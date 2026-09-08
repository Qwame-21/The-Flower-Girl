import { useState } from 'react';
import { supabase } from '../../config/supabase';
export default function PrivateAttachment({ bucket, path, label }) {
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!path) return null;
  return <div className="private-attachment"><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60); if (error) throw error; setLink(data.signedUrl); } catch { setError('Could not access this private file. Check your staff permissions.'); } finally { setBusy(false); } }}>{busy ? 'Preparing file…' : `Get ${label}`}</button>{link && <a href={link} target="_blank" rel="noreferrer">Open {label} (link expires in 60 seconds)</a>}{error && <p role="alert">{error}</p>}</div>;
}
