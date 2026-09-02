import { useState } from "react";
import { BackIcon } from "../icons.jsx";
import Logo from "./Logo.jsx";
import { PANEL_PIN } from "../data/menu.js";

export default function PinGate({ onUnlock, onBack }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function press(v) {
    if (v === "clear") {
      setInput("");
      setError(false);
      return;
    }
    const next = input.length < 4 ? input + v : input;
    setInput(next);
    if (next.length === 4) {
      if (next === PANEL_PIN) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setInput("");
          setError(false);
        }, 500);
      }
    }
  }

  return (
    <div className="pin-screen">
      <Logo size={96} className="hero-logo" />
      <h2>Painel Interno</h2>
      <p>Digite o PIN da equipe para acompanhar os pedidos.</p>
      <div className={"pin-dots" + (error ? " shake" : "")}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < input.length ? "filled" : ""} />
        ))}
      </div>
      <div className="pin-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <button key={n} type="button" onClick={() => press(String(n))}>{n}</button>
        ))}
        <button type="button" className="pin-clear" onClick={() => press("clear")}>Limpar</button>
        <button type="button" onClick={() => press("0")}>0</button>
        <button type="button" className="pin-clear" onClick={onBack}><BackIcon /></button>
      </div>
      <p className={"pin-error" + (error ? " show" : "")}>PIN incorreto. Tente novamente.</p>
    </div>
  );
}
