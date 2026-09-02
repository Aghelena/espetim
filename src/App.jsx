import { useEffect, useState } from "react";
import ClientView from "./components/ClientView.jsx";
import PanelView from "./components/PanelView.jsx";

// O painel abre direto quando o endereço termina em "#painel" — assim dá
// pra salvar um link separado (ex: espetim.vercel.app/#painel) nos
// favoritos do computador da loja, sem precisar de um botão visível na
// página do cliente.
function modeFromHash() {
  return window.location.hash === "#painel" ? "panel" : "client";
}

export default function App() {
  const [mode, setMode] = useState(modeFromHash);

  useEffect(() => {
    function onHashChange() {
      setMode(modeFromHash());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function goPanel() {
    window.location.hash = "painel";
    setMode("panel");
  }
  function goClient() {
    window.location.hash = "";
    setMode("client");
  }

  return (
    <div id="app" className={mode === "panel" ? "panel-mode" : ""}>
      {mode === "client" ? (
        <ClientView onGoPanel={goPanel} />
      ) : (
        <PanelView onGoClient={goClient} />
      )}
    </div>
  );
}