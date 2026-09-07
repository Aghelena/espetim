import { useState } from "react";
import { PAY_METHODS, STATUS_COLOR, actionLabelFor } from "../data/menu.js";
import { brl, timeAgo } from "../utils.js";
import { CheckIcon, CalcIcon } from "../icons.jsx";
import ChangeCalcDialog from "./ChangeCalcDialog.jsx";

export default function Ticket({ order, onAdvance, onCancel, onSaveChange }) {
  const [calcOpen, setCalcOpen] = useState(false);
  const isEntrega = order.fulfillment === "entrega";
  const isDinheiro = order.payment === "dinheiro";
  const color = STATUS_COLOR[order.status];
  const action = actionLabelFor(order.status, order.fulfillment);

  function saveChange(received, change) {
    onSaveChange(order.id, received, change);
    setCalcOpen(false);
  }

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
        {isEntrega && order.neighborhood && order.neighborhood !== "Outro" && (
          <span className="badge">{order.neighborhood}</span>
        )}
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

      {isDinheiro && (
        order.cashReceived != null ? (
          <button type="button" className="ticket-change" onClick={() => setCalcOpen(true)}>
            <CalcIcon /> Recebido {brl(order.cashReceived)} · Troco {brl(order.changeGiven || 0)}
          </button>
        ) : (
          <button type="button" className="ticket-change ticket-change-empty" onClick={() => setCalcOpen(true)}>
            <CalcIcon /> Calcular troco
          </button>
        )
      )}

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

      {calcOpen && (
        <ChangeCalcDialog
          total={order.total || 0}
          initialReceived={order.cashReceived}
          onSave={saveChange}
          onCancel={() => setCalcOpen(false)}
        />
      )}
    </div>
  );
}