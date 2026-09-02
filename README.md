# Espetim do Nin — Pedidos

Sistema de pedidos em React (Vite): cardápio com carrinho para o cliente e
um painel interno em formato de esteira (Recebido → Preparando → Pronto →
Entregue) para a equipe acompanhar o preparo e o envio.

## Como rodar no VSCode

1. Abra a pasta do projeto no VSCode.
2. No terminal integrado, instale as dependências:
   ```
   npm install
   ```
3. Suba o servidor de desenvolvimento:
   ```
   npm run dev
   ```
4. Abra o endereço que aparecer no terminal (normalmente `http://localhost:5173`).

## Como usar

- **Página do cliente** (`/`): o cliente monta o carrinho, escolhe retirada
  ou entrega, forma de pagamento e confirma. O botão final abre o WhatsApp
  já com a mensagem do pedido pronta para enviar ao seu número.
- **Painel interno**: clique em "Equipe" no topo da página do cliente e
  digite o PIN (o padrão é `7559` — troque em `src/data/menu.js`). Lá você
  vê os pedidos em colunas por status e pode registrar rapidamente um
  pedido que chegou pelo WhatsApp usando o botão "Novo pedido" (reaproveita
  o mesmo cardápio com os contadores).

## O que editar

Quase tudo fica em **`src/data/menu.js`**:

- `WHATSAPP_NUMBER` — número que recebe os pedidos.
- `PANEL_PIN` — PIN de 4 dígitos do painel interno.
- `MENU` — categorias, itens e preços.
- `FREE_ZONES` / `DELIVERY_FEE` — bairros com frete grátis e a taxa para os demais.
- `HOURS` — dias e horário de funcionamento (o site calcula sozinho se está aberto agora, usando o fuso `America/Sao_Paulo`).
- `PAY_METHODS` — formas de pagamento aceitas.

## Como os pedidos são guardados

O painel guarda os pedidos no `localStorage` do navegador. Isso funciona
muito bem entre **abas do mesmo navegador** — por exemplo, uma aba com o
cardápio do cliente e outra com o painel, no mesmo tablet ou computador do
seu estabelecimento: elas ficam sincronizadas automaticamente.

Isso **não sincroniza sozinho entre aparelhos diferentes** (o celular de um
cliente de verdade e o tablet da cozinha, por exemplo) — por isso o botão de
finalizar pedido sempre manda a mensagem pelo WhatsApp, que é o que
realmente chega até você de qualquer aparelho, sem precisar de conta ou
instalação. O painel serve para você (e sua equipe, no mesmo local) organizar
esses pedidos numa esteira visual, registrando cada um em poucos toques.

Se no futuro você quiser que os pedidos apareçam automaticamente no painel
assim que o cliente confirma — sem precisar registrar manualmente — isso dá
para fazer, mas exige um banco de dados de verdade por trás (por exemplo
Firebase ou Supabase, ambos com plano gratuito) para guardar os pedidos num
servidor em vez do navegador. É um passo a mais de infraestrutura; me avise
se quiser ajuda para configurar isso quando chegar a hora.

## Publicar/hospedar o site

Para colocar no ar (com um link de verdade para os clientes):
```
npm run build
```
Isso gera a pasta `dist/`, que pode ser publicada em qualquer serviço de
hospedagem de site estático — Vercel, Netlify e Cloudflare Pages têm planos
gratuitos e costumam ser as opções mais simples para esse tipo de projeto.
