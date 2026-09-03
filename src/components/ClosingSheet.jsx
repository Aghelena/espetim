import { useMemo, useState } from "react";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { PAY_METHODS } from "../data/menu.js";
import { brl, storeDateKey } from "../utils.js";
import { CashIcon, DownloadIcon } from "../icons.jsx";
import { exportClosingOrders } from "../csv.js";

// Retrato completo do pedido pra guardar dentro do fechamento — com
// fallback em todo campo (nunca undefined, senão o Firestore rejeita a
// gravação inteira com "invalid-argument").
function snapshotOrder(o) {
  return {
    code: o.code || "—",
    createdAt: o.createdAt || Date.now(),
    status: o.status || "entregue",
    customerName: o.customerName || "",
    customerPhone: o.customerPhone || "",
    fulfillment: o.fulfillment || "retirada",
    cep: o.cep || "",
    neighborhood: o.neighborhood || "",
    address: o.address || "",
    payment: o.payment || "outro",
    items: o.items || [],
    subtotal: o.subtotal || 0,
    deliveryFee: o.deliveryFee || 0,
    total: o.total || 0,
    notes: o.notes || "",
  };
}

// Fechamento de caixa: soma os pedidos ENTREGUES de hoje por forma de
// pagamento. Ao fechar, isso vira um registro no histórico e esses pedidos
// saem do quadro do painel (pedidos ainda em andamento não são mexidos).
export default function ClosingSheet({ orders, closings, addClosing, removeOrders, onClose }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [done, setDone] = useState(null);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  const today = storeDateKey();
  const delivered = useMemo(
    () => orders.filter((o) => o.status === "entregue" && storeDateKey(o.createdAt) === today),
    [orders, today]
  );
  const pendingCount = useMemo(
    () => orders.filter((o) => o.status !== "entregue" && storeDateKey(o.createdAt) === today).length,
    [orders, today]
  );

  const totalsByPayment = useMemo(() => {
    const t = {};
    for (const p of PAY_METHODS) t[p.id] = 0;
    for (const o of delivered) {
      const key = o.payment || "outro";
      t[key] = (t[key] || 0) + (o.total || 0);
    }
    return t;
  }, [delivered]);
  const totalGeral = delivered.reduce((a, o) => a + (o.total || 0), 0);

  const cashOrders = delivered.filter((o) => o.payment === "dinheiro");
  const cashWithChange = cashOrders.filter((o) => o.cashReceived != null);
  const cashReceivedTotal = cashWithChange.reduce((a, o) => a + (o.cashReceived || 0), 0);
  const changeGivenTotal = cashWithChange.reduce((a, o) => a + (o.changeGiven || 0), 0);

  async function handleClose() {
    setConfirmOpen(false);
    setError("");
    setClosing(true);
    const record = {
      dateKey: today,
      totalsByPayment,
      totalGeral,
      count: delivered.length,
      orders: delivered.map(snapshotOrder),
    };
    try {
      await addClosing(record);
      await removeOrders(delivered.map((o) => o.id));
      setDone({ count: delivered.length, total: totalGeral, dateKey: today, orders: record.orders });
    } catch (e) {
      console.error("Falha ao fechar o caixa:", e);
      const detail = (e && (e.code || e.message)) || "erro desconhecido";
      setError(`Não consegui salvar o fechamento (${detail}). Toca em "Fechar caixa" de novo — se continuar assim, me manda esse texto do erro.`);
    } finally {
      setClosing(false);
    }
  }

  const recent = closings.slice(0, 6);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-title">
          <h2>Fechamento de caixa</h2>
          <button type="button" className="sheet-close" onClick={onClose}>✕</button>
        </div>

        {done ? (
          <div className="closing-done">
            <CashIcon />
            <p>Caixa fechado! {done.count} {done.count === 1 ? "pedido" : "pedidos"} somando {brl(done.total)} foram arquivados.</p>
            {done.count > 0 && (
              <button type="button" className="btn-export" onClick={() => exportClosingOrders(done)}>
                <DownloadIcon /> Baixar planilha desse fechamento
              </button>
            )}
            <button type="button" className="btn-primary" style={{ background: "var(--ink)" }} onClick={onClose}>Fechar</button>
          </div>
        ) : (
          <>
            <p className="closing-hint">
              Considerando os <b>{delivered.length}</b> pedidos marcados como Entregues hoje ({today}).
              {pendingCount > 0 && ` Ainda há ${pendingCount} pedido${pendingCount === 1 ? "" : "s"} em andamento — esses não entram nesse fechamento.`}
            </p>

            <div className="totals" style={{ marginTop: 4 }}>
              {PAY_METHODS.map((p) => (
                <div className="row" key={p.id}>
                  <span>{p.label}</span>
                  <b className="num">{brl(totalsByPayment[p.id] || 0)}</b>
                </div>
              ))}
              <div className="row grand">
                <span>Total do dia</span>
                <span className="num">{brl(totalGeral)}</span>
              </div>
            </div>

            {cashOrders.length > 0 && (
              <div className="closing-cash-note">
                Dinheiro: recebido {brl(cashReceivedTotal)} · troco dado {brl(changeGivenTotal)}
                {cashWithChange.length < cashOrders.length &&
                  ` (${cashOrders.length - cashWithChange.length} pedido${cashOrders.length - cashWithChange.length === 1 ? "" : "s"} em dinheiro sem a calculadora de troco usada)`}
              </div>
            )}

            {error && <div className="err-note" style={{ marginBottom: 12 }}>{error}</div>}

            <button
              type="button"
              className="btn-primary"
              style={delivered.length === 0 || closing ? undefined : { background: "var(--ink)" }}
              disabled={delivered.length === 0 || closing}
              onClick={() => setConfirmOpen(true)}
            >
              <CashIcon /> {closing ? "Fechando…" : "Fechar caixa"}
            </button>
            {delivered.length === 0 && (
              <p className="closing-hint" style={{ marginTop: 10, marginBottom: 0 }}>
                Nenhum pedido marcado como <b>Entregue</b> hoje ainda — o botão libera assim que houver pelo menos um.
              </p>
            )}

            {recent.length > 0 && (
              <div className="closing-history">
                <label>Fechamentos anteriores</label>
                {recent.map((c) => (
                  <div className="closing-history-row" key={c.id}>
                    <span>{c.dateKey}</span>
                    <span>{c.count} pedido{c.count === 1 ? "" : "s"}</span>
                    <b className="num">{brl(c.totalGeral)}</b>
                    {(c.orders || []).length > 0 && (
                      <button type="button" className="row-dl" title="Baixar planilha desse fechamento" onClick={() => exportClosingOrders(c)}>
                        <DownloadIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="Fechar caixa"
          message={`Isso vai arquivar ${delivered.length} pedido${delivered.length === 1 ? "" : "s"} entregue${delivered.length === 1 ? "" : "s"} de hoje (total ${brl(totalGeral)}) e tirá-los do painel. Não dá pra desfazer.`}
          confirmLabel="Fechar caixa"
          cancelLabel="Voltar"
          danger
          onConfirm={handleClose}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}