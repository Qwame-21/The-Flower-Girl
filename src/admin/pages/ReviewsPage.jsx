import { UserRound } from 'lucide-react';
import { updateAdminCollection } from '../api/adminStore';

export default function ReviewsPage({
  activeTab,
  reviews,
  setSelectedItem,
  setEditingReview,
  setReviewFormOpen,
}) {
  return (
    <>
      <header className="admin-page-heading">
        <div>
          <small>Moderation · {activeTab}</small>
          <h2>Customer reviews</h2>
          <p>Read the complete review and control whether it appears publicly.</p>
        </div>
        <button
          onClick={() => {
            setEditingReview(null);
            setReviewFormOpen(true);
          }}
        >
          Add testimonial
        </button>
      </header>
      <div className="review-manager">
        {reviews
          .filter(review =>
            activeTab === 'Pending'
              ? review.status === 'Pending'
              : activeTab === 'Published'
              ? review.status === 'Published'
              : activeTab === 'Flagged'
              ? review.status === 'Flagged'
              : true
          )
          .map(review => (
            <article key={review.id}>
              <button
                onClick={() =>
                  setSelectedItem({
                    type: 'review',
                    title: review.product,
                    status: `${review.rating}.0 review`,
                    detail: review.text,
                    review,
                  })
                }
              >
                <span className="customer-avatar">
                  <UserRound size={19} />
                </span>
                <span>
                  <strong>{review.customer}</strong>
                  <small>
                    {review.product} · {review.date}
                  </small>
                </span>
                <b>{'★'.repeat(review.rating)}</b>
                <i>→</i>
              </button>
              <div>
                <button
                  onClick={() => {
                    setEditingReview(review);
                    setReviewFormOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    updateAdminCollection('reviews', items =>
                      items.map(item =>
                        item.id === review.id
                          ? {
                              ...item,
                              status: item.status === 'Published' ? 'Pending' : 'Published',
                            }
                          : item
                      )
                    )
                  }
                >
                  {review.status === 'Published' ? 'Unpublish' : 'Publish review'}
                </button>
                <button
                  onClick={() =>
                    updateAdminCollection('reviews', items =>
                      items.map(item =>
                        item.id === review.id ? { ...item, status: 'Flagged' } : item
                      )
                    )
                  }
                >
                  Flag
                </button>
                <button
                  className="is-danger"
                  onClick={() =>
                    updateAdminCollection('reviews', items =>
                      items.filter(item => item.id !== review.id)
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
      </div>
    </>
  );
}
