import { X } from 'lucide-react';

// TODO: Design DetailFlyoutPanel — contextual detail panel for orders, requests, reviews, customers etc.
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
          <button onClick={() => setSelectedItem(null)} aria-label="Close details">
            <X size={17} />
          </button>
          <h2>{selectedItem.title ?? 'Details'}</h2>
        </header>
        {/* TODO: Build contextual detail content here */}
      </aside>
    </>
  );
}
