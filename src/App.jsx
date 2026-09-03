import { useEffect, useState } from "react";
import ClientView from "./components/ClientView.jsx";
import PanelView from "./components/PanelView.jsx";
import OrderTrack from "./components/OrderTrack.jsx";

// O painel abre direto quando o endereço termina em "#painel" — assim dá
// pra salvar um link separado (ex: espetim.vercel.app/#painel) nos
// favoritos do computador da loja, sem precisar de um botão visível na
// página do cliente. "#acompanhar" e "#pedido/<codigo>" abrem a tela
// pública de acompanhamento do pedido.
function modeFromHash() {
  const h = window.location.hash;
  if (h === "#painel") return "panel";
  if (h === "#acompanhar" || h.startsWith("#pedido/")) return "track";
  return "client";
}
function codeFromHash() {
  const h = window.location.hash;
  return h.startsWith("#pedido/") ? decodeURIComponent(h.slice("#pedido/".length)) : "";
}

export default function App() {
  const [mode, setMode] = useState(modeFromHash);
  const [trackCode, setTrackCode] = useState(codeFromHash);

  useEffect(() => {
    function onHashChange() {
      setMode(modeFromHash());
      setTrackCode(codeFromHash());
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
      {mode === "client" && <ClientView onGoPanel={goPanel} />}
      {mode === "panel" && <PanelView onGoClient={goClient} />}
      {mode === "track" && <OrderTrack code={trackCode} onGoClient={goClient} />}
    </div>
  );
}