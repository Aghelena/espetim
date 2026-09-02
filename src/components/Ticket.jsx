import { PAY_METHODS, STATUS_COLOR, STATUS_ACTION } from "../data/menu.js";
import { brl, timeAgo } from "../utils.js";
import { CheckIcon } from "../icons.jsx";

export default function Ticket({ order, onAdvance, onCancel }) {
  const isEntrega = order.fulfillment === "entrega";
  const color = STATUS_COLOR[order.status];
  const action = STATUS_ACTION[order.status];

  return (
    <div className="ticket" style={{ "--col-c": color }}>
      <div className="ticket-top">
        <div>
          <div className="ticket-code">{order.code}</div>
          <div className="ticket-time">{timeAgo(order.createdAt)}</div>
        </div>
        <button type="button" className="ticket-cancel" title="Cancelar pedido" onClick={() => onCancel(order.id)}>✕</button>
      </div>
      <div className="ticket-customer">{order.customerName || "—"}</div>
      <div className="ticket-phone">{order.customerPhone || ""}</div>
      <div className="ticket-badges">
        <span className="badge">{isEntrega ? "Entrega" : "Retirada"}</span>
        {isEntrega && <span className="badge">{order.neighborhood}</span>}
        <span className="badge">{(PAY_METHODS.find((p) => p.id === order.payment) || {}).label || order.payment}</span>
      </div>
      <div className="ticket-items">
        {(order.items || []).map((l, i) => (
          <span key={i}>
            <b>{l.qty}×</b> {l.name}{i < order.items.length - 1 ? ", " : ""}
          </span>
        ))}
      </div>
      {isEntrega && order.address && <div className="ticket-items">{order.address}</div>}
      {order.notes && <div className="ticket-notes">"{order.notes}"</div>}
      <div className="ticket-bottom">
        <span className="ticket-total num">{brl(order.total || 0)}</span>
        {action ? (
          <button type="button" className="ticket-advance" style={{ "--col-c": color }} onClick={() => onAdvance(order.id)}>
            {action}
          </button>
        ) : (
          <span className="ticket-done"><CheckIcon /> Entregue</span>
        )}
      </div>
    </div>
  );
}
