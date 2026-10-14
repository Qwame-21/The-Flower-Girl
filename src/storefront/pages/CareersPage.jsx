import { useState, useEffect } from 'react';
import { Upload, Check } from 'lucide-react';
import { submitInquiry } from '../api/submissions';
import { formIsoDate } from '../utils/date';
import DateField from '../components/DateField';
import SiteFooter from '../components/SiteFooter';
import PhoneInput from '../components/PhoneInput';
import { fetchCareers, getCachedCareers } from '../data/careers';

export default function CareersPage({ onNavigate }) {
  const [applicationSent, setApplicationSent] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [careers, setCareers] = useState(() => getCachedCareers() || []);
  const [loading, setLoading] = useState(false);
  const [selectedCareer, setSelectedCareer] = useState(null);
  const [resumeName, setResumeName] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchCareers()
      .then(data => {
        setCareers(data);
        if (data.length > 0) {
          setSelectedCareer(data[0]);
        }
      })
      .catch(err => {
        console.error('Failed to load careers:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const submit = async event => {
    event.preventDefault();
    if (submitting || applicationSent) return;
    setSubmitting(true); setError('');
    try {
      const data = new FormData(event.currentTarget);
      await submitInquiry('career', { ...Object.fromEntries(data), date: formIsoDate(data, 'career'), careerId: selectedCareer?.id }, data.get('resume'), submissionId);
      setApplicationSent(true);
    } catch (error) { setError(error.message); }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return <main className="content-page careers-page"><header className="content-page-heading"><span>CAREERS · ACCRA</span><h1>Join our<br />creative team.</h1></header><p style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>Loading open positions...</p><SiteFooter onNavigate={onNavigate} /></main>;
  }

  if (careers.length === 0) {
    return <main className="content-page careers-page"><header className="content-page-heading"><span>CAREERS · ACCRA</span><h1>Join our<br />creative team.</h1></header><p style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>No open positions at this time. Check back soon!</p><SiteFooter onNavigate={onNavigate} /></main>;
  }

  const career = selectedCareer || careers[0];
  const descriptionLines = career.description ? career.description.split('\n').filter(line => line.trim()) : [];

  return (
    <main className="content-page careers-page">
      <header className="content-page-heading">
        <span>CAREERS · {career.location || 'ACCRA'}</span>
        <h1>Join our<br />creative team.</h1>
      </header>
      <section className="career-layout">
        <div className="career-role">
          <span>OPEN POSITION</span>
          <h2>{career.title}</h2>
          <p>
            {career.employment_type && <span style={{ fontSize: '0.85rem', color: '#666', marginRight: '1rem' }}>{career.employment_type}</span>}
            {career.location && <span style={{ fontSize: '0.85rem', color: '#666' }}>{career.location}</span>}
          </p>
          <a className="primary-action" href="#application">START APPLICATION</a>
        </div>
        <div className="career-details">
          {descriptionLines.map((line, idx) => {
            const isHeader = line.startsWith('Key responsibilities:') || line.startsWith('What we are looking for:') || line.startsWith('What we offer:');
            if (isHeader) {
              return <article key={idx}><h3>{line.replace(':', '')}</h3></article>;
            }
            if (line.startsWith('- ')) {
              return <li key={idx}>{line.substring(2)}</li>;
            }
            return <p key={idx}>{line}</p>;
          })}
        </div>
      </section>
      <section className="application-section" id="application">
        <div>
          <span>APPLICATION</span>
          <h2>Tell us about<br />your work.</h2>
          <p>Share the details that help the team understand your experience and creative point of view.</p>
        </div>
        <form onSubmit={submit}>
          <div className="application-grid">
            <label>Full name<input name="name" required /></label>
            <label>Email address<input name="email" required type="email" /></label>
            <PhoneInput label="Phone / WhatsApp" required />
            <label>Preferred start date<DateField name="career" /></label>
            <label>Link to portfolio or work samples<input name="portfolio" type="url" placeholder="https://..." /></label>
            <div className="resume-upload-capsule-wrap">
              <span className="field-label">Resume / CV (PDF)</span>
              <label className="resume-upload-capsule">
                <Upload size={15} />
                <span>{resumeName || 'CHOOSE FILE'}</span>
                <input
                  name="resume"
                  type="file"
                  accept=".pdf"
                  required
                  onChange={(e) => setResumeName(e.target.files?.[0]?.name || '')}
                />
              </label>
              {resumeName && (
                <small className="resume-upload-feedback">
                  <Check size={13} /> {resumeName}
                </small>
              )}
            </div>
            <label className="career-cover"><span>Cover letter (optional)</span><textarea name="cover" rows="4" placeholder="Tell us why you're interested in this role..." /></label>
          </div>
          <button type="submit" className="primary-action" disabled={submitting || applicationSent}>
            {submitting ? 'Submitting...' : applicationSent ? 'Application sent!' : 'Submit application'}
          </button>
          {error && <p className="shop-error" style={{ marginTop: '1rem' }}>{error}</p>}
        </form>
      </section>
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
