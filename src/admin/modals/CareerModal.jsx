import { X } from 'lucide-react';
import { addAdminRecord } from '../api/adminStore';

// TODO: Design CareerModal — create job listing form
export default function CareerModal({ careerFormOpen, setCareerFormOpen }) {
  if (!careerFormOpen) return null;

  return (
    <div className="admin-modal-stub" role="dialog" aria-modal="true" aria-label="Create career">
      <p>Career creation form — to be designed here.</p>
      <button onClick={() => setCareerFormOpen(false)}>Close</button>
    </div>
  );
}
