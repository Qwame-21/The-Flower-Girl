// src/pages/CareersPage.jsx
// Rewired to use Supabase careers and career_applications tables

import { useState, useEffect } from 'react';
import {
  listCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  listApplications,
  updateApplicationStatus,
  deleteApplication
} from '../data/careers';

// Toast helper
function showToast(msg) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message: msg } }));
}

export default function CareersPage() {
  const [careers, setCareers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('postings');
  const [confirmDeleteCareerId, setConfirmDeleteCareerId] = useState(null);
  const [confirmDeleteAppId, setConfirmDeleteAppId] = useState(null);

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const [careersData, applicationsData] = await Promise.all([
        listCareers(),
        listApplications()
      ]);
      setCareers(careersData);
      setApplications(applicationsData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCreateCareer = async (careerData) => {
    const result = await createCareer(careerData);
    if (result.success) {
      const updated = await listCareers();
      setCareers(updated);
      showToast('Job posting created');
    } else {
      showToast('Failed to create job posting');
    }
  };

  const handleUpdateCareer = async (id, careerData) => {
    const result = await updateCareer(id, careerData);
    if (result.success) {
      const updated = await listCareers();
      setCareers(updated);
      showToast('Job posting updated');
    } else {
      showToast('Failed to update job posting');
    }
  };

  const handleDeleteCareer = async (id) => {
    const result = await deleteCareer(id);
    if (result.success) {
      setCareers(prev => prev.filter(c => c.id !== id));
      showToast('Job posting deleted');
      setConfirmDeleteCareerId(null);
    } else {
      showToast('Failed to delete job posting');
    }
  };

  const handleUpdateApplicationStatus = async (id, status) => {
    const result = await updateApplicationStatus(id, status);
    if (result.success) {
      const updated = await listApplications();
      setApplications(updated);
      showToast(`Application ${status}`);
    } else {
      showToast('Failed to update application');
    }
  };

  const handleDeleteApplication = async (id) => {
    const result = await deleteApplication(id);
    if (result.success) {
      setApplications(prev => prev.filter(a => a.id !== id));
      showToast('Application deleted');
      setConfirmDeleteAppId(null);
    } else {
      showToast('Failed to delete application');
    }
  };

  if (loading) {
    return <div className="page-container">Loading careers...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Careers</h2>
          <p>Manage job postings and applications.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(26,26,26,0.1)' }}>
        <button
          type="button"
          onClick={() => setActiveTab('postings')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'postings' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'postings' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Job Postings ({careers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'applications' ? '2px solid #1a1a1a' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '14px',
            color: activeTab === 'applications' ? '#1a1a1a' : 'var(--text-muted)'
          }}
        >
          Applications ({applications.length})
        </button>
      </div>

      {activeTab === 'postings' ? (
        <>
          <div style={{ marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => {/* Would open add modal in full implementation */}}
              style={{
                padding: '10px 16px',
                background: '#1a1a1a',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Add Job Posting
            </button>
          </div>

          {careers.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid rgba(26,26,26,0.08)'
            }}>
              No job postings
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {careers.map(career => (
                <div
                  key={career.id}
                  style={{
                    background: 'var(--card-bg)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(26,26,26,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                        {career.title}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {career.location} · {career.employment_type}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      background: career.status === 'open' ? '#dcfce7' :
                                 career.status === 'paused' ? '#fef3c7' :
                                 career.status === 'closed' ? '#f3f4f6' : '#f3f4f6',
                      color: career.status === 'open' ? '#166534' :
                             career.status === 'paused' ? '#92400e' :
                             career.status === 'closed' ? '#374151' : '#374151'
                    }}>
                      {career.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px', color: '#374151' }}>
                    {career.description}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Posted {new Date(career.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {/* Would open edit modal */}}
                        style={{
                          padding: '6px 12px',
                          background: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCareerId(career.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {confirmDeleteCareerId === career.id && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fee2e2',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13px', color: '#991b1b' }}>Delete this job posting?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCareer(career.id)}
                        style={{
                          padding: '4px 12px',
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteCareerId(null)}
                        style={{
                          padding: '4px 12px',
                          background: 'transparent',
                          border: '1px solid rgba(26,26,26,0.2)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {applications.length === 0 ? (
            <div style={{
              padding: '48px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              background: 'var(--card-bg)',
              borderRadius: '12px',
              border: '1px solid rgba(26,26,26,0.08)'
            }}>
              No applications
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {applications.map(app => (
                <div
                  key={app.id}
                  style={{
                    background: 'var(--card-bg)',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid rgba(26,26,26,0.08)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                        {app.full_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {app.email} · {app.phone}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                      background: app.status === 'new' ? '#dbeafe' :
                                 app.status === 'reviewing' ? '#fef3c7' :
                                 app.status === 'shortlisted' ? '#dcfce7' :
                                 app.status === 'hired' ? '#dcfce7' :
                                 app.status === 'rejected' ? '#fee2e2' : '#f3f4f6',
                      color: app.status === 'new' ? '#1e40af' :
                             app.status === 'reviewing' ? '#92400e' :
                             app.status === 'shortlisted' ? '#166534' :
                             app.status === 'hired' ? '#166534' :
                             app.status === 'rejected' ? '#991b1b' : '#374151'
                    }}>
                      {app.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                    <strong>Role:</strong> {app.careers?.title || 'General Application'}
                  </div>

                  {app.location && (
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      <strong>Location:</strong> {app.location}
                    </div>
                  )}

                  {app.portfolio_url && (
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      <strong>Portfolio:</strong> <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1a1a1a' }}>{app.portfolio_url}</a>
                    </div>
                  )}

                  {app.resume_path && (
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      <strong>Resume:</strong> {app.resume_path}
                    </div>
                  )}

                  {app.experience && (
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                      <strong>Experience:</strong> {app.experience}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Applied {new Date(app.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {app.status === 'new' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateApplicationStatus(app.id, 'reviewing')}
                          style={{
                            padding: '6px 12px',
                            background: '#fef3c7',
                            color: '#92400e',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          Review
                        </button>
                      )}
                      {app.status === 'reviewing' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateApplicationStatus(app.id, 'shortlisted')}
                            style={{
                              padding: '6px 12px',
                              background: '#dcfce7',
                              color: '#166534',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            Shortlist
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                            style={{
                              padding: '6px 12px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 600
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {app.status === 'shortlisted' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateApplicationStatus(app.id, 'hired')}
                          style={{
                            padding: '6px 12px',
                            background: '#dcfce7',
                            color: '#166534',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                          }}
                        >
                          Hire
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAppId(app.id)}
                        style={{
                          padding: '6px 12px',
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {confirmDeleteAppId === app.id && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fee2e2',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '13px', color: '#991b1b' }}>Delete this application?</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteApplication(app.id)}
                        style={{
                          padding: '4px 12px',
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAppId(null)}
                        style={{
                          padding: '4px 12px',
                          background: 'transparent',
                          border: '1px solid rgba(26,26,26,0.2)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
