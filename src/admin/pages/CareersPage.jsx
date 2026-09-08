import { useState } from 'react';
import { BriefcaseBusiness, CheckCircle2, Download, ExternalLink, FileText, Globe, MapPin, Plus, ShieldAlert, User, UserCheck, XCircle } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../config/supabase';

export default function CareersPage({
  activeTab,
  adminData = { applications: [], careers: [] },
  setCareerFormOpen,
  setEditingCareer,
  onApplicationStatusChange,
  onCareerStatusChange,
  setSelectedItem,
}) {
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [downloadingResume, setDownloadingResume] = useState(false);
  const [resumeError, setResumeError] = useState('');

  const applications = adminData.applications || [];
  const careers = adminData.careers || [];

  const filteredApplications = applications.filter(app => {
    if (activeTab === 'Shortlist') return app.status === 'shortlisted';
    if (activeTab === 'Archived') return ['rejected', 'archived'].includes(app.status);
    return !['shortlisted', 'rejected', 'archived'].includes(app.status);
  });

  const selectedApp = filteredApplications.find(a => a.id === selectedAppId) || filteredApplications[0] || null;

  const handleDownloadResume = async (path) => {
    if (!path) return;
    setDownloadingResume(true);
    setResumeError('');
    try {
      if (supabaseConfigured && supabase) {
        const { data, error } = await supabase.storage
          .from('career-files')
          .createSignedUrl(path, 3600);
        if (error) throw error;
        if (data?.signedUrl) {
          window.open(data.signedUrl, '_blank');
          return;
        }
      }
      setResumeError('Private resume download requires live backend connection.');
    } catch (err) {
      setResumeError(err.message || 'Could not generate private resume link.');
    } finally {
      setDownloadingResume(false);
    }
  };

  const isRoleTab = ['Open roles', 'Drafts'].includes(activeTab);
  const filteredRoles = careers.filter(role => {
    if (activeTab === 'Open roles') return role.status === 'open';
    if (activeTab === 'Drafts') return ['draft', 'paused'].includes(role.status);
    return true;
  });

  return (
    <div className="admin-careers-workspace">
      {!supabaseConfigured && (
        <div className="admin-connection-notice" role="alert">
          <ShieldAlert size={20} className="notice-icon" />
          <div className="notice-content">
            <strong>Preview Mode — Unconnected Backend</strong>
            <p>
              This preview has no Supabase configuration, so Requests and Careers correctly show a connection message. Their live reads, saves, and private downloads still need verification against the backend.
            </p>
          </div>
          <span className="notice-badge">Local Storage Fallback</span>
        </div>
      )}

      <header className="admin-page-heading">
        <div>
          <small>Hiring & Roles · {activeTab}</small>
          <h2>Careers & Applications</h2>
          <p>Manage open positions, review applicant submissions, inspect candidate portfolios, and shortlist for interviews.</p>
        </div>
        <div className="careers-heading-actions">
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setCareerFormOpen && setCareerFormOpen(true)}
          >
            <Plus size={15} /> New Career Draft
          </button>
        </div>
      </header>

      {isRoleTab ? (
        <div className="admin-roles-panel">
          <div className="roles-grid">
            {filteredRoles.length === 0 ? (
              <div className="admin-empty-state">
                <BriefcaseBusiness size={32} />
                <strong>No roles in {activeTab}</strong>
                <p>Create career openings to accept applicant submissions from the storefront.</p>
              </div>
            ) : (
              filteredRoles.map(role => (
                <article key={role.id} className="role-management-card">
                  <div className="role-card-top">
                    <span className={`status-badge status-${role.status}`}>{role.status}</span>
                    <h3>{role.title}</h3>
                  </div>
                  <div className="role-meta">
                    <span><MapPin size={13} /> {role.location || 'Accra, Ghana'}</span>
                    <span>·</span>
                    <span>{role.employmentType || 'Full-time'}</span>
                  </div>
                  {role.description && <p className="role-desc">{role.description}</p>}
                  <div className="role-actions">
                    <button
                      type="button"
                      onClick={() => onCareerStatusChange && onCareerStatusChange(role.id, role.status === 'open' ? 'paused' : 'open')}
                    >
                      {role.status === 'open' ? 'Pause Position' : 'Open Position'}
                    </button>
                    {setEditingCareer && (
                      <button type="button" onClick={() => setEditingCareer(role)}>
                        Edit Role
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="admin-applications-grid">
          {filteredApplications.length === 0 ? (
            <div className="admin-empty-state">
              <User size={32} />
              <strong>No applications in {activeTab}</strong>
              <p>Applicant submissions will automatically sync and display here.</p>
            </div>
          ) : (
            <>
              <div className="applications-list-panel">
                {filteredApplications.map(app => {
                  const isSelected = selectedApp?.id === app.id;
                  return (
                    <article
                      key={app.id}
                      className={`applicant-card-item ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedAppId(app.id)}
                    >
                      <div className="app-card-header">
                        <span className="applicant-name">{app.name || app.fullName || 'New Applicant'}</span>
                        <span className={`status-badge status-${app.status}`}>{app.status}</span>
                      </div>
                      <div className="app-sub-meta">
                        <span>{app.location || 'Accra'}</span>
                        <span>·</span>
                        <span>{app.date ? `Available: ${app.date}` : 'Immediate'}</span>
                      </div>
                      {app.portfolio && (
                        <div className="app-portfolio-preview">
                          <Globe size={12} /> {app.portfolio}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {selectedApp && (
                <div className="application-detail-panel">
                  <div className="detail-panel-header">
                    <div>
                      <span className="ref-chip">Applicant Candidate</span>
                      <h3>{selectedApp.name || selectedApp.fullName}</h3>
                      <p className="sub-detail">{selectedApp.email} · {selectedApp.phone}</p>
                    </div>
                    <div className="header-actions">
                      {selectedApp.phone && (
                        <a
                          href={`https://wa.me/${selectedApp.phone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whatsapp-btn"
                        >
                          WhatsApp Candidate
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="detail-sections">
                    <section className="detail-block">
                      <h4>Candidate Profile</h4>
                      <div className="detail-grid">
                        <div>
                          <small>Location</small>
                          <strong>{selectedApp.location || 'Accra, Ghana'}</strong>
                        </div>
                        <div>
                          <small>Earliest Start Date</small>
                          <strong>{selectedApp.date || selectedApp.earliestStartDate || 'Flexible'}</strong>
                        </div>
                        <div>
                          <small>Portfolio / Social</small>
                          {selectedApp.portfolio ? (
                            <a
                              href={selectedApp.portfolio}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-link"
                            >
                              {selectedApp.portfolio} <ExternalLink size={12} />
                            </a>
                          ) : (
                            <strong>Not provided</strong>
                          )}
                        </div>
                      </div>
                    </section>

                    {selectedApp.experience && (
                      <section className="detail-block">
                        <h4>Relevant Experience</h4>
                        <p className="experience-box">{selectedApp.experience}</p>
                      </section>
                    )}

                    {selectedApp.motivation && (
                      <section className="detail-block">
                        <h4>Motivation & Introduction</h4>
                        <p className="motivation-box">{selectedApp.motivation}</p>
                      </section>
                    )}

                    {selectedApp.resumePath && (
                      <section className="detail-block">
                        <h4>Resume / CV Attachment</h4>
                        <div className="file-download-box">
                          <FileText size={20} />
                          <div className="file-info">
                            <strong>Private Applicant Resume (PDF/DOC)</strong>
                            <small>{selectedApp.resumePath}</small>
                          </div>
                          <button
                            type="button"
                            className="download-btn"
                            disabled={downloadingResume}
                            onClick={() => handleDownloadResume(selectedApp.resumePath)}
                          >
                            <Download size={15} /> {downloadingResume ? 'Generating link…' : 'Download CV Resume'}
                          </button>
                        </div>
                        {resumeError && <p className="field-error">{resumeError}</p>}
                      </section>
                    )}

                    <section className="detail-block candidate-status-block">
                      <h4>Application Status Workflow</h4>
                      <div className="action-buttons-row">
                        <button
                          type="button"
                          className={`status-opt-btn ${selectedApp.status === 'reviewing' ? 'active' : ''}`}
                          onClick={() => onApplicationStatusChange && onApplicationStatusChange(selectedApp.id, 'reviewing')}
                        >
                          Mark Under Review
                        </button>
                        <button
                          type="button"
                          className={`status-opt-btn ${selectedApp.status === 'shortlisted' ? 'active' : ''}`}
                          onClick={() => onApplicationStatusChange && onApplicationStatusChange(selectedApp.id, 'shortlisted')}
                        >
                          <UserCheck size={15} /> Shortlist Candidate
                        </button>
                        <button
                          type="button"
                          className={`status-opt-btn ${selectedApp.status === 'hired' ? 'active' : ''}`}
                          onClick={() => onApplicationStatusChange && onApplicationStatusChange(selectedApp.id, 'hired')}
                        >
                          <CheckCircle2 size={15} /> Hire Candidate
                        </button>
                        <button
                          type="button"
                          className={`status-opt-btn danger ${selectedApp.status === 'rejected' ? 'active' : ''}`}
                          onClick={() => onApplicationStatusChange && onApplicationStatusChange(selectedApp.id, 'rejected')}
                        >
                          <XCircle size={15} /> Archive / Reject
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

