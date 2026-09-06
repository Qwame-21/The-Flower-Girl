import { FileImage, X } from 'lucide-react';
import { addAdminRecord, updateAdminCollection } from '../api/adminStore';

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

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const rawPrice = String(form.get('price')).replace(/[^0-9.]/g, '');
    const product = {
      name: form.get('name'),
      brand: form.get('brand'),
      category: form.get('category'),
      subcategory: form.get('subcategory'),
      audience: form.get('audience'),
      description: form.get('description'),
      benefits: form.get('benefits'),
      size: form.get('size'),
      lowStockAt: Number(form.get('lowStockAt')),
      bestseller: form.get('bestseller') === 'on',
      trending: form.get('trending') === 'on',
      price: `GHS ${Number(rawPrice).toLocaleString()}`,
      stock: Number(form.get('stock')),
      visible: editingProduct?.visible ?? true,
      image:
        imagePreview ||
        editingProduct?.image ||
        '/assets/gifting-factory-logo-transparent-v2.png',
      secondaryImage: secondaryImagePreview || editingProduct?.secondaryImage || '',
    };

    if (editingProduct) {
      updateAdminCollection('products', items =>
        items.map(item => (item.id === editingProduct.id ? { ...item, ...product } : item))
      );
    } else {
      addAdminRecord('products', product);
    }

    setProductFormOpen(false);
    setEditingProduct(null);
    setImagePreview('');
    setSecondaryImagePreview('');
  };

  const handleClose = () => {
    setProductFormOpen(false);
    setEditingProduct(null);
  };

  return (
    <>
      <button
        className="admin-detail-scrim"
        onClick={handleClose}
        aria-label="Close product form"
      />
      <aside
        className="admin-detail-panel product-form-panel"
        aria-label={editingProduct ? 'Edit product' : 'Add new product'}
      >
        <button onClick={handleClose} aria-label="Close product form">
          <X size={17} />
        </button>
        <small>Catalogue</small>
        <h2>{editingProduct ? 'Edit product' : 'Add new product'}</h2>
        <form key={editingProduct?.id || 'new-product'} onSubmit={handleSubmit}>
          <div className="product-image-pair">
            <label className="product-image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setImagePreview(reader.result);
                  reader.readAsDataURL(file);
                }}
              />
              <span>
                {imagePreview ? (
                  <img src={imagePreview} alt="Primary product preview" />
                ) : (
                  <>
                    <FileImage size={22} />
                    <strong>Primary image</strong>
                    <small>PNG or JPG</small>
                  </>
                )}
              </span>
            </label>
            <label className="product-image-upload">
              <input
                type="file"
                accept="image/*"
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setSecondaryImagePreview(reader.result);
                  reader.readAsDataURL(file);
                }}
              />
              <span>
                {secondaryImagePreview ? (
                  <img src={secondaryImagePreview} alt="Detail product preview" />
                ) : (
                  <>
                    <FileImage size={22} />
                    <strong>Detail image</strong>
                    <small>Back, ingredients or in-use</small>
                  </>
                )}
              </span>
            </label>
          </div>
          <label>
            Product name
            <input
              name="name"
              required
              defaultValue={editingProduct?.name || ''}
              placeholder="e.g. Celebration hamper"
            />
          </label>
          <div>
            <label>
              Brand
              <input name="brand" defaultValue={editingProduct?.brand || ''} />
            </label>
            <label>
              Audience
              <input
                name="audience"
                defaultValue={editingProduct?.audience || ''}
                placeholder="Everyone"
              />
            </label>
          </div>
          <div>
            <label>
              Category
              <input
                name="category"
                required
                defaultValue={editingProduct?.category || ''}
                placeholder="Hampers"
              />
            </label>
            <label>
              Subcategory
              <input
                name="subcategory"
                defaultValue={editingProduct?.subcategory || ''}
              />
            </label>
          </div>
          <div>
            <label>
              Price
              <input
                name="price"
                required
                inputMode="decimal"
                defaultValue={editingProduct?.price?.replace(/[^0-9.]/g, '') || ''}
                placeholder="1250"
              />
            </label>
            <label>
              Size / volume / type
              <input name="size" defaultValue={editingProduct?.size || ''} />
            </label>
          </div>
          <div>
            <label>
              Inventory
              <input
                name="stock"
                required
                type="number"
                min="0"
                defaultValue={editingProduct?.stock ?? 1}
              />
            </label>
            <label>
              Low-stock alert at
              <input
                name="lowStockAt"
                required
                type="number"
                min="0"
                defaultValue={editingProduct?.lowStockAt ?? 3}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              defaultValue={editingProduct?.description || ''}
              placeholder="What the customer receives…"
            />
          </label>
          <label>
            Ingredients / benefits / included items
            <textarea
              name="benefits"
              defaultValue={editingProduct?.benefits || ''}
              placeholder="Use a new line for each item"
            />
          </label>
          <div className="product-flags">
            <label className="form-check">
              <input
                name="bestseller"
                type="checkbox"
                defaultChecked={editingProduct?.bestseller}
              />{' '}
              Bestseller
            </label>
            <label className="form-check">
              <input
                name="trending"
                type="checkbox"
                defaultChecked={editingProduct?.trending}
              />{' '}
              Trending
            </label>
          </div>
          <button type="submit">
            {editingProduct ? 'Save product changes' : 'Create product'}
          </button>
        </form>
      </aside>
    </>
  );
}
