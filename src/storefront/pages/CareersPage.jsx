import { useState, useEffect, useRef } from 'react';
import { Upload, Check } from 'lucide-react';
import OutlineActionButton from '../components/OutlineActionButton';
import { submitInquiry } from '../api/submissions';
import { formIsoDate } from '../utils/date';
import DateField from '../components/DateField';
import SiteFooter from '../components/SiteFooter';
import PhoneInput from '../components/PhoneInput';
import { fetchCareers, getCachedCareers, DEFAULT_CAREER } from '../data/careers';

// Equality check for career arrays — covers every field that is rendered or used.
// A change in description, location, employment_type, title, or requirements triggers the update.
function careersEqual(a, b) {
  if (a === b) return true;
  if (!a || !b || a.length !== b.length) return false;
  return a.every((item, i) =>
    item.id === b[i].id &&
    item.title === b[i].title &&
    item.description === b[i].description &&
    item.location === b[i].location &&
    item.employment_type === b[i].employment_type &&
    item.requirements === b[i].requirements
  );
}

// In-flight request de-duplication so concurrent calls or StrictMode re-mounts share the same promise.
let careersInFlight = null;
function getCareers() {
  if (!careersInFlight) {
    careersInFlight = fetchCareers().finally(() => {
      careersInFlight = null;
    });
  }
  return careersInFlight;
}

export default function CareersPage({ onNavigate }) {
  const [applicationSent, setApplicationSent] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // --- Synchronous initial state ---
  // getCachedCareers() is inside the lazy initialiser (runs once, not every render).
  // If the cache is cold, DEFAULT_CAREER is the fallback, so `career` is ALWAYS
  // non-null on the very first render — both sections appear in one paint.
  const [careers, setCareers] = useState(() => getCachedCareers() || [DEFAULT_CAREER]);
  const [selectedCareer, setSelectedCareer] = useState(() => (getCachedCareers() || [DEFAULT_CAREER])[0]);

  // Controls the 150ms opacity fade if career text updates after fetch.
  // Initialised to true so the career section is fully visible on the first paint.
  const [careerVisible, setCareerVisible] = useState(true);

  const [resumeName, setResumeName] = useState('');
  const fileInputRef = useRef(null);
  const isMountedRef = useRef(false);

  // Fetch Supabase data and update in place.
  // StrictMode-safe: shares the de-duplicated request, and whichever run completes
  // applies the result as long as the component is mounted.
  useEffect(() => {
    isMountedRef.current = true;

    getCareers()
      .then(data => {
        if (!isMountedRef.current || !data || data.length === 0) return;
        setCareers(prev => {
          if (careersEqual(prev, data)) return prev;
          // Content differs — fade out, swap, fade back in.
          setCareerVisible(false);
          setTimeout(() => {
            if (!isMountedRef.current) return;
            setSelectedCareer(cur => {
              if (!cur) return data[0];
              const match = data.find(c => c.id === cur.id);
              return match || data[0];
            });
            setCareerVisible(true);
          }, 150);
          return data;
        });
      })
      .catch(err => {
        if (isMountedRef.current) console.error('Failed to load careers:', err);
      });

    return () => {
      isMountedRef.current = false;
    };
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

  // career is guaranteed non-null because the initial state always falls back
  // to DEFAULT_CAREER. No skeleton, no loading flag, no conditional section hiding.
  const career = selectedCareer || careers[0];
  const descriptionLines = career?.description ? career.description.split('\n').filter(line => line.trim()) : [];

  return (
    <main className="content-page careers-page">
      <header className="content-page-heading">
        <span>CAREERS · {career?.location || 'ACCRA'}</span>
        <h1>Join our<br />creative team.</h1>
      </header>
      {/* career-layout is ALWAYS rendered on first paint — no layout shift */}
      <section className="career-layout" style={{ opacity: careerVisible ? 1 : 0, transition: 'opacity 150ms ease' }}>
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
