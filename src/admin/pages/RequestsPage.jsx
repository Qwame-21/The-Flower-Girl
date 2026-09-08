import { useState } from 'react';
import { CheckCircle2, Clock3, Download, ExternalLink, FileText, MessageSquareText, Send, ShieldAlert, Sparkles, User, ShoppingBag } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../config/supabase';

export default function RequestsPage({
  activeTab,
  filteredRequests = [],
  setSelectedItem,
  onRequestStatusChange,
  onSaveQuote,
  onConvertToOrder,
  adminData,
}) {
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [quoteInput, setQuoteInput] = useState('');
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [fileError, setFileError] = useState('');

  const selectedRequest = filteredRequests.find(r => r.id === selectedRequestId) || filteredRequests[0] || null;

  const handleDownloadInspiration = async (path) => {
    if (!path) return;
    setDownloadingFile(true);
    setFileError('');
    try {
      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase.storage
          .from('request-uploads')
          .createSignedUrl(path, 3600);
        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      }
      setFileError('Private file download requires live backend connection.');
    } catch (err) {
      setFileError(err.message || 'Could not generate private download link.');
    } finally {
      setDownloadingFile(false);
    }
  };

  const handleSaveQuoteSubmit = (event, request) => {
    event.preventDefault();
    const amount = Number(quoteInput || request.confirmedQuote || request.estimateHigh || 0);
    if (!amount || isNaN(amount)) return;
    if (onSaveQuote) {
      onSaveQuote(request.id, amount);
    }
    setQuoteInput('');
  };

  return (
    <div className="admin-requests-workspace">
      {!supabaseConfigured && (
        <div className="admin-connection-notice" role="alert">
          <ShieldAlert size={20} className="notice-icon" />
          <div className="notice-content">
            <strong>Preview Mode — Unconnected Backend</strong>
            <p>
              This preview has no Supabase configuration, so Requests and Careers correctly show a connection message. Their live reads, saves, and private downloads still need verification against the backend.
            </p>
          </div>
          <span className="notice-badge">Local Storage Fallback</span>
        </div>
      )}

      <header className="admin-page-heading">
        <div>
          <small>Storefront Custom Briefs · {activeTab}</small>
          <h2>Custom Requests</h2>
          <p>Review customer gift briefs, confirm custom estimates, and convert approved requests into orders.</p>
        </div>
        <div className="requests-heading-stats">
          <span className="stat-pill">
            <MessageSquareText size={15} />
            <b>{filteredRequests.length}</b> {filteredRequests.length === 1 ? 'Request' : 'Requests'}
          </span>
          <span className="stat-pill accent">
            <Clock3 size={15} />
            <b>{filteredRequests.filter(r => ['new', 'quote_needed'].includes(r.status)).length}</b> Needs Quote
          </span>
        </div>
      </header>

      {filteredRequests.length === 0 ? (
        <div className="admin-empty-state">
          <MessageSquareText size={32} />
          <strong>No custom requests in {activeTab}</strong>
          <p>Customer inquiries submitted through the custom gift builder will appear here automatically.</p>
        </div>
      ) : (
        <div className="admin-requests-grid">
          <div className="requests-list-panel">
            {filteredRequests.map(request => {
              const isSelected = selectedRequest?.id === request.id;
              const cleanPhone = (request.phone || '').replace(/\D/g, '');
              return (
                <article
                  key={request.id}
                  className={`request-card-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedRequestId(request.id)}
                >
                  <div className="request-card-header">
                    <span className="request-ref">{request.reference || 'RQ-CUSTOM'}</span>
                    <span className={`status-badge status-${request.status}`}>
                      {request.status === 'new' ? 'New' : request.status === 'quote_needed' ? 'Quote Needed' : request.status === 'approved' ? 'Approved' : request.status === 'converted' ? 'Converted' : request.status}
                    </span>
                  </div>
                  <h3 className="request-customer-name">{request.name || 'Anonymous Customer'}</h3>
                  <div className="request-meta-row">
                    <span>{request.service || 'Custom gift'}</span>
                    <span>·</span>
                    <span>Qty {request.quantity || 1}</span>
                    {request.preferredDate && (
                      <>
                        <span>·</span>
                        <span>{request.preferredDate}</span>
                      </>
                    )}
                  </div>
                  {request.estimateLow != null && (
                    <div className="request-estimate-tag">
                      Estimate: GHS {request.estimateLow?.toLocaleString()}–{request.estimateHigh?.toLocaleString()}
                    </div>
                  )}
                  {request.confirmedQuote != null && (
                    <div className="request-quote-tag">
                      Quote: <strong>GHS {request.confirmedQuote.toLocaleString()}</strong>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {selectedRequest && (
            <div className="request-detail-panel">
              <div className="detail-panel-header">
                <div>
                  <span className="ref-chip">{selectedRequest.reference || 'RQ-CUSTOM'}</span>
                  <h3>{selectedRequest.name}</h3>
                  <p className="sub-detail">{selectedRequest.email} · {selectedRequest.phone}</p>
                </div>
                <div className="header-actions">
                  {selectedRequest.phone && (
                    <a
                      href={`https://wa.me/${selectedRequest.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="whatsapp-btn"
                    >
                      <MessageSquareText size={15} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>

              <div className="detail-sections">
                <section className="detail-block">
                  <h4>Brief Details</h4>
                  <div className="detail-grid">
                    <div>
                      <small>Service / Type</small>
                      <strong>{selectedRequest.service || 'Custom Gift'}</strong>
                    </div>
                    <div>
                      <small>Occasion</small>
                      <strong>{selectedRequest.occasion || 'General'}</strong>
                    </div>
                    <div>
                      <small>Quantity</small>
                      <strong>{selectedRequest.quantity} unit{selectedRequest.quantity > 1 ? 's' : ''}</strong>
                    </div>
                    <div>
                      <small>Preferred Date</small>
                      <strong>{selectedRequest.preferredDate || selectedRequest.date || 'Flexible'}</strong>
                    </div>
                  </div>
                </section>

                {selectedRequest.selections?.length > 0 && (
                  <section className="detail-block">
                    <h4>Selections & Customizations</h4>
                    <div className="tags-cloud">
                      {selectedRequest.selections.map((item, idx) => (
                        <span key={idx} className="selection-chip">{item}</span>
                      ))}
                    </div>
                  </section>
                )}

                {selectedRequest.note && (
                  <section className="detail-block">
                    <h4>Customer Notes & Delivery Info</h4>
                    <p className="customer-note-box">{selectedRequest.note}</p>
                  </section>
                )}

                {selectedRequest.cardMessage && (
                  <section className="detail-block">
                    <h4>Card Message</h4>
                    <blockquote className="card-message-box">
                      "{selectedRequest.cardMessage}"
                      {selectedRequest.cardStyleNotes && (
                        <footer>Style: {selectedRequest.cardStyleNotes}</footer>
                      )}
                    </blockquote>
                  </section>
                )}

                {selectedRequest.inspirationPath && (
                  <section className="detail-block">
                    <h4>Inspiration Attachment</h4>
                    <div className="file-download-box">
                      <FileText size={20} />
                      <div className="file-info">
                        <strong>Private Inspiration File</strong>
                        <small>{selectedRequest.inspirationPath}</small>
                      </div>
                      <button
                        type="button"
                        className="download-btn"
                        disabled={downloadingFile}
                        onClick={() => handleDownloadInspiration(selectedRequest.inspirationPath)}
                      >
                        <Download size={15} /> {downloadingFile ? 'Generating link…' : 'Download Signed File'}
                      </button>
                    </div>
                    {fileError && <p className="field-error">{fileError}</p>}
                  </section>
                )}

                <section className="detail-block quote-management-block">
                  <h4>Quoting & Conversion</h4>
                  <div className="quote-status-row">
                    <div>
                      <small>Est. Range</small>
                      <div>
                        {selectedRequest.estimateLow != null
                          ? `GHS ${selectedRequest.estimateLow.toLocaleString()} – ${selectedRequest.estimateHigh?.toLocaleString()}`
                          : 'Not set'}
                      </div>
                    </div>
                    <div>
                      <small>Confirmed Quote</small>
                      <div className="confirmed-quote-val">
                        {selectedRequest.confirmedQuote != null
                          ? `GHS ${selectedRequest.confirmedQuote.toLocaleString()}`
                          : 'Awaiting Quote'}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={e => handleSaveQuoteSubmit(e, selectedRequest)} className="quote-form">
                    <label>
                      <span>Set Confirmed Quote (GHS)</span>
                      <input
                        type="number"
                        placeholder="e.g. 2500"
                        value={quoteInput}
                        onChange={e => setQuoteInput(e.target.value)}
                      />
                    </label>
                    <button type="submit" className="secondary-btn">Save Quote</button>
                  </form>

                  <div className="action-buttons-row">
                    <button
                      type="button"
                      className={`status-opt-btn ${selectedRequest.status === 'quote_needed' ? 'active' : ''}`}
                      onClick={() => onRequestStatusChange && onRequestStatusChange(selectedRequest.id, 'quote_needed')}
                    >
                      Flag Quote Needed
                    </button>
                    <button
                      type="button"
                      className={`status-opt-btn ${selectedRequest.status === 'approved' ? 'active' : ''}`}
                      onClick={() => onRequestStatusChange && onRequestStatusChange(selectedRequest.id, 'approved')}
                    >
                      <CheckCircle2 size={15} /> Mark Approved
                    </button>
                    <button
                      type="button"
                      className="convert-order-btn"
                      onClick={() => onConvertToOrder && onConvertToOrder(selectedRequest)}
                    >
                      <ShoppingBag size={15} /> Convert to Order
                    </button>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

