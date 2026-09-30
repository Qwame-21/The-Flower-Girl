// src/pages/ShopPOSPage.jsx
// Ported 1-for-1 verbatim from admin-monolith.html renderShopView() (lines 17775–18387)

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getOrders, saveOrders, logActivityEvent } from '../lib/ordersModel';
import CustomDropdown from '../components/shared/CustomDropdown';

const PRODUCTS_KEY = 'xa12-products-data-v1';

// Shared line-art motif set — thin single-weight stroke, no fill, ink-colored (Monolith lines 16732-16810)
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

const RAW_SNAPSHOT_PRODUCTS = [
  {
    id: "hamper-3750",
    name: "Luxury hamper",
    category: "hampers",
    price: 3750,
    stock: 25,
    image: "",
    description: "Laptop bag, Lacoste shirt, YSL perfume, Patek Philippe watch, manicure set and card.",
    tags: ["SIGNATURE"],
    active: true,
    syntheticSku: "HAM-3750",
    isSyntheticSku: true
  },
  {
    id: "christmas-bundle",
    name: "Christmas bundle",
    category: "bundles",
    price: 1250,
    stock: 20,
    image: "",
    description: "Six yards of Hollandaise fabric, Bodycology fragrance splash and an insulated tumbler.",
    tags: ["SEASONAL"],
    active: true,
    syntheticSku: "BUN-1250",
    isSyntheticSku: true
  },
  {
    id: "period-care",
    name: "Period care box",
    category: "care",
    price: 650,
    stock: 30,
    image: "",
    description: "Pads and panty liners, feminine wash and wipes, ginger tea with mint, cranberry juice, cookies and a hot water bottle. Monthly subscription available.",
    tags: ["SUBSCRIPTION"],
    active: true,
    syntheticSku: "CAR-0650",
    isSyntheticSku: true
  },
  {
    id: "fresh-bouquet",
    name: "Fresh flower bouquet",
    category: "flowers",
    price: 450,
    stock: 30,
    image: "",
    description: "A fresh arrangement selected around your preferred palette, occasion and delivery date.",
    tags: ["FRESH"],
    active: true,
    syntheticSku: "FLO-0450",
    isSyntheticSku: true
  },
  {
    id: "fragrance-gift",
    name: "Fragrance & treats gift",
    category: "hampers",
    price: 950,
    stock: 20,
    image: "",
    description: "A personalized combination of fragrance, premium chocolate, flowers and a handwritten card.",
    tags: ["FREQUENTLY CHOSEN"],
    active: true,
    syntheticSku: "HAM-0950",
    isSyntheticSku: true
  },
  {
    id: "personalized-bag",
    name: "Personalized wrist bag",
    category: "personalized",
    price: 650,
    stock: 20,
    image: "",
    description: "A wrist bag gift with optional name engraving, wrapping and additional accessories.",
    tags: ["PERSONALIZED"],
    active: true,
    syntheticSku: "PER-0650",
    isSyntheticSku: true
  },
  {
    id: "embroidery",
    name: "Embroidery & personalization",
    category: "personalized",
    price: 180,
    stock: 50,
    image: "",
    description: "Add a name or short personal detail to selected shirts, fabric gifts and accessories.",
    tags: ["MADE TO ORDER"],
    active: true,
    syntheticSku: "EMB-0180",
    isSyntheticSku: true
  }
];

const CATEGORY_MAP = {
  hampers: 'Hampers',
  bundles: 'Bundles',
  care: 'Care',
  flowers: 'Flowers',
  personalized: 'Personalized'
};

function normalizeProduct(p, idx = 0) {
  const categoryRaw = p.category || 'Flowers';
  const categoryTitle = CATEGORY_MAP[categoryRaw.toLowerCase()] || (categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1).toLowerCase());
  const catPrefix = categoryTitle.slice(0, 3).toUpperCase();
  const defaultCode = p.syntheticSku || `${catPrefix}-${101 + idx}`;

  return {
    id: String(p.id || `prod-${Date.now()}-${idx}`),
    code: String(p.code || p.sku || defaultCode),
    name: String(p.name || 'Unnamed Product'),
    category: categoryTitle,
    price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
    stock: typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0),
    threshold: typeof p.threshold === 'number' ? p.threshold : (parseInt(p.threshold, 10) || 3),
    salesCount: typeof p.salesCount === 'number' ? p.salesCount : 0,
    occasion: p.occasion || (p.tags && p.tags[0]) || 'Signature',
    isBundle: !!p.isBundle || categoryTitle === 'Bundles' || categoryTitle === 'Hampers',
    variants: p.variants || [],
    imageUrl: p.imageUrl || p.image || '',
    description: p.description || '',
    sizeType: p.sizeType || '',
    isBestseller: !!p.isBestseller,
    isTrending: !!p.isTrending,
    discountPercent: typeof p.discountPercent === 'number' ? p.discountPercent : (parseFloat(p.discountPercent) || 0)
  };
}

function loadProductsData() {
  try {
    const raw = localStorage.getItem(PRODUCTS_KEY);
    const list = raw ? JSON.parse(raw) : RAW_SNAPSHOT_PRODUCTS;
    return list.map((p, idx) => normalizeProduct(p, idx));
  } catch {
    return RAW_SNAPSHOT_PRODUCTS.map((p, idx) => normalizeProduct(p, idx));
  }
}

function saveProductsData(arr) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(arr));
  } catch {}
  window.dispatchEvent(new CustomEvent('xa12:orders-updated'));
}

function loadShopCart() {
  try {
    const savedCart = localStorage.getItem('shopCart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch {
    return [];
  }
}

function saveShopCart(cart) {
  try {
    localStorage.setItem('shopCart', JSON.stringify(cart));
  } catch {}
}

const INITIAL_FORM_DATA = {
  fullName: '',
  phone: '',
  email: '',
  address: '',
  apartment: '',
  townCity: '',
  region: '',
  country: 'Ghana',
  postalCode: '',
  landmark: '',
  locationLink: '',
  deliveryInstructions: '',
  deliveryDate: '',
  orderSource: 'Walk-in',
  paymentStatus: 'Awaiting payment'
};

export default function ShopPOSPage() {
  const [products, setProducts] = useState(loadProductsData);
  const [shopCart, setShopCart] = useState(loadShopCart);
  const [shopSearchQuery, setShopSearchQuery] = useState('');
  const [shopSelectedCategory, setShopSelectedCategory] = useState('ALL');
  const [isShopDrawerOpen, setIsShopDrawerOpen] = useState(false);

  const [shopFormData, setShopFormData] = useState(INITIAL_FORM_DATA);
  const [shopFormErrors, setShopFormErrors] = useState({});
  const [shopSuccessMessage, setShopSuccessMessage] = useState('');
  const [shopLastOrderCode, setShopLastOrderCode] = useState('');

  // Sync products when storage changes
  useEffect(() => {
    const handleSync = () => {
      setProducts(loadProductsData());
    };
    window.addEventListener('xa12:orders-updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('xa12:orders-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Sync cart helper
  const updateCart = (newCart) => {
    setShopCart(newCart);
    saveShopCart(newCart);
  };

  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isShopDrawerOpen) {
        setIsShopDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isShopDrawerOpen]);

  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  const searchLower = shopSearchQuery.toLowerCase().trim();
  const filteredProducts = products.filter(p => {
    const matchSearch = !searchLower || (
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.code && p.code.toLowerCase().includes(searchLower)) ||
      (p.category && p.category.toLowerCase().includes(searchLower))
    );
    const matchCategory = shopSelectedCategory === 'ALL' || p.category === shopSelectedCategory;
    return matchSearch && matchCategory;
  });

  const cartSubtotal = shopCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cartItemCount = shopCart.reduce((sum, item) => sum + item.qty, 0);

  const cartItemsWithStock = shopCart.map(item => {
    const product = products.find(p => p.id === item.id);
    return {
      ...item,
      availableStock: product ? product.stock : 0,
      isOutOfStock: product ? product.stock === 0 : false,
      maxQty: product ? product.stock : 0
    };
  });

  const handleAddToCart = (product) => {
    if (!product || product.stock <= 0) return;
    const existing = shopCart.find(item => item.id === product.id);
    let newCart;
    if (existing) {
      if (existing.qty < product.stock) {
        newCart = shopCart.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        newCart = shopCart;
      }
    } else {
      newCart = [
        ...shopCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          image: product.imageUrl,
          qty: 1
        }
      ];
    }
    updateCart(newCart);
    setIsShopDrawerOpen(true);
  };

  const handleDecreaseQty = (id) => {
    const item = shopCart.find(i => i.id === id);
    if (item && item.qty > 1) {
      const newCart = shopCart.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
      updateCart(newCart);
    }
  };

  const handleIncreaseQty = (id) => {
    const item = shopCart.find(i => i.id === id);
    const product = products.find(p => p.id === id);
    if (item && product && item.qty < product.stock) {
      const newCart = shopCart.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i);
      updateCart(newCart);
    }
  };

  const handleRemoveItem = (id) => {
    const newCart = shopCart.filter(item => item.id !== id);
    updateCart(newCart);
    if (newCart.length === 0) {
      setIsShopDrawerOpen(false);
    }
  };

  const handleFormFieldChange = (fieldName, value) => {
    setShopFormData(prev => ({ ...prev, [fieldName]: value }));
    setShopFormErrors(prev => ({ ...prev, [fieldName]: '' }));
  };

  const handlePlaceOrder = () => {
    const errors = {};
    if (!shopFormData.fullName.trim()) errors.fullName = 'Full name is required';
    if (!shopFormData.phone.trim()) errors.phone = 'Phone is required';
    if (!shopFormData.address.trim()) errors.address = 'Delivery address is required';
    if (!shopFormData.townCity.trim()) errors.townCity = 'Town/City is required';
    if (!shopFormData.region.trim()) errors.region = 'Region/State is required';
    if (!shopFormData.deliveryDate.trim()) errors.deliveryDate = 'Delivery date is required';
    if (shopCart.length === 0) errors.cart = 'At least one item is required';

    if (Object.keys(errors).length > 0) {
      setShopFormErrors(errors);
      return;
    }

    const orders = getOrders();
    const orderCode = `GF-2026-${Math.floor(10000 + Math.random() * 90000)}`;
    const orderId = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalAmount = shopCart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const newOrder = {
      id: orderId,
      orderCode: orderCode,
      customerName: shopFormData.fullName,
      phone: shopFormData.phone,
      email: shopFormData.email,
      source: shopFormData.orderSource.toLowerCase().replace(' ', '-'),
      items: shopCart.map(item => ({
        productId: item.id,
        sku: products.find(p => p.id === item.id)?.code || item.id,
        name: item.name,
        variant: '',
        qty: item.qty,
        unitPrice: item.price,
        category: item.category
      })),
      amount: totalAmount,
      paymentStatus: shopFormData.paymentStatus === 'Paid' ? 'paid' : 'pending',
      fulfillmentStatus: 'preparing',
      deliveryAddress: shopFormData.address,
      deliveryWindow: shopFormData.deliveryDate,
      estimatedDelivery: shopFormData.deliveryDate,
      estimatedDeliveryAt: { date: shopFormData.deliveryDate, window: '', from: '', to: '' },
      adminNote: shopFormData.deliveryInstructions,
      riderAssigned: '',
      orderDate: new Date().toISOString(),
      auditLog: [{ time: 'Just now', note: `Order created via ${shopFormData.orderSource}` }]
    };

    orders.unshift(newOrder);
    saveOrders(orders);

    // Update stock in products catalog
    const updatedProducts = products.map(product => {
      const cartItem = shopCart.find(item => item.id === product.id);
      if (cartItem) {
        return {
          ...product,
          stock: Math.max(0, product.stock - cartItem.qty)
        };
      }
      return product;
    });

    setProducts(updatedProducts);
    saveProductsData(updatedProducts);

    logActivityEvent({
      type: 'order',
      text: `New order ${orderCode} · GHS ${totalAmount.toFixed(2)}`
    });

    setShopLastOrderCode(orderCode);
    setShopSuccessMessage(`Order ${orderCode} placed successfully!`);
    updateCart([]);
    setShopFormData(INITIAL_FORM_DATA);
    setShopFormErrors({});
  };

  const renderFormField = (name, label, value, error, type = 'text') => {
    return (
      <div className="shop-field-group">
        <label className="shop-field-label">{label}</label>
        <input
          type={type}
          className={`shop-field-input ${error ? 'shop-error' : ''}`}
          id={`shopField_${name}`}
          value={value}
          onChange={(e) => handleFormFieldChange(name, e.target.value)}
          placeholder={label.replace(' *', '')}
        />
        {error && <span className="shop-field-error">{error}</span>}
      </div>
    );
  };

  return (
    <div className="shop-pos-container">
      {/* Main Product Grid Area */}
      <div className="shop-main-area">
        {/* Search */}
        <div className="shop-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            id="shopSearchInput"
            placeholder="Search by name, code or category"
            value={shopSearchQuery}
            onChange={(e) => setShopSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Chips */}
        <div className="shop-chips" role="group" aria-label="Category filters">
          <button
            type="button"
            className={`shop-chip ${shopSelectedCategory === 'ALL' ? 'shop-on' : ''}`}
            data-cat="ALL"
            aria-pressed={shopSelectedCategory === 'ALL'}
            onClick={() => setShopSelectedCategory('ALL')}
          >
            All <small>{products.length}</small>
          </button>
          {categories.map(cat => {
            const count = products.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                className={`shop-chip ${shopSelectedCategory === cat ? 'shop-on' : ''}`}
                data-cat={cat}
                aria-pressed={shopSelectedCategory === cat}
                onClick={() => setShopSelectedCategory(cat)}
              >
                {cat} <small>{count}</small>
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="shop-product-grid">
          {filteredProducts.length > 0 ? filteredProducts.map(p => {
            const cartItem = shopCart.find(item => item.id === p.id);
            const cartQty = cartItem ? cartItem.qty : 0;
            const lowThreshold = p.low_stock_threshold !== undefined ? p.low_stock_threshold : (p.threshold !== undefined ? p.threshold : 3);
            const isOutOfStock = p.stock === 0;
            const isLowStock = p.stock > 0 && p.stock <= lowThreshold;
            const canAdd = !isOutOfStock && cartQty < p.stock;

            return (
              <div
                key={p.id}
                className={`shop-card shop-product-card ${isOutOfStock ? 'shop-out' : ''}`}
                data-id={p.id}
              >
                <div className="card-media-bg">
                  {p.imageUrl ? (
                    <>
                      <img
                        src={p.imageUrl}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextElementSibling) {
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }
                        }}
                      />
                      <div
                        className="card-placeholder-fallback"
                        style={{ display: 'none' }}
                        dangerouslySetInnerHTML={{ __html: getPlaceholderSvg(p.category) }}
                      />
                    </>
                  ) : (
                    <div
                      className="card-placeholder-fallback"
                      dangerouslySetInnerHTML={{ __html: getPlaceholderSvg(p.category) }}
                    />
                  )}
                </div>

                <div className="shop-tags">
                  {isOutOfStock ? (
                    <span className="shop-badge shop-out-badge">Out of stock</span>
                  ) : isLowStock ? (
                    <span className="shop-badge shop-low-badge">Low · {p.stock} left</span>
                  ) : (
                    <span className="shop-badge shop-stock-badge">{p.stock} in stock</span>
                  )}
                </div>

                <div className="shop-card-body">
                  <span className="shop-card-name">{p.name}</span>
                  <div className="shop-card-bottom">
                    <span className="shop-card-code">{p.code}</span>
                    <span className="shop-card-price">GHS {Math.round(p.price)}</span>
                  </div>
                </div>

                {canAdd && (
                  <button
                    type="button"
                    className="shop-add-btn"
                    data-id={p.id}
                    onClick={() => handleAddToCart(p)}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add
                  </button>
                )}
              </div>
            );
          }) : (
            <div className="shop-empty-state">
              <span className="shop-empty-text">No products match your search</span>
            </div>
          )}
        </div>
      </div>

      {/* Cart Indicator Pill */}
      <div
        className={`shop-cart-indicator ${cartItemCount > 0 ? 'shop-has-items' : ''}`}
        id="shopCartIndicator"
        style={{ display: cartItemCount > 0 ? 'flex' : 'none' }}
        onClick={() => setIsShopDrawerOpen(true)}
      >
        <div className="shop-cart-info">
          <span className="shop-cart-count">{cartItemCount} items</span>
          <span className="shop-cart-total">GHS {Math.round(cartSubtotal)}</span>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      </div>

      {/* Order Drawer (reusing existing drawer component) */}
      <div
        className={`drawer-overlay ${isShopDrawerOpen ? 'open' : ''}`}
        id="shopDrawerOverlay"
        onClick={(e) => {
          if (e.target.id === 'shopDrawerOverlay') {
            setIsShopDrawerOpen(false);
          }
        }}
      >
        <div className="drawer-panel" id="shopDrawerPanel">
          <div className="drawer-header">
            <div>
              <h3 className="drawer-title" style={{ margin: 0 }}>Current Order</h3>
              <span className="shop-panel-count" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {cartItemCount} items
              </span>
            </div>
            <button
              type="button"
              className="drawer-close-btn"
              id="closeShopDrawerBtn"
              onClick={() => setIsShopDrawerOpen(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="drawer-body">
            {shopSuccessMessage && (
              <div className="shop-success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Order {shopLastOrderCode} placed successfully!</span>
                <Link to="/orders" className="shop-view-orders-link">View in Orders</Link>
              </div>
            )}

            {/* Cart Items */}
            <div className="shop-cart-items">
              {cartItemsWithStock.length > 0 ? cartItemsWithStock.map(item => {
                const product = products.find(p => p.id === item.id);
                const code = item.code || (product ? product.code : '');
                return (
                  <div key={item.id} className="shop-cart-item" data-id={item.id}>
                    <div className="shop-item-media">
                      {item.image ? (
                        <>
                          <img
                            src={item.image}
                            alt={item.name}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'grid';
                              }
                            }}
                          />
                          <div
                            style={{ display: 'none', width: '100%', height: '100%', placeItems: 'center' }}
                            dangerouslySetInnerHTML={{ __html: getPlaceholderSvg(item.category) }}
                          />
                        </>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: getPlaceholderSvg(item.category) }} />
                      )}
                    </div>
                    <div className="shop-item-details">
                      <span className="shop-item-name">{item.name}</span>
                      {code && <span className="shop-item-code">{code}</span>}
                      <span className="shop-item-price">GHS {Math.round(item.price)} each</span>
                    </div>
                    <div className="shop-item-qty">
                      <button
                        type="button"
                        className="shop-qty-btn shop-minus"
                        data-id={item.id}
                        disabled={item.qty <= 1}
                        aria-label="Decrease quantity"
                        onClick={() => handleDecreaseQty(item.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <span className="shop-qty-value">{item.qty}</span>
                      <button
                        type="button"
                        className="shop-qty-btn shop-plus"
                        data-id={item.id}
                        disabled={item.qty >= item.maxQty}
                        aria-label="Increase quantity"
                        onClick={() => handleIncreaseQty(item.id)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                      </button>
                    </div>
                    <div className="shop-item-total">GHS {Math.round(item.price * item.qty)}</div>
                    <button
                      type="button"
                      className="shop-item-remove"
                      data-id={item.id}
                      aria-label="Remove item"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                );
              }) : (
                <div className="shop-cart-empty">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
                    <circle cx="9" cy="21" r="1" />
                    <circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span className="shop-empty-text">Your cart is empty</span>
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="shop-totals">
              <div className="shop-total-row">
                <span>Subtotal</span>
                <span>GHS {Math.round(cartSubtotal)}</span>
              </div>
              <div className="shop-total-row shop-total-final">
                <span>Total</span>
                <span>GHS {Math.round(cartSubtotal)}</span>
              </div>
            </div>

            {/* Customer Form */}
            <div className="shop-form-section">
              <div className="shop-form-title">Customer Details</div>

              <div className="shop-form-grid">
                {renderFormField('fullName', 'Full name *', shopFormData.fullName, shopFormErrors.fullName)}
                {renderFormField('phone', 'Phone *', shopFormData.phone, shopFormErrors.phone)}
              </div>

              {renderFormField('email', 'Email (optional)', shopFormData.email, shopFormErrors.email)}
              {renderFormField('address', 'Delivery address *', shopFormData.address, shopFormErrors.address)}
              {renderFormField('apartment', 'Apartment/suite (optional)', shopFormData.apartment, shopFormErrors.apartment)}

              <div className="shop-form-grid">
                {renderFormField('townCity', 'Town/City *', shopFormData.townCity, shopFormErrors.townCity)}
                {renderFormField('region', 'Region/State *', shopFormData.region, shopFormErrors.region)}
              </div>

              <div className="shop-form-grid">
                {renderFormField('country', 'Country', shopFormData.country, shopFormErrors.country)}
                {renderFormField('postalCode', 'Postal code (optional)', shopFormData.postalCode, shopFormErrors.postalCode)}
              </div>

              {renderFormField('landmark', 'Nearest landmark', shopFormData.landmark, shopFormErrors.landmark)}
              {renderFormField('locationLink', 'Google Maps link (optional)', shopFormData.locationLink, shopFormErrors.locationLink)}
              {renderFormField('deliveryInstructions', 'Delivery instructions', shopFormData.deliveryInstructions, shopFormErrors.deliveryInstructions)}
              {renderFormField('deliveryDate', 'Delivery date *', shopFormData.deliveryDate, shopFormErrors.deliveryDate, 'date')}
            </div>

            {/* Order Options */}
            <div className="shop-form-section">
              <div className="shop-form-title">Order Options</div>

              <div className="shop-field-group">
                <label className="shop-field-label">Order source</label>
                <div id="shopOrderSourceContainer">
                  <CustomDropdown
                    options={[
                      { value: 'Walk-in', label: 'Walk-in' },
                      { value: 'Phone call', label: 'Phone call' },
                      { value: 'WhatsApp', label: 'WhatsApp' },
                      { value: 'Instagram', label: 'Instagram' }
                    ]}
                    value={shopFormData.orderSource}
                    onChange={(val) => handleFormFieldChange('orderSource', val)}
                  />
                </div>
              </div>

              <div className="shop-field-group">
                <label className="shop-field-label">Payment status</label>
                <div id="shopPaymentStatusContainer">
                  <CustomDropdown
                    options={[
                      { value: 'Paid', label: 'Paid' },
                      { value: 'Awaiting payment', label: 'Awaiting payment' }
                    ]}
                    value={shopFormData.paymentStatus}
                    onChange={(val) => handleFormFieldChange('paymentStatus', val)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="drawer-footer">
            <button
              type="button"
              className="shop-submit-btn"
              id="shopPlaceOrderBtn"
              disabled={cartItemCount === 0}
              onClick={handlePlaceOrder}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
