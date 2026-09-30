// src/pages/ProductsPage.jsx
// Ported 1-for-1 verbatim from admin-monolith.html renderProductsView() (lines 16870–17645)
// Storage key: 'xa12-products-data-v1'

import { useState, useRef } from 'react';
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

const getCatalogProducts = () => {
  return RAW_SNAPSHOT_PRODUCTS.map(p => ({
    id: p.id,
    name: p.name,
    category: CATEGORY_MAP[p.category] || p.category,
    price: p.price,
    stock: p.stock,
    threshold: 5,
    salesCount: 0,
    occasion: (p.tags && p.tags[0]) ? p.tags[0] : 'Signature',
    isBundle: p.category === 'bundles' || p.category === 'hampers',
    variants: [],
    imageUrl: (p.image && !p.image.startsWith('/assets/')) ? p.image : '',
    description: p.description || ''
  }));
};

function normalizeProduct(p, idx = 0) {
  const categoryRaw = p.category || 'Flowers';
  const categoryTitle = categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1).toLowerCase();
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
    const list = raw ? JSON.parse(raw) : getCatalogProducts();
    return list.map((p, idx) => normalizeProduct(p, idx));
  } catch {
    return getCatalogProducts().map((p, idx) => normalizeProduct(p, idx));
  }
}

function saveProductsData(arr) {
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(arr));
  } catch {}
  window.dispatchEvent(new CustomEvent('xa12:orders-updated'));
}

export default function ProductsPage() {
  const [products, setProducts] = useState(loadProductsData);
  const [productsSearchQuery, setProductsSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [isBulkPanelOpen, setIsBulkPanelOpen] = useState(false);
  const [selectedBulkCategory, setSelectedBulkCategory] = useState('ALL');
  const [bulkDiscountInput, setBulkDiscountInput] = useState('');
  const [bulkStatusMessageText, setBulkStatusMessageText] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fileInputRef = useRef(null);

  // Form state for drawer
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formCategory, setFormCategory] = useState('Hampers');
  const [formNewCategoryInput, setFormNewCategoryInput] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formThreshold, setFormThreshold] = useState('3');
  const [formDiscount, setFormDiscount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSizeType, setFormSizeType] = useState('');
  const [formBestseller, setFormBestseller] = useState(false);
  const [formTrending, setFormTrending] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState('');

  const updateProducts = (newList) => {
    setProducts(newList);
    saveProductsData(newList);
  };

  const getGlobalThreshold = (p) => {
    if (p && typeof p.low_stock_threshold === 'number') return p.low_stock_threshold;
    if (p && typeof p.threshold === 'number') return p.threshold;
    return 3;
  };

  const lowStockCount = products.filter(p => p.stock <= getGlobalThreshold(p) && p.stock > 0).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const allCategories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  const activeCategories = allCategories;

  const searchLower = productsSearchQuery.toLowerCase().trim();
  const filteredProducts = products.filter(p => {
    const matchSearch = !searchLower || (
      (p.name && p.name.toLowerCase().includes(searchLower)) ||
      (p.code && p.code.toLowerCase().includes(searchLower)) ||
      (p.category && p.category.toLowerCase().includes(searchLower))
    );
    const matchCategory = selectedCategoryFilter === 'ALL' || p.category === selectedCategoryFilter;
    return matchSearch && matchCategory;
  });

  const allCollapsed = activeCategories.length > 0 && activeCategories.every(cat => collapsedCategories.has(cat));
  const isSearching = searchLower.length > 0;

  const handleToggleAll = () => {
    if (allCollapsed) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(activeCategories));
    }
  };

  const toggleCategoryCollapse = (category) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const isDrawerOpen = isAddFormOpen || !!editingProductId;

  const openAddDrawer = () => {
    setEditingProductId(null);
    setIsAddFormOpen(true);
    setFormName('');
    const catPrefix = 'Hampers'.slice(0, 3).toUpperCase();
    setFormCode(`${catPrefix}-${101 + products.length}`);
    setFormCategory('Hampers');
    setFormNewCategoryInput('');
    setFormPrice('');
    setFormStock('10');
    setFormThreshold('3');
    setFormDiscount('');
    setFormDescription('');
    setFormSizeType('');
    setFormBestseller(false);
    setFormTrending(false);
    setFormImageUrl('');
    setFormError('');
  };

  const openEditDrawer = (id) => {
    const p = products.find(x => x.id === id);
    if (!p) return;
    setEditingProductId(id);
    setIsAddFormOpen(false);
    setFormName(p.name || '');
    setFormCode(p.code || '');
    setFormCategory(p.category || 'Hampers');
    setFormNewCategoryInput('');
    setFormPrice(p.price !== undefined ? String(p.price) : '');
    setFormStock(p.stock !== undefined ? String(p.stock) : '10');
    setFormThreshold(p.threshold !== undefined ? String(p.threshold) : '3');
    setFormDiscount(p.discountPercent ? String(p.discountPercent) : '');
    setFormDescription(p.description || '');
    setFormSizeType(p.sizeType || '');
    setFormBestseller(!!p.isBestseller);
    setFormTrending(!!p.isTrending);
    setFormImageUrl(p.imageUrl || '');
    setFormError('');
  };

  const closeDrawer = () => {
    setIsAddFormOpen(false);
    setEditingProductId(null);
  };

  const handleSaveDrawer = () => {
    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }
    const finalCat = formCategory === '__NEW__' ? (formNewCategoryInput.trim() || 'Hampers') : formCategory;
    const priceVal = parseFloat(formPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setFormError('Valid price is required');
      return;
    }
    const stockVal = parseInt(formStock, 10);
    const thresholdVal = parseInt(formThreshold, 10);
    const discountVal = parseFloat(formDiscount) || 0;

    if (editingProductId) {
      const updated = products.map(p => {
        if (p.id === editingProductId) {
          return {
            ...p,
            name: formName.trim(),
            code: formCode.trim(),
            category: finalCat,
            price: priceVal,
            stock: isNaN(stockVal) ? 0 : stockVal,
            threshold: isNaN(thresholdVal) ? 3 : thresholdVal,
            discountPercent: discountVal,
            description: formDescription.trim(),
            sizeType: formSizeType.trim(),
            isBestseller: formBestseller,
            isTrending: formTrending,
            imageUrl: formImageUrl.trim()
          };
        }
        return p;
      });
      updateProducts(updated);
    } else {
      const newProd = normalizeProduct({
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        code: formCode.trim(),
        category: finalCat,
        price: priceVal,
        stock: isNaN(stockVal) ? 0 : stockVal,
        threshold: isNaN(thresholdVal) ? 3 : thresholdVal,
        discountPercent: discountVal,
        description: formDescription.trim(),
        sizeType: formSizeType.trim(),
        isBestseller: formBestseller,
        isTrending: formTrending,
        imageUrl: formImageUrl.trim()
      }, products.length);
      updateProducts([newProd, ...products]);
    }
    closeDrawer();
  };

  const handleDeleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    updateProducts(updated);
    setConfirmDeleteId(null);
  };

  const handleBulkApply = () => {
    const pct = parseFloat(bulkDiscountInput);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setBulkStatusMessageText('Enter a valid discount percentage (1–100)');
      return;
    }
    const updated = products.map(p => {
      if (selectedBulkCategory === 'ALL' || p.category === selectedBulkCategory) {
        return { ...p, discountPercent: pct };
      }
      return p;
    });
    updateProducts(updated);
    setBulkStatusMessageText(`Applied ${pct}% discount to ${selectedBulkCategory === 'ALL' ? 'all categories' : selectedBulkCategory}`);
  };

  const handleBulkClear = () => {
    const updated = products.map(p => ({ ...p, discountPercent: 0 }));
    updateProducts(updated);
    setBulkDiscountInput('');
    setBulkStatusMessageText('Cleared all promo discounts');
  };

  // Top ordered chip items calculation (0 by default in monolith unless order sales exist)
  const topOrdered = [];

  return (
    <div className="xp-products">
      {/* Toolbar */}
      <div className="xp-toolbar">
        <div className="xp-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            id="xpSearchInput"
            placeholder="Search by name, code or category"
            value={productsSearchQuery}
            onChange={(e) => setProductsSearchQuery(e.target.value)}
          />
        </div>

        <div className="xp-toolbar-actions">
          <button
            type="button"
            className="xp-pill"
            id="xpBulkToggle"
            aria-expanded={isBulkPanelOpen}
            onClick={() => setIsBulkPanelOpen(!isBulkPanelOpen)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
              <circle cx="7.5" cy="7.5" r="1.2" />
            </svg>
            Bulk promo
          </button>
          <button
            type="button"
            className="xp-pill xp-solid"
            id="xpNewProduct"
            onClick={openAddDrawer}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New product
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="xp-chips" role="group" aria-label="Category filters">
        <button
          type="button"
          className={`xp-chip ${selectedCategoryFilter === 'ALL' ? 'xp-on' : ''}`}
          data-cat="ALL"
          aria-pressed={selectedCategoryFilter === 'ALL'}
          onClick={() => setSelectedCategoryFilter('ALL')}
        >
          All <small>{products.length}</small>
        </button>
        {activeCategories.map(cat => {
          const count = products.filter(p => p.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              className={`xp-chip ${selectedCategoryFilter === cat ? 'xp-on' : ''}`}
              data-cat={cat}
              aria-pressed={selectedCategoryFilter === cat}
              onClick={() => setSelectedCategoryFilter(cat)}
            >
              {cat} <small>{count}</small>
            </button>
          );
        })}
      </div>

      {/* Meta */}
      <p className="xp-meta">
        <span><b>{products.length} products</b> &nbsp;·&nbsp; {lowStockCount} low stock &nbsp;·&nbsp; {outOfStockCount} out of stock</span>
        {" "}<a id="xpToggleAll" onClick={handleToggleAll}>{allCollapsed ? 'Expand all' : 'Collapse all'}</a>
      </p>

      {/* Top Ordered */}
      {topOrdered.filter(item => item.count > 0).length > 0 && (
        <div className="xp-top-ordered">
          <span className="xp-label">Top ordered</span>
          {topOrdered.filter(item => item.count > 0).slice(0, 10).map((item, idx) => (
            <span key={item.name} className="xp-to-chip">
              <i>#{idx + 1}</i> {item.name} <em>{item.count}</em>
            </span>
          ))}
        </div>
      )}

      {/* Bulk Panel */}
      <section className={`xp-bulk ${isBulkPanelOpen ? 'xp-open' : ''}`} id="xpBulkPanel">
        <div className="xp-bulk-row">
          <div className="xp-field xp-cat">
            <label>Category</label>
            <div id="xpBulkCategoryContainer" className="xp-ctl">
              <CustomDropdown
                options={[
                  { value: 'ALL', label: 'All Categories' },
                  ...activeCategories.map(cat => ({ value: cat, label: cat }))
                ]}
                value={selectedBulkCategory}
                onChange={setSelectedBulkCategory}
              />
            </div>
          </div>
          <div className="xp-field xp-pct">
            <label>Discount %</label>
            <div className="xp-ctl">
              <input
                type="number"
                id="xpBulkDiscountInput"
                placeholder="20"
                min="1"
                max="100"
                value={bulkDiscountInput}
                onChange={(e) => setBulkDiscountInput(e.target.value)}
              />
            </div>
          </div>
          <button type="button" className="xp-pill xp-solid" id="xpBulkApply" onClick={handleBulkApply}>Apply</button>
          <button type="button" className="xp-pill" id="xpBulkClear" onClick={handleBulkClear}>Clear promos</button>
        </div>
        <p className={`xp-bulk-msg ${bulkStatusMessageText ? 'xp-show' : ''}`} id="xpBulkMsg">{bulkStatusMessageText}</p>
      </section>

      {/* Sections */}
      {activeCategories.map(category => {
        const categoryProds = filteredProducts.filter(p => p.category === category);
        if (categoryProds.length === 0 && searchLower) return null;
        if (selectedCategoryFilter !== 'ALL' && selectedCategoryFilter !== category) return null;

        const isCollapsed = collapsedCategories.has(category) && !isSearching;

        return (
          <section key={category} className={`xp-section ${isCollapsed ? 'xp-collapsed' : ''}`} data-cat={category}>
            <div className="xp-section-head">
              <button
                className="xp-toggle"
                aria-expanded={!isCollapsed}
                aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${category}`}
                onClick={() => toggleCategoryCollapse(category)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <h2>{category}</h2>
              <span className="xp-count">{categoryProds.length}</span>
              <span className="xp-rule"></span>
            </div>

            <div className="xp-collapse">
              <div className="xp-collapse-inner">
                <div className="xp-grid">
                  {categoryProds.map(p => {
                    const discountVal = parseFloat(p.discountPercent) || 0;
                    const discountedPrice = discountVal > 0 ? p.price * (1 - discountVal / 100) : p.price;
                    const lowThreshold = getGlobalThreshold(p);
                    const isLowStock = p.stock <= lowThreshold && p.stock > 0;
                    const isOutOfStock = p.stock === 0;
                    const hasPhoto = Boolean(p.imageUrl && p.imageUrl.trim());
                    const isConfirming = confirmDeleteId === p.id;

                    return (
                      <article
                        key={p.id}
                        className={`xp-card product-card ${hasPhoto ? 'has-photo' : 'has-placeholder'} ${isOutOfStock ? 'xp-out' : ''} ${isConfirming ? 'confirming' : ''}`}
                        data-id={p.id}
                        data-name={p.name.toLowerCase()}
                      >
                        <div className="card-media-bg">
                          {hasPhoto ? (
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

                        <div className="xp-tags">
                          {isOutOfStock ? (
                            <span className="xp-tag xp-out">Out of stock</span>
                          ) : isLowStock ? (
                            <span className="xp-tag xp-low">Low · {p.stock} left</span>
                          ) : (
                            <span className="xp-tag">{p.stock} in stock</span>
                          )}
                          {discountVal > 0 && (
                            <span className="xp-tag xp-off">-{discountVal}%</span>
                          )}
                        </div>

                        <div className="xp-icons">
                          <button
                            type="button"
                            className="xp-ib xp-edit-btn"
                            data-id={p.id}
                            aria-label="Edit"
                            onClick={() => openEditDrawer(p.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="xp-ib xp-del-btn"
                            data-id={p.id}
                            aria-label="Delete"
                            onClick={() => setConfirmDeleteId(p.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                            </svg>
                          </button>
                        </div>

                        <div className="xp-body">
                          <span className="xp-name">{p.name}</span>
                          <div className="xp-row2">
                            <span className="xp-sub">
                              {p.code}{p.sizeType ? ` · ${p.sizeType}` : ''}
                            </span>
                            <span className="xp-price">
                              {discountVal > 0 && <s>GHS {Math.round(p.price)}</s>}
                              {" "}GHS {Math.round(discountedPrice)}
                            </span>
                          </div>
                        </div>

                        <div className="xp-confirm">
                          <p>Delete this product?</p>
                          <div className="xp-btns">
                            <button
                              type="button"
                              className="xp-pill xp-solid xp-yes"
                              data-id={p.id}
                              onClick={() => handleDeleteProduct(p.id)}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              className="xp-pill xp-no"
                              data-id={p.id}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      {/* Right-Side Drawer (Add / Edit Product) — Monolith active lines 17076–17170 */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} id="productDrawerOverlay">
        <div className="drawer-panel" id="productDrawerPanel">
          <div className="drawer-header">
            <h3 className="drawer-title">{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
            <button
              type="button"
              className="drawer-close-btn"
              id="closeProductDrawerBtn"
              onClick={closeDrawer}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="drawer-body">
            {formError && (
              <div className="drawer-form-error" id="prodFormError" style={{ color: '#dc2626', marginBottom: '12px', fontSize: '13px' }}>
                {formError}
              </div>
            )}

            {/* 1. Product Name & Product Code */}
            <div className="form-grid-2">
              <div className="field-group">
                <label className="field-label">Product Name *</label>
                <input
                  type="text"
                  className="field-input"
                  id="prodFormName"
                  placeholder="e.g. Luxury Gift Basket"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Product Code *</label>
                <input
                  type="text"
                  className="field-input"
                  id="prodFormCode"
                  placeholder="e.g. HAM-101"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Category & Price (GHS) */}
            <div className="form-grid-2">
              <div className="field-group">
                <label className="field-label">Category *</label>
                <div id="drawerCategoryDropdownContainer">
                  <CustomDropdown
                    options={[
                      ...activeCategories.map(c => ({ value: c, label: c })),
                      { value: '__NEW__', label: '+ Add New Category...' }
                    ]}
                    value={formCategory}
                    onChange={(newVal) => setFormCategory(newVal)}
                  />
                </div>
                {formCategory === '__NEW__' && (
                  <div id="newCategoryInputWrap" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      className="field-input"
                      id="prodFormNewCategoryInput"
                      placeholder="Enter new category name..."
                      value={formNewCategoryInput}
                      onChange={(e) => setFormNewCategoryInput(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="field-group">
                <label className="field-label">Price (GHS) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="field-input"
                  id="prodFormPrice"
                  placeholder="0.00"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                />
              </div>
            </div>

            {/* 3. Stock Quantity, Low Stock Alert, Discount % */}
            <div className="form-grid-3">
              <div className="field-group">
                <label className="field-label">Stock Quantity</label>
                <input
                  type="number"
                  className="field-input"
                  id="prodFormStock"
                  placeholder="10"
                  value={formStock}
                  onChange={(e) => setFormStock(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Low Stock Alert</label>
                <input
                  type="number"
                  className="field-input"
                  id="prodFormThreshold"
                  placeholder="3"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Discount %</label>
                <input
                  type="number"
                  className="field-input"
                  id="prodFormDiscount"
                  placeholder="0"
                  value={formDiscount}
                  onChange={(e) => setFormDiscount(e.target.value)}
                />
              </div>
            </div>

            {/* 4. Description */}
            <div className="field-group">
              <label className="field-label">Description</label>
              <textarea
                className="field-textarea"
                id="prodFormDescription"
                rows={3}
                placeholder="Product details, items included, care instructions..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* 5. Size / Type */}
            <div className="field-group">
              <label className="field-label">Size / Type</label>
              <input
                type="text"
                className="field-input"
                id="prodFormSizeType"
                placeholder="e.g. Large / Deluxe"
                value={formSizeType}
                onChange={(e) => setFormSizeType(e.target.value)}
              />
            </div>

            {/* 6. Bestseller & Trending Checkboxes */}
            <div className="form-checkbox-row" style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="field-checkbox"
                  id="prodFormBestseller"
                  checked={formBestseller}
                  onChange={(e) => setFormBestseller(e.target.checked)}
                />
                <span>Bestseller</span>
              </label>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  className="field-checkbox"
                  id="prodFormTrending"
                  checked={formTrending}
                  onChange={(e) => setFormTrending(e.target.checked)}
                />
                <span>Trending</span>
              </label>
            </div>

            {/* 7. Product Image */}
            <div className="field-group">
              <label className="field-label">Product Image</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-pill-outline"
                  id="triggerPrimaryUploadBtn"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                >
                  Upload File
                </button>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>or enter URL:</span>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                id="prodFormPrimaryFile"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setFormImageUrl(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <input
                type="text"
                className="field-input"
                id="prodFormPrimaryUrl"
                placeholder="https://..."
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                style={{ marginTop: '8px' }}
              />
              <div id="drawerImgPreview" style={{ marginTop: '8px', width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', background: '#f3f4f6' }}>
                {formImageUrl && <img src={formImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
              </div>
            </div>
          </div>

          <div className="drawer-footer">
            <button type="button" className="btn-pill-outline" id="cancelProductDrawerBtn" onClick={closeDrawer}>Cancel</button>
            <button
              type="button"
              className="btn-pill-outline"
              id="saveProductDrawerBtn"
              style={{ borderColor: '#111827', background: '#111827', color: '#ffffff' }}
              onClick={handleSaveDrawer}
            >
              {editingProductId ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
