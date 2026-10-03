// src/pages/ProductsPage.jsx
// Rewired to use Supabase instead of localStorage

import { useState, useEffect, useRef } from 'react';
import CustomDropdown from '../components/shared/CustomDropdown';
import { getImageUrl } from '../lib/imageUrlHelper';
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion
} from '../data/products';

const DEFAULT_PRODUCTS = [
  {
    id: 'hamper-3750',
    name: 'Luxury hamper',
    slug: 'luxury-hamper',
    category: 'hampers',
    price: 3750,
    stock: 25,
    low_stock_threshold: 3,
    tag: 'SIGNATURE',
    description: 'Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.',
    details: ['Premium gift box', 'Fashion and fragrance selection', 'Watch and grooming pieces', 'Personal message card'],
    image_path: 'hamper-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 0
  },
  {
    id: 'christmas-bundle',
    name: 'Christmas bundle',
    slug: 'christmas-bundle',
    category: 'bundles',
    price: 1250,
    stock: 20,
    low_stock_threshold: 3,
    tag: 'SEASONAL',
    description: 'Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.',
    details: ['Hollandaise fabric', 'Fragrance splash', 'Insulated tumbler', 'Gift presentation'],
    image_path: 'engagement-presentation-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 1
  },
  {
    id: 'period-care',
    name: 'Period care box',
    slug: 'period-care-box',
    category: 'care',
    price: 650,
    stock: 30,
    low_stock_threshold: 5,
    tag: 'SUBSCRIPTION',
    description: 'Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle. Monthly subscription available.',
    details: ['Period-care essentials', 'Tea, juice and cookies', 'Hot water bottle', 'Optional monthly delivery'],
    image_path: 'wrapping-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 2
  },
  {
    id: 'fresh-bouquet',
    name: 'Fresh flower bouquet',
    slug: 'fresh-flower-bouquet',
    category: 'flowers',
    price: 450,
    stock: 30,
    low_stock_threshold: 5,
    tag: 'FRESH',
    description: 'A fresh arrangement selected around your preferred palette, occasion and delivery date.',
    details: ['Seasonal fresh flowers', 'Chosen colour direction', 'Hand-tied finishing', 'Message card'],
    image_path: 'bouquet-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 3
  },
  {
    id: 'fragrance-gift',
    name: 'Fragrance & treats gift',
    slug: 'fragrance-treats-gift',
    category: 'hampers',
    price: 950,
    stock: 20,
    low_stock_threshold: 3,
    tag: 'FREQUENTLY CHOSEN',
    description: 'A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.',
    details: ['Fragrance selection', 'Premium chocolates', 'Fresh floral accent', 'Handwritten card'],
    image_path: 'basket-hamper-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 4
  },
  {
    id: 'personalized-bag',
    name: 'Personalized wrist bag',
    slug: 'personalized-wrist-bag',
    category: 'personalized',
    price: 650,
    stock: 20,
    low_stock_threshold: 3,
    tag: 'PERSONALIZED',
    description: 'A wrist bag gift with optional name engraving, wrapping and additional accessories.',
    details: ['Wrist bag', 'Optional name finishing', 'Gift wrapping', 'Selected accessories'],
    image_path: 'delivery-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 5
  },
  {
    id: 'embroidery',
    name: 'Embroidery & personalization',
    slug: 'embroidery-personalization',
    category: 'personalized',
    price: 180,
    stock: 50,
    low_stock_threshold: 10,
    tag: 'MADE TO ORDER',
    description: 'Add a name or short personal detail to selected shirts, fabric gifts and accessories.',
    details: ['Name or short wording', 'Thread colour selection', 'Placement confirmation', 'Production approval'],
    image_path: 'embroidery-editorial-v2.png',
    secondary_image_path: null,
    visible: true,
    sort_order: 6
  }
];

const CATEGORY_MAP = {
  hampers: 'Hampers',
  bundles: 'Bundles',
  care: 'Care',
  flowers: 'Flowers',
  personalized: 'Personalized'
};

function getPlaceholderSvg(category) {
  const motifs = {
    hampers: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--ink,#1c1c1b)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="34" width="56" height="36" rx="2"/><rect x="8" y="26" width="64" height="10" rx="2"/><line x1="40" y1="26" x2="40" y2="70"/><path d="M40 26 C 32 14, 16 20, 40 26"/><path d="M40 26 C 48 14, 64 20, 40 26"/></svg>`,
    bundles: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--ink,#1c1c1b)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="12" y="34" width="56" height="36" rx="2"/><rect x="8" y="26" width="64" height="10" rx="2"/><line x1="40" y1="26" x2="40" y2="70"/><path d="M40 26 C 32 14, 16 20, 40 26"/><path d="M40 26 C 48 14, 64 20, 40 26"/></svg>`,
    care: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--ink,#1c1c1b)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="26" y="28" width="28" height="42" rx="6"/><rect x="32" y="18" width="16" height="12" rx="3"/><rect x="30" y="12" width="20" height="8" rx="2"/><line x1="32" y1="42" x2="48" y2="42"/><line x1="34" y1="49" x2="46" y2="49"/></svg>`,
    flowers: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--ink,#1c1c1b)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M40 70 Q 40 50 40 28"/><path d="M40 52 Q 28 46 28 38"/><path d="M40 52 Q 52 46 52 38"/><circle cx="40" cy="22" r="6"/><ellipse cx="40" cy="12" rx="4" ry="6" transform="rotate(0 40 22)"/><ellipse cx="50" cy="22" rx="4" ry="6" transform="rotate(90 40 22)"/><ellipse cx="40" cy="32" rx="4" ry="6" transform="rotate(180 40 22)"/><ellipse cx="30" cy="22" rx="4" ry="6" transform="rotate(270 40 22)"/></svg>`,
    personalized: `<svg width="80" height="80" viewBox="0 0 80 80" fill="none" stroke="var(--ink,#1c1c1b)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 16 L62 16 L62 56 L40 70 L18 56 Z"/><circle cx="40" cy="22" r="4"/><line x1="28" y1="34" x2="52" y2="34"/><line x1="30" y1="42" x2="50" y2="42"/><path d="M40 16 L40 8 M34 10 Q40 6 46 10"/></svg>`
  };
  const key = (category || '').toLowerCase();
  return motifs[key] || motifs.hampers;
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDefaults, setShowDefaults] = useState(false);
  const [importing, setImporting] = useState(false);
  const [productsSearchQuery, setProductsSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [formError, setFormError] = useState('');

  const fileInputRef = useRef(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('hampers');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formThreshold, setFormThreshold] = useState('3');
  const [formTag, setFormTag] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formImagePath, setFormImagePath] = useState('');
  const [formSecondaryImagePath, setFormSecondaryImagePath] = useState('');
  const [formVisible, setFormVisible] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState('0');

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, promotionsData] = await Promise.all([
          listProducts(),
          listPromotions()
        ]);
        setProducts(productsData);
        setPromotions(promotionsData);
        setShowDefaults(productsData.length === 0);
        setLoading(false);
      } catch (err) {
        console.error('Error loading products:', err);
        setError('Failed to load products. Please try again.');
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const openAddDrawer = () => {
    setEditingProductId(null);
    setFormName('');
    setFormSlug('');
    setFormCategory('hampers');
    setFormPrice('');
    setFormStock('10');
    setFormThreshold('3');
    setFormTag('');
    setFormDescription('');
    setFormDetails('');
    setFormImagePath('');
    setFormSecondaryImagePath('');
    setFormVisible(true);
    setFormSortOrder('0');
    setFormError('');
    setIsDrawerOpen(true);
  };

  const openEditDrawer = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setEditingProductId(productId);
    setFormName(product.name);
    setFormSlug(product.slug);
    setFormCategory(product.category);
    setFormPrice(String(product.price));
    setFormStock(String(product.stock));
    setFormThreshold(String(product.low_stock_threshold));
    setFormTag(product.tag || '');
    setFormDescription(product.description || '');
    setFormDetails(Array.isArray(product.details) ? product.details.join(', ') : '');
    setFormImagePath(product.image_path || '');
    setFormSecondaryImagePath(product.secondary_image_path || '');
    setFormVisible(product.visible);
    setFormSortOrder(String(product.sort_order));
    setFormError('');
    setIsDrawerOpen(true);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setEditingProductId(null);
  };

  const handleSaveProduct = async () => {
    setFormError('');

    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }
    if (!formSlug.trim()) {
      setFormError('Slug is required');
      return;
    }
    if (!formPrice || isNaN(parseFloat(formPrice))) {
      setFormError('Valid price is required');
      return;
    }
    if (!formStock || isNaN(parseInt(formStock))) {
      setFormError('Valid stock is required');
      return;
    }

    const productData = {
      id: editingProductId || formSlug,
      name: formName,
      slug: formSlug,
      category: formCategory,
      price: parseFloat(formPrice),
      stock: parseInt(formStock),
      low_stock_threshold: parseInt(formThreshold),
      tag: formTag,
      description: formDescription,
      details: formDetails ? formDetails.split(',').map(d => d.trim()) : [],
      image_path: formImagePath,
      secondary_image_path: formSecondaryImagePath,
      visible: formVisible,
      sort_order: parseInt(formSortOrder)
    };

    let result;
    if (editingProductId) {
      result = await updateProduct(editingProductId, productData);
    } else {
      result = await createProduct(productData);
    }

    if (!result.success) {
      setFormError(result.error);
      return;
    }

    // Reload products
    const updatedProducts = await listProducts();
    setProducts(updatedProducts);
    closeDrawer();
  };

  const handleDeleteProduct = async (productId) => {
    const result = await deleteProduct(productId);
    if (result.success) {
      const updatedProducts = await listProducts();
      setProducts(updatedProducts);
      setConfirmDeleteId(null);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const productId = editingProductId || formSlug;
    const result = await uploadProductImage(file, productId);

    if (result.success) {
      setFormImagePath(result.path);
    } else {
      setFormError(result.error);
    }
  };

  const handleImportDefaults = async () => {
    setImporting(true);
    try {
      for (const product of DEFAULT_PRODUCTS) {
        const existing = products.find(p => p.slug === product.slug);
        if (!existing) {
          await createProduct(product);
        }
      }
      const updatedProducts = await listProducts();
      setProducts(updatedProducts);
      setShowDefaults(false);
    } catch (err) {
      console.error('Error importing default products:', err);
      setFormError('Failed to import default products');
    } finally {
      setImporting(false);
    }
  };

  const lowStockCount = products.filter(p => p.stock <= p.low_stock_threshold && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchSearch = !productsSearchQuery ||
      p.name.toLowerCase().includes(productsSearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(productsSearchQuery.toLowerCase());
    const matchCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    return matchSearch && matchCategory;
  });

  const getPromotionPercent = (productId) => {
    const promo = promotions.find(p => p.product_id === productId && p.status === 'active');
    if (!promo) return 0;
    const now = new Date();
    const starts = promo.starts_at ? new Date(promo.starts_at) : null;
    const ends = promo.ends_at ? new Date(promo.ends_at) : null;
    if (starts && now < starts) return 0;
    if (ends && now > ends) return 0;
    return promo.percent;
  };

  if (showDefaults) {
    return (
      <div className="page-container">
        <div className="page-header-row">
          <div className="page-title-group">
            <h2>Products</h2>
            <p>Manage product catalog, stock, and promotions.</p>
          </div>
        </div>
        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '12px' }}>No Products Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Import the default product catalog to get started. These products will be stored in Supabase and can be edited later.
          </p>
          <button
            type="button"
            onClick={handleImportDefaults}
            disabled={importing}
            style={{ padding: '12px 24px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', cursor: importing ? 'not-allowed' : 'pointer', fontSize: '14px' }}
          >
            {importing ? 'Importing...' : 'Import Default Products'}
          </button>
          <div style={{ marginTop: '32px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '16px', fontSize: '14px' }}>Default Products:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {DEFAULT_PRODUCTS.map(p => (
                <div key={p.id} style={{ padding: '12px', background: 'rgba(26,26,26,0.04)', borderRadius: '6px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>{p.name}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{CATEGORY_MAP[p.category] || p.category}</div>
                  <div style={{ marginTop: '4px' }}>GHS {p.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="page-container">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '12px' }}>Error Loading Products</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const displayProducts = showDefaults ? DEFAULT_PRODUCTS.map(p => ({ ...p, _isDefault: true })) : products;

  const lowStockCount = displayProducts.filter(p => p.stock <= p.low_stock_threshold && p.stock > 0).length;
  const outOfStockCount = displayProducts.filter(p => p.stock === 0).length;

  const categories = Array.from(new Set(displayProducts.map(p => p.category)));

  const filteredProducts = displayProducts.filter(p => {
    const matchSearch = !productsSearchQuery ||
      p.name.toLowerCase().includes(productsSearchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(productsSearchQuery.toLowerCase());
    const matchCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div className="page-title-group">
          <h2>Products</h2>
          <p>Manage product catalog, stock, and promotions.</p>
        </div>
        <div className="header-actions">
          <button className="xp-pill xp-solid" type="button" onClick={openAddDrawer}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Products</div>
          <div style={{ fontSize: '24px', fontWeight: 600 }}>{products.length}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Low Stock</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: lowStockCount > 0 ? '#f59e0b' : 'inherit' }}>{lowStockCount}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Out of Stock</div>
          <div style={{ fontSize: '24px', fontWeight: 600, color: outOfStockCount > 0 ? '#ef4444' : 'inherit' }}>{outOfStockCount}</div>
        </div>
      </div>

      {/* Search and filter */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={productsSearchQuery}
          onChange={e => setProductsSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '10px 16px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '8px', fontSize: '14px' }}
        />
        <select
          value={selectedCategoryFilter}
          onChange={e => setSelectedCategoryFilter(e.target.value)}
          style={{ padding: '10px 16px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '8px', fontSize: '14px' }}
        >
          <option value="ALL">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_MAP[cat] || cat}</option>
          ))}
        </select>
      </div>

      {/* Products grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filteredProducts.map(product => {
          const discountPercent = getPromotionPercent(product.id);
          const discountedPrice = discountPercent > 0
            ? product.price * (1 - discountPercent / 100)
            : product.price;
          const isOutOfStock = product.stock === 0;
          const isLowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;

          return (
            <div
              key={product.id}
              style={{
                background: 'var(--card-bg)',
                borderRadius: '12px',
                border: '1px solid rgba(26,26,26,0.08)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '1', background: '#f5f5f5' }}>
                {product.image_path ? (
                  <img
                    src={getImageUrl(product.image_path)}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    dangerouslySetInnerHTML={{ __html: getPlaceholderSvg(product.category) }}
                  />
                )}
                {product._isDefault && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    background: 'rgba(245, 158, 11, 0.9)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    Not yet imported
                  </div>
                )}
                {!product.visible && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.6)',
                    color: '#fff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}>
                    Hidden
                  </div>
                )}
              </div>

              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>{product.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  {CATEGORY_MAP[product.category] || product.category}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    {discountPercent > 0 && (
                      <s style={{ fontSize: '12px', color: 'var(--text-muted)', marginRight: '4px' }}>
                        GHS {product.price}
                      </s>
                    )}
                    <span style={{ fontSize: '16px', fontWeight: 600 }}>
                      GHS {discountedPrice.toFixed(2)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : 'inherit' }}>
                    {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', borderTop: '1px solid rgba(26,26,26,0.08)' }}>
                <button
                  type="button"
                  onClick={() => openEditDrawer(product.id)}
                  disabled={product._isDefault}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', cursor: product._isDefault ? 'not-allowed' : 'pointer', fontSize: '13px', opacity: product._isDefault ? 0.5 : 1 }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(product.id)}
                  disabled={product._isDefault}
                  style={{ flex: 1, padding: '10px', background: 'transparent', border: 'none', borderLeft: '1px solid rgba(26,26,26,0.08)', cursor: product._isDefault ? 'not-allowed' : 'pointer', fontSize: '13px', color: '#ef4444', opacity: product._isDefault ? 0.5 : 1 }}
                >
                  Delete
                </button>
              </div>

              {confirmDeleteId === product.id && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px'
                }}>
                  <p style={{ marginBottom: '16px', textAlign: 'center' }}>Delete this product?</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      style={{ padding: '8px 16px', background: 'rgba(26,26,26,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Drawer */}
      {isDrawerOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1000
            }}
            onClick={closeDrawer}
          />
          <div
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '400px',
              background: '#fff',
              zIndex: 1001,
              padding: '24px',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ marginBottom: '24px' }}>{editingProductId ? 'Edit Product' : 'Add Product'}</h3>

            {formError && (
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Slug *</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={e => setFormSlug(e.target.value)}
                  disabled={!!editingProductId}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px', background: editingProductId ? '#f5f5f5' : 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Category *</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                >
                  {Object.entries(CATEGORY_MAP).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Price (GHS) *</label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={e => setFormPrice(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Stock *</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={e => setFormStock(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Low Stock Threshold</label>
                <input
                  type="number"
                  value={formThreshold}
                  onChange={e => setFormThreshold(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Tag</label>
                <input
                  type="text"
                  value={formTag}
                  onChange={e => setFormTag(e.target.value)}
                  placeholder="e.g., SIGNATURE, SEASONAL"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Description</label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px', resize: 'vertical' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Details (comma-separated)</label>
                <input
                  type="text"
                  value={formDetails}
                  onChange={e => setFormDetails(e.target.value)}
                  placeholder="Feature 1, Feature 2, Feature 3"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Primary Image</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  style={{ width: '100%' }}
                />
                {formImagePath && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formImagePath}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Secondary Image (optional)</label>
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const productId = editingProductId || formSlug;
                    const result = await uploadProductImage(file, `${productId}-secondary`);
                    if (result.success) {
                      setFormSecondaryImagePath(result.path);
                    } else {
                      setFormError(result.error);
                    }
                  }}
                  accept="image/*"
                  style={{ width: '100%' }}
                />
                {formSecondaryImagePath && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {formSecondaryImagePath}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="formVisible"
                  checked={formVisible}
                  onChange={e => setFormVisible(e.target.checked)}
                />
                <label htmlFor="formVisible" style={{ fontSize: '13px' }}>Visible on storefront</label>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Sort Order</label>
                <input
                  type="number"
                  value={formSortOrder}
                  onChange={e => setFormSortOrder(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid rgba(26,26,26,0.14)', borderRadius: '6px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={handleSaveProduct}
                  style={{ flex: 1, padding: '10px', background: '#1a1a1a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={closeDrawer}
                  style={{ flex: 1, padding: '10px', background: 'rgba(26,26,26,0.1)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
