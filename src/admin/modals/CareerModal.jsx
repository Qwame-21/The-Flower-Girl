import { X } from 'lucide-react';
import { addAdminRecord } from '../api/adminStore';

export default function CareerModal({ careerFormOpen, setCareerFormOpen }) {
  if (!careerFormOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addAdminRecord('careers', {
      title: form.get('title'),
      location: form.get('location'),
      type: form.get('type'),
      description: form.get('description'),
      status: form.get('status'),
    });
    setCareerFormOpen(false);
  };

  return (
    <>
      <button
        className="admin-detail-scrim"
        onClick={() => setCareerFormOpen(false)}
        aria-label="Close career form"
      />
      <aside className="admin-detail-panel product-form-panel" aria-label="Create career">
        <button onClick={() => setCareerFormOpen(false)} aria-label="Close career form">
          <X size={17} />
        </button>
        <small>Hiring</small>
        <h2>Create a career</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Role title
            <input name="title" required placeholder="e.g. Gift production assistant" />
          </label>
          <div>
            <label>
              Location
              <input name="location" required placeholder="Accra" />
            </label>
            <label>
              Employment type
              <input name="type" required placeholder="Full-time" />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              required
              placeholder="Responsibilities, experience and application guidance…"
            />
          </label>
          <label>
            Initial status
            <select name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="open">Open for applications</option>
              <option value="paused">Paused</option>
            </select>
          </label>
          <button type="submit">Create career</button>
        </form>
      </aside>
    </>
  );
}
