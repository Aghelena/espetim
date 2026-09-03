import { useRef, useState } from "react";
import { FREE_ZONES, DELIVERY_FEE, PAY_METHODS } from "../data/menu.js";
import { brl, cartLines, subtotalOf, deliveryFeeFor, nextOpeningLabel } from "../utils.js";
import { lookupCEP, formatCEP } from "../cep.js";
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

  // Preenche o endereço a partir do CEP (ViaCEP). Se o bairro devolvido
  // bater com um dos bairros já cadastrados, seleciona ele sozinho; senão
  // só avisa qual foi encontrado, pra pessoa escolher o mais próximo.
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
    setCepStatus("loading");
    const found = await lookupCEP(digits);
    if (!found) {
      setCepStatus("notfound");
      setCepBairro("");
      return;
    }
    setCepStatus("found");
    setCepBairro(found.bairro || "");
    setCheckout((c) => ({
      ...c,
      address: c.address.trim() ? c.address : found.logradouro || c.address,
    }));
    const match = FREE_ZONES.find((z) => z.toLowerCase() === (found.bairro || "").toLowerCase());
    if (match) field("neighborhood", match);
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
                <div className="field">
                  <label>CEP (opcional, preenche o endereço)</label>
                  <input
                    value={checkout.cep || ""}
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                    onChange={(e) => handleCep(e.target.value)}
                  />
                  {cepStatus === "loading" && <p className="cep-hint">Buscando endereço…</p>}
                  {cepStatus === "notfound" && <p className="cep-hint cep-warn">CEP não encontrado — preenche o endereço abaixo à mão.</p>}
                  {cepStatus === "found" && cepBairro && !FREE_ZONES.some((z) => z.toLowerCase() === cepBairro.toLowerCase()) && (
                    <p className="cep-hint">Endereço encontrado — bairro "{cepBairro}". Selecione o bairro mais próximo abaixo.</p>
                  )}
                </div>
                <div className={"field" + (formErr === "bairro" ? " error" : "")}>
                  <label>Bairro</label>
                  <select value={checkout.neighborhood} onChange={(e) => field("neighborhood", e.target.value)}>
                    <option value="">Selecione o bairro…</option>
                    {FREE_ZONES.map((z) => (
                      <option value={z} key={z}>{z} — frete grátis</option>
                    ))}
                    <option value="Outro">Outro bairro — {brl(DELIVERY_FEE)}</option>
                  </select>
                </div>
                <div className={"field" + (formErr === "endereco" ? " error" : "")}>
                  <label>Endereço</label>
                  <input value={checkout.address} placeholder="Rua, número, complemento" onChange={(e) => field("address", e.target.value)} />
                </div>
                <div className="field">
                  <label>Referência (opcional)</label>
                  <input value={checkout.reference} placeholder="Ponto de referência" onChange={(e) => field("reference", e.target.value)} />
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