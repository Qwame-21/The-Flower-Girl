import { RecordEditor } from '../components/RecordWorkspace';
import { addAdminRecord } from '../api/adminStore';
export default function ManualOrderModal({ onClose }) {
 const fields=[{key:'customer',label:'Customer name',required:true},{key:'phone',label:'Phone',required:true},{key:'recipient',label:'Recipient name'},{key:'delivery',label:'Delivery address',required:true},{key:'item',label:'Gift or service',required:true},{key:'quantity',label:'Quantity',type:'number',min:1,required:true,default:1},{key:'total',label:'Total (GHS)',type:'number',min:0,step:'0.01',required:true},{key:'paymentMethod',label:'Payment method',options:['Mobile Money','Card','Bank transfer','Pay on delivery']},{key:'customerNote',label:'Customer note',type:'textarea'}];
 return <RecordEditor title="Create manual order" fields={fields} onClose={onClose} onSave={async values=>{
  const tracking=`GF-${crypto.randomUUID().slice(0,8).toUpperCase()}`;
  addAdminRecord('orders',{...values,tracking,code:tracking,recipient:values.recipient||values.customer,items:[{name:values.item,qty:values.quantity,price:values.total/values.quantity}],paymentStatus:'pending',status:'pending_payment',staffOrder:true});
 }}><p className="workspace-source">This creates a pending order in this browser. It does not charge the customer or confirm payment.</p></RecordEditor>;
}
