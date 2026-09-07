import { useEffect, useState } from "react";
import Logo from "./Logo.jsx";
import { BackIcon, CheckIcon } from "../icons.jsx";
import { brl } from "../utils.js";
import { STATUS_LABEL } from "../data/menu.js";
import { db, isFirebaseConfigured } from "../firebase.js";
import { collection, onSnapshot, query, where } from "firebase/firestore";

const STORAGE_KEY = "espetim_orders_v1";

// Etapas mostradas pro cliente depois que o pagamento é confirmado. O
// "aguardando_pagamento" tem uma tela própria (ver abaixo) em vez de entrar
// nessa lista, porque nesse momento ainda não tem preparo em andamento.
//
// Pedido de retirada não passa por "saiu_para_entrega" (ele mesmo busca no
// balcão), então some da linha do tempo; pedido de entrega passa pelas
// duas etapas — "pronto" (ficou pronto na cozinha) e depois "saiu para
// entrega" — como passos bem separados.
const TRACK_STEPS_RETIRADA = ["recebido", "preparando", "pronto", "entregue"];
const TRACK_STEPS_ENTREGA = ["recebido", "preparando", "pronto", "saiu_para_entrega", "entregue"];

function loadLocalOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Tela pública de acompanhamento — o cliente chega aqui pelo link
// "Acompanhar meu pedido" (tela de confirmação) ou digitando o código à
// mão em #acompanhar. Não precisa de PIN: mesma lógica das regras do
// Firestore, que já deixam a coleção "orders" de leitura pública.
export default function OrderTrack({ code: initialCode, onGoClient }) {
  const [codeInput, setCodeInput] = useState(initialCode || "");
  const [code, setCode] = useState((initialCode || "").trim().toUpperCase());
  const [order, setOrder] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setCodeInput(initialCode || "");
    setCode((initialCode || "").trim().toUpperCase());
  }, [initialCode]);

  // Busca o pedido pelo código e mantém a tela atualizada sozinha: no modo
  // Firestore, em tempo real (onSnapshot); no modo localStorage, com um
  // polling curto, já que o evento "storage" não dispara na mesma aba que
  // fez a mudança (painel e cliente não costumam ser a mesma aba, mas isso
  // cobre também o caso de testar tudo no mesmo aparelho).
  useEffect(() => {
    if (!code) {
      setOrder(null);
      setChecked(false);
      return;
    }
    setChecked(false);

    if (isFirebaseConfigured) {
      const q = query(collection(db, "orders"), where("code", "==", code));
      const unsub = onSnapshot(
        q,
        (snap) => {
          setOrder(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
          setChecked(true);
        },
        () => setChecked(true)
      );
      return unsub;
    }

    function lookup() {
      const found = loadLocalOrders().find((o) => (o.code || "").toUpperCase() === code);
      setOrder(found || null);
      setChecked(true);
    }
    lookup();
    const t = setInterval(lookup, 4000);
    function onStorage(e) {
      if (e.key === STORAGE_KEY) lookup();
    }
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", onStorage);
    };
  }, [code]);

  function goToCode(e) {
    e.preventDefault();
    const c = codeInput.trim().toUpperCase();
    if (!c) return;
    window.location.hash = "pedido/" + encodeURIComponent(c);
    setCode(c);
  }

  function tryAnother() {
    window.location.hash = "acompanhar";
    setCode("");
    setCodeInput("");
    setOrder(null);
    setChecked(false);
  }

  const isEntrega = order?.fulfillment === "entrega";
  const TRACK_STEPS = isEntrega ? TRACK_STEPS_ENTREGA : TRACK_STEPS_RETIRADA;
  const stepIndex = order ? TRACK_STEPS.indexOf(order.status) : -1;

  return (
    <>
      <div className="topbar">
        <div className="brand-mini"><Logo size={30} /> Espetim do Nin</div>
      </div>
      <div className="track-page">
        <button type="button" className="track-back" onClick={onGoClient}>
          <BackIcon /> Voltar ao cardápio
        </button>

        {!code && (
          <form className="track-form" onSubmit={goToCode}>
            <h2>Acompanhar pedido</h2>
            <p>Digite o código que você recebeu na confirmação do pedido.</p>
            <div className="field">
              <label>Código do pedido</label>
              <input
                value={codeInput}
                placeholder="EX: EN-1234"
                onChange={(e) => setCodeInput(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ background: "var(--accent)", color: "#fff" }}>
              Ver status
            </button>
          </form>
        )}

        {code && !checked && <div className="track-loading">Buscando pedido…</div>}

        {code && checked && !order && (
          <div className="track-notfound">
            <h2>Não encontramos esse pedido</h2>
            <p>
              Confira se o código <b>{code}</b> está certo, ou fale com a gente pelo WhatsApp.
            </p>
            <button type="button" className="btn-ghost" onClick={tryAnother}>
              Tentar outro código
            </button>
          </div>
        )}

        {code && checked && order && (
          <div className="track-card">
            <div className="order-code">{order.code}</div>
            <p className="track-fulfillment">{isEntrega ? "Entrega" : "Retirada no local"}</p>

            {order.status === "aguardando_pagamento" ? (
              <p className="track-waiting">
                Aguardando a confirmação do pagamento pela loja — assim que confirmarmos, o preparo começa e essa
                página atualiza sozinha.
              </p>
            ) : (
              <div className="track-stepper">
                {TRACK_STEPS.map((s, i) => {
                  const done = i <= stepIndex;
                  let label = STATUS_LABEL[s];
                  if (s === "pronto" && !isEntrega) label = "Pronto para retirada";
                  return (
                    <div key={s} className={"track-step" + (done ? " done" : "") + (i === stepIndex ? " current" : "")}>
                      <span className="track-dot">{done ? <CheckIcon /> : i + 1}</span>
                      <span className="track-label">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="track-items">
              {(order.items || []).map((it, i) => (
                <div className="track-item" key={i}>
                  {it.qty}x {it.name}
                </div>
              ))}
            </div>
            <div className="track-total">
              Total: <b className="num">{brl(order.total)}</b>
            </div>

            <a className="track-link" href="#acompanhar" onClick={tryAnother}>
              Acompanhar outro pedido
            </a>
          </div>
        )}
      </div>
    </>
  );
}