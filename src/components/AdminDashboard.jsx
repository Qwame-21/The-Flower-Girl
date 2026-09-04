import { useMemo, useState } from 'react';
import { Bell, ChevronDown, ChevronRight, Download, LogOut, Search, ShoppingBag, X, LayoutDashboard, ClipboardList, WandSparkles, Package, ChartNoAxesColumnIncreasing, Users, Truck, BriefcaseBusiness, Settings, Images, MessageSquareText } from 'lucide-react';

const TABS = ['Overview', 'Orders', 'Log', 'Custom Requests', 'Products', 'Shop', 'Insights', 'Customers', 'Reviews', 'Delivery', 'Careers', 'Content', 'Settings'];
const TAB_ICONS = { Overview: LayoutDashboard, Orders: ClipboardList, Log: ClipboardList, 'Custom Requests': WandSparkles, Products: Package, Shop: ShoppingBag, Insights: ChartNoAxesColumnIncreasing, Customers: Users, Reviews: MessageSquareText, Delivery: Truck, Careers: BriefcaseBusiness, Content: Images, Settings };
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
  const [tab, setTab] = useState('Overview');
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

  const overviewContent = <>
    <SectionTitle eyebrow="OPERATIONS · TODAY" title="Everything that needs attention." action={<button onClick={() => setTab('Orders')}>VIEW ALL ORDERS</button>} />
    <section className="factory-overview-metrics">
      <article><small>PAID REVENUE</small><strong>GHS {revenue.toLocaleString()}</strong><span>Across confirmed demo orders</span></article>
      <article><small>ACTIVE ORDERS</small><strong>{orders.filter(order => !order.status.delivered).length}</strong><span>From payment to delivery</span></article>
      <article><small>CUSTOM REQUESTS</small><strong>{REQUESTS.length}</strong><span>Two require quotations</span></article>
      <article><small>DELIVERY QUEUE</small><strong>{awaiting.length}</strong><span>Ready for rider assignment</span></article>
    </section>
    <section className="factory-overview-grid">
      <article className="factory-performance"><header><div><small>ORDER PERFORMANCE</small><h2>Weekly volume</h2></div><span>THIS WEEK</span></header><div className="factory-bars">{[38,62,48,84,57,73,44].map((height,index)=><div key={index}><i style={{height:`${height}%`}} className={index===3?'active':''}/><small>{['M','T','W','T','F','S','S'][index]}</small></div>)}</div></article>
      <article className="factory-mix"><small>ORDER MIX</small><div className="factory-donut"><strong>12</strong><span>ORDERS</span></div><ul><li><i/>Hampers <b>42%</b></li><li><i/>Flowers <b>25%</b></li><li><i/>Personalized <b>18%</b></li><li><i/>Other <b>15%</b></li></ul></article>
    </section>
    <section className="factory-priority"><header><div><small>PRIORITY QUEUE</small><h2>Move these forward.</h2></div></header>{orders.slice(0,3).map(order=><button key={order.id} onClick={()=>{setTab('Orders');setExpanded(order.id)}}><span>{order.id}</span><strong>{order.name}</strong><em>{order.items}</em><b>{order.status.packaged?'ASSIGN DELIVERY':order.status.payment?'PREPARING':'CONFIRM PAYMENT'}</b><ChevronRight size={16}/></button>)}</section>
  </>;

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
  const deliveryContent = <><SectionTitle eyebrow="FULFILMENT" title="Delivery desk" /><section className="slay-stacked-records">{orders.filter(order=>!order.status.delivered).map(order=><article key={order.id}><div><strong>{order.id}</strong><small>{order.name}</small></div><p>{order.address}</p><b>{order.status.packaged?'READY':'PREPARING'}</b><button disabled={!order.status.packaged}>ASSIGN RIDER</button></article>)}</section></>;
  const careersContent = <><SectionTitle eyebrow="PEOPLE" title="Career applications" /><section className="factory-empty"><strong>No new applications</strong><p>Applications submitted through the storefront will arrive here for review, notes and status updates.</p></section></>;
  const contentContent = <><SectionTitle eyebrow="STOREFRONT" title="Content control" /><section className="slay-settings-grid"><article><h2>Homepage collections</h2><p>Control featured gifts, gallery imagery and service visibility.</p><button>MANAGE FEATURES</button></article><article><h2>Help and policies</h2><p>Update delivery guidance, frequently asked questions and order policies.</p><button>EDIT CONTENT</button></article></section></>;
  const reviewsContent = <><SectionTitle eyebrow="SOCIAL PROOF" title="Reviews" /><section className="factory-empty"><strong>Review moderation</strong><p>Verified-order ratings and customer comments will be managed here.</p><button>ADD REVIEW</button></section></>;
  const settingsContent = <><SectionTitle eyebrow="STORE CONTROL" title="Settings" /><section className="slay-settings-grid"><article><h2>Store details</h2><label>BUSINESS NAME<input defaultValue="The Gifting Factory by Flower Girl" /></label><label>PHONE<input defaultValue="020 241 7072" /></label><button>SAVE DETAILS</button></article><article><h2>Delivery note</h2><label>CUSTOMER MESSAGE<textarea defaultValue="Delivery timing and fees are confirmed after the order is reviewed." /></label><button>SAVE MESSAGE</button></article></section></>;

  const content = tab === 'Overview' ? overviewContent : tab === 'Orders' ? orderContent : tab === 'Log' ? logContent : tab === 'Custom Requests' ? requestsContent : tab === 'Products' ? productsContent : tab === 'Shop' ? shopContent : tab === 'Insights' ? insightsContent : tab === 'Customers' ? customersContent : tab === 'Delivery' ? deliveryContent : tab === 'Careers' ? careersContent : tab === 'Content' ? contentContent : tab === 'Reviews' ? reviewsContent : settingsContent;

  return <main className="slay-admin-page factory-admin"><aside className="factory-rail"><button className="factory-rail-mark" onClick={()=>setTab('Overview')}>TGF</button><nav>{TABS.filter(item=>!['Log','Shop','Content'].includes(item)).map(item=>{const Icon=TAB_ICONS[item];return <button key={item} title={item} aria-label={item} className={tab===item?'active':''} onClick={()=>setTab(item)}><Icon size={17}/></button>})}</nav><button title="Storefront" aria-label="Storefront" onClick={onExit}><LogOut size={17}/></button></aside><div className="slay-admin-shell factory-admin-shell">
    <header className="slay-admin-heading"><div><span className="slay-admin-title">The Gifting Factory</span><span className="slay-admin-mobile-title">TGF</span><span className="slay-cloud-state"><i /> DEMO DATA</span><button className="slay-bell" onClick={() => setNoticeOpen(current => !current)} aria-label="Notifications"><Bell size={18} /><b>{awaiting.length}</b></button></div>{noticeOpen && <div className="slay-notice"><button onClick={() => setNoticeOpen(false)}><X size={14} /></button><small>OPERATIONS</small><strong>{awaiting.length} order awaiting delivery</strong><p>Review the delivery queue before assigning a rider.</p></div>}</header>
    <section className="slay-admin-controls"><div className="slay-view-picker"><button onClick={() => setPickerOpen(current => !current)}>{tab}<ChevronDown size={15} className={pickerOpen ? 'rotated' : ''} /></button>{pickerOpen && <><button className="slay-picker-shield" onClick={() => setPickerOpen(false)} aria-label="Close navigation" /><div>{TABS.map(item => <button key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); setPickerOpen(false); }}>{item}</button>)}</div></>}</div><div><span className="slay-sync">LAST SYNC · JUST NOW</span><button className="slay-ghost" onClick={() => setTab('Shop')}><ShoppingBag size={14} /> VIEW SHOP</button><button className="slay-logout" onClick={onExit}><LogOut size={14} /> STOREFRONT</button></div></section>
    {content}
  </div></main>;
}
