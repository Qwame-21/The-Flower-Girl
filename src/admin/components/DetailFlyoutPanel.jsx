import { X } from 'lucide-react';
import { ORDER_LABELS } from '../utils/adminMappers';

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
        className="admin-detail-panel contextual-panel"
        aria-label={`${selectedItem.title} details`}
      ><header className="admin-panel-heading">
        <button onClick={() => setSelectedItem(null)} aria-label="Close details">
          <X size={17} />
        </button>
        <small>{activeNav}</small>
        <h2>{selectedItem.title}</h2></header>
        <span>{selectedItem.status}</span>
        <p>{selectedItem.detail}</p>
        {selectedItem.type === 'customer' && (
          <section className="panel-records">
            <small>Order history</small>
            {selectedItem.customer.orders.map(order => (
              <button
                key={order.id}
                onClick={() => {
                  setSelectedItem(null);
                  openOrder(order.id);
                }}
              >
                <strong>{order.tracking}</strong>
                <span>{ORDER_LABELS[order.status]}</span>
                <b>GHS {Number(order.total).toLocaleString()}</b>
              </button>
            ))}
          </section>
        )}
        {selectedItem.type === 'request' && (
          <section className="panel-detail-grid">
            <article><small>Request reference</small><strong>{selectedItem.request.reference || 'Not supplied'}</strong></article>
            <article><small>Email</small><p>{selectedItem.request.email || 'Not supplied'}</p></article>
            <article><small>Recipient</small><strong>{selectedItem.request.recipient || selectedItem.request.name}</strong><p>{selectedItem.request.recipientPhone || selectedItem.request.phone}</p></article>
            <article><small>Delivery / collection</small><strong>{selectedItem.request.deliveryAddress || 'Location not supplied'}</strong><p>{selectedItem.request.landmark}</p><p>{selectedItem.request.locationLink}</p><p>{selectedItem.request.deliveryInstructions}</p></article>
            <article><small>Budget</small><p>{selectedItem.request.budget ? `GHS ${selectedItem.request.budget}` : 'Not supplied'}</p></article>
            <article><small>Gift card</small><p>{selectedItem.request.cardMessage || 'No message'}</p><p>{selectedItem.request.cardStyleNotes}</p></article>

            <div>
              <small>Contact</small>
              <strong>{selectedItem.request.name}</strong>
              <p>{selectedItem.request.phone || 'No phone supplied'}</p>
            </div>
            <div>
              <small>Preferred date</small>
              <strong>{selectedItem.request.preferredDate || 'To confirm'}</strong>
              <p>{selectedItem.request.occasion || 'No occasion specified'}</p>
            </div>
            <div>
              <small>Selection</small>
              <strong>
                {selectedItem.request.service ||
                  selectedItem.request.selections?.join(', ') ||
                  'Bespoke gift'}
              </strong>
              <p>Quantity: {selectedItem.request.quantity || 1}</p>
            </div>
            <div>
              <small>Estimate</small>
              <strong>
                {selectedItem.request.estimateHigh
                  ? `GHS ${Number(selectedItem.request.estimateLow).toLocaleString()}–${Number(
                      selectedItem.request.estimateHigh
                    ).toLocaleString()}`
                  : 'Quote required'}
              </strong>
              <p>{selectedItem.request.inspirationName || 'No inspiration file'}</p>
            </div>
          </section>
        )}
        {selectedItem.type === 'application' && (
          <section className="panel-detail-grid">
            <div>
              <small>Contact</small>
              <strong>{selectedItem.application.email}</strong>
              <p>
                {selectedItem.application.phone || 'No phone'} ·{' '}
                {selectedItem.application.location || 'No location'}
              </p>
            </div>
            <div>
              <small>Role</small>
              <strong>{selectedItem.application.role}</strong>
              <p>
                Available: {selectedItem.application.earliestStart || 'To confirm'}
              </p>
            </div>
            <div>
              <small>Portfolio</small>
              <strong>{selectedItem.application.portfolio || 'Not supplied'}</strong>
              <p>CV: {selectedItem.application.cvName || 'No filename'}</p>
            </div>
            <div>
              <small>Experience</small>
              <p>{selectedItem.application.experience || 'Not supplied'}</p>
            </div>
          </section>
        )}
        {selectedItem.type === 'review' && (
          <section className="panel-review">
            <b>{'★'.repeat(selectedItem.review.rating)}</b>
            <blockquote>{selectedItem.review.text}</blockquote>
            <p>
              {selectedItem.review.customer} · {selectedItem.review.date}
            </p>
            <button
              onClick={() => {
                setReviews(items =>
                  items.map(item =>
                    item.id === selectedItem.review.id
                      ? {
                          ...item,
                          status:
                            selectedItem.review.status === 'Published'
                              ? 'Pending'
                              : 'Published',
                        }
                      : item
                  )
                );
                setSelectedItem(null);
              }}
            >
              {selectedItem.review.status === 'Published'
                ? 'Unpublish review'
                : 'Publish review'}
            </button>
          </section>
        )}
        {selectedItem.type === 'delivery' && (
          <section className="panel-delivery">
            <div>
              <small>Recipient</small>
              <strong>{selectedItem.delivery.recipient}</strong>
              <p>
                {selectedItem.delivery.phone} · {selectedItem.delivery.location}
              </p>
            </div>
            <div>
              <small>Rider</small>
              <strong>{selectedItem.delivery.rider}</strong>
              <p>Sent: {selectedItem.delivery.sentAt}</p>
            </div>
            <div>
              <small>Estimated delivery</small>
              <strong>{selectedItem.delivery.estimate}</strong>
            </div>
            <button
              onClick={() => {
                const next =
                  selectedItem.delivery.status === 'Ready'
                    ? 'In transit'
                    : 'Delivered';
                setDeliveries(items =>
                  items.map(item =>
                    item.id === selectedItem.delivery.id
                      ? { ...item, status: next }
                      : item
                  )
                );
                setSelectedItem(current => ({
                  ...current,
                  status: next,
                  delivery: { ...current.delivery, status: next },
                }));
              }}
            >
              {selectedItem.delivery.status === 'Ready'
                ? 'Mark dispatched'
                : 'Mark delivered'}
            </button>
          </section>
        )}
        {!['customer', 'request', 'application', 'review', 'delivery'].includes(
          selectedItem.type
        ) && (
          <div className="contextual-panel__actions">
            <button onClick={() => setSelectedItem(null)}>Close</button>
          </div>
        )}
      </aside>
    </>
  );
}
