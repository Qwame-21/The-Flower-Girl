import { useState, useEffect, useTransition } from 'react';
import CustomDropdown from '../components/shared/CustomDropdown';
import { ORDER_CATEGORIES, formatGHS } from '../lib/ordersModel';
import { listOrders, updateOrderStatus, deleteOrder, updateOrderNote } from '../data/orders';
import { supabase } from '../../config/supabase';
import { DASHBOARD_TO_DB_FULFILLMENT, DB_TO_DASHBOARD_FULFILLMENT, STEPPER_TO_EVENT_STAGE } from '../data/statusMap';

// SVG Icons
const SVG = {
  close: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  search: <svg className="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  banknote: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  shoppingBag: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  avatar: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  email: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  location: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  restore: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
};

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateDisplay(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function OrdersPage() {
  const [, startTransition] = useTransition();

  // Load orders state
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load orders from Supabase on mount
  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError(null);
      const orders = await listOrders();
      setOrdersList(orders);
      setLoading(false);
    }
    loadOrders();
  }, []);

  // Filters state
  const [filters, setFilters] = useState({
    searchQuery: '',
    category: 'all',
    status: 'all',
    source: 'all'
  });

  // Selection & modal state
  const [selectedIds, setSelectedIds] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);
  const [confirmingBulkCancel, setConfirmingBulkCancel] = useState(false);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [panelDrafts, setPanelDrafts] = useState({});

  // Filter ONLY live non-delivered orders for Orders page (delivered moves to Log)
  const liveOrders = ordersList.filter(o => o.fulfillmentStatus !== 'delivered');

  // Filtered orders derivation
  const filteredOrders = liveOrders.filter(order => {
    if (filters.category !== 'all') {
      const matchCat = (order.items || []).some(item => (item.category || '').toLowerCase() === filters.category);
      if (!matchCat) return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'pending_payment') {
        if (!isPendingPayment(order)) return false;
      } else if (order.fulfillmentStatus !== filters.status) {
        return false;
      }
    }
    if (filters.source !== 'all' && order.source !== filters.source) {
      return false;
    }
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const code = (order.orderCode || order.id || '').toLowerCase();
      const name = (order.customerName || '').toLowerCase();
      const phone = (order.customerPhone || order.phone || '').toLowerCase();
      const hasItemMatch = (order.items || []).some(item =>
        (item.name || '').toLowerCase().includes(q) || (item.sku || '').toLowerCase().includes(q)
      );
      if (!code.includes(q) && !name.includes(q) && !phone.includes(q) && !hasItemMatch) {
        return false;
      }
    }
    return true;
  });



  // Helper update wrapper - now refreshes from Supabase
  const refreshOrders = async () => {
    setLoading(true);
    const orders = await listOrders();
    setOrdersList(orders);
    setLoading(false);
  };

  // Checkbox toggle
  const toggleSelectOrder = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    const allFilteredIds = filteredOrders.map(o => o.id);
    if (selectedIds.length === allFilteredIds.length && allFilteredIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  // Stepper box status update — now uses Supabase
  const handleStepperClick = async (orderId, stage) => {
    const order = ordersList.find(o => o.id === orderId);
    if (!order) return;

    let newStatus;
    let note = '';

    // Special case 1: clicking "Paid" on unpaid order -> mark paid
    if (stage === 'paid' && order.paymentStatus === 'pending') {
      newStatus = 'preparing'; // Move to preparing when paid
      note = 'Payment confirmed';
    }
    // Special case 2: clicking "Paid" on already paid order -> unmark paid (revert to pending_payment)
    else if (stage === 'paid' && order.paymentStatus === 'paid') {
      newStatus = 'pending_payment';
      note = 'Payment reverted';
    }
    // Stage to status mapping
    else {
      const stageToStatus = {
        processing: 'preparing',
        packed: 'ready',
        dispatched: 'dispatched',
        delivered: 'delivered'
      };
      const statusOrder = ['preparing', 'ready', 'dispatched', 'delivered'];
      const currentStatus = order.fulfillmentStatus;
      const targetStatus = stageToStatus[stage] || stage;

      // If clicking already active status, step back one stage
      if (currentStatus === targetStatus) {
        const currentIndex = statusOrder.indexOf(currentStatus);
        if (currentIndex > 0) {
          newStatus = statusOrder[currentIndex - 1];
        } else if (currentIndex === 0) {
          newStatus = 'pending_payment';
        }
      } else {
        // Advance to target stage
        newStatus = targetStatus;
      }
    }

    if (newStatus) {
      await updateOrderStatus(orderId, newStatus, note);
      await refreshOrders();
    }
  };


  // Restore order
  const handleRestoreOrder = async (orderId) => {
    await updateOrderStatus(orderId, 'preparing', 'Order reopened');
    await refreshOrders();
  };

  // Single delete order
  const handleConfirmDeleteOrder = async (orderId) => {
    const success = await deleteOrder(orderId);
    if (success) {
      await refreshOrders();
      setConfirmingDeleteId(null);
      if (expandedId === orderId) setExpandedId(null);
    }
  };

  // Bulk actions
  const handleBulkMoveStatus = async (targetStatus) => {
    for (const orderId of selectedIds) {
      await updateOrderStatus(orderId, targetStatus, `Bulk move to ${targetStatus}`);
    }
    await refreshOrders();
    setSelectedIds([]);
  };

  const handleConfirmBulkCancel = async () => {
    for (const orderId of selectedIds) {
      await updateOrderStatus(orderId, 'cancelled', 'Bulk cancel');
    }
    await refreshOrders();
    setSelectedIds([]);
    setConfirmingBulkCancel(false);
  };

  const handleConfirmBulkDelete = async () => {
    for (const orderId of selectedIds) {
      await deleteOrder(orderId);
    }
    await refreshOrders();
    setSelectedIds([]);
    setConfirmingBulkDelete(false);
  };

  // Draft handlers
  const updateDraft = (orderId, key, val) => {
    setPanelDrafts(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [key]: val
      }
    }));
  };

  const handleSaveNote = async (order) => {
    const draft = panelDrafts[order.id] || {};
    const nextOrders = ordersList.map(o => {
      if (o.id !== order.id) return o;
      const updated = { ...o };
      if (draft.note !== undefined) updated.adminNote = draft.note;
      if (draft.date) {
        updated.estimatedDeliveryAt = {
          date: draft.date,
          window: draft.window || '',
          from: draft.from || '',
          to: draft.to || ''
        };
        const dateDisp = formatDisplayDate(draft.date);
        const winDisp = draft.window ? ` · ${draft.window}` : '';
        updated.estimatedDelivery = `${dateDisp}${winDisp}`;
      }
      return updated;
    });
    setOrdersList(nextOrders);

    // Update admin note in Supabase
    if (draft.note !== undefined) {
      await updateOrderNote(order.id, draft.note);
    }
  };

  // Stats helpers
  const calculateStats = (orders) => {
    const liveOrders = orders.filter(o => o.fulfillmentStatus !== 'delivered');
    const totalRevenue = liveOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const activeOrders = liveOrders.length;
    const pendingPayment = liveOrders.filter(o => o.paymentStatus === 'pending').length;

    const categoryCounts = { all: liveOrders.length, hampers: 0, personalized: 0, bundles: 0, care: 0, flowers: 0 };
    liveOrders.forEach(order => {
      (order.items || []).forEach(item => {
        const cat = (item.category || '').toLowerCase();
        if (categoryCounts[cat] !== undefined) {
          categoryCounts[cat]++;
        }
      });
    });

    const statusCounts = {
      all: liveOrders.length,
      pending_payment: liveOrders.filter(o => o.paymentStatus === 'pending').length,
      preparing: liveOrders.filter(o => o.fulfillmentStatus === 'preparing').length,
      ready: liveOrders.filter(o => o.fulfillmentStatus === 'ready').length,
      dispatched: liveOrders.filter(o => o.fulfillmentStatus === 'dispatched').length,
      cancelled: liveOrders.filter(o => o.fulfillmentStatus === 'cancelled').length
    };

    const sourceCounts = {
      all: liveOrders.length,
      staff: liveOrders.filter(o => o.staffOrder).length,
      online: liveOrders.filter(o => !o.staffOrder).length
    };

    return { totalRevenue, activeOrders, pendingPayment, categoryCounts, statusCounts, sourceCounts };
  };

  const stats = calculateStats(ordersList);
  const { categoryCounts, statusCounts, sourceCounts } = stats;

  const categoryTabs = [
    { id: 'all', name: 'All Orders', count: liveOrders.length },
    ...ORDER_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: categoryCounts[cat.id] || 0
    }))
  ];

  const statusOptions = [
    { id: 'all', name: 'All statuses', count: statusCounts.all },
    { id: 'pending_payment', name: 'Pending payment', count: statusCounts.pending_payment },
    { id: 'preparing', name: 'Processing', count: statusCounts.preparing },
    { id: 'ready', name: 'Packed', count: statusCounts.ready },
    { id: 'dispatched', name: 'Dispatched', count: statusCounts.dispatched },
    { id: 'cancelled', name: 'Cancelled', count: statusCounts.cancelled }
  ];

  const sourceOptions = [
    { id: 'all', name: 'All' },
    { id: 'staff', name: 'Staff' },
    { id: 'online', name: 'Online' }
  ];

  const hasActiveFilters = filters.category !== 'all' || filters.status !== 'all' || filters.source !== 'all' || !!filters.searchQuery;

  // Selection island logic
  const selectedCount = selectedIds.length;
  const allSelected = selectedCount > 0 && selectedCount === filteredOrders.length;

  return (
    <div className="orders-page-container">
      {/* Page Header */}
      <div className="orders-page-header">
        <div className="page-title-group">
          <h2>Orders Management</h2>
          <p>Track order fulfillment, assign riders, and manage orders.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-row">
        <div className="stat-card">
          <div className="stat-card-icon">{SVG.banknote}</div>
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value">GHS {Math.round(stats.totalRevenue).toLocaleString('en-US')}</div>
          <div className="stat-card-caption">From paid orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">{SVG.shoppingBag}</div>
          <div className="stat-card-label">Active Orders</div>
          <div className="stat-card-value">{stats.activeOrders}</div>
          <div className="stat-card-caption">Not yet delivered</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon">{SVG.clock}</div>
          <div className="stat-card-label">Pending Payment</div>
          <div className="stat-card-value">{stats.pendingPayment}</div>
          <div className="stat-card-caption">Awaiting payment</div>
        </div>
      </div>

      {/* Unified Filter Card */}
      <div className="orders-filter-card">
        {/* Search Bar */}
        <div className="filter-card-search">
          {SVG.search}
          <input
            type="text"
            className="orders-search-input"
            placeholder="Search ID, name, phone, or item code..."
            value={filters.searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              startTransition(() => {
                setFilters(prev => ({ ...prev, searchQuery: val }));
              });
            }}
          />
        </div>

        {/* Categories Row */}
        <div className="filter-card-row">
          <div className="category-tabs-row">
            {categoryTabs.map(tab => (
              <button
                key={tab.id}
                className={`category-tab ${filters.category === tab.id ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, category: tab.id }))}
              >
                {tab.name} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Status & Source Filter Row */}
        <div className="filter-card-row filter-card-bottom-row">
          <div className="status-filters">
            {statusOptions.map(opt => (
              <button
                key={opt.id}
                className={`status-filter ${filters.status === opt.id ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, status: opt.id }))}
              >
                {opt.name} ({opt.count})
              </button>
            ))}
          </div>

          <div className="source-toggle">
            {sourceOptions.map(opt => (
              <button
                key={opt.id}
                className={`source-toggle-btn ${filters.source === opt.id ? 'active' : ''}`}
                onClick={() => setFilters(prev => ({ ...prev, source: opt.id }))}
              >
                {opt.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Helper Line with Selection Island */}
      <div className="helper-line-with-island">
        <span className="helper-text">
          Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
        </span>
        {hasActiveFilters && (
          <button
            className="clear-filters-link"
            onClick={() => setFilters({ searchQuery: '', category: 'all', status: 'all', source: 'all' })}
          >
            Clear filters
          </button>
        )}

        {/* Selection Island */}
        {filteredOrders.length > 0 && (
          selectedCount === 0 ? (
            <div className="selection-island">
              <button className="island-action" onClick={toggleSelectAll}>Select all</button>
              <span className="island-count">0 selected</span>
            </div>
          ) : confirmingBulkCancel ? (
            <div className="selection-island has-selection confirming-cancel">
              <span className="island-confirm-text">Cancel {selectedCount} {selectedCount === 1 ? 'order' : 'orders'}?</span>
              <button className="island-action danger danger-solid" onClick={handleConfirmBulkCancel}>Yes</button>
              <button className="island-action" onClick={() => setConfirmingBulkCancel(false)}>No</button>
            </div>
          ) : confirmingBulkDelete ? (
            <div className="selection-island has-selection confirming-cancel">
              <span className="island-confirm-text">Delete {selectedCount} {selectedCount === 1 ? 'order' : 'orders'}?</span>
              <button className="island-action danger danger-solid" onClick={handleConfirmBulkDelete}>Yes</button>
              <button className="island-action" onClick={() => setConfirmingBulkDelete(false)}>No</button>
            </div>
          ) : (
            <div className="selection-island has-selection">
              <button className="island-action primary" onClick={toggleSelectAll}>
                {allSelected ? 'Clear' : 'Select all'}
              </button>
              <span className="island-count">{selectedCount} selected</span>
              <div className="island-divider"></div>
              <CustomDropdown
                options={[
                  { value: 'preparing', label: 'Processing' },
                  { value: 'ready', label: 'Packed' },
                  { value: 'dispatched', label: 'Dispatched' },
                  { value: 'delivered', label: 'Delivered' }
                ]}
                value=""
                placeholder="Move status..."
                onChange={(val) => {
                  if (val) handleBulkMoveStatus(val);
                }}
              />
              <button className="island-action" onClick={() => setSelectedIds([])}>Cancel</button>
              <button className="island-action danger" onClick={() => setConfirmingBulkCancel(true)}>Cancel Orders</button>
              <button className="island-action danger danger-solid" onClick={() => setConfirmingBulkDelete(true)}>Delete</button>
            </div>
          )
        )}
      </div>

      {/* Order List */}
      <div className="order-list">
        {loading ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Loading orders...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--chart-bad)', margin: 0 }}>Error loading orders: {error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              {SVG.shoppingBag}
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0' }}>No orders found</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          filteredOrders.map(order => {
            const isSelected = selectedIds.includes(order.id);
            const isExpanded = expandedId === order.id;
            const displayCode = order.orderCode || order.id;

            let offTrackPill = null;
            if (order.paymentStatus === 'pending') {
              offTrackPill = <span className="off-track-pill awaiting-payment">Awaiting payment</span>;
            } else if (order.fulfillmentStatus === 'cancelled') {
              offTrackPill = <span className="off-track-pill cancelled">Cancelled</span>;
            }

            const skus = (order.items || []).map(i => i.sku).filter(Boolean);
            let productCodesDisplay = '';
            if (skus.length === 1) productCodesDisplay = skus[0];
            else if (skus.length > 1) productCodesDisplay = `${skus[0]} +${skus.length - 1}`;
            const hasCodes = productCodesDisplay.length > 0;

            const sourceTag = order.source === 'staff' ? 'Staff' : 'Online';
            const amount = order.amount || 0;
            const deliveryInfo = order.estimatedDelivery ? ` · ${order.estimatedDelivery}` : '';

            const isPaid = order.paymentStatus === 'paid';
            const stepperSteps = [
              { key: 'paid', label: 'Paid', actionStage: 'paid' },
              { key: 'packed', label: 'Packed', actionStage: 'packed' },
              { key: 'dispatched', label: 'Dispatched', actionStage: 'dispatched' },
              { key: 'delivered', label: 'Delivered', actionStage: 'delivered' }
            ];
            const statusOrder = ['paid', 'packed', 'dispatched', 'delivered'];
            const currentIndex = statusOrder.indexOf(
              order.fulfillmentStatus === 'preparing' ? 'paid' :
              order.fulfillmentStatus === 'ready' ? 'packed' :
              order.fulfillmentStatus === 'dispatched' ? 'dispatched' :
              order.fulfillmentStatus === 'delivered' ? 'delivered' : -1
            );

            const draft = panelDrafts[order.id] || {};
            const draftDate = draft.date !== undefined ? draft.date : '';
            const draftWindow = draft.window !== undefined ? draft.window : '';
            const draftFrom = draft.from !== undefined ? draft.from : '';
            const draftTo = draft.to !== undefined ? draft.to : '';
            const draftNote = draft.note !== undefined ? draft.note : (order.adminNote || '');

            const hasStructuredDelivery = order.estimatedDeliveryAt && typeof order.estimatedDeliveryAt === 'object';
            let selectedDate = draftDate || (hasStructuredDelivery ? order.estimatedDeliveryAt.date || '' : '');
            let selectedWindow = draftWindow || (hasStructuredDelivery ? order.estimatedDeliveryAt.window || '' : '');
            let customFrom = draftFrom || (hasStructuredDelivery ? order.estimatedDeliveryAt.from || '' : '');
            let customTo = draftTo || (hasStructuredDelivery ? order.estimatedDeliveryAt.to || '' : '');

            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            const dateOptions = [
              { value: '', label: 'Not set' },
              { value: formatDate(today), label: `Today · ${formatDateDisplay(today)}` },
              { value: formatDate(tomorrow), label: `Tomorrow · ${formatDateDisplay(tomorrow)}` }
            ];
            for (let i = 2; i <= 6; i++) {
              const d = new Date(today);
              d.setDate(d.getDate() + i);
              dateOptions.push({
                value: formatDate(d),
                label: `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`
              });
            }
            dateOptions.push({ value: 'custom', label: 'Pick another date…' });

            const timeWindows = [
              { value: '', label: 'Not set' },
              { value: 'morning', label: 'Morning · 9am-12pm' },
              { value: 'afternoon', label: 'Afternoon · 12-4pm' },
              { value: 'evening', label: 'Evening · 4-7pm' },
              { value: 'custom', label: 'Custom time…' }
            ];

            let nextStageLabel = 'MARK PACKAGED FIRST';
            if (order.paymentStatus === 'pending') nextStageLabel = 'MARK AS PAID FIRST';
            else if (order.fulfillmentStatus === 'preparing') nextStageLabel = 'MARK PACKAGED FIRST';
            else if (order.fulfillmentStatus === 'ready') nextStageLabel = 'DISPATCH ORDER';
            else if (order.fulfillmentStatus === 'dispatched') nextStageLabel = 'MARK DELIVERED';

            return (
              <div key={order.id} className={`order-card ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''}`}>
                <div
                  className="order-card-header"
                  onClick={() => setExpandedId(prev => prev === order.id ? null : order.id)}
                >
                  {/* Checkbox */}
                  <label className="order-card-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectOrder(order.id)}
                    />
                    <span className="custom-checkbox-box"></span>
                  </label>

                  {/* Avatar */}
                  <div className="order-card-avatar">{SVG.avatar}</div>

                  {/* Info */}
                  <div className={`order-card-info ${!hasCodes ? 'centered' : ''}`}>
                    <div className="order-name-row">
                      <span className="order-customer-name">{order.customerName}</span>
                      <span className="order-source-tag">{sourceTag}</span>
                      {offTrackPill}
                    </div>
                    {hasCodes && (
                      <div className="order-product-codes">
                        {productCodesDisplay}{deliveryInfo}
                      </div>
                    )}
                  </div>

                  {/* Right side: Stepper, Amount, Chevron */}
                  <div className="order-card-right">
                    {order.fulfillmentStatus === 'cancelled' ? (
                      <div className="cancelled-restore-container" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="restore-capsule-btn"
                          onClick={() => handleRestoreOrder(order.id)}
                        >
                          {SVG.restore} Restore order
                        </button>
                      </div>
                    ) : (
                      <div className="order-stepper-boxes" onClick={(e) => e.stopPropagation()}>
                        {stepperSteps.map((step, index) => {
                          const isStepPaid = step.key === 'paid';
                          const disabled = !isPaid && !isStepPaid;
                          let stateClass = '';
                          if (disabled) stateClass = 'disabled';
                          else if (index === currentIndex) stateClass = 'current';
                          else if (index < currentIndex) stateClass = 'reached';

                          return (
                            <button
                              key={step.key}
                              className={`stepper-box ${stateClass}`}
                              disabled={disabled}
                              onClick={() => handleStepperClick(order.id, step.actionStage)}
                            >
                              <span className="stepper-checkbox"></span>
                              <span className="stepper-label">{step.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="order-amount-block">
                      <div className="order-amount-text">GHS {amount.toLocaleString('en-US')}</div>
                      <div className="order-code-muted">{displayCode}</div>
                    </div>

                    <div className={`expand-chevron ${isExpanded ? 'expanded' : ''}`}>
                      {SVG.chevron}
                    </div>
                  </div>
                </div>

                {/* Expanded details panel */}
                {isExpanded && (
                  <div className="order-details-panel">
                    <div className="details-panel-grid">
                      {/* Left: Customer Info */}
                      <div className="details-column customer-column">
                        <div className="customer-info-section">
                          <div className="customer-header-row">
                            <div className="customer-name-display">{order.customerName}</div>
                            <div className="customer-header-right">
                              <span className="order-code-chip">{displayCode}</span>
                              <button className="print-badge-btn" onClick={() => window.print()}>PRINT</button>
                            </div>
                          </div>

                          <div className="contact-details-grid">
                            <div className="contact-detail-row">
                              <div className="contact-icon-tile">{SVG.phone}</div>
                              <div className="contact-detail-content">
                                <div className="contact-detail-label">PHONE</div>
                                <div className="contact-detail-value">
                                  {order.customerPhone || order.phone ? (
                                    <a href={`tel:${order.customerPhone || order.phone}`} className="contact-link">
                                      {order.customerPhone || order.phone}
                                    </a>
                                  ) : 'N/A'}
                                </div>
                              </div>
                            </div>

                            <div className="contact-detail-row">
                              <div className="contact-icon-tile">{SVG.email}</div>
                              <div className="contact-detail-content">
                                <div className="contact-detail-label">EMAIL</div>
                                <div className="contact-detail-value">
                                  {order.customerEmail || order.email ? (
                                    <a href={`mailto:${order.customerEmail || order.email}`} className="contact-link">
                                      {order.customerEmail || order.email}
                                    </a>
                                  ) : 'N/A'}
                                </div>
                              </div>
                            </div>

                            <div className="contact-detail-row">
                              <div className="contact-icon-tile">{SVG.location}</div>
                              <div className="contact-detail-content">
                                <div className="contact-detail-label">DELIVERY ADDRESS</div>
                                <div className="contact-detail-value">{order.deliveryAddress || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Items */}
                      <div className="details-column items-column">
                        <div className="column-header-row">
                          <span className="column-title">ITEMS</span>
                        </div>
                        <div className="items-list">
                          {(order.items || []).map((item, idx) => (
                            <div key={idx} className="item-entry">
                              <span className="item-entry-left">
                                <span className="item-code">{item.sku || 'w01'}</span>
                                <span className="item-name">{item.name}</span>
                                <span className="item-qty">×{item.qty}</span>
                              </span>
                              <span className="item-entry-price">GHS {(item.unitPrice * item.qty).toFixed(0)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="items-total-row">
                          <span className="total-label">Total:</span>
                          <span className="total-amount-pink">GHS {Math.round(amount)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery & Admin Note Section */}
                    <div className="admin-delivery-section">
                      <div className="section-divider"></div>
                      <div className="delivery-section">
                        <div className="delivery-dropdowns-row">
                          <div className="form-field-row">
                            <label className="form-field-label">DATE</label>
                            <CustomDropdown
                              options={dateOptions}
                              value={selectedDate}
                              onChange={(val) => updateDraft(order.id, 'date', val)}
                            />
                          </div>

                          <div className="form-field-row">
                            <label className="form-field-label">TIME</label>
                            <CustomDropdown
                              options={timeWindows}
                              value={selectedWindow}
                              disabled={!selectedDate}
                              onChange={(val) => updateDraft(order.id, 'window', val)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="admin-note-section">
                        <div className="form-field-row">
                          <label className="form-field-label">ADMIN NOTE (VISIBLE TO CUSTOMER)</label>
                          <textarea
                            className="form-field-input admin-note-field"
                            value={draftNote}
                            placeholder="e.g. Call when nearby"
                            rows={2}
                            onChange={(e) => updateDraft(order.id, 'note', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="admin-note-actions">
                        <button className="save-note-capsule-btn" onClick={() => handleSaveNote(order)}>
                          Save note
                        </button>
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="details-action-row">
                      <button
                        className="stage-action-grey-btn"
                        disabled={order.fulfillmentStatus !== 'ready'}
                        onClick={() => handleStepperClick(order.id, order.paymentStatus === 'pending' ? 'paid' : order.fulfillmentStatus === 'preparing' ? 'packed' : order.fulfillmentStatus === 'ready' ? 'dispatched' : 'delivered')}
                      >
                        {nextStageLabel}
                      </button>

                      {confirmingDeleteId === order.id ? (
                        <span className="delete-confirm-group">
                          <span className="island-confirm-text" style={{ fontSize: '12px', color: '#b9645c', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            Delete order permanently?
                          </span>
                          <button
                            className="delete-order-pink-btn"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                            onClick={() => handleConfirmDeleteOrder(order.id)}
                          >
                            Yes
                          </button>
                          <button
                            className="stage-action-grey-btn"
                            onClick={() => setConfirmingDeleteId(null)}
                          >
                            No
                          </button>
                        </span>
                      ) : (
                        <button
                          className="delete-order-pink-btn"
                          onClick={() => setConfirmingDeleteId(order.id)}
                        >
                          Delete order
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
