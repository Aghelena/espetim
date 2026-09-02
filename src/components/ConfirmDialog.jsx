// Popup de confirmação simples, no estilo do site — substitui o
// window.confirm() padrão do navegador (que é feio e não dá pra estilizar).
export default function ConfirmDialog({
  title = "Confirmar",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="confirm-backdrop" onClick={onCancel}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        <div className="confirm-dialog-actions">
          <button type="button" className="cd-btn cd-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={"cd-btn " + (danger ? "cd-danger" : "cd-solid")}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}