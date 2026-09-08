import { X, ExternalLink, ShoppingBag, MessageSquareText } from 'lucide-react';

export default function DetailFlyoutPanel({
  selectedItem,
  setSelectedItem,
  activeNav,
  openOrder,
  setReviews,
  setDeliveries,
}) {
  if (!selectedItem) return null;

  return (
    <>
      <button
        className="admin-detail-scrim"
        onClick={() => setSelectedItem(null)}
        aria-label="Close details"
      />
      <aside
        className="admin-detail-panel"
        aria-label={`${selectedItem.title ?? 'Details'} panel`}
      >
        <header className="admin-panel-heading">
          <div>
            <small>{selectedItem.status || 'Details'}</small>
            <h2>{selectedItem.title ?? 'Details'}</h2>
          </div>
          <button onClick={() => setSelectedItem(null)} aria-label="Close details">
            <X size={17} />
          </button>
        </header>

        <div className="admin-panel-body">
          {selectedItem.detail && (
            <p className="detail-panel-summary">{selectedItem.detail}</p>
          )}

          {selectedItem.recordId && (
            <div className="detail-panel-actions">
              <button
                type="button"
                className="primary-action-btn"
                onClick={() => {
                  if (openOrder && selectedItem.recordId) {
                    openOrder(selectedItem.recordId);
                    setSelectedItem(null);
                  }
                }}
              >
                <ShoppingBag size={15} /> View Full Order #{selectedItem.recordId}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

