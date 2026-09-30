// src/pages/CustomersPage.jsx
// Ported 1-for-1 from admin-monolith.html renderCustomersView() (lines 22244–22470)

import { useState, useEffect } from 'react';
import { formatGHS } from '../lib/ordersModel';
import { listOrders } from '../data/orders';
import CustomDropdown from '../components/shared/CustomDropdown';

// ── SVG Icons matching monolith lines 18462–18464 ─────────────────────────────
const SVG_ICONS = {
  whatsapp: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  phone: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
};

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// ── Load Customers ── (Monolith lines 21853–21860)
function loadCustomersData(orders) {
  const customerGroupMap = new Map();

  orders.forEach(ord => {
    const key = (ord.customerEmail || ord.customerPhone || ord.customerName).toLowerCase().trim();
    if (!customerGroupMap.has(key)) {
      customerGroupMap.set(key, {
        id: `cust-${key.replace(/[^a-z0-9]/g, '')}`,
        name: ord.customerName || 'Customer',
        email: ord.customerEmail || 'N/A',
        phone: ord.customerPhone || 'N/A',
        orderCount: 0,
        totalSpend: 0,
        lastOrderDate: ord.orderDate ? ord.orderDate.split('T')[0] : 'N/A',
        orderHistory: []
      });
    }

    const c = customerGroupMap.get(key);
    c.orderCount += 1;
    if (ord.paymentStatus === 'paid') {
      c.totalSpend += Number(ord.total || 0);
    }
    c.orderHistory.push(ord);

    if (ord.orderDate && ord.orderDate > c.lastOrderDate) {
      c.lastOrderDate = ord.orderDate.split('T')[0];
    }
  });

  return Array.from(customerGroupMap.values());
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCustomer, setActiveCustomer] = useState(null);

  // Load orders from Supabase on mount
  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const loadedOrders = await listOrders();
      setOrders(loadedOrders);
      setCustomers(loadCustomersData(loadedOrders));
      setLoading(false);
    }
    loadOrders();
  }, []);

  // Filter customers (Monolith lines 22245–22255)
  const filteredCustomers = customers.filter(c => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchPhone = (c.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div className="page-container">
      {/* Monolith lines 22259–22271 */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Customer Database</h2>
          <p>Search, filter, and view customer records.</p>
        </div>
        <div className="controls-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="search-field" style={{ flex: 1, minWidth: '260px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="text"
              id="customerSearchInput"
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Monolith lines 22273–22321 */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Total Spend</th>
              <th>Last Order</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => (
                <tr key={c.id} className="customer-row" data-id={c.id} onClick={() => setActiveCustomer(c)}>
                  <td style={{ fontWeight: 600 }}>
                    {c.name}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.orderCount}</td>
                  <td style={{ fontWeight: 600 }}>GHS {c.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{c.lastOrderDate}</td>
                  <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <div className="contact-actions-group" style={{ justifyContent: 'flex-end' }}>
                      <a
                        href={`https://wa.me/${(c.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-icon-action"
                        title="Message on WhatsApp"
                        aria-label="WhatsApp"
                      >
                        {SVG_ICONS.whatsapp}
                      </a>
                      <a
                        href={`tel:${c.phone}`}
                        className="btn-icon-action"
                        title="Call Customer"
                        aria-label="Call"
                      >
                        {SVG_ICONS.phone}
                      </a>
                      <button
                        type="button"
                        className="btn-capsule view-customer-btn"
                        data-id={c.id}
                        onClick={e => { e.stopPropagation(); setActiveCustomer(c); }}
                      >
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No customers match your search query or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Monolith lines 22324–22336 & 22400–22469 */}
      <div className={`drawer-backdrop ${activeCustomer ? 'active' : ''}`} id="drawerBackdrop" onClick={() => setActiveCustomer(null)} />
      <div className={`customer-drawer ${activeCustomer ? 'active' : ''}`} id="customerDrawer">
        {activeCustomer && (
          <>
            <div className="drawer-header">
              <div>
                <h3 id="drawerCustName" style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
                  {activeCustomer.name}
                </h3>
                <span id="drawerCustSub" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {activeCustomer.email} • {activeCustomer.phone}
                </span>
              </div>
              <button
                type="button"
                className="btn-icon-action"
                id="closeDrawerBtn"
                style={{ border: 'none' }}
                onClick={() => setActiveCustomer(null)}
              >
                {SVG_ICONS.close}
              </button>
            </div>

            <div className="drawer-body" id="drawerBody">
              <div>
                <span className="drawer-section-title">LIFETIME SPEND</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#1a1a1a' }}>
                  GHS {activeCustomer.totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{activeCustomer.orderCount} total orders</span>
              </div>

              <div>
                <span className="drawer-section-title">ORDER HISTORY SUMMARY</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  {activeCustomer.orderHistory && activeCustomer.orderHistory.length > 0 ? (
                    activeCustomer.orderHistory.map((o, idx) => (
                      <div
                        key={o.id || idx}
                        style={{ padding: '10px 12px', background: 'rgba(26,26,26,0.03)', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '12px', color: '#1a1a1a' }}>
                            {o.id || o.orderCode} • {(o.items || []).map(i => i.name || i.title || '').join(', ')}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Placed on {o.orderDate ? o.orderDate.split('T')[0] : (o.date || 'N/A')}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, fontSize: '12px' }}>GHS {(o.amount || 0).toFixed(2)}</div>
                          <span className="status-badge status-published" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            {o.fulfillmentStatus || o.status || 'delivered'}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No prior order history recorded.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
