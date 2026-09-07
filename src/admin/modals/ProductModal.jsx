import { addAdminRecord, updateAdminCollection } from '../api/adminStore';

// TODO: Design ProductModal — add/edit product form with image upload, pricing, inventory
export default function ProductModal({
  productFormOpen,
  setProductFormOpen,
  editingProduct,
  setEditingProduct,
  imagePreview,
  setImagePreview,
  secondaryImagePreview,
  setSecondaryImagePreview,
}) {
  if (!productFormOpen) return null;

  const handleClose = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <div className="admin-modal-stub" role="dialog" aria-modal="true" aria-label={editingProduct ? 'Edit product' : 'Add product'}>
      <p>{editingProduct ? 'Edit product' : 'Add product'} — form to be designed here.</p>
      <button onClick={handleClose}>Close</button>
    </div>
  );
}
