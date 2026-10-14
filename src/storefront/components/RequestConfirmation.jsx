import { useState } from 'react';
import { requestWhatsAppUrl } from '../utils/request';

export default function RequestConfirmation({ request, onNavigate }) {
  const [copied, setCopied] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const displayRef = request?.shortCode || request?.reference || 'Request';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayRef);
      setCopied(true);
      setCopyFeedback('Reference copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopyFeedback('Unable to copy automatically. Please copy the reference above.');
    }
  };

  const whatsappLink = requestWhatsAppUrl(request);

  return (
    <div className="request-confirmation-card" style={{
      padding: '36px 24px',
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid rgba(26,26,26,0.08)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      maxWidth: '560px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      {/* Animated Gift Box SVG Icon */}
      <div className="confirmation-icon-wrapper" style={{
        width: '64px',
        height: '64px',
        margin: '0 auto 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: '#f4f4f2',
        color: '#1a1a1a'
      }}>
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animated-confirmation-gift"
        >
          <rect x="3" y="8" width="18" height="13" rx="1" />
          <path d="M12 8V21" />
          <path d="M3 13h18" />
          <path d="M8 8c0-2 1.5-4 4-4s4 2 4 4" />
          <path d="M8 8c-2 0-4-1-4-3 0-1.5 1.5-2 3-1L12 8" />
          <path d="M16 8c2 0 4-1 4-3 0-1.5-1.5-2-3-1L12 8" />
        </svg>
      </div>

      <h2 style={{
        fontSize: '24px',
        fontWeight: 700,
        color: '#1a1a1a',
        margin: '0 0 8px 0',
        letterSpacing: '-0.01em'
      }}>
        Request received
      </h2>

      <p style={{
        fontSize: '14px',
        color: '#555552',
        margin: '0 0 24px 0',
        lineHeight: 1.5
      }}>
        Thank you, <strong>{request.name || 'there'}</strong>. Our team will review your bespoke gift request and send a tailored quote to your WhatsApp shortly.
      </p>

      {/* Short Code Badge with Copy Button */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 18px',
        background: '#f8f8f7',
        border: '1px solid rgba(26,26,26,0.12)',
        borderRadius: '8px',
        margin: '0 auto 24px'
      }}>
        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#747471', fontWeight: 600 }}>Reference</span>
        <strong style={{ fontSize: '16px', letterSpacing: '0.05em', color: '#1a1a1a', fontFamily: 'monospace' }}>{displayRef}</strong>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy request reference"
          style={{
            background: 'transparent',
            border: 'none',
            padding: '6px',
            minWidth: '44px',
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: copied ? '#15803d' : '#1a1a1a'
          }}
          title={copied ? 'Copied!' : 'Copy reference'}
        >
          {copied ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>

      {copyFeedback && (
        <div role="status" style={{ fontSize: '12px', color: copied ? '#15803d' : '#b91c1c', marginBottom: '16px' }}>
          {copyFeedback}
        </div>
      )}

      {/* Summary Box */}
      <div style={{
        textAlign: 'left',
        background: '#fcfcfb',
        border: '1px solid rgba(26,26,26,0.06)',
        borderRadius: '8px',
        padding: '16px 18px',
        fontSize: '13px',
        lineHeight: 1.6,
        color: '#333330',
        marginBottom: '28px'
      }}>
        <div style={{ fontWeight: 600, color: '#1a1a1a', marginBottom: '6px' }}>Summary</div>
        {request.occasion && <div><strong>Occasion:</strong> {request.occasion}</div>}
        {request.preferredDate && <div><strong>Needed by:</strong> {request.preferredDate}</div>}
        {request.fulfilment && <div><strong>Fulfilment:</strong> {request.fulfilment === 'collection' ? 'Collection from shop' : 'Delivery'}</div>}
        {request.selections?.length > 0 && <div><strong>Selections:</strong> {request.selections.join(', ')}</div>}
        {request.budget && <div><strong>Budget:</strong> GHS {request.budget}</div>}
      </div>

      {/* 3 Required Actions */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="primary-action"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            minHeight: '44px',
            textDecoration: 'none'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          CONTINUE ON WHATSAPP
        </a>

        <button
          type="button"
          onClick={() => onNavigate ? onNavigate('track', { ref: displayRef }) : (window.location.href = `/track?ref=${encodeURIComponent(displayRef)}`)}
          style={{
            minHeight: '44px',
            padding: '12px 20px',
            borderRadius: '999px',
            border: '1px solid #1a1a1a',
            background: 'transparent',
            color: '#1a1a1a',
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer'
          }}
        >
          TRACK THIS REQUEST
        </button>

        <button
          type="button"
          onClick={() => onNavigate ? onNavigate('shop') : (window.location.href = '/shop')}
          style={{
            minHeight: '44px',
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            color: '#747471',
            fontSize: '13px',
            fontWeight: 500,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            textDecoration: 'underline'
          }}
        >
          CONTINUE SHOPPING
        </button>
      </div>
    </div>
  );
}
