import { STATUS_LABEL, PAY_METHODS } from "./data/menu.js";
import { brl, storeDateKey, storeTimeLabel } from "./utils.js";

const PAY_LABEL = Object.fromEntries(PAY_METHODS.map((p) => [p.id, p.label]));

// Escapa um campo pro padrão CSV: só entra entre aspas quando precisa
// (contém o separador, aspas ou quebra de linha), e aspas internas viram "".
function csvField(value) {
  const s = String(value ?? "");
  if (/[;"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// Ponto e vírgula como separador (é o que o Excel em português espera) —
// e um BOM no início pra acentos não virarem caracteres estranhos.
export function ordersToCSV(orders) {
  const header = [
    "Código", "Horário", "Status", "Cliente", "Telefone", "Tipo",
    "Bairro/Endereço", "Pagamento", "Itens", "Subtotal", "Taxa de entrega", "Total", "Observações",
  ];
  const rows = orders.map((o) => {
    const itens = (o.items || []).map((it) => `${it.qty}x ${it.name}`).join(" + ");
    const local = o.fulfillment === "entrega"
      ? [o.address, o.neighborhood, o.cep ? `CEP ${o.cep}` : ""].filter(Boolean).join(" - ")
      : "Retirada no local";
    return [
      o.code || "",
      storeTimeLabel(o.createdAt),
      STATUS_LABEL[o.status] || o.status || "",
      o.customerName || "",
      o.customerPhone || "",
      o.fulfillment === "entrega" ? "Entrega" : "Retirada",
      local,
      PAY_LABEL[o.payment] || o.payment || "",
      itens,
      brl(o.subtotal || 0),
      brl(o.deliveryFee || 0),
      brl(o.total || 0),
      o.notes || "",
    ];
  });
  const lines = [header, ...rows].map((r) => r.map(csvField).join(";"));
  return "﻿" + lines.join("\r\n");
}

export function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTodayOrders(orders) {
  const today = orders.filter((o) => storeDateKey(o.createdAt) === storeDateKey());
  const sorted = [...today].sort((a, b) => a.createdAt - b.createdAt);
  const csv = ordersToCSV(sorted);
  downloadCSV(`pedidos-${storeDateKey()}.csv`, csv);
  return sorted.length;
}

// Exporta os pedidos guardados dentro de UM fechamento de caixa específico
// (já arquivados, não aparecem mais no quadro do painel).
export function exportClosingOrders(closing) {
  const list = (closing.orders || []).slice().sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  const csv = ordersToCSV(list);
  downloadCSV(`pedidos-fechamento-${closing.dateKey || "dia"}.csv`, csv);
  return list.length;
}