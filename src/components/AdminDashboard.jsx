import { useEffect, useState } from 'react';
import { BriefcaseBusiness, ChartNoAxesColumnIncreasing, ClipboardCheck, Clock3, FileImage, House, Images, MessageSquareText, Package, Settings, ShoppingBag, Tag, Truck, UserRound, Users, X } from 'lucide-react';
import { addAdminRecord, readAdminData, updateAdminCollection } from '../admin/api/adminStore';
import { useAdminData } from '../admin/hooks/useAdminData';
import { logoutToLogin } from '../admin/utils/logout';
import { useNotificationAudio } from '../admin/hooks/useNotificationAudio';
import AdminRail from '../admin/components/AdminRail';
import AdminTopbar from '../admin/components/AdminTopbar';
import DetailFlyoutPanel from '../admin/components/DetailFlyoutPanel';
import OrdersPage from '../admin/pages/OrdersPage';
import OverviewPage from '../admin/pages/OverviewPage';
import WorkspacePages from '../admin/pages/WorkspacePages';
import ManualOrderModal from '../admin/modals/ManualOrderModal';
import ReviewModal from '../admin/modals/ReviewModal';
import CareerModal from '../admin/modals/CareerModal';
import ConfirmDeleteModal from '../admin/modals/ConfirmDeleteModal';
import ProductModal from '../admin/modals/ProductModal';
import CollectionModal from '../admin/modals/CollectionModal';
import { ORDER_LABELS, cataloguePrice, mapDatabaseOrder } from '../admin/utils/adminMappers';
import { supabase } from '../config/supabase';

const NAV_ITEMS = [
  { label: 'Overview', icon: House }, { label: 'Orders', icon: ShoppingBag },
  { label: 'Requests', icon: MessageSquareText }, { label: 'Products', icon: Tag },
  { label: 'Shop', icon: Package }, { label: 'Insights', icon: ChartNoAxesColumnIncreasing },
  { label: 'Customers', icon: Users }, { label: 'Reviews', icon: ClipboardCheck },
  { label: 'Delivery', icon: Truck }, { label: 'Gallery', icon: Images },
  { label: 'Careers', icon: BriefcaseBusiness }, { label: 'Content', icon: FileImage },
];

const PAGE_DATA = {
  Overview: { tabs: [['Today', 8, Clock3], ['This week', 24, ClipboardCheck], ['Activity', 16, Package]], title: 'Today at a glance', subtitle: 'The work that needs attention across the store.', rows: [['Orders to confirm', '8', 'Payment and recipient details'], ['Gifts in preparation', '12', 'Packing, wrapping and personalization'], ['Ready for delivery', '4', 'Awaiting rider assignment'], ['Custom requests', '6', 'Quotes and customer replies']] },
  Orders: { tabs: [['All orders', 5, Package], ['Paid', 1, ClipboardCheck], ['Preparing', 1, Clock3], ['Ready', 1, Package], ['Log', 1, FileImage]], title: 'Orders', subtitle: 'Confirm payment and move every gift through preparation, dispatch and delivery.', rows: [] },
  Requests: { tabs: [['All requests', 0, MessageSquareText], ['Quote needed', 0, Clock3], ['Approved', 0, ClipboardCheck]], title: 'Custom gift requests', subtitle: 'Review inspiration, prepare quotes and convert approved ideas into orders.', rows: [] },
  Reviews: { tabs: [['Pending', 7, Clock3], ['Published', 42, ClipboardCheck], ['Flagged', 2, Package]], title: 'Review moderation', subtitle: 'Check verified customer feedback before it appears in the shop.', rows: [['Luxury hamper', '5.0', 'Adwoa M. · Awaiting approval'], ['Flower bouquet', '4.0', 'Nana K. · Awaiting approval'], ['Engraved wrist bag', '5.0', 'Esi A. · Verified order'], ['Care gift box', '4.5', 'Mariam D. · Verified order']] },
  Products: { tabs: [['All products', 38, Package], ['Low stock', 6, Clock3], ['Hidden', 4, Tag]], title: 'Product catalogue', subtitle: 'Manage availability, pricing and storefront visibility.', rows: [['Luxury celebration hamper', '8 in stock', 'Hampers · GHS 3,750'], ['Fresh flower bouquet', '19 in stock', 'Flowers · From GHS 450'], ['Period care box', '6 in stock', 'Care gifts · From GHS 650'], ['Embroidery service', 'Available', 'Personalization · From GHS 180'], ['Christmas bundle', '12 in stock', 'Seasonal · From GHS 1,250']] },
  Customers: { tabs: [['All customers', 126, Users], ['Returning', 31, Clock3], ['Recipients', 84, UserRound]], title: 'Customer directory', subtitle: 'Customer history, recipients and saved delivery details.', rows: [['Ama Mensah', '3 orders', 'East Legon · Last order today'], ['Nana Owusu', '5 orders', 'Airport Residential · Last order today'], ['Esi Arthur', '2 orders', 'Tema · Last order yesterday'], ['Kwame Boateng', '1 order', 'Adenta · Last order 30 Aug']] },
  Careers: { tabs: [['Applications', 14, BriefcaseBusiness], ['Shortlist', 4, ClipboardCheck], ['Archived', 22, Package]], title: 'Career applications', subtitle: 'Review applicants, notes and interview status.', rows: [['Content creator', '6 applicants', '3 new applications'], ['Gift production assistant', '5 applicants', 'Review in progress'], ['Delivery coordinator', '3 applicants', 'Shortlist ready'], ['General application', 'Open', 'Accepting submissions']] },
  Shop: { tabs: [['Featured', 8, Package], ['Collections', 6, Tag], ['Drafts', 3, Clock3]], title: 'Storefront control', subtitle: 'Curate the products and collections customers see first.', rows: [['Celebration gifts', 'Live', '6 products · Updated today'], ['Flowers for every moment', 'Live', '8 products · Updated yesterday'], ['Personalized keepsakes', 'Draft', '4 products · Needs imagery'], ['Care packages', 'Live', '5 products · Updated 30 Aug']] },
  Insights: { tabs: [['Performance', 12, ChartNoAxesColumnIncreasing], ['Products', 8, Package], ['Delivery', 4, Truck]], title: 'Store performance', subtitle: 'Track revenue, order volume and fulfillment health.', rows: [['Paid revenue', 'GHS 28,430', '+12.4% this week'], ['Average order value', 'GHS 1,184', '+4.2% this week'], ['Orders completed', '24', 'Average fulfillment 1.8 days'], ['Custom request conversion', '38%', '5 converted this month']] },
  Delivery: { tabs: [['Queue', 8, Truck], ['Out today', 4, Clock3], ['Completed', 42, ClipboardCheck]], title: 'Delivery desk', subtitle: 'Assign riders, confirm destinations and record completion.', rows: [['GF-1046 · Tema', 'Ready', 'Recipient: Esi Arthur'], ['GF-1043 · Osu', 'Assigned', 'Rider: Michael A.'], ['GF-1041 · East Legon', 'In transit', 'ETA 4:20 PM']] },
  Gallery: { tabs: [['Published', 4, Images], ['Hidden', 0, FileImage], ['Recent uploads', 0, Clock3]], title: 'Gallery', subtitle: 'Upload, label and control every image used in the storefront gallery.', rows: [] },
  Content: { tabs: [['Homepage', 7, Images], ['Policies', 5, ClipboardCheck], ['Announcements', 3, FileImage]], title: 'Storefront content', subtitle: 'Manage homepage features, policies and customer announcements.', rows: [['Homepage hero', 'Live', 'Orange rose campaign'], ['Featured collection', 'Live', 'Celebration gifts'], ['Delivery policy', 'Live', 'Updated 28 Aug'], ['Holiday notice', 'Draft', 'Scheduled for 18 Dec']] },
  Settings: { tabs: [['Store', 6, Settings], ['Team', 4, Users], ['Security', 3, ClipboardCheck]], title: 'Store settings', subtitle: 'Manage business details, staff access and admin preferences.', rows: [['Business profile', 'Complete', 'Name, contact and operating hours'], ['Delivery settings', 'Review', 'Zones, timing and customer notes'], ['Team access', '4 members', 'Roles and permissions'], ['Security', 'Active', 'Sessions and account protection']] },
};

export default function AdminDashboard({ staffIdentity }) {
  const [overviewDataStatus, setOverviewDataStatus] = useState('local');
  const [activeNav, setActiveNav] = useState('Overview');
  const [activeTabs, setActiveTabs] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [expandedOrderIds, setExpandedOrderIds] = useState([]);
  const [deleteOrderIds, setDeleteOrderIds] = useState([]);
  const [orderQuery, setOrderQuery] = useState('');
  const [orderDrafts, setOrderDrafts] = useState({});
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [careerFormOpen, setCareerFormOpen] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [manualOrderOpen, setManualOrderOpen] = useState(false);
  const [staffCart, setStaffCart] = useState(() => { try { const saved = JSON.parse(window.localStorage.getItem('gifting-factory-staff-cart') || '[]'); return Array.isArray(saved) ? saved : []; } catch { return []; } });
  const [staffCartOpen, setStaffCartOpen] = useState(false);
  const [staffCartMessage, setStaffCartMessage] = useState('');
  const [collectionFormOpen, setCollectionFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [galleryMessage, setGalleryMessage] = useState('');
  const [readNotificationIds, setReadNotificationIds] = useState(() => { try { return JSON.parse(window.localStorage.getItem('gifting-factory-read-notifications') || '[]'); } catch { return []; } });
  const [notificationSound, setNotificationSound] = useState(() => window.localStorage.getItem('gifting-factory-notification-sound') !== 'off');
  const [utilityPanel, setUtilityPanel] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [secondaryImagePreview, setSecondaryImagePreview] = useState('');
  const { adminData, setAdminData, products } = useAdminData();

  // Inactivity auto-logout — 15 minutes of no user input signs out the session.
  useEffect(() => {
    if (!staffIdentity) return undefined;
    const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;
    let timer;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { logoutToLogin(); }, INACTIVITY_TIMEOUT_MS);
    };
    const events = ['mousemove', 'keydown', 'pointerdown', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [staffIdentity]);
  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    const loadVerifiedOrders = async () => {
      try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !active) return;
      setOverviewDataStatus('loading');
      const { data, error } = await supabase.from('orders').select('*, order_items(*), order_events(*)').order('created_at', { ascending: false });
      if (active) setOverviewDataStatus(error ? 'error' : 'ready');
      if (!error && active) setAdminData(current => ({ ...current, ordersSource: 'supabase', orders: (data || []).map(mapDatabaseOrder) }));
      } catch { if (active) setOverviewDataStatus('error'); }
    };
    loadVerifiedOrders();
    const { data: { subscription: orderAuthSubscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_IN') window.setTimeout(loadVerifiedOrders, 0);
      if (event === 'SIGNED_OUT') setAdminData(current => ({ ...current, orders: [], ordersSource: undefined }));
    });
    const channel = supabase.channel('admin-paid-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadVerifiedOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, loadVerifiedOrders)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'order_events' }, loadVerifiedOrders)
      .subscribe();
    return () => { active = false; orderAuthSubscription.unsubscribe(); supabase.removeChannel(channel); };
  }, [setAdminData]);
  useEffect(() => window.localStorage.setItem('gifting-factory-staff-cart', JSON.stringify(staffCart)), [staffCart]);
  useEffect(() => {
    if (!utilityPanel) return undefined;
    const trigger = document.activeElement;
    const closeOnEscape = event => { if (event.key === 'Escape') setUtilityPanel(null); };
    const closeOutside = event => { if (!event.target.closest('.admin-foundation__utilities, .admin-foundation__popover')) setUtilityPanel(null); };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOutside); trigger?.focus?.(); };
  }, [utilityPanel]);
  const customerFrequency = adminData.orders.reduce((map, order) => ({ ...map, [order.phone || order.customer]: (map[order.phone || order.customer] || 0) + 1 }), {});
  const reviews = adminData.reviews || [];
  const deliveries = adminData.orders.filter(order => order.status !== 'pending_payment').map(order => ({ id: order.tracking, orderId: order.id, customer: order.customer, recipient: order.recipient || order.customer, phone: order.phone, location: order.delivery || 'Location pending', status: order.status === 'paid' ? 'Payment confirmed' : order.status === 'packaging' ? 'Preparing' : order.status === 'ready' ? 'Ready' : order.status === 'delivery' ? 'In transit' : 'Delivered', rider: order.rider || 'Unassigned', sentAt: order.deliveryAt ? new Date(order.deliveryAt).toLocaleString('en-GH') : 'Not dispatched', deliveredAt: order.completedAt ? new Date(order.completedAt).toLocaleString('en-GH') : '', receivedBy: order.receivedBy || '', proofNote: order.proofNote || '', estimate: order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleString('en-GH') : 'Awaiting estimate' }));
  const setReviews = updater => updateAdminCollection('reviews', updater);
  const setDeliveries = updater => { const next = updater(deliveries); updateAdminCollection('orders', orders => orders.map(order => { const delivery = next.find(item => item.orderId === order.id); if (!delivery) return order; const status = delivery.status === 'Delivered' ? 'completed' : delivery.status === 'In transit' ? 'delivery' : 'ready'; return { ...order, status, [`${status}At`]: new Date().toISOString() }; })); };
  const customerCount = Object.keys(customerFrequency).length;
  const returningCustomerCount = Object.values(customerFrequency).filter(count => count > 1).length;
  const page = PAGE_DATA[activeNav];
  const tabs = (() => {
    if (activeNav === 'Overview') {
      const now = new Date();
      const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - 6); weekStart.setHours(0, 0, 0, 0);
      const createdSince = start => adminData.orders.filter(order => new Date(order.createdAt) >= start).length + adminData.requests.filter(request => new Date(request.createdAt) >= start).length;
      return [['Today', createdSince(todayStart), Clock3], ['This week', createdSince(weekStart), ClipboardCheck], ['Activity', adminData.orders.length + adminData.requests.length + adminData.applications.length, Package]];
    }
    if (activeNav === 'Products') return [['All products', products.length, Package], ['Low stock', products.filter(product => product.stock < 10).length, Clock3], ['Hidden', products.filter(product => !product.visible).length, Tag]];
    if (activeNav === 'Orders') return [['All orders', adminData.orders.length, Package], ['Paid', adminData.orders.filter(order => order.paymentStatus === 'paid').length, ClipboardCheck], ['Preparing', adminData.orders.filter(order => order.status === 'packaging').length, Clock3], ['Ready', adminData.orders.filter(order => order.status === 'ready').length, Package], ['Log', adminData.orders.filter(order => order.status === 'completed').length, FileImage]];
    if (activeNav === 'Requests') return [['All requests', adminData.requests.length, MessageSquareText], ['Quote needed', adminData.requests.filter(request => ['new', 'quote_needed'].includes(request.status)).length, Clock3], ['Approved', adminData.requests.filter(request => request.status === 'approved').length, ClipboardCheck]];
    if (activeNav === 'Shop') return [['All products', products.length, Package], ['Featured', products.filter(product => product.featured && product.visible).length, ClipboardCheck], ['Collections', adminData.collections.length, Tag], ['Drafts', products.filter(product => !product.visible).length, Clock3]];
    if (activeNav === 'Gallery') return [['Published', adminData.gallery.filter(image => image.visible).length, Images], ['Hidden', adminData.gallery.filter(image => !image.visible).length, FileImage], ['Recent uploads', adminData.gallery.filter(image => image.createdAt).length, Clock3]];
    if (activeNav === 'Reviews') return [['Pending', reviews.filter(review => review.status === 'Pending').length, Clock3], ['Published', reviews.filter(review => review.status === 'Published').length, ClipboardCheck], ['Flagged', reviews.filter(review => review.status === 'Flagged').length, Package]];
    if (activeNav === 'Delivery') return [['Queue', deliveries.filter(delivery => delivery.status !== 'Delivered').length, Truck], ['Out today', deliveries.filter(delivery => delivery.status === 'In transit').length, Clock3], ['Completed', deliveries.filter(delivery => delivery.status === 'Delivered').length, ClipboardCheck]];
    if (activeNav === 'Careers') return [['Applications', adminData.applications.filter(item => !['shortlisted', 'archived'].includes(item.status)).length, BriefcaseBusiness], ['Shortlist', adminData.applications.filter(item => item.status === 'shortlisted').length, ClipboardCheck], ['Closed', adminData.applications.filter(item => ['rejected', 'hired'].includes(item.status)).length, Package], ['Open roles', adminData.careers.filter(role => role.status === 'open').length, BriefcaseBusiness], ['Drafts', adminData.careers.filter(role => role.status === 'draft').length, FileImage]];
    if (activeNav === 'Customers') return [['All customers', customerCount, Users], ['Returning', returningCustomerCount, Clock3], ['Recipients', adminData.orders.length, UserRound]];
    return page.tabs;
  })();
  const activeTab = activeTabs[activeNav] || tabs[0][0];
  const tabIndex = tabs.findIndex(([label]) => label === activeTab);
  const filteredOrders = adminData.orders.filter(order => (activeTab === 'All orders' ? true : activeTab === 'Paid' ? order.paymentStatus === 'paid' : activeTab === 'Preparing' ? order.status === 'packaging' : activeTab === 'Ready' ? order.status === 'ready' : activeTab === 'Log' ? order.status === 'completed' : true) && `${order.tracking} ${order.code || ''} ${order.customer} ${order.phone} ${order.delivery}`.toLowerCase().includes(orderQuery.toLowerCase()));
  const paidOrders = adminData.orders.filter(order => order.paymentStatus === 'paid');
  const activeOrders = adminData.orders.filter(order => order.status !== 'completed');
  const notifications = [...adminData.orders.map(order => ({ id: `order-${order.id}-${order.status}-${order.updatedAt || order.createdAt}`, type: order.updatedAt ? 'Order updated' : 'Order received', title: `${order.tracking} · ${order.customer}`, status: ORDER_LABELS[order.status], route: 'Orders', record: order })), ...adminData.requests.map(request => ({ id: `request-${request.id}-${request.status}-${request.updatedAt || request.createdAt}`, type: request.updatedAt ? 'Request updated' : 'Request received', title: `${request.reference || 'Request'} · ${request.name || 'Customer'}`, status: request.status === 'quote_needed' ? 'Quote needed' : request.status, route: 'Requests', record: request })), ...adminData.applications.map(application => ({ id: `application-${application.id}-${application.status}-${application.updatedAt || application.createdAt}`, type: 'Application', title: application.name || 'New applicant', status: application.status || application.role, route: 'Careers', record: application }))].sort((a, b) => new Date(b.record.updatedAt || b.record.createdAt || 0) - new Date(a.record.updatedAt || a.record.createdAt || 0));
  const notificationCount = notifications.filter(item => !readNotificationIds.includes(item.id)).length;
  useNotificationAudio(notificationCount, notificationSound);
  const selectNav = (label) => { setActiveNav(label); setMobileOpen(false); if (window.matchMedia('(max-width: 760px)').matches) setRailExpanded(false); setUtilityPanel(null); setSelectedItem(null); };
  const openOrder = id => { setActiveTabs(current => ({ ...current, Orders: 'All orders' })); selectNav('Orders'); window.setTimeout(() => setExpandedOrderIds([id]), 0); };
  const selectTab = (label) => { setActiveTabs(current => ({ ...current, [activeNav]: label })); setUtilityPanel(null); setSelectedItem(null); };
  const toggleUtility = (panel) => setUtilityPanel(current => current === panel ? null : panel);
  const markNotificationsRead = ids => setReadNotificationIds(current => { const next = [...new Set([...current, ...ids])]; window.localStorage.setItem('gifting-factory-read-notifications', JSON.stringify(next)); return next; });
  const saveOrderNotes = async (order) => {
    const draft = orderDrafts[order.id] || {};
    const adminNote = draft.adminNote ?? order.adminNote ?? '';
    if (order.source === 'supabase') {
      if (!supabase) throw new Error('Shared order connection is unavailable.');
      const { data, error } = await supabase.from('orders').update({ admin_note: adminNote }).eq('id', order.id).select('id').single();
      if (error || !data) throw new Error('Could not save the shared order. Check your connection and staff access, then retry.');
      setAdminData(current => ({ ...current, orders: current.orders.map(item => item.id === order.id ? { ...item, adminNote } : item) }));
    } else {
      updateAdminCollection('orders', orders => orders.map(item => item.id === order.id ? { ...item, adminNote } : item));
    }
    setSavedOrderId(order.id);
    window.setTimeout(() => setSavedOrderId(null), 1800);
  };

  return <main className={`admin-foundation ${railExpanded ? 'has-expanded-rail' : ''}`}>
    <AdminRail
      railExpanded={railExpanded}
      setRailExpanded={setRailExpanded}
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      activeNav={activeNav}
      selectNav={selectNav}
      navItems={NAV_ITEMS}
    />

    <section className="admin-foundation__workspace">
      <AdminTopbar
        description={page.subtitle}
        activeNav={activeNav}
        setMobileOpen={setMobileOpen}
        utilityPanel={utilityPanel}
        toggleUtility={toggleUtility}
        setUtilityPanel={setUtilityPanel}
        notificationCount={notificationCount}
        notificationSound={notificationSound}
        setNotificationSound={setNotificationSound}
        notifications={notifications}
        readNotificationIds={readNotificationIds}
        markNotificationsRead={markNotificationsRead}
        openOrder={openOrder}
        selectNav={selectNav}
        setSelectedItem={setSelectedItem}
        staffIdentity={staffIdentity}
        setActiveTabs={setActiveTabs}
      />

      <section className="admin-file" style={{ '--active-tab': tabIndex }}>
        <nav className="admin-foundation__tabs" role="tablist" aria-label={`${activeNav} sections`}>
          {tabs.map(([label, , Icon], index) => <button role="tab" id={`admin-tab-${activeNav}-${index}`} aria-controls="admin-active-panel" tabIndex={activeTab === label ? 0 : -1} key={label} className={activeTab === label ? 'is-active' : ''} aria-selected={activeTab === label} onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; selectTab(tabs[nextIndex][0]); event.currentTarget.parentElement.children[nextIndex]?.focus(); }} onClick={() => selectTab(label)}><span className="admin-foundation__tab-icon"><Icon size={16} strokeWidth={1.7} /></span><span>{label}</span></button>)}
        </nav>
        <section id="admin-active-panel" role="tabpanel" aria-labelledby={`admin-tab-${activeNav}-${Math.max(0, tabIndex)}`} key={`${activeNav}-${activeTab}`} className="admin-foundation__canvas" aria-label={`${activeTab} workspace`}>
          {/* Overview and operational workspaces share navigation; gallery controls retain their existing implementation. */}
          {activeNav === 'Overview' ? <OverviewPage activeTab={activeTab} adminData={adminData} dataStatus={overviewDataStatus} /> : !['Gallery', 'Orders'].includes(activeNav) ? <WorkspacePages staffIdentity={staffIdentity} activeNav={activeNav} activeTab={activeTab} adminData={adminData} setAdminData={setAdminData} /> : activeNav === 'Orders' ? (
            <OrdersPage
              activeTab={activeTab}
              filteredOrders={filteredOrders}
              orderQuery={orderQuery}
              setOrderQuery={setOrderQuery}
              selectedOrderIds={selectedOrderIds}
              setSelectedOrderIds={setSelectedOrderIds}
              expandedOrderIds={expandedOrderIds}
              setExpandedOrderIds={setExpandedOrderIds}
              deleteOrderIds={deleteOrderIds}
              setDeleteOrderIds={setDeleteOrderIds}
              orderDrafts={orderDrafts}
              setOrderDrafts={setOrderDrafts}
              savedOrderId={savedOrderId}
              saveOrderNotes={saveOrderNotes}
              paidOrders={paidOrders}
              activeOrders={activeOrders}
              adminData={adminData}
              setManualOrderOpen={setManualOrderOpen}
            />
          ) : (<section className="admin-gallery-manager"><label><input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith('image/')) { setGalleryMessage('Choose a PNG, JPG or WebP image.'); return; } if (file.size > 2 * 1024 * 1024) { setGalleryMessage('Image is too large. Choose a file under 2 MB for this browser preview.'); return; } const reader = new FileReader(); reader.onerror = () => setGalleryMessage('The image could not be read.'); reader.onload = () => { addAdminRecord('gallery', { src: reader.result, label: file.name.replace(/\.[^.]+$/, ''), visible: true }); setGalleryMessage('Image uploaded and published.'); }; reader.readAsDataURL(file); }} /><FileImage size={18} /><span>Upload gallery image</span></label>{galleryMessage && <p className="gallery-message" role="status">{galleryMessage}</p>}{adminData.gallery.filter(image => activeTab === 'Published' ? image.visible : activeTab === 'Hidden' ? !image.visible : Boolean(image.createdAt)).map(image => <article key={image.id}><img src={image.src} alt={image.label} /><label>Image label<input aria-label={`Label for ${image.label}`} defaultValue={image.label} onBlur={event => { const label = event.target.value.trim(); if (label) updateAdminCollection('gallery', items => items.map(item => item.id === image.id ? { ...item, label } : item)); }} /></label><div><button aria-label={`Move ${image.label} earlier`} onClick={() => updateAdminCollection('gallery', items => { const index = items.findIndex(item => item.id === image.id); if (index < 1) return items; const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>↑</button><button aria-label={`Move ${image.label} later`} onClick={() => updateAdminCollection('gallery', items => { const index = items.findIndex(item => item.id === image.id); if (index < 0 || index === items.length - 1) return items; const next = [...items]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; return next; })}>↓</button><button onClick={() => updateAdminCollection('gallery', items => items.map(item => item.id === image.id ? { ...item, visible: !item.visible } : item))}>{image.visible ? 'Hide' : 'Publish'}</button><button className="is-danger" onClick={() => setPendingDelete({ collection: 'gallery', id: image.id, title: image.label, detail: 'This removes the image from Admin and the public gallery.' })}>Delete</button></div></article>)}</section>)}
        </section>
      </section>
    </section>
    <DetailFlyoutPanel
      selectedItem={selectedItem}
      setSelectedItem={setSelectedItem}
      activeNav={activeNav}
      openOrder={openOrder}
      setReviews={setReviews}
      setDeliveries={setDeliveries}
    />
    <ProductModal
      productFormOpen={productFormOpen}
      setProductFormOpen={setProductFormOpen}
      editingProduct={editingProduct}
      setEditingProduct={setEditingProduct}
      imagePreview={imagePreview}
      setImagePreview={setImagePreview}
      secondaryImagePreview={secondaryImagePreview}
      setSecondaryImagePreview={setSecondaryImagePreview}
    />
    <CareerModal
      careerFormOpen={careerFormOpen}
      setCareerFormOpen={setCareerFormOpen}
    />
    <ConfirmDeleteModal
      isOpen={deleteOrderIds.length > 0}
      title={`Delete ${deleteOrderIds.length === 1 ? 'this order' : `${deleteOrderIds.length} orders`}?`}
      badgeText="Permanent action"
      detail="The selected order records and their tracking history will be removed from this browser."
      codeText={deleteOrderIds.map(id => adminData.orders.find(order => order.id === id)?.tracking).filter(Boolean).join(', ')}
      onCancel={() => setDeleteOrderIds([])}
      onConfirm={() => {
        updateAdminCollection('orders', orders => orders.filter(order => !deleteOrderIds.includes(order.id)));
        setSelectedOrderIds([]);
        setExpandedOrderIds([]);
        setDeleteOrderIds([]);
      }}
    />
    {manualOrderOpen && <ManualOrderModal onClose={() => setManualOrderOpen(false)} />}
    {staffCartOpen && <><button className="admin-detail-scrim" onClick={() => setStaffCartOpen(false)} aria-label="Close staff cart" /><aside className="admin-detail-panel product-form-panel" aria-label="Staff cart"><button onClick={() => setStaffCartOpen(false)} aria-label="Close staff cart"><X size={17} /></button><small>Assisted ordering</small><h2>Staff cart</h2>{staffCart.length ? <form onSubmit={event => { event.preventDefault(); const form = new FormData(event.currentTarget); const currentProducts = readAdminData().products; const invalid = staffCart.find(item => !cataloguePrice(item.price) || item.qty > Number(currentProducts.find(product => product.id === item.id)?.stock || 0)); if (invalid) { setStaffCartMessage(`${invalid.name} has an invalid price or insufficient stock. Refresh its catalogue record before ordering.`); return; } const seed = Date.now().toString().slice(-6); const items = staffCart.map(item => ({ id: item.id, name: item.name, qty: item.qty, price: cataloguePrice(item.price) })); const total = items.reduce((sum, item) => sum + item.price * item.qty, 0); addAdminRecord('orders', { tracking: `GF-${seed}`, code: `STAFF-${seed}`, customer: form.get('customer'), phone: form.get('phone'), recipient: form.get('recipient') || form.get('customer'), delivery: form.get('delivery'), customerNote: form.get('note'), paymentMethod: form.get('paymentMethod'), paymentStatus: 'pending', items, total, status: 'pending_payment', staffOrder: true }); updateAdminCollection('products', products => products.map(product => { const ordered = items.find(item => item.id === product.id); return ordered ? { ...product, stock: Math.max(0, Number(product.stock) - ordered.qty) } : product; })); setStaffCart([]); setStaffCartMessage(''); setStaffCartOpen(false); setActiveTabs(current => ({ ...current, Orders: 'All orders' })); selectNav('Orders'); }}><div className="staff-cart-lines">{staffCart.map(item => <article key={item.id}><img src={item.image} alt={item.name} /><span><strong>{item.name}</strong><small>{item.price} · Qty {item.qty} of {item.stock}</small></span><button type="button" aria-label={`Reduce ${item.name}`} onClick={() => setStaffCart(items => items.map(entry => entry.id === item.id ? { ...entry, qty: Math.max(1, entry.qty - 1) } : entry))}>−</button><button type="button" aria-label={`Increase ${item.name}`} disabled={item.qty >= Number(item.stock)} onClick={() => setStaffCart(items => items.map(entry => entry.id === item.id ? { ...entry, qty: Math.min(Number(entry.stock), entry.qty + 1) } : entry))}>+</button><button type="button" className="is-danger" onClick={() => setStaffCart(items => items.filter(entry => entry.id !== item.id))}>Remove</button></article>)}</div><div className="staff-cart-total"><span>Order total</span><strong>GHS {staffCart.reduce((sum, item) => sum + cataloguePrice(item.price) * item.qty, 0).toLocaleString()}</strong></div>{staffCartMessage && <p className="staff-cart-message" role="alert">{staffCartMessage}</p>}<label>Customer name<input name="customer" required /></label><div><label>Phone<input name="phone" required /></label><label>Recipient<input name="recipient" /></label></div><label>Delivery location<input name="delivery" required /></label><label>Payment method<select name="paymentMethod"><option>Mobile Money</option><option>Card</option><option>Bank transfer</option><option>Pay on delivery</option></select></label><label>Order note<textarea name="note" /></label><button type="submit" disabled={staffCart.some(item => !cataloguePrice(item.price))}>Create pending order</button></form> : <div className="admin-empty-state"><ShoppingBag size={22} /><strong>Your staff cart is empty</strong><p>Add products from the shop catalogue.</p></div>}</aside></>}
    <ReviewModal
      reviewFormOpen={reviewFormOpen}
      setReviewFormOpen={setReviewFormOpen}
      editingReview={editingReview}
      setEditingReview={setEditingReview}
    />
    <CollectionModal
      collectionFormOpen={collectionFormOpen}
      setCollectionFormOpen={setCollectionFormOpen}
      products={products}
    />
    <ConfirmDeleteModal
      isOpen={selectedItem?.type === 'delete-collection'}
      title={selectedItem?.title || ''}
      badgeText={selectedItem?.status || 'Permanent action'}
      detail={selectedItem?.detail || ''}
      confirmButtonText="Delete collection"
      dialogClassName="admin-confirm-dialog collection-delete-dialog"
      ariaLabel={selectedItem?.title || 'Delete collection'}
      onCancel={() => setSelectedItem(null)}
      onConfirm={() => {
        if (selectedItem?.collection?.id) {
          updateAdminCollection('collections', items => items.filter(item => item.id !== selectedItem.collection.id));
        }
        setSelectedItem(null);
      }}
    />
    <ConfirmDeleteModal
      isOpen={Boolean(pendingDelete)}
      title={pendingDelete ? `Delete ${pendingDelete.title}?` : ''}
      badgeText="Permanent action"
      detail={pendingDelete?.detail}
      ariaLabel={pendingDelete ? `Delete ${pendingDelete.title}` : ''}
      onCancel={() => setPendingDelete(null)}
      onConfirm={() => {
        if (pendingDelete) {
          updateAdminCollection(pendingDelete.collection, items => items.filter(item => item.id !== pendingDelete.id));
          if (pendingDelete.collection === 'products') {
            updateAdminCollection('collections', items => items.map(collection => ({ ...collection, productIds: collection.productIds.filter(id => id !== pendingDelete.id) })));
          }
          setPendingDelete(null);
        }
      }}
    />
  </main>;
}
