import { useRef, useState } from "react";
import { DELIVERY_FEE, PAY_METHODS } from "../data/menu.js";
import { brl, cartLines, subtotalOf, deliveryFeeFor, nextOpeningLabel } from "../utils.js";
import { lookupCEP, formatCEP, zoneForCEP } from "../cep.js";
import { WhatsIcon } from "../icons.jsx";

export default function CheckoutSheet({ cart, setCart, checkout, setCheckout, formErr, open, onClose, onSubmit }) {
  const lines = cartLines(cart);
  const subtotal = subtotalOf(cart);
  const fee = deliveryFeeFor(checkout.fulfillment, checkout.neighborhood);
  const total = subtotal + (fee || 0);
  const [cepStatus, setCepStatus] = useState("idle"); // idle | loading | found | notfound
  const [cepBairro, setCepBairro] = useState("");
  const lastLookedUp = useRef("");

  function field(name, value) {
    setCheckout((c) => ({ ...c, [name]: value }));
  }
  function removeLine(id) {
    const next = { ...cart };
    delete next[id];
    setCart(next);
  }

  // O frete já é decidido na hora pelo CEP, usando as faixas cadastradas em
  // data/menu.js (não depende do nome do bairro que a ViaCEP devolve). A
  // busca à ViaCEP só entra depois, pra preencher a rua e o bairro.
  async function handleCep(raw) {
    const formatted = formatCEP(raw);
    field("cep", formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length < 8) {
      setCepStatus("idle");
      setCepBairro("");
      return;
    }
    if (digits === lastLookedUp.current) return;
    lastLookedUp.current = digits;

    const zone = zoneForCEP(digits);
    field("neighborhood", zone || "Outro");

    setCepStatus("loading");
    const found = await lookupCEP(digits);
    if (!found) {
      setCepStatus(zone ? "found" : "notfound");
      setCepBairro("");
      return;
    }
    setCepStatus("found");
    setCepBairro(found.bairro || "");
    const streetZone = [found.logradouro, found.bairro].filter(Boolean).join(" - ");
    setCheckout((c) => ({
      ...c,
      address: c.address.trim() ? c.address : streetZone || c.address,
    }));
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <h2>Seu pedido</h2>
          <button type="button" className="sheet-close" onClick={onClose}>✕</button>
        </div>

        {lines.length === 0 ? (
          <div className="empty-cart">
            Seu carrinho está vazio.
            <br />
            Adicione espetinhos, combos, acompanhamentos ou bebidas.
          </div>
        ) : (
          <>
            <div className="cart-list">
              {lines.map((l) => (
                <div className="cart-line" key={l.id}>
                  <span>
                    <span className="qty num">{l.qty}×</span>
                    {l.name}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <b className="num mono">{brl(l.total)}</b>
                    <button type="button" className="rm" aria-label="Remover" onClick={() => removeLine(l.id)}>✕</button>
                  </span>
                </div>
              ))}
            </div>

            <div className="field">
              <label>Retirada ou entrega?</label>
              <div className="seg">
                <button type="button" className={checkout.fulfillment === "retirada" ? "active" : ""} onClick={() => field("fulfillment", "retirada")}>
                  Retirar no local
                </button>
                <button type="button" className={checkout.fulfillment === "entrega" ? "active" : ""} onClick={() => field("fulfillment", "entrega")}>
                  Entrega
                </button>
              </div>
            </div>

            {checkout.fulfillment === "entrega" && (
              <>
                <div className={"field" + (formErr === "cep" ? " error" : "")}>
                  <label>CEP</label>
                  <input
                    value={checkout.cep || ""}
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                    onChange={(e) => handleCep(e.target.value)}
                  />
                  {cepStatus === "loading" && <p className="cep-hint">Buscando endereço…</p>}
                  {cepStatus === "found" && (
                    <p className="cep-hint">
                      Frete: {checkout.neighborhood === "Outro" ? brl(DELIVERY_FEE) : "grátis"}.
                      {cepBairro ? ` Endereço preenchido (bairro dos Correios: ${cepBairro}).` : " Preenche a rua abaixo se não veio certo."}
                    </p>
                  )}
                  {cepStatus === "notfound" && (
                    <p className="cep-hint cep-warn">
                      Não encontrei a rua desse CEP, preenche à mão abaixo — mas o frete já foi calculado: {checkout.neighborhood === "Outro" ? brl(DELIVERY_FEE) : "grátis"}.
                    </p>
                  )}
                </div>
                <div className="field-row">
                  <div className={"field" + (formErr === "endereco" ? " error" : "")} style={{ flex: 2 }}>
                    <label>Endereço (rua e bairro)</label>
                    <input value={checkout.address} placeholder="Preenchido pelo CEP" onChange={(e) => field("address", e.target.value)} />
                  </div>
                  <div className={"field" + (formErr === "numero" ? " error" : "")} style={{ flex: 1 }}>
                    <label>Número</label>
                    <input value={checkout.number} placeholder="123" inputMode="numeric" onChange={(e) => field("number", e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Complemento / referência (opcional)</label>
                  <input value={checkout.reference} placeholder="Apto, bloco, ponto de referência…" onChange={(e) => field("reference", e.target.value)} />
                </div>
              </>
            )}

            <div className={"field" + (formErr === "pagamento" ? " error" : "")}>
              <label>Forma de pagamento</label>
              <div className="pay-grid">
                {PAY_METHODS.map((p) => (
                  <button key={p.id} type="button" className={"pay-opt" + (checkout.payment === p.id ? " active" : "")} onClick={() => field("payment", p.id)}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field-row">
              <div className={"field" + (formErr === "nome" ? " error" : "")}>
                <label>Seu nome</label>
                <input value={checkout.name} placeholder="Nome" onChange={(e) => field("name", e.target.value)} />
              </div>
              <div className={"field" + (formErr === "telefone" ? " error" : "")}>
                <label>Telefone</label>
                <input value={checkout.phone} placeholder="(16) 99999-9999" onChange={(e) => field("phone", e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label>Observações (opcional)</label>
              <textarea rows={2} placeholder="Ex: sem cebola, ponto da carne..." value={checkout.notes} onChange={(e) => field("notes", e.target.value)} />
            </div>

            <div className="totals">
              <div className="row"><span>Subtotal</span><b className="num">{brl(subtotal)}</b></div>
              <div className="row"><span>Entrega</span><b className="num">{fee === null ? "—" : fee === 0 ? "Grátis" : brl(fee)}</b></div>
              <div className="row grand"><span>Total</span><span className="num">{brl(total)}</span></div>
            </div>

            {formErr && <p className="err-note">Preencha os campos destacados antes de continuar.</p>}

            <button type="button" className="btn-primary" disabled={!open} onClick={onSubmit}>
              <WhatsIcon /> Enviar pedido no WhatsApp
            </button>
            {!open && <p className="closed-note">Estamos fechados agora — voltamos {nextOpeningLabel()}.</p>}
          </>
        )}
      </div>
    </div>
  );
}