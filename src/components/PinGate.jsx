import { useEffect, useState } from "react";
import { BackIcon } from "../icons.jsx";
import Logo from "./Logo.jsx";
import { PANEL_PIN } from "../data/menu.js";

export default function PinGate({ onUnlock, onBack }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function pressDigit(d) {
    setError(false);
    setInput((prev) => (prev.length < 4 ? prev + d : prev));
  }
  function clearInput() {
    setInput("");
    setError(false);
  }
  function backspace() {
    setError(false);
    setInput((prev) => prev.slice(0, -1));
  }

  // Confere o PIN assim que completa 4 dígitos — seja pelo teclado numérico
  // na tela ou pelo teclado físico.
  useEffect(() => {
    if (input.length !== 4) return;
    if (input === PANEL_PIN) {
      onUnlock();
    } else {
      setError(true);
      const t = setTimeout(() => {
        setInput("");
        setError(false);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [input, onUnlock]);

  // Digitar pelo teclado do computador: números, Backspace pra apagar e
  // Esc pra limpar tudo.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key >= "0" && e.key <= "9") pressDigit(e.key);
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Escape") clearInput();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
          <button key={n} type="button" onClick={() => pressDigit(String(n))}>{n}</button>
        ))}
        <button type="button" className="pin-clear" onClick={clearInput}>Limpar</button>
        <button type="button" onClick={() => pressDigit("0")}>0</button>
        <button type="button" className="pin-clear" onClick={onBack}><BackIcon /></button>
      </div>
      <p className={"pin-error" + (error ? " show" : "")}>PIN incorreto. Tente novamente.</p>
    </div>
  );
}