import { Search, X } from 'lucide-react';
import { PRODUCTS as STOREFRONT_PRODUCTS } from '../../data/products';
import { updateAdminCollection } from '../api/adminStore';

export default function ProductsPage({
  activeTab,
  productQuery,
  setProductQuery,
  filteredProducts,
  setSelectedItem,
  setEditingProduct,
  setImagePreview,
  setSecondaryImagePreview,
  setProductFormOpen,
  setPendingDelete,
  adminData,
}) {
  return (
    <>
      <header className="admin-page-heading product-heading">
        <div>
          <small>Catalogue · {activeTab}</small>
          <h2>Products</h2>
          <p>Manage product imagery, pricing, inventory and storefront visibility.</p>
        </div>
        <button
          className="admin-primary-action"
          onClick={() => {
            setEditingProduct(null);
            setImagePreview('');
            setSecondaryImagePreview('');
            setProductFormOpen(true);
          }}
        >
          Add new product
        </button>
      </header>
      <div className="product-toolbar">
        <label>
          <Search size={16} />
          <input
            value={productQuery}
            onChange={event => setProductQuery(event.target.value)}
            placeholder="Search products or categories"
          />
          {productQuery && (
            <button onClick={() => setProductQuery('')} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </label>
        <span>{filteredProducts.length} products</span>
      </div>
      <div className="product-table" role="table" aria-label="Products">
        <div className="product-table__head" role="row">
          <span>Product</span>
          <span>Price</span>
          <span>Inventory</span>
          <span>Storefront</span>
          <span />
        </div>
        {filteredProducts.map(product => (
          <article key={product.id} role="row">
            <button
              className="product-identity"
              onClick={() =>
                setSelectedItem({
                  title: product.name,
                  status: product.visible ? 'Visible' : 'Hidden',
                  detail: `${product.category} · ${product.price}`,
                })
              }
            >
              <img src={product.image} alt={product.name} />
              <span>
                <strong>{product.name}</strong>
                <small>{product.category}</small>
              </span>
            </button>
            <span>{product.price}</span>
            <span className={product.stock < 10 ? 'is-low' : ''}>
              {product.stock} available
            </span>
            <button
              className={`visibility-switch ${product.visible ? 'is-on' : ''}`}
              onClick={() =>
                updateAdminCollection('products', items =>
                  items.map(item =>
                    item.id === product.id ? { ...item, visible: !item.visible } : item
                  )
                )
              }
              aria-label={`${product.visible ? 'Hide' : 'Show'} ${product.name}`}
              aria-pressed={product.visible}
            >
              <i />
            </button>
            <div className="product-row-actions">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setImagePreview(product.image);
                  setSecondaryImagePreview(product.secondaryImage || '');
                  setProductFormOpen(true);
                }}
              >
                Edit
              </button>
              <button
                className="is-danger"
                onClick={() =>
                  setPendingDelete({
                    collection: 'products',
                    id: product.id,
                    title: product.name,
                    detail:
                      'This removes the product from Admin, storefront collections, carts after refresh, and future ordering.',
                  })
                }
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
      <section className="product-promotion-editor" aria-label="Product percentage offers">
        <header>
          <div>
            <small>Storefront offers</small>
            <h3>Product promotions</h3>
          </div>
          <p>
            Set the percentage, pause an offer without deleting it, or remove it completely.
          </p>
        </header>
        {STOREFRONT_PRODUCTS.map(product => {
          const promotion = (adminData.promotions || []).find(
            item => item.productId === product.id
          );
          return (
            <label key={`discount-${product.id}`}>
              <span>
                <strong>{product.name}</strong>
                <small>
                  {product.priceLabel}
                  {promotion ? ` · ${promotion.status}` : ' · no promotion'}
                </small>
              </span>
              <input
                type="number"
                min="0"
                max="90"
                step="1"
                defaultValue={promotion?.percent || 0}
                aria-label={`${product.name} discount percentage`}
                onBlur={event => {
                  const percent = Math.min(
                    90,
                    Math.max(0, Number(event.target.value) || 0)
                  );
                  updateAdminCollection('promotions', items =>
                    percent
                      ? items.some(item => item.productId === product.id)
                        ? items.map(item =>
                            item.productId === product.id ? { ...item, percent } : item
                          )
                        : [
                            ...items,
                            {
                              id: `promo-${product.id}`,
                              productId: product.id,
                              percent,
                              status: 'active',
                            },
                          ]
                      : items.filter(item => item.productId !== product.id)
                  );
                }}
              />
              <b>% OFF</b>
              <button
                type="button"
                disabled={!promotion}
                onClick={() =>
                  updateAdminCollection('promotions', items =>
                    items.map(item =>
                      item.productId === product.id
                        ? {
                            ...item,
                            status: item.status === 'active' ? 'paused' : 'active',
                          }
                        : item
                    )
                  )
                }
              >
                {promotion?.status === 'active' ? 'Pause' : 'Activate'}
              </button>
              <button
                type="button"
                disabled={!promotion}
                onClick={() =>
                  updateAdminCollection('promotions', items =>
                    items.filter(item => item.productId !== product.id)
                  )
                }
              >
                Remove
              </button>
            </label>
          );
        })}
      </section>
    </>
  );
}
