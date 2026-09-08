import { useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { ORDER_LABELS } from '../utils/adminMappers';
import '../workspace.css';
import FlowArrow from '../components/FlowArrow';

const money = value => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS', currencyDisplay: 'code' }).format(Number(value || 0));
const date = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleDateString('en-GH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

export default function OrdersPage({ filteredOrders, orderQuery, setOrderQuery, expandedOrderIds, setExpandedOrderIds, orderDrafts, setOrderDrafts, saveOrderNotes, paidOrders, activeOrders, adminData, setManualOrderOpen }) {
  const [saving, setSaving] = useState(null);
  const [feedback, setFeedback] = useState({});
  const save = async order => {
    setSaving(order.id);
    setFeedback({});
    try { await saveOrderNotes(order); setFeedback({ id: order.id, message: 'Order notes saved.' }); }
    catch (error) { setFeedback({ id: order.id, message: error.message || 'Could not save. Please try again.', error: true }); }
    finally { setSaving(null); }
  };
  return <div className="orders-workspace">
    <header className="orders-heading"><div><h2>Orders</h2><p>Every gift, from payment to delivery.</p></div><button className="orders-primary" onClick={() => setManualOrderOpen(true)}><Plus size={17} /> Manual order</button></header>
    <div className="orders-summary" aria-label="Order summary"><div><span>Total orders</span><strong>{adminData.orders.length}</strong></div><div><span>In progress</span><strong>{activeOrders.length}</strong></div><div><span>Confirmed payments</span><strong>{paidOrders.length}</strong></div></div>
    <div className="orders-toolbar"><label><Search size={18} /><input type="search" aria-label="Search orders" placeholder="Search order, customer or location" value={orderQuery} onChange={event => setOrderQuery(event.target.value)} /></label><span>{filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}</span></div>
    {!filteredOrders.length ? <div className="orders-empty"><Package size={28} /><h3>{orderQuery ? 'No matching orders' : 'No orders here yet'}</h3><p>{orderQuery ? 'Try another name, order number or location.' : 'Orders will appear here when available.'}</p>{orderQuery && <button onClick={() => setOrderQuery('')}>Clear search</button>}</div> : <div className="orders-list">
      <div className="orders-columns" aria-hidden="true"><span>Order / customer</span><span>Delivery</span><span>Status</span><span>Total</span><span /></div>
      {filteredOrders.map(order => {
        const expanded = expandedOrderIds.includes(order.id);
        const draft = orderDrafts[order.id] || {};
        return <article className="orders-record" key={order.id}>
          <button className="orders-row" aria-expanded={expanded} aria-controls={`order-details-${order.id}`} onClick={() => setExpandedOrderIds(ids => expanded ? ids.filter(id => id !== order.id) : [...ids, order.id])}>
            <span><strong>{order.tracking || order.code}</strong><small>{order.customer} · {date(order.createdAt)}</small></span><span className="orders-location">{order.delivery || 'Location pending'}</span><span><b className={`orders-status status-${order.status}`}>{ORDER_LABELS[order.status] || order.status}</b></span><strong>{money(order.total)}</strong><FlowArrow size={12} direction={expanded ? 'up' : 'down'} />
          </button>
          {expanded && <div className="orders-details" id={`order-details-${order.id}`}>
            <section><h3>Gift & delivery details</h3><ul>{(order.items || []).map((item, index) => <li key={index}><span>{item.name}</span><strong>× {item.qty}</strong></li>)}</ul><dl><dt>Recipient</dt><dd>{order.recipient || order.customer}</dd><dt>Phone</dt><dd>{order.phone || 'Not provided'}</dd><dt>Address</dt><dd>{order.delivery || 'Not provided'}</dd><dt>Requested date</dt><dd>{date(order.requestedDeliveryDate)}</dd><dt>Payment</dt><dd>{order.paymentMethod || 'Not provided'} · {order.paymentStatus || 'Not recorded'}</dd></dl>{order.customerNote && <p><strong>Customer note</strong><br />{order.customerNote}</p>}{order.cardMessage && <p><strong>Card message</strong><br />{order.cardMessage}</p>}</section>
            <form onSubmit={event => { event.preventDefault(); save(order); }}><h3>Order notes</h3><p className="orders-note">{order.source === 'supabase' ? 'Changes save to the shared order.' : 'This record is stored in this browser.'}</p><label>Note<textarea rows={4} value={draft.adminNote ?? order.adminNote ?? ''} onChange={event => setOrderDrafts(drafts => ({ ...drafts, [order.id]: { ...drafts[order.id], adminNote: event.target.value } }))} /></label><small>Order notes may be visible in customer tracking.</small><button className="orders-primary" disabled={saving !== null} type="submit">{saving === order.id ? 'Saving…' : 'Save notes'}</button>{feedback.id === order.id && <p role={feedback.error ? 'alert' : 'status'}>{feedback.message}</p>}</form>
          </div>}
        </article>;
      })}
    </div>}
  </div>;
}
