import { BriefcaseBusiness } from 'lucide-react';
import { updateAdminCollection } from '../api/adminStore';

export default function CareersPage({
  activeTab,
  adminData,
  setCareerFormOpen,
  setSelectedItem,
}) {
  return (
    <>
      <header className="admin-page-heading">
        <div>
          <small>Hiring · {activeTab}</small>
          <h2>Careers</h2>
          <p>Create openings, control availability and review incoming applications.</p>
        </div>
        <button onClick={() => setCareerFormOpen(true)}>Create career</button>
      </header>
      <section className="career-admin-controls">
        <button
          onClick={() => {
            const careersOpen = adminData.careers.some(role => role.status === 'open');
            updateAdminCollection('careers', roles =>
              roles.map(role => (role.status === 'draft' ? role : { ...role, status: careersOpen ? 'paused' : 'open' }))
            );
          }}
        >
          {adminData.careers.some(role => role.status === 'open')
            ? 'Pause storefront applications'
            : 'Reopen storefront applications'}
        </button>
      </section>
      {['Applications', 'Shortlist', 'Archived'].includes(activeTab) ? (
        <div className="application-manager">
          {adminData.applications
            .filter(application =>
              activeTab === 'Shortlist'
                ? application.status === 'shortlisted'
                : activeTab === 'Archived'
                ? application.status === 'archived'
                : !['shortlisted', 'archived'].includes(application.status)
            )
            .map(application => (
              <article key={application.id}>
                <button
                  onClick={() =>
                    setSelectedItem({
                      type: 'application',
                      title: application.name,
                      status: application.status,
                      detail: application.motivation || application.experience || 'No application note supplied.',
                      application,
                    })
                  }
                >
                  <span className="customer-avatar">
                    <BriefcaseBusiness size={19} />
                  </span>
                  <span>
                    <strong>{application.name}</strong>
                    <small>{application.email} · {application.phone || 'No phone'}</small>
                  </span>
                  <span>
                    <small>Applied for</small>
                    <b>{application.role}</b>
                  </span>
                  <em>{application.status}</em>
                  <i>→</i>
                </button>
                <div>
                  {application.status !== 'shortlisted' && (
                    <button
                      onClick={() =>
                        updateAdminCollection('applications', items =>
                          items.map(item => (item.id === application.id ? { ...item, status: 'shortlisted' } : item))
                        )
                      }
                    >
                      Shortlist
                    </button>
                  )}
                  {application.status !== 'archived' && (
                    <button
                      onClick={() =>
                        updateAdminCollection('applications', items =>
                          items.map(item => (item.id === application.id ? { ...item, status: 'archived' } : item))
                        )
                      }
                    >
                      Archive
                    </button>
                  )}
                  {['shortlisted', 'archived'].includes(application.status) && (
                    <button
                      onClick={() =>
                        updateAdminCollection('applications', items =>
                          items.map(item => (item.id === application.id ? { ...item, status: 'new' } : item))
                        )
                      }
                    >
                      Restore
                    </button>
                  )}
                </div>
              </article>
            ))}
          {!adminData.applications.some(application =>
            activeTab === 'Shortlist'
              ? application.status === 'shortlisted'
              : activeTab === 'Archived'
              ? application.status === 'archived'
              : !['shortlisted', 'archived'].includes(application.status)
          ) && (
            <div className="admin-empty-state">
              <BriefcaseBusiness size={22} />
              <strong>No {activeTab.toLowerCase()} yet</strong>
              <p>Application status changes will appear here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="career-list">
          {adminData.careers
            .filter(role => (activeTab === 'Drafts' ? role.status === 'draft' : role.status === 'open'))
            .map(role => (
              <article key={role.id}>
                <div>
                  <small>{role.status}</small>
                  <h3>{role.title}</h3>
                  <p>{role.location || 'Accra, Ghana'} · {role.type || 'Full-time'}</p>
                </div>
                <div>
                  <button
                    onClick={() =>
                      updateAdminCollection('careers', roles =>
                        roles.map(item => (item.id === role.id ? { ...item, status: item.status === 'open' ? 'paused' : 'open' } : item))
                      )
                    }
                  >
                    {role.status === 'open' ? 'Pause' : 'Publish'}
                  </button>
                  <button
                    className="is-danger"
                    onClick={() =>
                      updateAdminCollection('careers', roles => roles.filter(item => item.id !== role.id))
                    }
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
        </div>
      )}
    </>
  );
}
