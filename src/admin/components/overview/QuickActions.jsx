import { useState } from 'react';
import { Plus, Package, MessageSquareText, ShieldAlert, Lock, X } from 'lucide-react';

export default function QuickActions({ onInspect, data }) {
  const [reverifyModal, setReverifyModal] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  const handleActionClick = (actionName, requiresReauth = false) => {
    if (requiresReauth) {
      setPendingAction(actionName);
      setPassword('');
      setError('');
      setReverifyModal(true);
    } else {
      executeAction(actionName);
    }
  };

  const executeAction = actionName => {
    if (actionName === 'view-pending') {
      onInspect('Pending orders', data.pending);
    } else if (actionName === 'view-quotes') {
      onInspect('Requests awaiting a quote', data.quotes);
    } else if (actionName === 'view-overdue') {
      onInspect('Overdue deliveries', data.overdue);
    } else if (actionName === 'clear-cache') {
      alert('Local workspace cache refreshed.');
    }
  };

  const handleReverifySubmit = e => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your staff password.');
      return;
    }
    // Simulate password re-verification check
    setReverifyModal(false);
    if (pendingAction) executeAction(pendingAction);
  };

  return (
    <section className="ov-sui-quick-actions-section" aria-label="Staff quick actions">
      <header className="ov-sui-section-header">
        <div>
          <span className="ov-sui-tag">SHORTCUTS // 04</span>
          <h2 className="ov-sui-section-title">Quick Actions</h2>
        </div>
      </header>

      <div className="ov-sui-actions-grid">
        <button
          className="ov-sui-action-card"
          onClick={() => handleActionClick('view-pending')}
        >
          <Package size={20} />
          <strong>View Pending Orders</strong>
          <small>{data.pending.length} orders in pipeline</small>
        </button>

        <button
          className="ov-sui-action-card"
          onClick={() => handleActionClick('view-quotes')}
        >
          <MessageSquareText size={20} />
          <strong>Customer Quotes</strong>
          <small>{data.quotes.length} briefs needing quotation</small>
        </button>

        <button
          className="ov-sui-action-card ov-sui-action-card--destructive"
          onClick={() => handleActionClick('clear-cache', true)}
        >
          <ShieldAlert size={20} />
          <strong>Refresh Workspace Data</strong>
          <small>Requires staff re-verification</small>
        </button>
      </div>

      {/* Password Re-verification Modal */}
      {reverifyModal && (
        <div className="ov-sui-modal-backdrop" onClick={() => setReverifyModal(false)}>
          <div className="ov-sui-modal-box" onClick={e => e.stopPropagation()}>
            <header className="ov-sui-modal-header">
              <div className="ov-sui-modal-title">
                <Lock size={18} />
                <h3>Staff Re-verification Required</h3>
              </div>
              <button onClick={() => setReverifyModal(false)}>
                <X size={18} />
              </button>
            </header>

            <form onSubmit={handleReverifySubmit} className="ov-sui-modal-form">
              <p className="ov-sui-modal-desc">
                Confirm your password to authorize this action:
              </p>

              <input
                type="password"
                autoFocus
                className="ov-sui-modal-input"
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />

              {error && <span className="ov-sui-modal-error">{error}</span>}

              <div className="ov-sui-modal-footer">
                <button
                  type="button"
                  className="ov-sui-btn-cancel"
                  onClick={() => setReverifyModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ov-sui-btn-confirm">
                  Authorize & Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
