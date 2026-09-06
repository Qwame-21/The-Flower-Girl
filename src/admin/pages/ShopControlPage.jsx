import { updateAdminCollection } from '../api/adminStore';

export default function ShopControlPage({
  activeTab,
  adminData,
  products,
  setCollectionFormOpen,
  setEditingProduct,
  setImagePreview,
  setSecondaryImagePreview,
  setProductFormOpen,
  setSelectedItem,
  staffCart,
  setStaffCart,
  setStaffCartOpen,
}) {
  return (
    <section className="shop-manager">
      <header>
        <div>
          <small>Shop management</small>
          <h3>
            {activeTab === 'Collections'
              ? 'Storefront collections.'
              : 'Your storefront catalogue.'}
          </h3>
          <p>
            {activeTab === 'Collections'
              ? 'Create, order and assign products to customer-facing groups.'
              : 'Browse the catalogue and place an assisted order for a customer.'}
          </p>
        </div>
        <div>
          {activeTab === 'Collections' ? (
            <button onClick={() => setCollectionFormOpen(true)}>New collection</button>
          ) : (
            <button
              onClick={() => {
                setEditingProduct(null);
                setImagePreview('');
                setSecondaryImagePreview('');
                setProductFormOpen(true);
              }}
            >
              Add product
            </button>
          )}
          <button onClick={() => setStaffCartOpen(true)}>
            Staff cart ({staffCart.reduce((sum, item) => sum + item.qty, 0)})
          </button>
        </div>
      </header>
      {activeTab === 'Collections' ? (
        <div className="collection-manager">
          {adminData.collections.map((collection, collectionIndex) => (
            <article key={collection.id}>
              <span>
                <strong>{collection.title}</strong>
                <small>
                  {collection.description || 'No description'} ·{' '}
                  {collection.productIds.length} products
                </small>
              </span>
              <div className="collection-products">
                {products.map(product => (
                  <label key={product.id}>
                    <input
                      type="checkbox"
                      checked={collection.productIds.includes(product.id)}
                      onChange={event =>
                        updateAdminCollection('collections', items =>
                          items.map(item =>
                            item.id === collection.id
                              ? {
                                  ...item,
                                  productIds: event.target.checked
                                    ? [...new Set([...item.productIds, product.id])]
                                    : item.productIds.filter(id => id !== product.id),
                                }
                              : item
                          )
                        )
                      }
                    />
                    {product.name}
                  </label>
                ))}
              </div>
              <button
                disabled={collectionIndex === 0}
                aria-label={`Move ${collection.title} earlier`}
                onClick={() =>
                  updateAdminCollection('collections', items => {
                    const next = [...items];
                    [next[collectionIndex - 1], next[collectionIndex]] = [
                      next[collectionIndex],
                      next[collectionIndex - 1],
                    ];
                    return next;
                  })
                }
              >
                ↑
              </button>
              <button
                disabled={collectionIndex === adminData.collections.length - 1}
                aria-label={`Move ${collection.title} later`}
                onClick={() =>
                  updateAdminCollection('collections', items => {
                    const next = [...items];
                    [next[collectionIndex], next[collectionIndex + 1]] = [
                      next[collectionIndex + 1],
                      next[collectionIndex],
                    ];
                    return next;
                  })
                }
              >
                ↓
              </button>
              <button
                onClick={() =>
                  updateAdminCollection('collections', items =>
                    items.map(item =>
                      item.id === collection.id
                        ? { ...item, status: item.status === 'live' ? 'draft' : 'live' }
                        : item
                    )
                  )
                }
              >
                {collection.status === 'live' ? 'Live' : 'Draft'}
              </button>
              <button
                className="is-danger"
                onClick={() =>
                  setSelectedItem({
                    type: 'delete-collection',
                    title: `Delete ${collection.title}?`,
                    status: 'Permanent action',
                    detail:
                      'The products stay in the catalogue; only this collection will be removed.',
                    collection,
                  })
                }
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div>
          {products
            .filter(product =>
              activeTab === 'Featured'
                ? product.featured && product.visible
                : activeTab === 'Drafts'
                ? !product.visible
                : true
            )
            .map(product => (
              <article key={product.id}>
                <img src={product.image} alt={product.name} />
                <span>
                  <strong>{product.name}</strong>
                  <small>
                    {product.category} · {product.price} · {product.stock} available
                  </small>
                </span>
                <button
                  className={product.featured ? 'is-on' : ''}
                  onClick={() =>
                    updateAdminCollection('products', items =>
                      items.map(item =>
                        item.id === product.id
                          ? { ...item, featured: !item.featured }
                          : item
                      )
                    )
                  }
                >
                  {product.featured ? 'Featured' : 'Feature'}
                </button>
                <button
                  onClick={() =>
                    updateAdminCollection('products', items =>
                      items.map(item =>
                        item.id === product.id
                          ? { ...item, visible: !item.visible }
                          : item
                      )
                    )
                  }
                >
                  {product.visible ? 'Live' : 'Draft'}
                </button>
                <button
                  disabled={!product.visible || Number(product.stock) < 1}
                  onClick={() =>
                    setStaffCart(items =>
                      items.some(item => item.id === product.id)
                        ? items.map(item =>
                            item.id === product.id
                              ? {
                                  ...item,
                                  qty: Math.min(Number(product.stock), item.qty + 1),
                                }
                              : item
                          )
                        : [...items, { ...product, qty: 1 }]
                    )
                  }
                >
                  {!product.visible
                    ? 'Draft item'
                    : Number(product.stock) < 1
                    ? 'Out of stock'
                    : 'Add to cart'}
                </button>
                <button
                  onClick={() => {
                    setEditingProduct(product);
                    setImagePreview(product.image || '');
                    setSecondaryImagePreview(product.secondaryImage || '');
                    setProductFormOpen(true);
                  }}
                >
                  Edit
                </button>
              </article>
            ))}
        </div>
      )}
    </section>
  );
}
