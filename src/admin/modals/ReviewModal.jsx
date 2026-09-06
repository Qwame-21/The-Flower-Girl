import { X } from 'lucide-react';
import { addAdminRecord, updateAdminCollection } from '../api/adminStore';

export default function ReviewModal({
  reviewFormOpen,
  setReviewFormOpen,
  editingReview,
  setEditingReview,
}) {
  if (!reviewFormOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const record = {
      customer: form.get('customer'),
      product: form.get('product'),
      rating: Number(form.get('rating')),
      text: form.get('text'),
      status: form.get('status'),
      date:
        editingReview?.date ||
        new Date().toLocaleDateString('en-GH', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
    };

    if (editingReview) {
      updateAdminCollection('reviews', items =>
        items.map(item => (item.id === editingReview.id ? { ...item, ...record } : item))
      );
    } else {
      addAdminRecord('reviews', record);
    }

    setReviewFormOpen(false);
    setEditingReview(null);
  };

  const handleClose = () => {
    setReviewFormOpen(false);
    setEditingReview(null);
  };

  return (
    <>
      <button
        className="admin-detail-scrim"
        onClick={handleClose}
        aria-label="Close review form"
      />
      <aside
        className="admin-detail-panel product-form-panel"
        aria-label={editingReview ? 'Edit review' : 'Add testimonial'}
      >
        <button onClick={handleClose} aria-label="Close review form">
          <X size={17} />
        </button>
        <small>Reviews</small>
        <h2>{editingReview ? 'Edit review' : 'Add testimonial'}</h2>
        <form key={editingReview?.id || 'new-review'} onSubmit={handleSubmit}>
          <label>
            Customer name
            <input name="customer" required defaultValue={editingReview?.customer || ''} />
          </label>
          <label>
            Product or service
            <input name="product" required defaultValue={editingReview?.product || ''} />
          </label>
          <div>
            <label>
              Rating
              <select name="rating" defaultValue={editingReview?.rating || 5}>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue={editingReview?.status || 'Pending'}>
                <option>Pending</option>
                <option>Published</option>
                <option>Flagged</option>
              </select>
            </label>
          </div>
          <label>
            Review text
            <textarea name="text" required rows="6" defaultValue={editingReview?.text || ''} />
          </label>
          <button type="submit">
            {editingReview ? 'Save review' : 'Add testimonial'}
          </button>
        </form>
      </aside>
    </>
  );
}
