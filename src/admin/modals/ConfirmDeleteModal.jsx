export default function ConfirmDeleteModal({
  isOpen,
  title,
  badgeText = 'Permanent action',
  detail,
  codeText,
  confirmButtonText = 'Delete permanently',
  dialogClassName = 'admin-confirm-dialog',
  ariaLabel,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <>
      <button
        className="admin-detail-scrim"
        onClick={onCancel}
        aria-label="Cancel deletion"
      />
      <aside
        className={dialogClassName}
        role="alertdialog"
        aria-label={ariaLabel || title}
      >
        {badgeText && <small>{badgeText}</small>}
        {title && <h2>{title}</h2>}
        {detail && <p>{detail}</p>}
        {codeText && <code>{codeText}</code>}
        <div>
          <button onClick={onCancel}>Cancel</button>
          <button className="is-danger" onClick={onConfirm}>
            {confirmButtonText}
          </button>
        </div>
      </aside>
    </>
  );
}
