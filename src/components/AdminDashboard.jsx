import { useMemo, useState } from 'react';
import { Bell, ChevronDown, ChevronRight, Download, LogOut, Search, ShoppingBag, X } from 'lucide-react';

const TABS = ['Orders', 'Log', 'Custom Requests', 'Products', 'Shop', 'Insights', 'Customers', 'Settings'];
const STAGES = ['payment', 'confirmed', 'packaged', 'delivered'];

const SEED_ORDERS = [
  { id: 'GF-1048', name: 'Ama Mensah', phone: '024 102 3498', total: 3750, time: 'Today, 10:42', items: 'Luxury hamper × 1', address: 'East Legon, Accra', note: 'Add a handwritten birthday card.', status: { payment: true, confirmed: true, packaged: false, delivered: false } },
  { id: 'GF-1047', name: 'Nana Owusu', phone: '055 820 7141', total: 1900, time: 'Today, 09:18', items: 'Christmas bundle × 1, Bouquet × 1', address: 'Airport Residential, Accra', note: 'Call before arrival.', status: { payment: true, confirmed: true, packaged: true, delivered: false } },
  { id: 'GF-1046', name: 'Esi Arthur', phone: '020 441 8290', total: 650, time: 'Yesterday, 17:04', items: 'Period care box × 1', address: 'Tema Community 12', note: 'Recipient is receiving the order.', status: { payment: true, confirmed: true, packaged: true, delivered: true } },
  { id: 'GF-1045', name: 'Kwame Boateng', phone: '027 215 9980', total: 1130, time: 'Yesterday, 14:21', items: 'Wrist bag × 1, Embroidery × 2', address: 'Adenta, Accra', note: 'Initials: K.B.', status: { payment: false, confirmed: false, packaged: false, delivered: false } },
];

const PRODUCTS = [
  ['Luxury hamper', 'Hampers', 'GHS 3,750', 8],
  ['Christmas bundle', 'Seasonal', 'From GHS 1,250', 12],
  ['Fresh flower bouquet', 'Flowers', 'From GHS 450', 19],
  ['Period care box', 'Care gifts', 'From GHS 650', 6],
  ['Embroidery & personalization', 'Customization', 'From GHS 180', 14],
];

const REQUESTS = [
  ['CR-028', 'Abena K.', 'Engraved wrist bag with initials', 'Today, 11:12'],
  ['CR-027', 'Kojo A.', 'Corporate hamper for 12 recipients', 'Today, 08:54'],
  ['CR-026', 'Mariam D.', 'Anniversary flowers and presentation box', 'Yesterday'],
];

function SectionTitle({ eyebrow, title, action }) {
  return <header className="slay-section-title with-action"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action}</header>;
}

export default function AdminDashboard({ onExit }) {
  const [tab, setTab] = useState('Orders');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [expanded, setExpanded] = useState('GF-1048');
  const [selected, setSelected] = useState([]);

  const visibleOrders = useMemo(() => orders.filter(order => {
    const matchesQuery = `${order.id} ${order.name} ${order.phone}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Unpaid' && !order.status.payment) || (filter === 'Packing' && order.status.payment && !order.status.packaged) || (filter === 'Delivery' && order.status.packaged && !order.status.delivered) || (filter === 'Fulfilled' && order.status.delivered);
    return matchesQuery && matchesFilter;
  }), [orders, query, filter]);

  const revenue = orders.filter(order => order.status.payment).reduce((sum, order) => sum + order.total, 0);
  const awaiting = orders.filter(order => order.status.packaged && !order.status.delivered);

  const toggleStage = (id, stage) => setOrders(current => current.map(order => order.id === id ? { ...order, status: { ...order.status, [stage]: !order.status[stage] } } : order));
  const toggleSelected = id => setSelected(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);

  const orderContent = <>
    <section className="slay-kpis">
      <article className="dark"><small>PAID REVENUE</small><strong>GHS {revenue.toLocaleString()}</strong></article>
      <article><small>ACTIVE ORDERS</small><strong>{orders.filter(order => !order.status.delivered).length}</strong></article>
      <article><small>AWAITING DELIVERY</small><strong>{awaiting.length}</strong></article>
    </section>
    <label className="slay-order-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search order, customer or phone" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={15} /></button>}</label>
    {awaiting.length > 0 && <section className="slay-awaiting"><header><span>AWAITING DELIVERY</span><b>{awaiting.length}</b></header><div>{awaiting.map(order => <p key={order.id}><strong>{order.id}</strong><span>{order.name} · {order.address}</span><b>READY</b></p>)}</div></section>}
    <div className="slay-filter-row">{['All', 'Unpaid', 'Packing', 'Delivery', 'Fulfilled'].map(item => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}<b>{item === 'All' ? orders.length : orders.filter(order => item === 'Unpaid' ? !order.status.payment : item === 'Packing' ? order.status.payment && !order.status.packaged : item === 'Delivery' ? order.status.packaged && !order.status.delivered : order.status.delivered).length}</b></button>)}</div>
    {selected.length > 0 && <div className="slay-bulk"><span>{selected.length} SELECTED</span><div><button onClick={() => setSelected([])}>CLEAR</button><button className="danger" onClick={() => setOrders(current => current.filter(order => !selected.includes(order.id)))}>ARCHIVE</button></div></div>}
    <section className="slay-order-list">{visibleOrders.map(order => <article className="slay-order-card" key={order.id}>
      <div className="slay-order-summary" onClick={() => setExpanded(current => current === order.id ? '' : order.id)}>
        <button className={`slay-check ${selected.includes(order.id) ? 'checked' : ''}`} onClick={event => { event.stopPropagation(); toggleSelected(order.id); }} aria-label={`Select ${order.id}`}>{selected.includes(order.id) ? '✓' : ''}</button>
        <div className="slay-order-id"><strong>{order.id}</strong><small>{order.time}</small></div>
        <div className="slay-order-person"><strong>{order.name}</strong><small>{order.phone}</small></div>
        <span className="slay-order-total">GHS {order.total.toLocaleString()}</span>
        <div className="slay-status-checks">{STAGES.map(stage => <button key={stage} className={order.status[stage] ? 'checked' : ''} onClick={event => { event.stopPropagation(); toggleStage(order.id, stage); }}><i>{order.status[stage] ? '✓' : ''}</i>{stage.toUpperCase()}</button>)}</div>
        <ChevronRight size={16} className={expanded === order.id ? 'rotated' : ''} />
      </div>
      {expanded === order.id && <div className="slay-order-detail"><div><small>ORDER</small><p>{order.items}</p></div><div><small>DELIVERY</small><p>{order.address}<br /><span>{order.phone}</span></p></div><div><small>NOTES</small><p>{order.note}</p></div><div className="slay-order-actions"><button>PRINT SUMMARY</button><button>CONTACT CUSTOMER</button><button disabled={order.status.delivered}>ASSIGN RIDER</button></div></div>}
    </article>)}</section>
  </>;

  const logContent = <><SectionTitle eyebrow="ORDER HISTORY" title="Fulfilment log" action={<button><Download size={14} /> EXPORT</button>} /><section className="slay-stacked-records">{orders.filter(order => order.status.delivered).map(order => <article key={order.id}><div><strong>{order.id}</strong><small>{order.time}</small></div><p>{order.name}</p><b>GHS {order.total.toLocaleString()}</b><span>DELIVERED</span></article>)}</section></>;
  const requestsContent = <><SectionTitle eyebrow="CUSTOMIZATION" title="Customer requests" /><section className="slay-stacked-records">{REQUESTS.map(request => <article key={request[0]}><div><strong>{request[0]}</strong><small>{request[3]}</small></div><p>{request[2]}</p><b>{request[1]}</b><button>OPEN</button></article>)}</section></>;
  const productsContent = <><SectionTitle eyebrow="CATALOGUE" title="Products" action={<button>ADD PRODUCT</button>} /><div className="slay-product-tools"><div><span>LIVE PRODUCTS</span><strong>{PRODUCTS.length}</strong></div><div><span>LOW STOCK</span><strong>2</strong></div><button>UPDATE PROMOTIONS</button></div><section className="slay-product-table"><header><span>PRODUCT</span><span>PRICE</span><span>STOCK</span><span>STATUS</span><span></span></header>{PRODUCTS.map(product => <article key={product[0]}><span><strong>{product[0]}</strong><small>{product[1]}</small></span><span>{product[2]}</span><input type="number" defaultValue={product[3]} aria-label={`${product[0]} stock`} /><span>LIVE</span><button>EDIT</button></article>)}</section></>;
  const shopContent = <><SectionTitle eyebrow="STOREFRONT" title="Shop preview" /><div className="slay-shop-preview-label">LIVE PREVIEW</div><section className="slay-shop-preview"><img src="/assets/hamper-editorial-v2.png" alt="Luxury hamper" /><div><span>FEATURED COLLECTION</span><h1>Thoughtful gifting, beautifully presented.</h1><p>Review the customer-facing catalogue and confirm that imagery, pricing and availability are ready.</p><button onClick={onExit}>OPEN STOREFRONT</button></div></section></>;
  const insightsContent = <><SectionTitle eyebrow="PERFORMANCE" title="Insights" /><section className="slay-insight-grid"><article><span>AVERAGE ORDER VALUE</span><strong>GHS {Math.round(revenue / Math.max(1, orders.filter(order => order.status.payment).length)).toLocaleString()}</strong><p>Based on paid demo orders.</p></article><article><span>TOP CATEGORY</span><strong>Luxury hampers</strong><p>Highest contribution to order value.</p></article><article><span>REPEAT CUSTOMERS</span><strong>18%</strong><p>Demo retention signal.</p></article></section></>;
  const customersContent = <><SectionTitle eyebrow="RELATIONSHIPS" title="Customers" /><section className="slay-customer-list">{orders.map(order => <article key={order.id}><div><strong>{order.name}</strong><span>{order.phone}</span></div><div><small>LATEST ORDER</small><b>{order.id}</b></div><div><small>TOTAL SPEND</small><b>GHS {order.total.toLocaleString()}</b></div></article>)}</section></>;
  const settingsContent = <><SectionTitle eyebrow="STORE CONTROL" title="Settings" /><section className="slay-settings-grid"><article><h2>Store details</h2><label>BUSINESS NAME<input defaultValue="The Gifting Factory by Flower Girl" /></label><label>PHONE<input defaultValue="020 241 7072" /></label><button>SAVE DETAILS</button></article><article><h2>Delivery note</h2><label>CUSTOMER MESSAGE<textarea defaultValue="Delivery timing and fees are confirmed after the order is reviewed." /></label><button>SAVE MESSAGE</button></article></section></>;

  const content = tab === 'Orders' ? orderContent : tab === 'Log' ? logContent : tab === 'Custom Requests' ? requestsContent : tab === 'Products' ? productsContent : tab === 'Shop' ? shopContent : tab === 'Insights' ? insightsContent : tab === 'Customers' ? customersContent : settingsContent;

  return <main className="slay-admin-page"><div className="slay-admin-shell">
    <header className="slay-admin-heading"><div><span className="slay-admin-title">The Gifting Factory</span><span className="slay-admin-mobile-title">TGF</span><span className="slay-cloud-state"><i /> DEMO DATA</span><button className="slay-bell" onClick={() => setNoticeOpen(current => !current)} aria-label="Notifications"><Bell size={18} /><b>{awaiting.length}</b></button></div>{noticeOpen && <div className="slay-notice"><button onClick={() => setNoticeOpen(false)}><X size={14} /></button><small>OPERATIONS</small><strong>{awaiting.length} order awaiting delivery</strong><p>Review the delivery queue before assigning a rider.</p></div>}</header>
    <section className="slay-admin-controls"><div className="slay-view-picker"><button onClick={() => setPickerOpen(current => !current)}>{tab}<ChevronDown size={15} className={pickerOpen ? 'rotated' : ''} /></button>{pickerOpen && <><button className="slay-picker-shield" onClick={() => setPickerOpen(false)} aria-label="Close navigation" /><div>{TABS.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setPickerOpen(false); }}>{item}</button>)}</div></>}</div><div><span className="slay-sync">LAST SYNC · JUST NOW</span><button className="slay-ghost" onClick={() => setTab('Shop')}><ShoppingBag size={14} /> VIEW SHOP</button><button className="slay-logout" onClick={onExit}><LogOut size={14} /> STOREFRONT</button></div></section>
    {content}
  </div></main>;
}
