import DataResetPanel from '../components/DataResetPanel';
import { useState } from 'react';
import RecordWorkspace, { RecordEditor } from '../components/RecordWorkspace';
import PrivateAttachment from '../components/PrivateAttachment';
import { useStaffCollection } from '../hooks/useStaffCollection';
import { readAdminData, writeAdminData } from '../api/adminStore';
import { saveBrowserRecord, validateProductImage } from '../utils/workspaceData';
import { buildOverview } from '../utils/overview';
import { ORDER_LABELS, cataloguePrice } from '../utils/adminMappers';
import { supabase } from '../../config/supabase';
import { logoutToLogin } from '../utils/logout';
const money = value => `GHS ${Number(value || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label = value => String(value || '—').replaceAll('_', ' ');
const column = (name, key, formatter) => ({ label: name, value: record => formatter ? formatter(record[key]) : record[key] });
const field = (key, name, type = 'text', extra = {}) => ({ key, label: name, type, ...extra });
const statusField = options => ({ key: 'status', label: 'Status', options });
const localSave = collection => async (record, values) => saveBrowserRecord(collection, record, values);
const facts = (record, keys) => <dl className="record-facts">{keys.map(([name, key]) => <div key={key}><dt>{name}</dt><dd>{typeof record[key] === 'object' ? JSON.stringify(record[key], null, 2) : String(record[key] ?? '—')}</dd></div>)}</dl>;

export function RequestsWorkspace({ activeTab }) {
  const remote = useStaffCollection('customer_requests');
  const records = remote.records.filter(record => activeTab === 'Quote needed' ? ['new', 'quote_needed'].includes(record.status) : activeTab === 'Approved' ? record.status === 'approved' : true);
  return <RecordWorkspace title="Customer requests" subtitle="Read the brief, prepare a quote and keep the customer’s request moving." source="Shared Supabase records · Staff access required" records={records} loading={remote.loading} error={remote.error} onRetry={remote.reload} columns={[column('Reference', 'reference'), column('Customer', 'customer_name'), column('Service', 'service'), column('Status', 'status', label)]} fields={[statusField(['new','quote_needed','approved','closed']),field('confirmed_quote','Confirmed quote (GHS)','number',{min:0,step:'0.01'}),field('admin_note','Admin note','textarea',{hint:'May be visible in customer tracking.'})]} onSave={remote.save} renderDetails={record => <>{facts(record,[['Customer','customer_name'],['Email','email'],['Phone','phone'],['Occasion','occasion'],['Preferred date','preferred_date'],['Quantity','quantity'],['Selections','selections'],['Customer brief','notes'],['Card message','card_message']])}<PrivateAttachment bucket="request-uploads" path={record.inspiration_path} label="inspiration image" /></>} />;
}

export function CareersWorkspace({ activeTab }) {
  const roles = ['Open roles','Drafts'].includes(activeTab);
  return roles ? <RolesWorkspace activeTab={activeTab} /> : <ApplicationsWorkspace activeTab={activeTab} />;
}
function RolesWorkspace({ activeTab }) {
  const remote = useStaffCollection('careers');
  return <RecordWorkspace title="Career openings" subtitle="Create a role and manage its availability." source="Shared Supabase records" records={remote.records.filter(record => activeTab === 'Drafts' ? record.status === 'draft' : record.status !== 'draft')} loading={remote.loading} error={remote.error} onRetry={remote.reload} canCreate={!remote.error && !remote.loading ? 'role' : false} onSave={remote.save} columns={[column('Role','title'),column('Location','location'),column('Employment','employment_type'),column('Status','status',label)]} fields={[field('title','Role title','text',{required:true}),field('location','Location'),field('employment_type','Employment type'),field('description','Role description','textarea',{required:true}),statusField(['draft','open','paused','closed'])]} />;
}
function ApplicationsWorkspace({ activeTab }) {
  const remote = useStaffCollection('career_applications');
  const records = remote.records.filter(record => activeTab === 'Shortlist' ? record.status === 'shortlisted' : activeTab === 'Closed' ? ['rejected','hired'].includes(record.status) : !['rejected','hired'].includes(record.status));
  return <RecordWorkspace title="Applications" subtitle="Review experience, portfolios and private application files." source="Shared Supabase records · CVs remain private" records={records} loading={remote.loading} error={remote.error} onRetry={remote.reload} onSave={remote.save} columns={[column('Applicant','full_name'),column('Email','email'),column('Location','location'),column('Status','status',label)]} fields={[statusField(['new','reviewing','shortlisted','rejected','hired'])]} renderDetails={record => <>{facts(record,[['Email','email'],['Phone','phone'],['Location','location'],['Portfolio','portfolio_url'],['Earliest start','earliest_start_date'],['Experience','experience'],['Motivation','motivation']])}<PrivateAttachment bucket="career-files" path={record.resume_path} label="CV" /></>} />;
}

export function ProductsWorkspace({ activeTab, adminData }) {
  const records = adminData.products.filter(product => activeTab === 'Hidden' ? !product.visible : activeTab === 'Low stock' ? Number(product.stock) < 10 : true);
  return <RecordWorkspace title="Product catalogue" subtitle="Keep pricing, stock and product information in one place." records={records.map(record => ({ ...record, price: cataloguePrice(record.price) }))} source="Browser catalogue · Saved edits affect this browser’s storefront" canCreate="product" columns={[column('Product','name'),column('Category','category'),column('Price','price',money),column('Stock','stock'),column('Visibility','visible',value => value ? 'Published' : 'Hidden')]} fields={[field('name','Product name','text',{required:true}),field('category','Category','text',{required:true}),field('price','Price (GHS)','number',{required:true,min:0,step:'0.01'}),field('stock','Stock quantity','number',{required:true,min:0}),field('image','Main image URL or /assets path','text',{hint:'Use an existing image path or an HTTPS image URL.'}),field('description','Description','textarea'),field('visible','Visible on storefront','checkbox'),field('featured','Featured product','checkbox')]} onSave={async (record,values) => { validateProductImage(values.image); await localSave('products')(record,{...values,price:money(values.price)}); }} renderDetails={record => record.id ? <><p>Current price: {money(record.price)}</p>{record.image && <img className="record-product-image" src={record.image} alt={record.name} />}</> : <p>New products start hidden until you choose to publish them.</p>} />;
}

export function ShopWorkspace({ adminData, activeTab }) {
  if (activeTab === 'Collections') return <RecordWorkspace title="Collections" subtitle="Group products into useful collections for your customers." source="Browser catalogue · Storefront integration varies by collection" records={adminData.collections} canCreate="collection" columns={[column('Collection','title'),column('Status','status'),column('Products','productIds',value => value?.length || 0)]} fields={[field('title','Collection name','text',{required:true}),field('description','Description','textarea'),statusField(['draft','live']),field('productIds','Products in this collection','checklist',{choices:adminData.products.map(product=>({id:product.id,name:product.name}))})]} onSave={async (record,values)=>{ const ids=values.productIds; if(ids.some(id=>!adminData.products.some(product=>product.id===id))) throw new Error('One or more product IDs do not exist.'); await localSave('collections')(record,{...values,productIds:[...new Set(ids)]}); }} />;
  const records = adminData.products.filter(product=>activeTab==='Featured'?product.featured && product.visible:activeTab==='Drafts'?!product.visible:true);
  return <RecordWorkspace title="Shop merchandising" subtitle="Choose what is featured and visible in your browser storefront." records={records} source="Browser catalogue" columns={[column('Product','name'),column('Category','category'),column('Featured','featured',value=>value?'Yes':'No'),column('Visible','visible',value=>value?'Yes':'No')]} fields={[field('featured','Feature this product','checkbox'),field('visible','Visible on storefront','checkbox')]} onSave={localSave('products')} />;
}

export function CustomersWorkspace({ adminData, activeTab }) {
  const orders = buildOverview(adminData).orders;
  const records = Object.values(orders.reduce((result,order)=>{ const id=order.phone || order.customerEmail || order.customer || order.id; result[id] ||= {id,name:order.customer,phone:order.phone,email:order.customerEmail,orders:[],total:0};result[id].orders.push(order); if(order.paymentStatus==='paid')result[id].total+=Number(order.total||0);return result;},{})).filter(customer=>activeTab!=='Returning'||customer.orders.length>1);
  const recipients = orders.map(order=>({id:order.id,name:order.recipient||order.customer,phone:order.phone,email:'',orders:[order],total:0}));
  return <RecordWorkspace title={activeTab==='Recipients'?'Recipients':'Customers'} subtitle="Contact details and purchase history from available orders." source={adminData.ordersSource==='supabase'?'Derived from shared orders':'Derived from browser orders · Demo orders excluded'} records={activeTab==='Recipients'?recipients:records} columns={[column('Name','name'),column('Phone','phone'),column('Orders','orders',value=>value.length),column('Paid total','total',money)]} renderDetails={record=><>{facts(record,[['Name','name'],['Phone','phone'],['Email','email']])}<h3>Order history</h3>{record.orders.map(order=><p key={order.id}>{order.tracking} · {ORDER_LABELS[order.status]||order.status} · {money(order.total)}<br/>{order.delivery}</p>)}</>} />;
}

export function ReviewsWorkspace({ adminData, activeTab }) {
  return <RecordWorkspace title="Review moderation" subtitle="Read feedback before choosing whether to publish it." source="Browser reviews · Saved publication changes affect the browser storefront" records={(adminData.reviews||[]).filter(review=>review.status===activeTab)} columns={[column('Customer','customer'),column('Product','product'),column('Rating','rating',value=>`${value} / 5`),column('Status','status')]} fields={[statusField(['Pending','Published','Flagged'])]} onSave={localSave('reviews')} renderDetails={record=><blockquote className="record-review">{record.text}</blockquote>} />;
}

export function DeliveryWorkspace({ adminData, activeTab, setAdminData }) {
  const orders=buildOverview(adminData).orders.filter(order=>activeTab==='Completed'?order.status==='completed':activeTab==='Out today'?order.status==='delivery':['ready','delivery'].includes(order.status));
  return <RecordWorkspace title="Delivery desk" subtitle="Review destinations and keep fulfilment status up to date." source={adminData.ordersSource==='supabase'?'Shared orders':'Browser orders · Demo orders excluded'} records={orders} columns={[column('Order','tracking'),{label:'Recipient',value:record=>record.recipient||record.customer},column('Destination','delivery'),column('Status','status',value=>ORDER_LABELS[value]||value)]} fields={[statusField(['ready','delivery','completed']),field('estimatedDelivery','Delivery estimate','datetime-local'),field('adminNote','Tracking note','textarea',{hint:'This note may be visible to the customer.'})]} onSave={async (record,values)=>{ if(record.source==='supabase'){ const {error}=await supabase.from('orders').update({fulfillment_status:values.status,estimated_delivery:values.estimatedDelivery?new Date(values.estimatedDelivery).toISOString():null,admin_note:values.adminNote}).eq('id',record.id).select('id').single();if(error)throw error;setAdminData(current=>({...current,orders:current.orders.map(order=>order.id===record.id?{...order,...values}:order)})); }else await localSave('orders')(record,values); }} renderDetails={record=>facts(record,[['Recipient','recipient'],['Phone','phone'],['Address','delivery'],['Customer note','customerNote']])} />;
}

export function InsightsWorkspace({ adminData, activeTab }) {
 const data=buildOverview(adminData,'Activity'); const paid=data.orders.filter(order=>order.paymentStatus==='paid'); const revenue=paid.reduce((sum,order)=>sum+Number(order.total||0),0);
 const products=Object.values(paid.reduce((result,order)=>{for(const item of order.items||[]){ const id=item.id||item.name;result[id]||={id,name:item.name,quantity:0,revenue:0}; result[id].quantity+=Number(item.qty||0);result[id].revenue+=Number(item.qty||0)*Number(item.price||0);}return result;},{})).sort((a,b)=>b.revenue-a.revenue);
 const records=activeTab==='Products'?products:activeTab==='Delivery'?['ready','delivery','completed'].map(status=>({id:status,name:ORDER_LABELS[status],quantity:data.orders.filter(order=>order.status===status).length,revenue:null})): [{id:'paid',name:'Confirmed paid orders',quantity:paid.length,revenue},{id:'average',name:'Average paid order value',quantity:paid.length,revenue:paid.length?revenue/paid.length:0},{id:'open',name:'Open orders',quantity:data.pending.length,revenue:null}];
 return <RecordWorkspace title="Store insights" subtitle="A clear view of available order data, without fabricated growth figures." source="All available orders · Demo orders excluded · Item revenue excludes delivery fees" records={records} columns={[column(activeTab==='Products'?'Product':'Metric','name'),column('Count','quantity'),column('Value','revenue',value=>value===null?'—':money(value))]} />;
}

export function ContentWorkspace({ adminData, activeTab }) {
 const [edit,setEdit]=useState(false); const [message,setMessage]=useState('');
 const keys=activeTab==='Policies'?[['deliveryPolicy','Delivery policy'],['orderPolicy','Order policy']]:activeTab==='Announcements'?[['announcement','Announcement']]:[['homepageFeature','Homepage feature']];
 return <div className="record-workspace"><header className="workspace-heading"><div><h2>{activeTab}</h2><p>Review the current copy and save deliberate changes.</p></div><button className="admin-primary" onClick={()=>setEdit(true)}>Edit copy</button></header><p className="workspace-source">Browser content · Publishing integration must be verified before launch</p>{message&&<p role="status">{message}</p>}<div className="workspace-copy">{keys.map(([key,name])=><section key={key}><h3>{name}</h3><p>{adminData.content[key]||'No content yet.'}</p></section>)}</div>{edit&&<RecordEditor title={`Edit ${activeTab.toLowerCase()}`} record={adminData.content} fields={keys.map(([key,name])=>field(key,name,'textarea',{required:true}))} onClose={()=>setEdit(false)} onSave={async values=>{const current=readAdminData();writeAdminData({...current,content:{...current.content,...values}});setMessage('Content saved in this browser.');}}/>}</div>;
}

export function SettingsWorkspace({ adminData, activeTab, staffIdentity }) {
 const [edit,setEdit]=useState(false); const [message,setMessage]=useState('');
 const fields=activeTab==='Team'?[field('adminName','Display name','text',{required:true}),field('adminEmail','Display email','email',{required:true})]:[field('businessName','Business name','text',{required:true}),field('supportPhone','Support phone'),field('supportEmail','Support email','email'),field('dispatchCity','Dispatch city'),field('deliveryNote','Delivery note','textarea')];
 if(activeTab==='Security')return <div className="record-workspace"><header className="workspace-heading"><div><h2>Account security</h2><p>Manage your staff session and access.</p></div></header>{staffIdentity ? <><dl className="record-facts"><div><dt>Email</dt><dd>{staffIdentity.email}</dd></div><div><dt>Role</dt><dd>{staffIdentity.profile.role}</dd></div><div><dt>Access</dt><dd>Active staff member</dd></div></dl><button className="admin-primary" onClick={async()=>{try { await logoutToLogin(); } catch { setMessage('Could not sign out. Please try again.'); }}}>Sign out</button></> : <section className="workspace-copy"><h3>Local preview</h3><p>You are viewing browser-backed data. Staff sign-in is required for shared records.</p><a className="account-signin" href="/admin">Open staff sign-in</a></section>}<p role="status">{message}</p><p className="workspace-source">Contact the store owner for password resets and role changes. Display profile edits never grant access.</p><DataResetPanel staffIdentity={staffIdentity}/></div>;
 return <div className="record-workspace"><header className="workspace-heading"><div><h2>{activeTab==='Team'?'Administrator profile':'Store preferences'}</h2><p>{activeTab==='Team'?'Update the displayed profile for this browser.':'Business contact and delivery information.'}</p></div><button className="admin-primary" onClick={()=>setEdit(true)}>Edit settings</button></header><p className="workspace-source">Browser settings · Team access is managed in Supabase</p>{message&&<p role="status">{message}</p>}{facts(adminData.settings,fields.map(item=>[item.label,item.key]))}{edit&&<RecordEditor title="Edit settings" record={adminData.settings} fields={fields} onClose={()=>setEdit(false)} onSave={async values=>{const current=readAdminData();writeAdminData({...current,settings:{...current.settings,...values}});setMessage('Settings saved.');}}/>}</div>;
}

export default function WorkspacePages(props) {
 const pages={Requests:RequestsWorkspace,Products:ProductsWorkspace,Shop:ShopWorkspace,Customers:CustomersWorkspace,Reviews:ReviewsWorkspace,Delivery:DeliveryWorkspace,Careers:CareersWorkspace,Insights:InsightsWorkspace,Content:ContentWorkspace,Settings:SettingsWorkspace};
 const Page=pages[props.activeNav];
 return Page?<Page {...props}/>:null;
}
