// ---------------------------------------------------------------------------
// Configuração da loja — edite estes valores livremente.
// ---------------------------------------------------------------------------

// Número de WhatsApp que recebe os pedidos (DDI + DDD + número, só dígitos).
export const WHATSAPP_NUMBER = "5516991707559";

// PIN de 4 dígitos para abrir o painel interno da equipe.
export const PANEL_PIN = "7559";

// Bairros com frete grátis. Qualquer outro bairro cobra DELIVERY_FEE.
export const FREE_ZONES = [
  "Parque Progresso",
  "Aeroporto I",
  "Aeroporto II",
  "Aeroporto III",
];
export const DELIVERY_FEE = 10;

// Faixas de CEP (Franca, SP) de cada bairro grátis — usado pra calcular o
// frete sozinho a partir do CEP digitado, sem depender do nome do bairro
// que a busca devolve. Fora dessas faixas, cobra DELIVERY_FEE. "from"/"to"
// são o CEP sem traço, como número.
export const FREE_ZONE_CEP_RANGES = [
  { zone: "Aeroporto I", from: 14404038, to: 14404075 },
  { zone: "Aeroporto II", from: 14404099, to: 14404131 },
  { zone: "Aeroporto III", from: 14404200, to: 14404268 },
  { zone: "Parque Progresso", from: 14403079, to: 14403088 },
];

// Horário de funcionamento. day: 0=domingo ... 6=sábado.
export const HOURS = [
  { day: 1, label: "Segunda", open: 17, close: 22 },
  { day: 3, label: "Quarta", open: 17, close: 22 },
  { day: 4, label: "Quinta", open: 17, close: 22 },
  { day: 5, label: "Sexta", open: 17, close: 22 },
  { day: 6, label: "Sábado", open: 14, close: 22 },
];

// Fuso horário usado para calcular se a loja está aberta agora.
export const TIME_ZONE = "America/Sao_Paulo";

// Formas de pagamento aceitas (registradas no pedido; nada é cobrado pelo site).
export const PAY_METHODS = [
  { id: "pix", label: "Pix" },
  { id: "credito", label: "Cartão de crédito" },
  { id: "debito", label: "Cartão de débito" },
  { id: "dinheiro", label: "Dinheiro" },
];

// Cardápio, por categoria.
export const MENU = [
  {
    id: "espetinhos",
    label: "Espetinhos",
    icon: "skewer",
    items: [
      { id: "esp-bovino", name: "Bovino", price: 12 },
      { id: "esp-frango", name: "Medalhão de Frango", price: 12 },
      { id: "esp-linguica", name: "Linguiça", price: 12 },
      { id: "esp-coracao", name: "Coração", price: 12 },
      { id: "esp-kafta", name: "Kafta", price: 12 },
      { id: "esp-coalho", name: "Queijo Coalho", price: 13 },
      { id: "esp-coalho-mel", name: "Queijo Coalho com Mel", price: 14 },
    ],
  },
  {
    id: "combos",
    label: "Combos",
    icon: "star",
    items: [{ id: "combo-2esp", name: "2 Espetos + Acompanhamento", price: 23 }],
  },
  {
    id: "acompanhamentos",
    label: "Acompanhamentos",
    icon: "bowl",
    items: [
      { id: "ac-farofa", name: "Farofa", price: 2 },
      { id: "ac-vinagrete", name: "Vinagrete", price: 2.5 },
      { id: "ac-mandioca", name: "Mandioca", price: 3 },
      { id: "ac-todos", name: "Todos os Acompanhamentos", price: 6 },
    ],
  },
  {
    id: "bebidas",
    label: "Bebidas",
    icon: "cup",
    items: [
      { id: "beb-agua", name: "Água", price: 3 },
      { id: "beb-coca", name: "Coca-Cola", price: 6.5 },
      { id: "beb-guarana", name: "Guaraná", price: 5 },
      { id: "beb-romarinho", name: "Romarinho", price: 4.5 },
    ],
  },
];

export const ITEMS_BY_ID = Object.fromEntries(
  MENU.flatMap((cat) => cat.items.map((it) => [it.id, it]))
);

// "aguardando_pagamento" é onde todo pedido feito pelo cliente (via
// WhatsApp) entra primeiro — assim que ele confirma o envio, o pedido já
// cai no painel nessa coluna. Um pedido registrado direto pelo painel
// (balcão/telefone) entra em "recebido", pulando essa etapa.
//
// "saiu_para_entrega" só existe pra pedidos de ENTREGA — depois de
// "pronto" (ficou pronto na cozinha), a entrega ainda precisa sair pra
// rua. Pedido de RETIRADA pula essa coluna: de "pronto" já vai direto
// pra "entregue" quando o cliente retira (ver nextStatus abaixo).
export const STATUS_FLOW = ["aguardando_pagamento", "recebido", "preparando", "pronto", "saiu_para_entrega", "entregue"];
export const STATUS_LABEL = {
  aguardando_pagamento: "Aguardando pagamento",
  recebido: "Recebido",
  preparando: "Preparando",
  pronto: "Pronto",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
};
export const STATUS_COLOR = {
  aguardando_pagamento: "#b3a89f",
  recebido: "#e0221a",
  preparando: "#15100e",
  pronto: "#1f9254",
  saiu_para_entrega: "#2f6fb3",
  entregue: "#8a7f77",
};
export const STATUS_ACTION = {
  aguardando_pagamento: "Confirmar pagamento",
  recebido: "Iniciar preparo",
  preparando: "Marcar pronto",
  saiu_para_entrega: "Marcar entregue",
};

// Próximo status ao avançar um pedido no painel. O único ponto onde
// retirada e entrega se separam é em "pronto": quem retira no local pode
// ser marcado como entregue direto; quem recebe em casa primeiro sai
// para entrega.
export function nextStatus(status, fulfillment) {
  if (status === "pronto" && fulfillment !== "entrega") return "entregue";
  const i = STATUS_FLOW.indexOf(status);
  if (i < 0 || i >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[i + 1];
}

// Texto do botão de avançar no painel — também depende do tipo do pedido
// só na etapa "pronto".
export function actionLabelFor(status, fulfillment) {
  if (status === "pronto") return fulfillment === "entrega" ? "Marcar saiu para entrega" : "Marcar entregue";
  return STATUS_ACTION[status];
}