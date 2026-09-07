// ---------------------------------------------------------------------------
// Configuração da loja — edite estes valores livremente.
// ---------------------------------------------------------------------------

// Número de WhatsApp que recebe os pedidos (DDI + DDD + número, só dígitos).
export const WHATSAPP_NUMBER = "5516991707559";

// PIN de 4 dígitos para abrir o painel interno da equipe.
export const PANEL_PIN = "7559";

// Bairros com entrega mais barata (LOW_DELIVERY_FEE). Qualquer outro
// bairro de Franca cobra DELIVERY_FEE (não tem mais entrega grátis).
export const LOW_FEE_ZONES = [
  "Parque Progresso",
  "Prolongamento Jardim Lima",
  "Jardim Flórida",
  "Recanto Elimar",
  "Prolongamento Recanto Elimar",
  "Parque das Árvores",
  "Jardim Alvorada",
  "Vila Marta",
  "Vila Europa",
  "Jardim Santa Lúcia",
  "Jardim Consolação",
];
export const LOW_DELIVERY_FEE = 4.99;
export const DELIVERY_FEE = 10;

// Faixas de CEP (Franca, SP) de cada bairro da lista acima — usado pra
// calcular o frete sozinho a partir do CEP digitado, sem depender do nome
// do bairro que a busca devolve. Fora dessas faixas, cobra DELIVERY_FEE.
// "from"/"to" são o CEP sem traço, como número.
export const LOW_FEE_CEP_RANGES = [
  { zone: "Parque Progresso", from: 14403079, to: 14403088 },
  { zone: "Prolongamento Jardim Lima", from: 14403090, to: 14403102 },
  { zone: "Jardim Flórida", from: 14403267, to: 14403278 },
  { zone: "Recanto Elimar", from: 14403280, to: 14403303 },
  { zone: "Prolongamento Recanto Elimar", from: 14403320, to: 14403336 },
  { zone: "Parque das Árvores", from: 14404064, to: 14404071 },
  { zone: "Jardim Alvorada", from: 14403130, to: 14404014 },
  { zone: "Vila Marta", from: 14403161, to: 14403171 },
  { zone: "Vila Europa", from: 14403213, to: 14403218 },
  { zone: "Jardim Santa Lúcia", from: 14403002, to: 14403017 },
  { zone: "Jardim Consolação", from: 14400030, to: 14400160 },
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
      { id: "esp-pao-alho", name: "Pão de Alho", price: 8 },
    ],
  },
    {
    id: "combos",
    label: "Combos",
    icon: "star",
    items: [
      { id: "combo-1esp", name: "1 Espeto + Acompanhamento - Vinagrete, Farofa e Mandioca", price: 16 },
      { id: "combo-2esp", name: "2 Espetos + Acompanhamento - Vinagrete, Farofa e Mandioca", price: 23 },
      { id: "combo-alho", name: "2 Pães de Alho + Acompanhamento - Vinagrete, Farofa e Mandioca", price: 16 },
      { id: "combo-queijo", name: "2 Queijo Coalho + Acompanhamento - Vinagrete, Farofa e Mandioca", price: 20 },
      { id: "combo-queijo2", name: "2 Queijo Coalho + Mel", price: 20 },
    ],
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

// Colunas do quadro (Kanban) do painel. A etapa "pronto" vira DUAS
// colunas na tela — o sistema já separa sozinho pelo tipo do pedido
// (fulfillment), sem a equipe precisar escolher nada: quem é retirada
// cai em "Pronto para retirada", quem é entrega cai em "Pronto" (e
// segue dali pra "Saiu para entrega"). O status guardado no pedido
// continua sendo só "pronto" nos dois casos — é só a exibição que muda.
export const BOARD_COLUMNS = [
  { key: "aguardando_pagamento", label: STATUS_LABEL.aguardando_pagamento, color: STATUS_COLOR.aguardando_pagamento, match: (o) => o.status === "aguardando_pagamento" },
  { key: "recebido", label: STATUS_LABEL.recebido, color: STATUS_COLOR.recebido, match: (o) => o.status === "recebido" },
  { key: "preparando", label: STATUS_LABEL.preparando, color: STATUS_COLOR.preparando, match: (o) => o.status === "preparando" },
  { key: "pronto_retirada", label: "Pronto para retirada", color: STATUS_COLOR.pronto, match: (o) => o.status === "pronto" && o.fulfillment !== "entrega" },
  { key: "pronto_entrega", label: STATUS_LABEL.pronto, color: STATUS_COLOR.pronto, match: (o) => o.status === "pronto" && o.fulfillment === "entrega" },
  { key: "saiu_para_entrega", label: STATUS_LABEL.saiu_para_entrega, color: STATUS_COLOR.saiu_para_entrega, match: (o) => o.status === "saiu_para_entrega" },
  { key: "entregue", label: STATUS_LABEL.entregue, color: STATUS_COLOR.entregue, match: (o) => o.status === "entregue" },
];