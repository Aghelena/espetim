import { useEffect, useState } from "react";
import CategoryNav from "./CategoryNav.jsx";
import MenuPicker from "./MenuPicker.jsx";
import CheckoutSheet from "./CheckoutSheet.jsx";
import Confirm from "./Confirm.jsx";
import { CartIcon, LockIcon } from "../icons.jsx";
import Logo from "./Logo.jsx";
import { MENU, WHATSAPP_NUMBER, FREE_ZONES, DELIVERY_FEE, PAY_METHODS } from "../data/menu.js";
import { brl, cartLines, subtotalOf, deliveryFeeFor, isOpenNow, nextOpeningLabel, genCode } from "../utils.js";
import { useOrders } from "../hooks/useOrders.js";

const EMPTY_CHECKOUT = { fulfillment: "retirada", neighborhood: "", address: "", reference: "", payment: "", name: "", phone: "", notes: "" };

export default function ClientView({ onGoPanel }) {
  const [activeCat, setActiveCat] = useState(MENU[0].id);
  const [cart, setCart] = useState({});
  const [checkout, setCheckout] = useState(EMPTY_CHECKOUT);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [lastOrder, setLastOrder] = useState(null);
  const [open, setOpen] = useState(isOpenNow());
  const { addOrder } = useOrders();

  useEffect(() => {
    const t = setInterval(() => setOpen(isOpenNow()), 60000);
    return () => clearInterval(t);
  }, []);

  function selectCat(id) {
    setActiveCat(id);
    const el = document.getElementById("cat-" + id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function validate() {
    if (!checkout.name.trim()) return "nome";
    if (!checkout.phone.trim()) return "telefone";
    if (!checkout.payment) return "pagamento";
    if (checkout.fulfillment === "entrega") {
      if (!checkout.neighborhood) return "bairro";
      if (!checkout.address.trim()) return "endereco";
    }
    return "";
  }

  function buildMessage(code, lines, subtotal, fee, total) {
    const rows = lines.map((l) => `${l.qty}x ${l.name} - ${brl(l.total)}`).join("\n");
    let out = `*Novo pedido — Espetim do Nin*\n`;
    out += `Código: ${code}\n\n`;
    out += `*Itens:*\n${rows}\n\n`;
    out += `Subtotal: ${brl(subtotal)}\n`;
    out += `Entrega: ${fee === 0 ? "Grátis" : brl(fee)}\n`;
    out += `*Total: ${brl(total)}*\n\n`;
    if (checkout.fulfillment === "entrega") {
      out += `*Entrega em:* ${checkout.address}${checkout.reference ? " (ref: " + checkout.reference + ")" : ""} — ${checkout.neighborhood}\n`;
    } else {
      out += `*Retirada no local*\n`;
    }
    out += `*Pagamento:* ${(PAY_METHODS.find((p) => p.id === checkout.payment) || {}).label || ""}\n`;
    out += `*Cliente:* ${checkout.name} — ${checkout.phone}\n`;
    if (checkout.notes.trim()) out += `*Obs:* ${checkout.notes.trim()}\n`;
    return out;
  }

  function submitOrder() {
    const err = validate();
    setFormErr(err);
    if (err) return;
    const lines = cartLines(cart);
    if (lines.length === 0) return;
    const subtotal = subtotalOf(cart);
    const fee = deliveryFeeFor(checkout.fulfillment, checkout.neighborhood) || 0;
    const total = subtotal + fee;
    const code = genCode();
    const message = buildMessage(code, lines, subtotal, fee, total);
    const order = { code, total, message };

    addOrder(
      {
        code,
        customerName: checkout.name,
        customerPhone: checkout.phone,
        fulfillment: checkout.fulfillment,
        neighborhood: checkout.fulfillment === "entrega" ? checkout.neighborhood : "",
        address: checkout.fulfillment === "entrega" ? checkout.address : "",
        reference: checkout.fulfillment === "entrega" ? checkout.reference : "",
        payment: checkout.payment,
        items: lines.map((l) => ({ name: l.name, qty: l.qty, price: l.price })),
        subtotal,
        deliveryFee: fee,
        total,
        notes: checkout.notes,
        source: "cliente",
      },
      "aguardando_pagamento"
    );

    window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message), "_blank");

    setLastOrder(order);
    setCart({});
    setCheckout(EMPTY_CHECKOUT);
    setFormErr("");
    setSheetOpen(false);
  }

  if (lastOrder) {
    return <Confirm order={lastOrder} onGoPanel={onGoPanel} onNewOrder={() => setLastOrder(null)} />;
  }

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const subtotal = subtotalOf(cart);

  return (
    <>
      <div className="topbar">
        <div className="brand-mini"><Logo size={30} /> Espetim do Nin</div>
      </div>

      <section className="hero">
        <Logo size={132} className="hero-logo" />
        <p className="tagline">Qualidade, sabor e aquele churrasco no ponto certo. Peça já!</p>
        <div className="status-row">
          <span className={"status-pill " + (open ? "open" : "closed")}>
            <span className="status-dot" />
            {open ? "Aberto agora" : "Fechado agora"}
            {!open && " · abre " + nextOpeningLabel()}
          </span>
          <div className="hours-chips">
            <span className="hours-chip">Qua–Sex 17h–22h</span>
            <span className="hours-chip">Sáb 14h–22h</span>
          </div>
        </div>
      </section>

      <CategoryNav active={activeCat} onSelect={selectCat} />
      <MenuPicker cart={cart} onChange={setCart} />

      {count > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-inner">
            <span>{count} {count === 1 ? "item" : "itens"} · <b className="num">{brl(subtotal)}</b></span>
            <button type="button" className="go" onClick={() => setSheetOpen(true)}><CartIcon /> Ver carrinho</button>
          </div>
        </div>
      )}

      {sheetOpen && (
        <CheckoutSheet
          cart={cart}
          setCart={setCart}
          checkout={checkout}
          setCheckout={setCheckout}
          formErr={formErr}
          open={open}
          onClose={() => setSheetOpen(false)}
          onSubmit={submitOrder}
        />
      )}
{/* Acesso da equipe: bem discreto de propósito, pra não chamar a
          atenção de clientes. No computador da loja, o jeito prático é
          salvar o link direto (termina em "#painel") nos favoritos. */}
      <button type="button" className="staff-link" onClick={onGoPanel}>
        <LockIcon /> equipe
      </button>
    </>
  );
}