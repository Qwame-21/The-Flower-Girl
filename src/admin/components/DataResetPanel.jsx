import { useState } from 'react';
import { Database, HardDrive } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { RecordEditor } from './RecordWorkspace';
import { clearDatabaseBusinessData, clearLocalBusinessData } from '../utils/resetData';

export default function DataResetPanel({ staffIdentity }) {
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');
  const owner = staffIdentity?.profile.role === 'owner';
  const phrase = target === 'database' ? 'DELETE DATABASE DATA' : 'DELETE LOCAL DATA';
  return <section className="admin-data-reset" aria-labelledby="reset-heading">
    <h3 id="reset-heading">Start fresh</h3><p>Clear business records while keeping gallery images, staff accounts and store preferences.</p>
    <div className="admin-reset-options">
      <article><HardDrive size={21}/><h4>This browser</h4><p>Clear local orders, requests, applications, products, collections, promotions, reviews, roles, copy, cart and wishlist. Shared database records stay intact. A local backup is saved first.</p><button onClick={() => { setMessage(''); setTarget('local'); }}>Clear local data</button></article>
      <article><Database size={21}/><h4>Shared database</h4><p>Clear business records and site copy for everyone, including the storefront catalogue. Gallery, uploaded files, accounts and store preferences stay intact. Requires an owner account and the reset migration.</p><button disabled={!owner || !supabase} onClick={() => { setMessage(''); setTarget('database'); }}>Clear database data</button>{!owner && <small>Only the store owner can reset shared data.</small>}</article>
    </div>
    {message && <p role="status">{message}</p>}
    {target && <RecordEditor submitLabel="Delete selected data" busyLabel="Deleting…" title={target === 'local' ? 'Clear this browser’s data' : 'Clear shared business data'} record={{ confirmation: '' }} fields={[{ key:'confirmation', label:`Type ${phrase} to confirm`, type:'text', required:true }]} onClose={() => setTarget(null)} onSave={async values => {
      if (values.confirmation !== phrase) throw new Error(`Type ${phrase} exactly to continue.`);
      if (target === 'database') await clearDatabaseBusinessData(supabase);
      else clearLocalBusinessData();
      setMessage(target === 'database' ? 'Shared business records cleared. Reloading the dashboard…' : 'Local business records cleared. Reloading the dashboard…');
      window.setTimeout(() => window.location.reload(), 900);
    }}><p>Orders, requests, applications and catalogue records in the selected scope will be deleted. Gallery and staff login are preserved. Database backups require database-owner access to restore.</p></RecordEditor>}
  </section>;
}
