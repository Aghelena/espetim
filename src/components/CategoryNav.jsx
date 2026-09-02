import { MENU } from "../data/menu.js";
import { CATEGORY_ICONS } from "../icons.jsx";

export default function CategoryNav({ active, onSelect }) {
  return (
    <nav className="cat-nav">
      {MENU.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.icon];
        return (
          <button
            key={cat.id}
            type="button"
            className={"cat-tab" + (cat.id === active ? " active" : "")}
            onClick={() => onSelect(cat.id)}
          >
            <Icon />
            {cat.label}
          </button>
        );
      })}
    </nav>
  );
}
