import { useState } from "react";
import { brl } from "../utils.js";

// Calculadora de troco: digita quanto o cliente deu em dinheiro e já mostra
// o troco. Ao salvar, isso fica registrado no pedido e entra na conferência
// do fechamento de caixa.
export default function ChangeCalcDialog({ total, initialReceived, onSave, onCancel }) {
  const [received, setReceived] = useState(initialReceived != null ? String(initialReceived).replace(".", ",") : "");

  const receivedNum = parseFloat(received.replace(",", ".")) || 0;
  const change = receivedNum - total;
  const canSave = receivedNum > 0;

  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>Calcular troco</h3>
        <p>Total do pedido: <b className="num">{brl(total)}</b></p>

        <div className="field" style={{ textAlign: "left" }}>
          <label>Valor recebido do cliente</label>
          <input
            autoFocus
            inputMode="decimal"
            placeholder="0,00"
            value={received}
            onChange={(e) => setReceived(e.target.value.replace(/[^0-9,]/g, ""))}
          />
        </div>

        <div className={"change-result" + (receivedNum > 0 && change < 0 ? " neg" : "")}>
          {receivedNum === 0
            ? "Digite o valor recebido"
            : change < 0
            ? `Falta ${brl(-change)}`
            : change === 0
            ? "Valor exato, sem troco"
            : `Troco: ${brl(change)}`}
        </div>

        <div className="confirm-dialog-actions">
          <button type="button" className="cd-btn cd-ghost" onClick={onCancel}>Cancelar</button>
          <button
            type="button"
            className="cd-btn cd-solid"
            disabled={!canSave}
            onClick={() => canSave && onSave(receivedNum, Math.max(0, change))}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}