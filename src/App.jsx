import { useState } from "react";
import ClientView from "./components/ClientView.jsx";
import PanelView from "./components/PanelView.jsx";

export default function App() {
  const [mode, setMode] = useState("client"); // "client" | "panel"

  return (
    <div id="app">
      {mode === "client" ? (
        <ClientView onGoPanel={() => setMode("panel")} />
      ) : (
        <PanelView onGoClient={() => setMode("client")} />
      )}
    </div>
  );
}
