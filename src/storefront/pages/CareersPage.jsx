import { useState, useEffect, useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import OutlineActionButton from '../components/OutlineActionButton';
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
  // Seed from cache synchronously so the page renders immediately with no loading flash.
  // fetchCareers always falls back to DEFAULT_CAREER, so a loading guard is never needed.
  const initialCareers = getCachedCareers() || [];
  const [careers, setCareers] = useState(initialCareers);
  const [selectedCareer, setSelectedCareer] = useState(() => initialCareers[0] || null);
  const [resumeName, setResumeName] = useState('');
  const fileInputRef = useRef(null);
  // Tracks whether the async fetch has settled. Prevents "No open positions"
  // from flashing on cold-cache first visits before fetchCareers() resolves.
  const fetchedRef = useRef(initialCareers.length > 0);

  useEffect(() => {
    fetchCareers()
      .then(data => {
        fetchedRef.current = true;
        setCareers(data);
        // Only update selected if user has not yet interacted
        setSelectedCareer(prev => prev ?? (data.length > 0 ? data[0] : null));
      })
      .catch(err => {
        fetchedRef.current = true;
        console.error('Failed to load careers:', err);
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


  // Only show "no positions" after fetch confirmed it (not on cold-cache first paint)
  if (careers.length === 0 && fetchedRef.current) {
    return <main className="content-page careers-page"><header className="content-page-heading"><span>CAREERS · ACCRA</span><h1>Join our<br />creative team.</h1></header><p style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>No open positions at this time. Check back soon!</p><SiteFooter onNavigate={onNavigate} /></main>;
  }

  // career is defined once the cache or fetch has populated it.
  // On cold-cache first render, career is null until the useEffect resolves —
  // render the form shell immediately, skip the career-details section.
  const career = selectedCareer || careers[0] || null;
  const descriptionLines = career?.description ? career.description.split('\n').filter(line => line.trim()) : [];

  return (
    <main className="content-page careers-page">
      <header className="content-page-heading">
        <span>CAREERS · {career?.location || 'ACCRA'}</span>
        <h1>Join our<br />creative team.</h1>
      </header>
      {career && (
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
      )}
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
              <div className="resume-upload-row">
                <input
                  ref={fileInputRef}
                  name="resume"
                  type="file"
                  accept=".pdf"
                  required
                  className="visually-hidden-file-input"
                  onChange={(e) => setResumeName(e.target.files?.[0]?.name || '')}
                />
                <OutlineActionButton
                  type="button"
                  icon={<Upload size={16} strokeWidth={1.6} />}
                  label={resumeName ? 'CHANGE FILE' : 'CHOOSE FILE'}
                  className="resume-upload-button"
                  onClick={() => fileInputRef.current?.click()}
                />
                {resumeName && (
                  <div className="resume-filename-tag" title={resumeName}>
                    <Check size={14} strokeWidth={2} />
                    <span className="resume-filename-text">{resumeName}</span>
                  </div>
                )}
              </div>
            </div>
            <label className="career-cover"><span>Cover letter (optional)</span><textarea name="cover" rows="4" placeholder="Tell us why you're interested in this role..." /></label>
          </div>
          <button type="submit" className="primary-action" disabled={submitting || applicationSent}>
            {submitting ? 'SUBMITTING…' : applicationSent ? 'APPLICATION SENT!' : 'SUBMIT APPLICATION'}
          </button>
          {error && <p className="shop-error" style={{ marginTop: '1rem' }}>{error}</p>}
        </form>
      </section>
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
