import { useRef, useState } from "react";
import MenuPicker from "./MenuPicker.jsx";
import { LOW_DELIVERY_FEE, DELIVERY_FEE, PAY_METHODS } from "../data/menu.js";
import { brl, cartLines, subtotalOf, deliveryFeeFor, genCode } from "../utils.js";
import { lookupCEP, formatCEP, zoneForCEP } from "../cep.js";
import { PlusIcon } from "../icons.jsx";

const EMPTY_FORM = { fulfillment: "retirada", cep: "", neighborhood: "", address: "", number: "", reference: "", payment: "", name: "", phone: "", notes: "" };

// Registro rápido de um pedido que chegou por fora (WhatsApp, telefone,
// balcão) direto no painel — usa o mesmo cardápio com contadores.
export default function NewOrderSheet({ onClose, onSave }) {
  const [cart, setCart] = useState({});
  const [form, setForm] = useState(EMPTY_FORM);
  const [cepStatus, setCepStatus] = useState("idle"); // idle | loading | found | notfound
  const [cepBairro, setCepBairro] = useState("");
  const lastLookedUp = useRef("");

  const lines = cartLines(cart);
  const subtotal = subtotalOf(cart);
  const fee = deliveryFeeFor(form.fulfillment, form.neighborhood);
  const total = subtotal + (fee || 0);
  const needsCep = form.fulfillment === "entrega" && !form.neighborhood;

  function field(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  // O frete já é decidido na hora pelo CEP, usando as faixas cadastradas em
  // data/menu.js (não depende do nome do bairro que a ViaCEP devolve). A
  // busca à ViaCEP só entra depois, pra preencher a rua.
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
    setForm((f) => ({
      ...f,
      address: f.address.trim() ? f.address : streetZone || f.address,
    }));
  }

  function save() {
    if (lines.length === 0 || needsCep) return;
    const fullAddress = form.fulfillment === "entrega"
      ? form.address.trim() + (form.number.trim() ? ", nº " + form.number.trim() : "")
      : "";
    onSave({
      code: genCode(),
      customerName: form.name || "Sem nome",
      customerPhone: form.phone || "",
      fulfillment: form.fulfillment,
      cep: form.fulfillment === "entrega" ? form.cep : "",
      neighborhood: form.fulfillment === "entrega" ? form.neighborhood : "",
      address: fullAddress,
      payment: form.payment || "",
      items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      subtotal,
      deliveryFee: fee || 0,
      total,
      notes: form.notes || "",
    });
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <h2>Registrar pedido</h2>
          <button type="button" className="sheet-close" onClick={onClose}>✕</button>
        </div>

        <MenuPicker cart={cart} onChange={setCart} compact />

        <div className="field" style={{ marginTop: 10 }}>
          <label>Retirada ou entrega?</label>
          <div className="seg">
            <button type="button" className={form.fulfillment === "retirada" ? "active" : ""} onClick={() => field("fulfillment", "retirada")}>Retirar no local</button>
            <button type="button" className={form.fulfillment === "entrega" ? "active" : ""} onClick={() => field("fulfillment", "entrega")}>Entrega</button>
          </div>
        </div>

        {form.fulfillment === "entrega" && (
          <>
            <div className="field">
              <label>CEP</label>
              <input
                value={form.cep || ""}
                placeholder="00000-000"
                inputMode="numeric"
                maxLength={9}
                onChange={(e) => handleCep(e.target.value)}
              />
              {cepStatus === "loading" && <p className="cep-hint">Buscando endereço…</p>}
              {cepStatus === "found" && (
                <p className="cep-hint">
                  Frete: {brl(form.neighborhood === "Outro" ? DELIVERY_FEE : LOW_DELIVERY_FEE)}.
                  {cepBairro ? ` Endereço preenchido (bairro dos Correios: ${cepBairro}).` : " Preenche a rua abaixo se não veio certo."}
                </p>
              )}
              {cepStatus === "notfound" && (
                <p className="cep-hint cep-warn">
                  Não encontrei a rua desse CEP, preenche à mão abaixo — mas o frete já foi calculado: {brl(form.neighborhood === "Outro" ? DELIVERY_FEE : LOW_DELIVERY_FEE)}.
                </p>
              )}
              {needsCep && cepStatus === "idle" && (
                <p className="cep-hint">Digite o CEP pra calcular o frete.</p>
              )}
            </div>
            <div className="field-row">
              <div className="field" style={{ flex: 2 }}>
                <label>Endereço (rua e bairro)</label>
                <input value={form.address} placeholder="Preenchido pelo CEP" onChange={(e) => field("address", e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Número</label>
                <input value={form.number} placeholder="123" inputMode="numeric" onChange={(e) => field("number", e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="field">
          <label>Pagamento</label>
          <div className="pay-grid">
            {PAY_METHODS.map((p) => (
              <button key={p.id} type="button" className={"pay-opt" + (form.payment === p.id ? " active" : "")} onClick={() => field("payment", p.id)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label>Cliente</label>
            <input value={form.name} placeholder="Nome" onChange={(e) => field("name", e.target.value)} />
          </div>
          <div className="field">
            <label>Telefone</label>
            <input value={form.phone} placeholder="(16) 99999-9999" onChange={(e) => field("phone", e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>Observações</label>
          <textarea rows={2} value={form.notes} onChange={(e) => field("notes", e.target.value)} />
        </div>

        <div className="totals">
          <div className="row"><span>Subtotal</span><b className="num">{brl(subtotal)}</b></div>
          <div className="row"><span>Entrega</span><b className="num">{fee === null ? "—" : fee === 0 ? "Grátis" : brl(fee)}</b></div>
          <div className="row grand"><span>Total</span><span className="num">{brl(total)}</span></div>
        </div>

        <button type="button" className="btn-primary" style={{ background: "var(--accent)", color: "#fff" }} disabled={lines.length === 0 || needsCep} onClick={save}>
          <PlusIcon /> Adicionar ao painel
        </button>
        {needsCep && (
          <p className="closing-hint" style={{ marginTop: 10, marginBottom: 0, textAlign: "center" }}>
            Falta o CEP pra calcular o frete e liberar o botão.
          </p>
        )}
      </div>
    </div>
  );
}