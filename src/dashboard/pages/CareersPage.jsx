// src/pages/CareersPage.jsx
// Ported 1-for-1 verbatim from admin-monolith.html renderCareersView() (lines 24881–25147)
// Storage key: 'xa12-careers-data-v1'

import { useState } from 'react';
import CustomDropdown from '../components/shared/CustomDropdown';

const CAREERS_KEY = 'xa12-careers-data-v1';

// SVG Icons matching monolith
const SVG_ICONS = {
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  more: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" />
    </svg>
  ),
  external: (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
};

// ── Initial Seed Data ── (Monolith lines 22614–22615)
const SEED_POSTINGS = [
  {
    id: 'JOB-01',
    title: 'Senior Floral Designer',
    location: 'Labone Flagship',
    employment_type: 'Full-Time',
    description: 'Lead bridal arrangement and bespoke hamper floral styling.',
    status: 'open'
  },
  {
    id: 'JOB-02',
    title: 'Logistics & Dispatch Coordinator',
    location: 'East Legon Hub',
    employment_type: 'Full-Time',
    description: 'Coordinate rider assignments and same-day express deliveries.',
    status: 'open'
  }
];

const SEED_APPLICANTS = [
  {
    id: 'APP-01',
    name: 'Akua Mansa',
    job: 'Senior Floral Designer',
    email: 'akua.m@gmail.com',
    phone: '+233 24 111 2233',
    location: 'Accra',
    date: '24 Sep 2026',
    portfolio_url: 'https://instagram.com',
    resume: 'akua-mansa-cv.pdf',
    status: 'reviewing',
    rating: 4
  },
  {
    id: 'APP-02',
    name: 'Kofi Mensah',
    job: 'Logistics & Dispatch Coordinator',
    email: 'kmensah@yahoo.com',
    phone: '+233 20 888 9900',
    location: 'Tema',
    date: '21 Sep 2026',
    portfolio_url: '',
    resume: 'kofi-mensah-logistics.pdf',
    status: 'new',
    rating: 5
  }
];

function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

// ── Status Helper Functions ── (Monolith lines 24882–24896)
function jobStatusClass(status) {
  return { draft: 'job-draft', open: 'job-open', paused: 'job-paused', closed: 'job-closed' }[status] || 'job-draft';
}
function appStatusClass(status) {
  return { new: 'app-new', reviewing: 'app-reviewing', shortlisted: 'app-shortlisted', rejected: 'app-rejected', hired: 'app-hired' }[status] || 'app-new';
}
function cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

function StarsRating({ n }) {
  const full = Math.round(n || 0);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg
          key={i}
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill={i <= full ? '#b9873a' : 'none'}
          stroke={i <= full ? '#b9873a' : '#cfccc5'}
          strokeWidth="2"
          style={{ flexShrink: 0 }}
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

// Persistence helpers
function loadCareersData() {
  try {
    const raw = localStorage.getItem(CAREERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { postings: SEED_POSTINGS, applicants: SEED_APPLICANTS };
}

function saveCareersData(data) {
  try {
    localStorage.setItem(CAREERS_KEY, JSON.stringify(data));
  } catch {}
}

export default function CareersPage() {
  const [data, setData] = useState(loadCareersData);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', location: '', empType: 'Full-Time', description: '', status: 'open' });
  const [activeJobMenu, setActiveJobMenu] = useState(null);
  const [activeApplicant, setActiveApplicant] = useState(null);

  const saveAndSetData = (newData) => {
    saveCareersData(newData);
    setData(newData);
  };

  // Create Job Posting
  function handleCreateJob() {
    if (!createForm.title.trim()) {
      showToast('Job title is required.');
      return;
    }
    const newJob = {
      id: 'JOB-' + String(data.postings.length + 1).padStart(2, '0'),
      title: createForm.title.trim(),
      location: createForm.location.trim() || 'Accra',
      employment_type: createForm.empType || 'Full-Time',
      description: createForm.description.trim(),
      status: createForm.status || 'open'
    };
    const updated = { ...data, postings: [...data.postings, newJob] };
    saveAndSetData(updated);
    showToast(`"${createForm.title}" posted.`);
    setShowCreateModal(false);
    setCreateForm({ title: '', location: '', empType: 'Full-Time', description: '', status: 'open' });
  }

  // Job status toggle/close
  function handleJobAction(job, action) {
    if (action === 'pause' || action === 'reopen') {
      const newStatus = job.status === 'paused' ? 'open' : 'paused';
      const updatedPostings = data.postings.map(j => j.id === job.id ? { ...j, status: newStatus } : j);
      saveAndSetData({ ...data, postings: updatedPostings });
      showToast(`Posting ${newStatus === 'paused' ? 'paused' : 'reopened'}.`);
    } else if (action === 'close') {
      const updatedPostings = data.postings.map(j => j.id === job.id ? { ...j, status: 'closed' } : j);
      saveAndSetData({ ...data, postings: updatedPostings });
      showToast('Posting closed.');
    }
    setActiveJobMenu(null);
  }

  // Update applicant status
  function handleSaveApplicantStatus(newStatus) {
    if (!activeApplicant) return;
    const updatedApplicants = data.applicants.map(a => a.id === activeApplicant.id ? { ...a, status: newStatus } : a);
    saveAndSetData({ ...data, applicants: updatedApplicants });
    showToast(`${activeApplicant.name} marked ${cap(newStatus)}.`);
    setActiveApplicant(null);
  }

  return (
    <div className="page-container">
      {/* Page Header — Monolith lines 24900–24910 */}
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Careers</h2>
          <p>Manage job postings and candidate applications.</p>
        </div>
        <div className="header-actions">
          <button
            className="xp-pill xp-solid"
            id="createJobBtn"
            type="button"
            onClick={() => setShowCreateModal(true)}
          >
            {SVG_ICONS.plus} Create Job Posting
          </button>
        </div>
      </div>

      {/* Job Postings Section — Monolith lines 24912–24941 */}
      <span className="meta-label" style={{ marginTop: '12px', display: 'block' }}>JOB POSTINGS</span>
      {data.postings.length === 0 ? (
        <div className="careers-empty-state">
          No job postings yet. Create your first posting to start receiving applications.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '16px', margin: '12px 0 28px 0' }}>
          {data.postings.map(job => {
            const applicantCount = data.applicants.filter(a => a.job === job.title).length;
            return (
              <div key={job.id} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative' }} data-job-id={job.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{job.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{job.location} · {job.employment_type}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <span className={`career-status-pill ${jobStatusClass(job.status)}`}>{cap(job.status)}</span>
                    <button
                      type="button"
                      className="btn-icon-action job-more-btn"
                      data-job-id={job.id}
                      title="More options"
                      onClick={() => setActiveJobMenu(job)}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(28,28,27,0.06)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      {SVG_ICONS.more}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {applicantCount} applicant{applicantCount !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Candidate Applications Table Section — Monolith lines 24943–24993 */}
      <span className="meta-label" style={{ display: 'block', marginBottom: '12px' }}>CANDIDATE APPLICATIONS</span>
      {data.applicants.length === 0 ? (
        <div className="careers-empty-state">
          No applications yet. Applications from the storefront will appear here.
        </div>
      ) : (
        <div className="table-wrapper" style={{ border: '1px solid rgba(28,28,27,0.12)', borderRadius: '16px', overflow: 'auto', background: 'var(--card-bg,#f7f7f3)' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(28,28,27,0.12)', background: 'rgba(28,28,27,0.03)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Candidate</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Position</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Contact</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Location</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Applied</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Links</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {data.applicants.map(app => (
                <tr
                  key={app.id}
                  className="applicant-row"
                  data-app-id={app.id}
                  onClick={() => setActiveApplicant(app)}
                  style={{ borderBottom: '1px solid rgba(28,28,27,0.06)', cursor: 'pointer' }}
                >
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{app.name}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{app.job}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{app.email}<br />{app.phone}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{app.location || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{app.date}</td>
                  <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {app.portfolio_url && (
                        <a
                          href={app.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="xp-pill"
                          style={{ textDecoration: 'none', height: '26px', padding: '0 10px', fontSize: '10px', gap: '4px', display: 'inline-flex', alignItems: 'center' }}
                        >
                          Portfolio {SVG_ICONS.external}
                        </a>
                      )}
                      {app.resume && (
                        <button
                          type="button"
                          className="xp-pill view-cv-btn"
                          data-cv={app.resume}
                          onClick={() => showToast(`Opening CV: ${app.resume}`)}
                          style={{ height: '26px', padding: '0 10px', fontSize: '10px' }}
                        >
                          CV
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span className={`career-status-pill ${appStatusClass(app.status)}`}>{cap(app.status)}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StarsRating n={app.rating || 0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Job Posting Modal — Monolith lines 24996–25027 */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '440px', width: '90%' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>Create Job Posting</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px 0' }}>Add a new open position.</p>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Job Title</label>
              <input type="text" className="field-input" placeholder="e.g. Senior Floral Designer" value={createForm.title} onChange={e => setCreateForm({ ...createForm, title: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Location</label>
              <input type="text" className="field-input" placeholder="e.g. Labone Flagship" value={createForm.location} onChange={e => setCreateForm({ ...createForm, location: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Employment Type</label>
              <input type="text" className="field-input" placeholder="e.g. Full-Time" value={createForm.empType} onChange={e => setCreateForm({ ...createForm, empType: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '4px' }}>Description</label>
              <textarea rows={3} className="field-textarea" placeholder="Key responsibilities..." value={createForm.description} onChange={e => setCreateForm({ ...createForm, description: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid rgba(26,26,26,0.15)', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" className="xp-pill" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="button" className="xp-pill xp-solid" onClick={handleCreateJob}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Job Actions Modal — Monolith lines 25030–25105 */}
      {activeJobMenu && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '90%' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>Job: {activeJobMenu.title}</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px 0' }}>Choose an action.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                className="xp-pill"
                onClick={() => handleJobAction(activeJobMenu, activeJobMenu.status === 'paused' ? 'reopen' : 'pause')}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {activeJobMenu.status === 'paused' ? 'Reopen Posting' : 'Pause Posting'}
              </button>
              <button
                type="button"
                className="xp-pill"
                onClick={() => handleJobAction(activeJobMenu, 'close')}
                style={{ width: '100%', justifyContent: 'center', color: '#dc2626' }}
              >
                Close Posting
              </button>
              <button
                type="button"
                className="xp-pill"
                onClick={() => setActiveJobMenu(null)}
                style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Application Status Modal — Monolith lines 25107–25137 */}
      {activeApplicant && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '380px', width: '90%' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 700 }}>{activeApplicant.name}</h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 16px 0' }}>Applied for: {activeApplicant.job}</p>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: '#747471', display: 'block', marginBottom: '6px' }}>Application Status</label>
              <CustomDropdown
                options={[
                  { value: 'new', label: 'New' },
                  { value: 'reviewing', label: 'Reviewing' },
                  { value: 'shortlisted', label: 'Shortlisted' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'hired', label: 'Hired' }
                ]}
                value={activeApplicant.status}
                onChange={handleSaveApplicantStatus}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="xp-pill" onClick={() => setActiveApplicant(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
