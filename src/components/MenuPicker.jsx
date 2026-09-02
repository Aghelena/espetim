import { MENU } from "../data/menu.js";
import { CATEGORY_ICONS } from "../icons.jsx";
import { brl } from "../utils.js";

// Lista do cardápio com contador (-/+) por item. Usado tanto na tela do
// cliente quanto no "novo pedido" do painel interno — cada um passa seu
// próprio `cart` e `onChange`.
export default function MenuPicker({ cart, onChange, compact = false }) {
  function setQty(id, qty) {
    const next = { ...cart };
    if (qty <= 0) delete next[id];
    else next[id] = qty;
    onChange(next);
  }

  return (
    <div className="menu">
      {MENU.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.icon];
        return (
          <div className="cat-section" id={compact ? undefined : `cat-${cat.id}`} key={cat.id} style={compact ? { marginTop: 12 } : undefined}>
            <div className="cat-title">
              <Icon />
              <h2 style={compact ? { fontSize: ".95rem" } : undefined}>{cat.label}</h2>
              <span className="cat-rule" />
            </div>
            {cat.items.map((item) => {
              const qty = cart[item.id] || 0;
              return (
                <div className="item-row" key={item.id}>
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price mono num">{brl(item.price)}</span>
                  </div>
                  <div className="stepper">
                    <button
                      type="button"
                      className="step-btn minus"
                      disabled={qty === 0}
                      aria-label={`Diminuir ${item.name}`}
                      onClick={() => setQty(item.id, qty - 1)}
                    >
                      −
                    </button>
                    <span className="step-qty num">{qty}</span>
                    <button
                      type="button"
                      className="step-btn plus"
                      aria-label={`Aumentar ${item.name}`}
                      onClick={() => setQty(item.id, qty + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
