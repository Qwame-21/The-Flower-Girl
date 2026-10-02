// src/pages/RequestsPage.jsx
// Rewired to use Supabase customer_requests table

import { useState, useEffect } from 'react';
import {
  listRequests,
  updateRequestStatus,
  updateRequestQuote,
  deleteRequest
} from '../data/requests';

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

export default function RequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [confirmedQuote, setConfirmedQuote] = useState('');

  // Load requests on mount
  useEffect(() => {
    async function loadRequests() {
      const data = await listRequests();
      setRequests(data);
      setLoading(false);
    }
    loadRequests();
  }, []);

  const handleStatusChange = async (requestId, newStatus) => {
    const result = await updateRequestStatus(requestId, newStatus, adminNote || null);
    if (result.success) {
      const updated = await listRequests();
      setRequests(updated);
      showToast(`Request ${newStatus}`);
      setAdminNote('');
    } else {
      showToast('Failed to update request');
    }
  };

  const handleQuoteUpdate = async (requestId) => {
    if (!confirmedQuote || isNaN(parseFloat(confirmedQuote))) {
      showToast('Please enter a valid quote amount');
      return;
    }
    const result = await updateRequestQuote(requestId, parseFloat(confirmedQuote));
    if (result.success) {
      const updated = await listRequests();
      setRequests(updated);
      showToast('Quote updated');
      setConfirmedQuote('');
    } else {
      showToast('Failed to update quote');
    }
  };

  const handleDelete = async (requestId) => {
    const result = await deleteRequest(requestId);
    if (result.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
      showToast('Request deleted');
      setConfirmDeleteId(null);
    } else {
      showToast('Failed to delete request');
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchSearch = !searchQuery ||
      request.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reference.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusCounts = {
    all: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    quote_needed: requests.filter(r => r.status === 'quote_needed').length,
    approved: requests.filter(r => r.status === 'approved').length,
    converted: requests.filter(r => r.status === 'converted').length,
    closed: requests.filter(r => r.status === 'closed').length
  };

  if (loading) {
    return <div className="page-container">Loading requests...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Customer Requests</h2>
          <p>Manage custom gift requests and quotes.</p>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(26,26,26,0.1)', overflowX: 'auto' }}>
        {['all', 'new', 'quote_needed', 'approved', 'converted', 'closed'].map(status => (
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
              textTransform: 'capitalize',
              whiteSpace: 'nowrap'
            }}
          >
            {status.replace('_', ' ')} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search by name or reference..."
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

      {/* Requests list */}
      {filteredRequests.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid rgba(26,26,26,0.08)'
        }}>
          No requests found
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredRequests.map(request => (
            <div
              key={request.id}
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
                    {request.customer_name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {request.reference} · {request.phone}
                  </div>
                </div>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  background: request.status === 'new' ? '#dbeafe' :
                             request.status === 'approved' ? '#dcfce7' :
                             request.status === 'converted' ? '#fef3c7' :
                             request.status === 'closed' ? '#f3f4f6' :
                             '#fef3c7',
                  color: request.status === 'new' ? '#1e40af' :
                         request.status === 'approved' ? '#166534' :
                         request.status === 'converted' ? '#92400e' :
                         request.status === 'closed' ? '#374151' :
                         '#92400e'
                }}>
                  {request.status.replace('_', ' ')}
                </span>
              </div>

              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <strong>Type:</strong> {request.request_type}
                {request.service && <span> · {request.service}</span>}
              </div>

              {request.occasion && (
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Occasion:</strong> {request.occasion}
                </div>
              )}

              {request.preferred_date && (
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Preferred date:</strong> {new Date(request.preferred_date).toLocaleDateString()}
                </div>
              )}

              {request.selections && request.selections.length > 0 && (
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Selections:</strong> {request.selections.join(', ')}
                </div>
              )}

              {request.estimate_low && request.estimate_high && (
                <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                  <strong>Estimate:</strong> GHS {request.estimate_low} - {request.estimate_high}
                </div>
              )}

              {request.confirmed_quote && (
                <div style={{ fontSize: '14px', marginBottom: '8px', color: '#166534', fontWeight: 600 }}>
                  <strong>Confirmed quote:</strong> GHS {request.confirmed_quote}
                </div>
              )}

              {request.notes && (
                <div style={{ fontSize: '14px', marginBottom: '8px', fontStyle: 'italic' }}>
                  "{request.notes}"
                </div>
              )}

              {request.admin_note && (
                <div style={{ fontSize: '13px', marginBottom: '12px', padding: '8px', background: '#f3f4f6', borderRadius: '6px' }}>
                  <strong>Admin note:</strong> {request.admin_note}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Admin note..."
                  value={selectedRequestId === request.id ? adminNote : ''}
                  onChange={e => setAdminNote(e.target.value)}
                  onFocus={() => setSelectedRequestId(request.id)}
                  style={{
                    flex: 1,
                    padding: '6px 12px',
                    border: '1px solid rgba(26,26,26,0.14)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Quote (GHS)"
                  value={selectedRequestId === request.id ? confirmedQuote : ''}
                  onChange={e => setConfirmedQuote(e.target.value)}
                  onFocus={() => setSelectedRequestId(request.id)}
                  style={{
                    width: '120px',
                    padding: '6px 12px',
                    border: '1px solid rgba(26,26,26,0.14)',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {new Date(request.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {request.status === 'new' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(request.id, 'quote_needed')}
                        style={{
                          padding: '6px 12px',
                          background: '#fef3c7',
                          color: '#92400e',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600
                        }}
                      >
                        Need Quote
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(request.id, 'approved')}
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
                        Approve
                      </button>
                    </>
                  )}
                  {request.status === 'quote_needed' && (
                    <button
                      type="button"
                      onClick={() => handleQuoteUpdate(request.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#dbeafe',
                        color: '#1e40af',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Save Quote
                    </button>
                  )}
                  {request.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => handleStatusChange(request.id, 'converted')}
                      style={{
                        padding: '6px 12px',
                        background: '#fef3c7',
                        color: '#92400e',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                    >
                      Convert to Order
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(request.id)}
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

              {confirmDeleteId === request.id && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: '#fee2e2',
                  borderRadius: '8px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '13px', color: '#991b1b' }}>Delete this request?</span>
                  <button
                    type="button"
                    onClick={() => handleDelete(request.id)}
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
