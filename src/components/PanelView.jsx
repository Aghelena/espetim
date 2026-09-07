import { useEffect, useState } from "react";
import PinGate from "./PinGate.jsx";
import Ticket from "./Ticket.jsx";
import NewOrderSheet from "./NewOrderSheet.jsx";
import ConfirmDialog from "./ConfirmDialog.jsx";
import ClosingSheet from "./ClosingSheet.jsx";
import { useOrders } from "../hooks/useOrders.js";
import { useClosings } from "../hooks/useClosings.js";
import { BOARD_COLUMNS } from "../data/menu.js";
import { BackIcon, LogoutIcon, PlusIcon, DownloadIcon, CashIcon } from "../icons.jsx";
import Logo from "./Logo.jsx";
import { exportTodayOrders } from "../csv.js";
import { storeDateKey } from "../utils.js";

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
  const [closingOpen, setClosingOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // id do pedido esperando confirmação
  const { orders, addOrder, advanceOrder, updateOrder, cancelOrder, removeOrders, synced } = useOrders();
  const { closings, addClosing } = useClosings();
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
  function handleExport() {
    // Junta os pedidos ainda no quadro com os que já foram arquivados por
    // um fechamento de caixa hoje, pra planilha do dia sair completa mesmo
    // depois de fechar o caixa uma ou mais vezes.
    const today = storeDateKey();
    const fromClosings = closings.filter((c) => c.dateKey === today).flatMap((c) => c.orders || []);
    exportTodayOrders([...orders, ...fromClosings]);
  }
  function handleSaveChange(id, cashReceived, changeGiven) {
    updateOrder(id, { cashReceived, changeGiven });
  }

  return (
    <div id="panel-wrap">
      <div className="panel-top">
        <div className="left">
          <span className={"sync-dot" + (cloudOn ? "" : " off")} title={cloudOn ? "Sincronizado na nuvem" : "Somente neste aparelho"} />
          <div className="brand-mini"><Logo size={30} /> Painel · Espetim do Nin</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button type="button" className="icon-btn" title="Fechamento de caixa" onClick={() => setClosingOpen(true)}><CashIcon /></button>
          <button type="button" className="icon-btn" title="Exportar pedidos de hoje (CSV)" onClick={handleExport}><DownloadIcon /></button>
          <button type="button" className="icon-btn" title="Ver página do cliente" onClick={onGoClient}><BackIcon /></button>
          <button type="button" className="icon-btn" title="Sair" onClick={lock}><LogoutIcon /></button>
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
        {BOARD_COLUMNS.map((col) => {
          const list = orders.filter(col.match).sort((a, b) => a.createdAt - b.createdAt);
          return (
            <div className="col" style={{ "--col-c": col.color }} key={col.key}>
              <div className="col-head">
                <h3>{col.label}</h3>
                <span className="n">{list.length}</span>
              </div>
              <div className="col-body">
                {list.length === 0 ? (
                  <div className="col-empty">Nenhum pedido</div>
                ) : (
                  list.map((o) => (
                    <Ticket key={o.id} order={o} onAdvance={advanceOrder} onCancel={handleCancel} onSaveChange={handleSaveChange} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button type="button" className="fab" onClick={() => setNewOrderOpen(true)}>
        <PlusIcon /> Novo pedido
      </button>

      {newOrderOpen && <NewOrderSheet onClose={() => setNewOrderOpen(false)} onSave={handleSave} />}

      {closingOpen && (
        <ClosingSheet
          orders={orders}
          closings={closings}
          addClosing={addClosing}
          removeOrders={removeOrders}
          onClose={() => setClosingOpen(false)}
        />
      )}

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