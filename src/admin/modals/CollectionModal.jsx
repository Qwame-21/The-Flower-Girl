import { X } from 'lucide-react';
import { addAdminRecord } from '../api/adminStore';

// TODO: Design CollectionModal — create storefront collection form
export default function CollectionModal({ collectionFormOpen, setCollectionFormOpen, products }) {
  if (!collectionFormOpen) return null;

  return (
    <div className="admin-modal-stub" role="dialog" aria-modal="true" aria-label="Create collection">
      <p>Collection creation form — to be designed here.</p>
      <button onClick={() => setCollectionFormOpen(false)}>Close</button>
    </div>
  );
}
