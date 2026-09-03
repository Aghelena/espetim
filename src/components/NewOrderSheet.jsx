import { useRef, useState } from "react";
import MenuPicker from "./MenuPicker.jsx";
import { FREE_ZONES, DELIVERY_FEE, PAY_METHODS } from "../data/menu.js";
import { brl, cartLines, subtotalOf, deliveryFeeFor, genCode } from "../utils.js";
import { lookupCEP, formatCEP } from "../cep.js";
import { PlusIcon } from "../icons.jsx";

const EMPTY_FORM = { fulfillment: "retirada", cep: "", neighborhood: "", address: "", reference: "", payment: "", name: "", phone: "", notes: "" };

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
  const fee = deliveryFeeFor(form.fulfillment, form.neighborhood) || 0;
  const total = subtotal + fee;

  function field(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
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
    setForm((f) => ({
      ...f,
      address: f.address.trim() ? f.address : found.logradouro || f.address,
    }));
    const match = FREE_ZONES.find((z) => z.toLowerCase() === (found.bairro || "").toLowerCase());
    if (match) field("neighborhood", match);
  }

  function save() {
    if (lines.length === 0) return;
    onSave({
      code: genCode(),
      customerName: form.name || "Sem nome",
      customerPhone: form.phone || "",
      fulfillment: form.fulfillment,
      cep: form.fulfillment === "entrega" ? form.cep : "",
      neighborhood: form.fulfillment === "entrega" ? form.neighborhood : "",
      address: form.fulfillment === "entrega" ? form.address : "",
      payment: form.payment || "",
      items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
      subtotal,
      deliveryFee: fee,
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
              <label>CEP (opcional, preenche o endereço)</label>
              <input
                value={form.cep || ""}
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
            <div className="field">
              <label>Bairro</label>
              <select value={form.neighborhood} onChange={(e) => field("neighborhood", e.target.value)}>
                <option value="">Selecione…</option>
                {FREE_ZONES.map((z) => <option value={z} key={z}>{z} — grátis</option>)}
                <option value="Outro">Outro — {brl(DELIVERY_FEE)}</option>
              </select>
            </div>
            <div className="field">
              <label>Endereço</label>
              <input value={form.address} placeholder="Rua, número" onChange={(e) => field("address", e.target.value)} />
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
          <div className="row"><span>Entrega</span><b className="num">{fee === 0 ? "Grátis" : brl(fee)}</b></div>
          <div className="row grand"><span>Total</span><span className="num">{brl(total)}</span></div>
        </div>

        <button type="button" className="btn-primary" style={{ background: "var(--accent)", color: "#fff" }} disabled={lines.length === 0} onClick={save}>
          <PlusIcon /> Adicionar ao painel
        </button>
      </div>
    </div>
  );
}