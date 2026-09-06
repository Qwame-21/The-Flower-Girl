import { ChevronDown, Package, Search, X } from 'lucide-react';
import { updateAdminCollection } from '../api/adminStore';
import { ORDER_STAGES, ORDER_LABELS } from '../utils/adminMappers';

export default function OrdersPage({
  activeTab,
  filteredOrders,
  orderQuery,
  setOrderQuery,
  selectedOrderIds,
  setSelectedOrderIds,
  expandedOrderIds,
  setExpandedOrderIds,
  setDeleteOrderIds,
  orderDrafts,
  setOrderDrafts,
  savedOrderId,
  saveOrderNotes,
  paidOrders,
  activeOrders,
  adminData,
  setManualOrderOpen,
}) {
  return <>
    <header className="admin-page-heading"><div><small>Fulfilment · {activeTab}</small><h2>Orders</h2><p>Confirm payment, prepare each gift and keep delivery progress current.</p></div><button onClick={() => setManualOrderOpen(true)}>Add manual order</button></header>
    <section className="order-summary"><article><small>Paid revenue</small><strong>GHS {paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0).toLocaleString()}</strong><span>{paidOrders.length} verified payments</span></article><article><small>Active orders</small><strong>{activeOrders.length}</strong><span>{adminData.orders.filter(order => order.status === 'packaging').length} being prepared</span></article><article><small>Delivery queue</small><strong>{adminData.orders.filter(order => order.status === 'ready' || order.status === 'delivery').length}</strong><span>Ready or dispatched</span></article></section>
    <div className="order-search"><Search size={16} /><input value={orderQuery} onChange={event => setOrderQuery(event.target.value)} placeholder="Search order ID, code, customer, phone or location" />{orderQuery && <button onClick={() => setOrderQuery('')} aria-label="Clear order search"><X size={14} /></button>}</div>
    <div className="order-selection-bar"><label><input type="checkbox" checked={filteredOrders.length > 0 && filteredOrders.every(order => selectedOrderIds.includes(order.id))} onChange={event => setSelectedOrderIds(event.target.checked ? filteredOrders.map(order => order.id) : [])} /><span>{selectedOrderIds.length ? `${selectedOrderIds.length} selected` : 'Select orders'}</span></label>{selectedOrderIds.length > 0 && <><button onClick={() => setSelectedOrderIds([])}>Clear</button><button className="is-danger" onClick={() => setDeleteOrderIds(selectedOrderIds)}>Delete selected</button></>}</div>
    <div className="order-workbench" role="table" aria-label={`${activeTab} orders`}>
      <div className="order-workbench__head" role="row"><span /><span>Order and customer</span><span>Progress</span><span>Total</span><span /></div>
      {filteredOrders.map(order => { const stageIndex = ORDER_STAGES.indexOf(order.status); const expanded = expandedOrderIds.includes(order.id); const setStage = (status) => updateAdminCollection('orders', orders => orders.map(item => item.id === order.id ? { ...item, status, ...(status === 'pending_payment' ? { paymentStatus: 'pending' } : stageIndex < 1 && status === 'paid' ? { paymentStatus: 'paid' } : {}), [`${status}At`]: new Date().toISOString(), updatedAt: new Date().toISOString() } : item)); return <article key={order.id} role="row" className={expanded ? 'is-expanded' : ''}>
        <label className="order-select"><input type="checkbox" checked={selectedOrderIds.includes(order.id)} onChange={event => setSelectedOrderIds(ids => event.target.checked ? [...ids, order.id] : ids.filter(id => id !== order.id))} /><span /></label>
        <div className="order-identity"><div><strong>{order.tracking}</strong><b>{order.code || `BOOK-${order.tracking.replace(/\D/g, '')}`}</b><em className={order.paymentStatus === 'paid' ? 'is-verified' : ''}>{order.paymentStatus === 'paid' ? 'Payment confirmed' : 'Payment pending'}</em></div><h3>{order.customer}</h3><p>{order.phone} · {new Date(order.createdAt).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' })}</p>{order.staffOrder && <em>Staff order</em>}</div>
        <div className="order-checkpoints" aria-label={`${order.tracking} fulfilment progress`}>
          <label><input type="checkbox" checked={order.paymentStatus === 'paid'} onChange={event => setStage(event.target.checked ? 'paid' : 'pending_payment')} /><i /><span>Paid</span></label>
          <label><input type="checkbox" checked={stageIndex >= 3} disabled={stageIndex < 1} onChange={event => setStage(event.target.checked ? 'ready' : 'packaging')} /><i /><span>Packed</span></label>
          <label><input type="checkbox" checked={stageIndex >= 4} disabled={stageIndex < 3} onChange={event => setStage(event.target.checked ? 'delivery' : 'ready')} /><i /><span>Dispatched</span></label>
          <label><input type="checkbox" checked={stageIndex >= 5} disabled={stageIndex < 4} onChange={event => setStage(event.target.checked ? 'completed' : 'delivery')} /><i /><span>Delivered</span></label>
        </div>
        <div className="order-total"><strong>GHS {Number(order.total).toLocaleString()}</strong><span className={`order-stage is-${order.status}`}>{ORDER_LABELS[order.status]}</span></div>
        <button className="order-expand" aria-label={`${expanded ? 'Collapse' : 'Expand'} ${order.tracking}`} aria-expanded={expanded} onClick={() => setExpandedOrderIds(ids => expanded ? ids.filter(id => id !== order.id) : [...ids, order.id])}><ChevronDown size={17} /></button>
        {expanded && <section className="order-expanded-detail"><article><small>Customer</small><strong>{order.customer}</strong><p>{order.phone}</p><p>{order.delivery}</p><p>{order.customerEmail || 'No email supplied'}</p><blockquote>{order.customerNote || 'No customer delivery note was supplied.'}</blockquote><button onClick={() => window.print()}>Print order</button></article><article><small>Items</small>{order.items.map((item, index) => <div className="order-line-item" key={`${item.name}-${index}`}><p><strong>{item.qty}×</strong> {item.name}</p><b>GHS {Number(item.price || order.total / Math.max(order.items.length, 1)).toLocaleString()}</b></div>)}<div className="order-items-total"><span>Total</span><strong>GHS {Number(order.total).toLocaleString()}</strong></div><p>{order.paymentMethod || 'Payment method pending'} · {order.paymentStatus === 'paid' ? 'Payment confirmed' : 'Awaiting payment confirmation'}</p></article><article><small>Admin note and delivery information</small><label>Estimated delivery<input type="datetime-local" value={orderDrafts[order.id]?.estimatedDelivery ?? order.estimatedDelivery ?? ''} onChange={event => setOrderDrafts(drafts => ({ ...drafts, [order.id]: { ...drafts[order.id], estimatedDelivery: event.target.value } }))} /></label><label>Admin note visible to customer<textarea value={orderDrafts[order.id]?.adminNote ?? order.adminNote ?? ''} placeholder="Call when nearby, recipient instructions…" onChange={event => setOrderDrafts(drafts => ({ ...drafts, [order.id]: { ...drafts[order.id], adminNote: event.target.value } }))} /></label><div><button className="order-save-note" onClick={() => saveOrderNotes(order)}>{savedOrderId === order.id ? 'Saved' : 'Save information'}</button>{order.paymentStatus === 'paid' && <button onClick={() => setStage('packaging')}>Start processing</button>}<button className="is-danger" onClick={() => setDeleteOrderIds([order.id])}>Delete order</button></div></article></section>}
      </article>; })}
      {!filteredOrders.length && <div className="admin-empty-state"><Package size={22} /><strong>No orders in {activeTab.toLowerCase()}</strong><p>New orders will appear here automatically.</p></div>}
    </div>
  </>;
}
