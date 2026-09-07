import { X } from 'lucide-react';
import { addAdminRecord } from '../api/adminStore';

export default function CollectionModal({
  collectionFormOpen,
  setCollectionFormOpen,
  products,
}) {
  if (!collectionFormOpen) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    addAdminRecord('collections', {
      title: form.get('title'),
      description: form.get('description'),
      status: form.get('status'),
      productIds: form.getAll('products'),
    });
    setCollectionFormOpen(false);
  };

  return (
    <>
      <button
        className="admin-detail-scrim"
        onClick={() => setCollectionFormOpen(false)}
        aria-label="Close collection form"
      />
      <aside className="admin-detail-panel product-form-panel" aria-label="Create collection"><header className="admin-panel-heading">
        <button onClick={() => setCollectionFormOpen(false)} aria-label="Close collection form">
          <X size={17} />
        </button>
        <small>Shop</small>
        <h2>Create collection</h2></header>
        <form onSubmit={handleSubmit}>
          <label>
            Collection title
            <input name="title" required placeholder="e.g. Birthday gifts" />
          </label>
          <label>
            Description
            <textarea name="description" required rows="4" />
          </label>
          <fieldset className="collection-form-products">
            <legend>Products</legend>
            {products.map(product => (
              <label key={product.id}>
                <input type="checkbox" name="products" value={product.id} />
                {product.name}
              </label>
            ))}
          </fieldset>
          <label>
            Status
            <select name="status" defaultValue="draft">
              <option value="draft">Draft</option>
              <option value="live">Live on storefront</option>
            </select>
          </label>
          <button type="submit">Create collection</button>
        </form>
      </aside>
    </>
  );
}
