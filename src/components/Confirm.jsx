import { CheckIcon, WhatsIcon, LockIcon } from "../icons.jsx";
import Logo from "./Logo.jsx";
import { brl } from "../utils.js";
import { WHATSAPP_NUMBER } from "../data/menu.js";

export default function Confirm({ order, onGoPanel, onNewOrder }) {
  function reopenWhatsApp() {
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(order.message);
    window.open(url, "_blank");
  }

  return (
    <>
      <div className="topbar">
        <div className="brand-mini"><Logo size={30} /> Espetim do Nin</div>
      </div>

      <div className="confirm">
        <div className="check"><CheckIcon /></div>
        <h2>Pedido pronto para envio!</h2>
        <p>Confirme o envio da mensagem que abrimos no seu WhatsApp — é assim que seu pedido chega até nós.</p>
        <div className="order-code">{order.code}</div>
        <p>Total: <b className="num">{brl(order.total)}</b></p>
        <div className="confirm-actions">
          <button type="button" className="btn-primary" onClick={reopenWhatsApp}>
            <WhatsIcon /> Abrir WhatsApp novamente
          </button>
          <button type="button" className="btn-ghost" onClick={onNewOrder}>Fazer novo pedido</button>
        </div>
      </div>

      <button type="button" className="staff-link" onClick={onGoPanel}>
        <LockIcon /> equipe
      </button>
    </>
  );
}