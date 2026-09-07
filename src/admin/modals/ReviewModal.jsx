import { X } from 'lucide-react';
import { addAdminRecord, updateAdminCollection } from '../api/adminStore';

// TODO: Design ReviewModal — add/edit review form
export default function ReviewModal({
  reviewFormOpen,
  setReviewFormOpen,
  editingReview,
  setEditingReview,
}) {
  if (!reviewFormOpen) return null;

  const handleClose = () => {
    setReviewFormOpen(false);
    setEditingReview(null);
  };

  return (
    <div className="admin-modal-stub" role="dialog" aria-modal="true" aria-label={editingReview ? 'Edit review' : 'Add testimonial'}>
      <p>{editingReview ? 'Edit review' : 'Add testimonial'} — form to be designed here.</p>
      <button onClick={handleClose}>Close</button>
    </div>
  );
}
