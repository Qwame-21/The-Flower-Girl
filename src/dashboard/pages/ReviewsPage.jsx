// src/pages/ReviewsPage.jsx
// Rewired to use Supabase reviews table

import { useState, useEffect } from 'react';
import {
  listReviews,
  updateReviewStatus,
  deleteReview
} from '../data/reviews';

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// Star display
function StarsSVG({ rating }) {
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[1,2,3,4,5].map(n => (
        <svg key={n} width="14" height="14" viewBox="0 0 24 24"
          fill={n <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Load reviews on mount
  useEffect(() => {
    async function loadReviews() {
      const data = await listReviews();
      setReviews(data);
      setLoading(false);
    }
    loadReviews();
  }, []);

  const handleStatusChange = async (reviewId, newStatus) => {
    const result = await updateReviewStatus(reviewId, newStatus);
    if (result.success) {
      setReviews(prev => prev.map(r =>
        r.id === reviewId ? { ...r, status: newStatus } : r
      ));
      showToast(`Review ${newStatus}`);
    } else {
      showToast('Failed to update review');
    }
  };

  const handleDelete = async (reviewId) => {
    const result = await deleteReview(reviewId);
    if (result.success) {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showToast('Review deleted');
      setConfirmDeleteId(null);
    } else {
      showToast('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchSearch = !searchQuery ||
      review.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product_or_service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.review_text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCounts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    published: reviews.filter(r => r.status === 'published').length,
    flagged: reviews.filter(r => r.status === 'flagged').length
  };

  if (loading) {
    return <div className="page-container">Loading reviews...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Reviews</h2>
          <p>Manage customer reviews and testimonials.</p>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(26,26,26,0.1)' }}>
        {['all', 'pending', 'published', 'flagged'].map(status => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: statusFilter === status ? '2px solid #1a1a1a' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '14px',
              color: statusFilter === status ? '#1a1a1a' : 'var(--text-muted)',
              textTransform: 'capitalize'
            }}
          >
            {status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search reviews..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 16px',
            border: '1px solid rgba(26,26,26,0.14)',
            borderRadius: '8px',
            fontSize: '14px'
          }}
        />
      </div>

      {/* Reviews list */}
      {filteredReviews.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid rgba(26,26,26,0.08)'
        }}>
          No reviews found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredReviews.map(review => (
            <div
              key={review.id}
              style={{
                background: 'var(--card-bg)',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid rgba(26,26,26,0.08)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                    {review.customer_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {review.product_or_service}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <StarsSVG rating={review.rating} />
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    background: review.status === 'published' ? '#dcfce7' :
                               review.status === 'flagged' ? '#fee2e2' :
                               review.status === 'pending' ? '#fef3c7' : '#f3f4f6',
                    color: review.status === 'published' ? '#166534' :
                           review.status === 'flagged' ? '#991b1b' :
                           review.status === 'pending' ? '#92400e' : '#374151'
                  }}>
                    {review.status}
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px', color: '#374151' }}>
                {review.review_text}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {review.status === 'pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(review.id, 'published')}
                        style={{
                          padding: '6px 12px',
                          background: '#dcfce7',
                          color: '#166534',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Publish
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(review.id, 'flagged')}
                        style={{
                          padding: '6px 12px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Flag
                      </button>
                    </>
                  )}
                  {review.status === 'published' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(review.id, 'pending')}
                      style={{
                        padding: '6px 12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(review.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {confirmDeleteId === review.id && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fee2e2',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: '#991b1b' }}>Delete this review?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(review.id)}
                    style={{
                      padding: '4px 12px',
                      background: '#dc2626',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(null)}
                    style={{
                      padding: '4px 12px',
                      background: 'transparent',
                      border: '1px solid rgba(26,26,26,0.2)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
