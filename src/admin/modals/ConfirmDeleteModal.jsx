import { X } from 'lucide-react';

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
        <header className="admin-panel-heading">
          <button type="button" onClick={onCancel} aria-label="Close confirmation"><X size={17} /></button>
          {badgeText && <small>{badgeText}</small>}
          {title && <h2>{title}</h2>}
        </header>
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
