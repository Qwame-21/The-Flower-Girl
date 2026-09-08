import { useState } from 'react';
import { submitInquiry } from '../api/submissions';
import { formIsoDate } from '../utils/date';
import DateField from '../components/DateField';
import SiteFooter from '../components/SiteFooter';
import PhoneInput from '../components/PhoneInput';

export default function CareersPage({ onNavigate }) {
  const [applicationSent, setApplicationSent] = useState(false);
  const [submissionId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (submitting || applicationSent) return;
    setSubmitting(true); setError('');
    try {
      const data = new FormData(event.currentTarget);
      await submitInquiry('career', { ...Object.fromEntries(data), date: formIsoDate(data, 'career') }, data.get('resume'), submissionId);
      setApplicationSent(true);
    } catch (error) { setError(error.message); }
    finally { setSubmitting(false); }
  };
  return <main className="content-page careers-page"><header className="content-page-heading"><span>CAREERS · ACCRA</span><h1>Join our<br />creative team.</h1></header><section className="career-layout"><div className="career-role"><span>OPEN POSITION</span><h2>Content Creator &amp;<br />Social Media Manager</h2><p>We are looking for a creative, passionate and trend-aware person to manage content and grow our online community.</p><a className="primary-action" href="#application">START APPLICATION</a></div><div className="career-details"><article><h3>Key responsibilities</h3><ul><li>Create engaging content for social platforms</li><li>Plan and manage the content calendar</li><li>Shoot and edit polished photos, videos and graphics</li><li>Monitor trends and suggest creative ideas</li><li>Engage followers and help grow the community</li><li>Review performance and provide monthly reports</li></ul></article><article><h3>What we are looking for</h3><ul><li>Experience in content creation or social media</li><li>Clear written and verbal communication</li><li>Confidence using content creation tools</li><li>Strong understanding of social trends and analytics</li><li>Independent, detail-oriented working style</li><li>Interest in branding, storytelling and engagement</li></ul></article><article><h3>What we offer</h3><ul><li>Competitive salary</li><li>Creative and supportive work environment</li><li>Opportunities for growth and development</li><li>A chance to shape a growing Ghanaian gifting brand</li></ul></article></div></section><section className="application-section" id="application"><div><span>APPLICATION</span><h2>Tell us about<br />your work.</h2><p>Share the details that help the team understand your experience and creative point of view.</p></div><form onSubmit={submit}><div className="application-grid"><label>Full name<input name="name" required /></label><label>Email address<input name="email" required type="email" /></label><PhoneInput label="Phone / WhatsApp" required /><label>Current location<input name="location" required /></label><label>Portfolio or social link<input name="portfolio" required type="url" placeholder="https://" /></label><DateField label="Earliest start date" prefix="career" /></div><label>Relevant experience<textarea name="experience" required rows="4" /></label><label>Why do you want to join the team?<textarea name="motivation" required rows="5" /></label><label className="upload-field">Attach CV / résumé<input name="resume" required type="file" accept=".pdf,.doc,.docx" /></label><button className="primary-action" type="submit" disabled={submitting || applicationSent}>{submitting ? 'SUBMITTING…' : applicationSent ? 'APPLICATION SUBMITTED' : 'SUBMIT APPLICATION'}</button>{error && <p role="alert">{error}</p>}{applicationSent && <p className="inline-success">Your application and CV have been received. The team will review your details.</p>}</form></section><SiteFooter onNavigate={onNavigate} /></main>;
}
