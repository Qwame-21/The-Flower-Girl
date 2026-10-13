import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToasts, removeToast } from '../lib/toastStore';

function ToastItem({ toast }) {
  const navigate = useNavigate();
  const [remaining, setRemaining] = useState(toast.duration || 6000);
  const [isHovered, setIsHovered] = useState(false);
  const total = toast.duration || 6000;
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    lastTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isHovered) {
        setRemaining(prev => {
          const next = prev - delta;
          if (next <= 0) {
            clearInterval(interval);
            removeToast(toast.id);
            return 0;
          }
          return next;
        });
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isHovered, toast.id]);

  const handleClick = (e) => {
    // If clicked close button, let close handler deal with it
    if (e.target.closest('.toast-close-btn')) return;
    if (toast.route) {
      navigate(toast.route);
    }
    removeToast(toast.id);
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'new_order': return 'New Order';
      case 'new_request': return 'New Request';
      case 'new_application': return 'Career';
      case 'low_stock': return 'Inventory';
      case 'new_review': return 'Review';
      default: return 'Notification';
    }
  };

  const progressPercent = Math.max(0, Math.min(100, (remaining / total) * 100));

  return (
    <div
      className={`dashboard-toast-card ${toast.type || ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        lastTimeRef.current = Date.now();
        setIsHovered(false);
      }}
      role="alert"
    >
      <div className="toast-card-header">
        <span className="toast-type-pill">{getTypeLabel(toast.type)}</span>
        <button
          className="toast-close-btn"
          aria-label="Dismiss notification"
          onClick={(e) => {
            e.stopPropagation();
            removeToast(toast.id);
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className="toast-card-body">
        {toast.title && <div className="toast-card-title">{toast.title}</div>}
        {toast.body && <div className="toast-card-text">{toast.body}</div>}
      </div>

      <div className="toast-progress-track">
        <div
          className="toast-progress-bar"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToasts(setToasts);
    return () => unsubscribe();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="dashboard-toast-stack" aria-live="polite">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
