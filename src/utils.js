import { FREE_ZONES, DELIVERY_FEE, HOURS, TIME_ZONE, ITEMS_BY_ID } from "./data/menu.js";

export function brl(n) {
  return "R$ " + (Math.round(n * 100) / 100).toFixed(2).replace(".", ",");
}

export function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return "EN-" + s;
}

// Lê o horário atual no fuso da loja, não importa em que fuso o navegador esteja.
export function spParts() {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = {};
  fmt.formatToParts(new Date()).forEach((p) => (parts[p.type] = p.value));
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  let hour = parseInt(parts.hour, 10);
  if (hour === 24) hour = 0;
  return { dow: map[parts.weekday], hour, minute: parseInt(parts.minute, 10) };
}

export function isOpenNow() {
  const p = spParts();
  const h = HOURS.find((x) => x.day === p.dow);
  if (!h) return false;
  const mins = p.hour * 60 + p.minute;
  return mins >= h.open * 60 && mins < h.close * 60;
}

export function nextOpeningLabel() {
  const p = spParts();
  const mins = p.hour * 60 + p.minute;
  for (let off = 0; off < 8; off++) {
    const d = (p.dow + off) % 7;
    const h = HOURS.find((x) => x.day === d);
    if (h && (off > 0 || mins < h.open * 60)) {
      return off === 0 ? `hoje às ${h.open}h` : `${h.label.toLowerCase()} às ${h.open}h`;
    }
  }
  return "";
}

// "YYYY-MM-DD" no fuso da loja — usado pra saber se um pedido é "de hoje" e
// pra nomear o arquivo exportado, sem depender do fuso do navegador de quem
// está usando o painel.
export function storeDateKey(ts = Date.now()) {
  // Alguns pedidos arquivados em fechamentos antigos não guardaram
  // horário — cai no dia de hoje em vez de travar a formatação.
  const t = Number.isFinite(ts) ? ts : Date.now();
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date(t));
}

export function isToday(ts) {
  return storeDateKey(ts) === storeDateKey();
}

// "HH:mm" no fuso da loja, pra colocar no relatório exportado.
export function storeTimeLabel(ts) {
  const t = Number.isFinite(ts) ? ts : Date.now();
  const fmt = new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false });
  return fmt.format(new Date(t));
}

export function timeAgo(ts) {
  const mins = Math.max(0, Math.floor((Date.now() - ts) / 60000));
  if (mins < 1) return "agora";
  if (mins < 60) return "há " + mins + " min";
  const h = Math.floor(mins / 60);
  return "há " + h + "h" + (mins % 60 ? (mins % 60) + "min" : "");
}

export function cartLines(cart) {
  return Object.keys(cart)
    .filter((id) => cart[id] > 0)
    .map((id) => {
      const it = ITEMS_BY_ID[id];
      return { id, name: it.name, price: it.price, qty: cart[id], total: it.price * cart[id] };
    });
}

export function subtotalOf(cart) {
  return cartLines(cart).reduce((a, l) => a + l.total, 0);
}

export function deliveryFeeFor(fulfillment, neighborhood) {
  if (fulfillment !== "entrega") return 0;
  if (!neighborhood) return null; // ainda não escolhido
  return FREE_ZONES.includes(neighborhood) ? 0 : DELIVERY_FEE;
}