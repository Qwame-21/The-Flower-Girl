import { useEffect, useRef, useState } from 'react';
import { Search, Plus, X, Inbox, Save } from 'lucide-react';
import { localDateTime } from '../utils/workspaceData';
import FlowArrow from './FlowArrow';

export function RecordEditor({ title, record, fields, onSave, onClose, children, readOnly = false, submitLabel = 'Save changes', busyLabel = 'Saving…' }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef(null);
  useEffect(() => {
    const trigger = document.activeElement;
    dialog.current.showModal();
    return () => trigger?.focus?.();
  }, []);
  const submit = async event => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(fields.map(field => [field.key, field.type === 'checklist' ? form.getAll(field.key) : field.type === 'checkbox' ? form.has(field.key) : field.type === 'number' ? (form.get(field.key) === '' ? null : Number(form.get(field.key))) : String(form.get(field.key) || '').trim()]));
    setBusy(true); setError('');
    try { await onSave(values); onClose(); } catch (failure) { setError(failure.message || 'Could not save. Your entries are still here.'); } finally { setBusy(false); }
  };
  return <dialog ref={dialog} aria-label={title} className="admin-record-dialog" onCancel={event => { if (busy) event.preventDefault(); else onClose(); }}>
    <header><div><small>WORKSPACE DETAILS</small><h2>{title}</h2></div><button disabled={busy} onClick={onClose} aria-label="Close editor"><X size={19} /></button></header>
    <form onSubmit={submit}><div className="admin-record-body">{children}{fields.map(field => field.type === 'checklist' ? <fieldset className="record-checklist" key={field.key}><legend>{field.label}</legend>{field.choices.map(choice => <label key={choice.id}><input type="checkbox" name={field.key} value={choice.id} defaultChecked={record?.[field.key]?.includes(choice.id)} />{choice.name}</label>)}</fieldset> : <label key={field.key} className={field.type === 'checkbox' ? 'record-check' : ''}><span>{field.label}</span>{field.options ? <select name={field.key} defaultValue={record?.[field.key] ?? field.default ?? field.options[0]}>{[...new Set([...field.options, ...(record?.[field.key] ? [record[field.key]] : [])])].map(option => <option key={option} value={option}>{option.replaceAll('_', ' ')}</option>)}</select> : field.type === 'textarea' ? <textarea name={field.key} rows={4} required={field.required} defaultValue={Array.isArray(record?.[field.key]) ? record[field.key].join(', ') : record?.[field.key] || ''} /> : <input name={field.key} type={field.type || 'text'} required={field.required} min={field.min} max={field.max} step={field.step || (field.type === 'number' ? '1' : undefined)} defaultChecked={field.type === 'checkbox' ? Boolean(record?.[field.key]) : undefined} defaultValue={field.type === 'checkbox' ? undefined : field.type === 'datetime-local' ? localDateTime(record?.[field.key]) : record?.[field.key] ?? field.default ?? ''} />}{field.hint && <small>{field.hint}</small>}</label>)}{error && <p className="workspace-error" role="alert">{error}</p>}</div><footer><button type="button" disabled={busy} onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</button>{!readOnly && <button className="admin-primary" disabled={busy} type="submit"><Save size={16} />{busy ? busyLabel : submitLabel}</button>}</footer></form>
  </dialog>;
}

export default function RecordWorkspace({ title, subtitle, records, columns, fields, onSave, canCreate = false, source = 'Browser workspace', children, renderDetails, loading = false, error, onRetry }) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const found = records.filter(record => columns.some(column => String(column.value(record) ?? '').toLowerCase().includes(query.toLowerCase())));
  const pages = Math.max(1, Math.ceil(found.length / 12));
  const current = Math.min(page, pages);
  return <div className="record-workspace"><header className="workspace-heading"><div><h2>{title}</h2><p>{subtitle}</p></div>{canCreate && <button className="admin-primary" onClick={() => setEditing({})}><Plus size={17} />Add {canCreate === true ? 'record' : canCreate}</button>}</header>
    <div className="workspace-source">{source}</div>{children}
    {message && <p role="status" className="workspace-success">{message}</p>}
    <div className="workspace-tools"><label><Search size={18} /><input type="search" aria-label={`Search ${title.toLowerCase()}`} value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder={`Search ${title.toLowerCase()}…`} /></label><span>{found.length} {found.length === 1 ? 'record' : 'records'}</span></div>
    {error ? <div className="workspace-empty" role="alert"><h3>We couldn’t load these records</h3><p>{error}</p>{onRetry && <button onClick={onRetry}>Try again</button>}</div> : loading ? <div className="workspace-empty" role="status">Loading records…</div> : !found.length ? <div className="workspace-empty"><Inbox size={28} /><h3>{query ? 'No matching records' : 'Nothing here yet'}</h3><p>{query ? 'Try a different search.' : 'New records will appear here when available.'}</p>{query && <button onClick={() => setQuery('')}>Clear search</button>}</div> : <><div className="workspace-table"><table><thead><tr>{columns.map(column => <th key={column.label}>{column.label}</th>)}<th><span className="sr-only">Details</span></th></tr></thead><tbody>{found.slice((current - 1) * 12, current * 12).map(record => <tr key={record.id}>{columns.map((column, index) => <td key={column.label} data-label={column.label}>{index === 0 ? <button className="record-title" onClick={() => setEditing(record)}>{column.value(record) || 'Untitled'}</button> : column.value(record) ?? '—'}</td>)}<td><button className="record-open" aria-label={`Open ${columns[0].value(record)}`} onClick={() => setEditing(record)}><FlowArrow /></button></td></tr>)}</tbody></table></div><footer className="workspace-pagination"><span>Page {current} of {pages}</span><button disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</button><button disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button></footer></>}
    {editing && <RecordEditor key={editing.id || 'new'} title={editing.id ? String(columns[0].value(editing) || title) : `New ${title.toLowerCase()}`} record={editing} readOnly={!onSave} fields={fields || []} onClose={() => setEditing(null)} onSave={async values => { if (onSave) await onSave(editing, values); setMessage(onSave ? 'Changes saved.' : ''); }}>
      {renderDetails ? renderDetails(editing) : editing.id && <dl className="record-facts">{columns.map(column => <div key={column.label}><dt>{column.label}</dt><dd>{column.value(editing) || '—'}</dd></div>)}</dl>}
      {!onSave && <p className="workspace-source">Read-only record. Close when finished.</p>}
    </RecordEditor>}
  </div>;
}
