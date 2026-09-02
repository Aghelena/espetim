import { useEffect, useState } from "react";
import PinGate from "./PinGate.jsx";
import Ticket from "./Ticket.jsx";
import NewOrderSheet from "./NewOrderSheet.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { useOrders } from "../hooks/useOrders.js";
import { STATUS_FLOW, STATUS_LABEL, STATUS_COLOR } from "../data/menu.js";
import { BackIcon, LogoutIcon, PlusIcon } from "../icons.jsx";
import Logo from "./Logo.jsx";

const UNLOCK_KEY = "espetim_panel_unlocked";

export default function PanelView({ onGoClient }) {
  const [unlocked, setUnlocked] = useState(() => {
    try {
      return localStorage.getItem(UNLOCK_KEY) === "1";
    } catch (e) {
      return false;
    }
  });
  const [newOrderOpen, setNewOrderOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // id do pedido esperando confirmação
  const { orders, addOrder, advanceOrder, cancelOrder, synced } = useOrders();
  const cloudOn = synced === true;
  const [, forceTick] = useState(0);

  // Reflete "há X min" sem precisar interagir com a página.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  function unlock() {
    setUnlocked(true);
    try {
      localStorage.setItem(UNLOCK_KEY, "1");
    } catch (e) {}
  }
  function lock() {
    setUnlocked(false);
    try {
      localStorage.removeItem(UNLOCK_KEY);
    } catch (e) {}
  }

  if (!unlocked) {
    return <PinGate onUnlock={unlock} onBack={onGoClient} />;
  }

  function handleCancel(id) {
    setCancelTarget(id);
  }
  function confirmCancel() {
    if (cancelTarget) cancelOrder(cancelTarget);
    setCancelTarget(null);
  }
  function handleSave(data) {
    addOrder(data);
    setNewOrderOpen(false);
  }

  return (
    <div id="panel-wrap">
      <div className="panel-top">
        <div className="left">
          <span
            className={"sync-dot" + (cloudOn ? "" : " off")}
            title={cloudOn ? "Sincronizado na nuvem" : "Somente neste aparelho"}
          />
          <div className="brand-mini">
            <Logo size={30} /> Painel · Espetim do Nin
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="icon-btn"
            title="Ver página do cliente"
            onClick={onGoClient}
          >
            <BackIcon />
          </button>
          <button
            type="button"
            className="icon-btn"
            title="Sair"
            onClick={lock}
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
      {!cloudOn && (
        <div className="panel-msg">
          {synced === "local"
            ? "Sincronização na nuvem não configurada — os pedidos aparecem aqui só neste aparelho (entre abas). Configure o Firebase em src/firebase.js para receber pedidos de qualquer aparelho automaticamente."
            : "Conectando à nuvem…"}
        </div>
      )}

      <div className="board">
        {STATUS_FLOW.map((status) => {
          const list = orders
            .filter((o) => o.status === status)
            .sort((a, b) => a.createdAt - b.createdAt);
          return (
            <div
              className="col"
              style={{ "--col-c": STATUS_COLOR[status] }}
              key={status}
            >
              <div className="col-head">
                <h3>{STATUS_LABEL[status]}</h3>
                <span className="n">{list.length}</span>
              </div>
              <div className="col-body">
                {list.length === 0 ? (
                  <div className="col-empty">Nenhum pedido</div>
                ) : (
                  list.map((o) => (
                    <Ticket
                      key={o.id}
                      order={o}
                      onAdvance={advanceOrder}
                      onCancel={handleCancel}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="fab"
        onClick={() => setNewOrderOpen(true)}
      >
        <PlusIcon /> Novo pedido
      </button>

      {newOrderOpen && <NewOrderSheet onClose={() => setNewOrderOpen(false)} onSave={handleSave} />}

      {cancelTarget && (
        <ConfirmDialog
          title="Cancelar pedido"
          message="Tem certeza que quer cancelar este pedido? Essa ação não pode ser desfeita."
          confirmLabel="Cancelar pedido"
          cancelLabel="Voltar"
          danger
          onConfirm={confirmCancel}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}