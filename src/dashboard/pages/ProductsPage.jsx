// src/pages/ProductsPage.jsx
// Ported 1-for-1 verbatim from admin-monolith.html renderProductsView() (lines 16870–17645)
// Rewired to use Supabase instead of localStorage

import { useState, useEffect, useRef } from 'react';
import CustomDropdown from '../components/shared/CustomDropdown';
import PasswordConfirmModal from '../components/PasswordConfirmModal';
import { getImageUrl } from '../lib/imageUrlHelper';
import { PRODUCT_CATEGORIES, PRODUCT_TAGS } from '../../shared/taxonomy';
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
import { getAppSettings } from '../data/settingsAdapter';
import { formatNumber } from '../lib/ordersModel';
import { getProductDiscountPercent, calculateProductPrice } from '../../shared/pricing';

const PRODUCTS_KEY = 'xa12-products-data-v1';

function showToast(message) {
  window.dispatchEvent(new CustomEvent('xa12:toast', { detail: { message } }));
}

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

const CATEGORY_IMAGE_FALLBACKS = {
  hampers: '/assets/hamper-editorial-v2.png',
  bundles: '/assets/engagement-presentation-v2.png',
  care: '/assets/wrapping-editorial-v2.png',
  flowers: '/assets/bouquet-editorial-v2.png',
  personalized: '/assets/embroidery-editorial-v2.png'
};

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

// Convert Supabase product to HOPESON shape
function normalizeProduct(p, idx = 0) {
  const categoryRaw = p.category || 'Flowers';
  const categoryTitle = CATEGORY_MAP[categoryRaw.toLowerCase()] || (categoryRaw.charAt(0).toUpperCase() + categoryRaw.slice(1).toLowerCase());
  const catPrefix = categoryTitle.slice(0, 3).toUpperCase();
  const defaultCode = p.id || `${catPrefix}-${101 + idx}`;
  const catKey = categoryTitle.toLowerCase();
  const fallbackImg = CATEGORY_IMAGE_FALLBACKS[catKey] || '/assets/hamper-editorial-v2.png';

  return {
    id: String(p.id || `prod-${Date.now()}-${idx}`),
    code: String(defaultCode),
    name: String(p.name || 'Unnamed Product'),
    category: categoryTitle,
    price: typeof p.price === 'number' ? p.price : (parseFloat(p.price) || 0),
    stock: typeof p.stock === 'number' ? p.stock : (parseInt(p.stock, 10) || 0),
    threshold: typeof p.low_stock_threshold === 'number' ? p.low_stock_threshold : (parseInt(p.low_stock_threshold, 10) || 3),
    salesCount: 0,
    occasion: p.tag || 'Signature',
    isBundle: categoryTitle === 'Bundles' || categoryTitle === 'Hampers',
    variants: [],
    imageUrl: getImageUrl(p.image_path) || fallbackImg,
    description: p.description || '',
    details: Array.isArray(p.details) ? p.details : [],
    sizeType: '',
    isBestseller: false,
    isTrending: false,
    discountPercent: 0
  };
}

export default function ProductsPage() {
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDefaults, setShowDefaults] = useState(false);
  const [importing, setImporting] = useState(false);
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
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);

  const fileInputRef = useRef(null);

  // Load settings for password confirmation check
  useEffect(() => {
    setSettings(getAppSettings());
  }, []);

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
  const [formDetails, setFormDetails] = useState([]);
  const [formNewDetail, setFormNewDetail] = useState('');
  const [formTag, setFormTag] = useState('SIGNATURE');
  const [formNewTagInput, setFormNewTagInput] = useState('');
  const [formSizeType, setFormSizeType] = useState('');
  const [formBestseller, setFormBestseller] = useState(false);
  const [formTrending, setFormTrending] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formError, setFormError] = useState('');

  // Load data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [productsData, promotionsData] = await Promise.all([
          listProducts(),
          listPromotions()
        ]);
        if (!isMounted) return;
        const normalizedProducts = (productsData || []).map((p, idx) => normalizeProduct(p, idx));
        setProducts(normalizedProducts);
        setPromotions(promotionsData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error loading products:', err);
        if (!isMounted) return;
        setError(err.message || 'Failed to load products');
        setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  const updateProducts = (newList) => {
    setProducts(newList);
  };

  const getGlobalThreshold = (p) => {
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
    setFormTag('SIGNATURE');
    setFormNewTagInput('');
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
    setFormDetails(p.details || []);
    setFormNewDetail('');
    setFormTag(p.occasion || 'SIGNATURE');
    setFormNewTagInput('');
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

  const handleSaveDrawer = async () => {
    if (!formName.trim()) {
      setFormError('Product name is required');
      return;
    }
    const finalCat = formCategory === '__NEW__' ? (formNewCategoryInput.trim() || 'Hampers') : formCategory;
    const finalTag = formTag === '__NEW__' ? (formNewTagInput.trim().toUpperCase() || 'SIGNATURE') : formTag;
    const priceVal = parseFloat(formPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setFormError('Valid price is required');
      return;
    }
    if (!formStock || formStock.trim() === '') {
      setFormError('Enter how many are in stock');
      return;
    }
    const stockVal = parseInt(formStock, 10);
    if (isNaN(stockVal) || stockVal < 0) {
      setFormError('Enter a valid stock quantity');
      return;
    }
    const thresholdVal = parseInt(formThreshold, 10);
    const discountVal = parseFloat(formDiscount) || 0;

    // Map HOPESON shape back to Supabase shape
    const categoryKey = Object.keys(CATEGORY_MAP).find(k => CATEGORY_MAP[k] === finalCat) || finalCat.toLowerCase();
    
    const productData = {
      id: editingProductId || formCode,
      name: formName.trim(),
      slug: (editingProductId || formCode).toLowerCase().replace(/\s+/g, '-'),
      category: categoryKey,
      price: priceVal,
      stock: isNaN(stockVal) ? 0 : stockVal,
      low_stock_threshold: isNaN(thresholdVal) ? 3 : thresholdVal,
      tag: finalTag || '',
      description: formDescription.trim(),
      details: formDetails,
      image_path: formImageUrl.trim(),
      secondary_image_path: null,
      visible: true,
      sort_order: 0
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
    const productsData = await listProducts();
    const normalizedProducts = productsData.map((p, idx) => normalizeProduct(p, idx));
    setProducts(normalizedProducts);
    
    // Update promotion if discount changed
    if (discountVal > 0) {
      const existingPromo = promotions.find(p => p.product_id === productData.id);
      if (existingPromo) {
        await updatePromotion(existingPromo.id, { percent: discountVal, status: 'active' });
      } else {
        await createPromotion({ productId: productData.id, percent: discountVal, status: 'active' });
      }
    }

    closeDrawer();
  };

  const handleDeleteProduct = async (id) => {
    if (settings?.security?.requirePasswordForDestructive) {
      setPendingDeleteAction(() => async () => {
        const result = await deleteProduct(id);
        if (result.success) {
          const productsData = await listProducts();
          const normalizedProducts = productsData.map((p, idx) => normalizeProduct(p, idx));
          setProducts(normalizedProducts);
          setConfirmDeleteId(null);
          showToast('Product deleted');
        } else {
          showToast(result.error || 'Failed to delete product');
        }
      });
      setShowPwConfirm(true);
      return;
    }

    const result = await deleteProduct(id);
    if (result.success) {
      const productsData = await listProducts();
      const normalizedProducts = productsData.map((p, idx) => normalizeProduct(p, idx));
      setProducts(normalizedProducts);
      setConfirmDeleteId(null);
      showToast('Product deleted');
    } else {
      showToast(result.error || 'Failed to delete product');
    }
  };

  const handlePasswordConfirm = async (password) => {
    try {
      const { confirmDestructive } = await import('../utils/confirmDestructive');
      await confirmDestructive(password);
      if (pendingDeleteAction) {
        await pendingDeleteAction();
        setPendingDeleteAction(null);
      }
      setShowPwConfirm(false);
    } catch (err) {
      throw err;
    }
  };

  const handleBulkApply = async () => {
    const pct = parseFloat(bulkDiscountInput);
    if (isNaN(pct) || pct < 1 || pct > 100) {
      setBulkStatusMessageText('Enter a valid discount percentage (1–100)');
      return;
    }
    
    // Apply to promotions in Supabase
    const productsToUpdate = selectedBulkCategory === 'ALL' 
      ? products 
      : products.filter(p => p.category === selectedBulkCategory);
    
    for (const product of productsToUpdate) {
      const existingPromo = promotions.find(p => p.product_id === product.id);
      if (existingPromo) {
        await updatePromotion(existingPromo.id, { percent: pct, status: 'active' });
      } else {
        await createPromotion({ productId: product.id, percent: pct, status: 'active' });
      }
    }

    // Update local state
    const updated = products.map(p => {
      if (selectedBulkCategory === 'ALL' || p.category === selectedBulkCategory) {
        return { ...p, discountPercent: pct };
      }
      return p;
    });
    setProducts(updated);
    setBulkStatusMessageText(`Applied ${pct}% discount to ${selectedBulkCategory === 'ALL' ? 'all categories' : selectedBulkCategory}`);
  };

  const handleBulkClear = async () => {
    // Clear all promotions
    for (const promo of promotions) {
      await deletePromotion(promo.id);
    }
    
    const updated = products.map(p => ({ ...p, discountPercent: 0 }));
    setProducts(updated);
    setBulkDiscountInput('');
    setBulkStatusMessageText('Cleared all promo discounts');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const productId = editingProductId || formCode;
    const result = await uploadProductImage(file, productId);

    if (result.success) {
      setFormImageUrl(getImageUrl(result.path));
    } else {
      setFormError(result.error);
    }
  };

  const handleImportDefaults = async () => {
    setImporting(true);
    try {
      for (const product of DEFAULT_PRODUCTS) {
        const existing = products.find(p => p.id === product.id);
        if (!existing) {
          await createProduct(product);
        }
      }
      const productsData = await listProducts();
      const normalizedProducts = productsData.map((p, idx) => normalizeProduct(p, idx));
      setProducts(normalizedProducts);
      setShowDefaults(false);
    } catch (err) {
      console.error('Error importing default products:', err);
      setFormError('Failed to import default products');
    } finally {
      setImporting(false);
    }
  };

  const handleAddDetail = () => {
    const trimmed = formNewDetail.trim();
    if (!trimmed) return;
    if (formDetails.length >= 10) return;
    if (formDetails.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
      setFormError('This detail already exists');
      return;
    }
    if (trimmed.length < 1 || trimmed.length > 80) {
      setFormError('Detail must be 1 to 80 characters');
      return;
    }
    setFormDetails([...formDetails, trimmed]);
    setFormNewDetail('');
    setFormError('');
  };

  const getQuickAddSuggestions = () => {
    const hardcodedDetails = DEFAULT_PRODUCTS.flatMap(p => p.details || []);
    const liveDetails = products.flatMap(p => p.details || []);
    const allDetails = [...new Set([...hardcodedDetails, ...liveDetails])];
    return allDetails.filter(d => !formDetails.includes(d));
  };

  const getPromotionPercent = (productId) => getProductDiscountPercent(productId, promotions);

  // Top ordered chip items calculation (0 by default in monolith unless order sales exist)
  const topOrdered = [];

  if (showDefaults) {
    return (
      <div className="xp-products">
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
              disabled
            />
          </div>

          <div className="xp-toolbar-actions">
            <button
              type="button"
              className="xp-pill xp-solid"
              id="xpNewProduct"
              disabled
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New product
            </button>
          </div>
        </div>

        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--xp-card)', borderRadius: '12px', border: '1px solid rgba(26,26,26,0.08)' }}>
          <h3 style={{ marginBottom: '12px' }}>No Products Yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
            Import the default product catalog to get started. These products will be stored in the live database and can be edited later.
          </p>
          <button
            type="button"
            onClick={handleImportDefaults}
            disabled={importing}
            className="xp-pill xp-solid"
            style={{ opacity: importing ? 0.6 : 1 }}
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
                  <div style={{ marginTop: '4px' }}>GHS {formatNumber(p.price, 2)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="xp-products">Loading products...</div>;
  }

  if (error) {
    return (
      <div className="xp-products">
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '12px' }}>Error Loading Products</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="xp-pill xp-solid"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xp-products">
      {/* Toolbar */}
      <div className="xp-toolbar">
        <div className="xp-search">
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
          All <small>{formatNumber(products.length)}</small>
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
              {cat} <small>{formatNumber(count)}</small>
            </button>
          );
        })}
      </div>

      {/* Meta */}
      <p className="xp-meta">
        <span><b>{formatNumber(products.length)} products</b> &nbsp;·&nbsp; {formatNumber(lowStockCount)} low stock &nbsp;·&nbsp; {formatNumber(outOfStockCount)} out of stock</span>
        {" "}<a id="xpToggleAll" onClick={handleToggleAll}>{allCollapsed ? 'Expand all' : 'Collapse all'}</a>
      </p>

      {/* Top Ordered */}
      {topOrdered.filter(item => item.count > 0).length > 0 && (
        <div className="xp-top-ordered">
          <span className="xp-label">Top ordered</span>
          {topOrdered.filter(item => item.count > 0).slice(0, 10).map((item, idx) => (
            <span key={item.name} className="xp-to-chip">
              <i>#{formatNumber(idx + 1)}</i> {item.name} <em>{formatNumber(item.count)}</em>
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
              <span className="xp-count">{formatNumber(categoryProds.length)}</span>
              <span className="xp-rule"></span>
            </div>

            <div className="xp-collapse">
              <div className="xp-collapse-inner">
                <div className="xp-grid">
                  {categoryProds.map(p => {
                    const discountVal = getPromotionPercent(p.id);
                    const { salePrice: discountedPrice } = calculateProductPrice(p.price, discountVal);
                    const lowThreshold = getGlobalThreshold(p);
                    const isLowStock = p.stock <= lowThreshold && p.stock > 0;
                    const isOutOfStock = p.stock === 0;
                    const isConfirming = confirmDeleteId === p.id;
                    const displayImg = p.imageUrl || CATEGORY_IMAGE_FALLBACKS[(p.category || '').toLowerCase()] || '/assets/hamper-editorial-v2.png';

                    return (
                      <article
                        key={p.id}
                        className={`xp-card product-card ${isOutOfStock ? 'xp-out' : ''} ${isConfirming ? 'xp-confirming' : ''}`}
                        data-id={p.id}
                        data-name={p.name.toLowerCase()}
                      >
                        <div className="card-media-bg">
                          <img
                            src={displayImg}
                            alt={p.name}
                            onError={(e) => {
                              e.currentTarget.src = '/assets/hamper-editorial-v2.png';
                            }}
                          />

                          <div className="xp-tags">
                            {isOutOfStock ? (
                              <span className="xp-tag xp-out">Out of stock</span>
                            ) : isLowStock ? (
                              <span className="xp-tag xp-low">Low · {formatNumber(p.stock)} left</span>
                            ) : (
                              <span className="xp-tag">{formatNumber(p.stock)} in stock</span>
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
                              title="Edit product"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                              title="Delete product"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        <div className="xp-body">
                          <div className="xp-card-footer-row">
                            <span className="xp-name" title={p.name}>{p.name}</span>
                            <div className="xp-price">
                              {discountVal > 0 && <s className="xp-old-price">GHS {Math.round(p.price).toLocaleString('en-US')}</s>}
                              <span className={discountVal > 0 ? 'xp-current-price is-discounted' : 'xp-current-price'}>
                                GHS {Math.round(discountedPrice).toLocaleString('en-US')}
                              </span>
                            </div>
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
                  disabled={!!editingProductId}
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
                      ...PRODUCT_CATEGORIES,
                      ...activeCategories.filter(c => !PRODUCT_CATEGORIES.some(pc => pc.value === c)).map(c => ({ value: c, label: c })),
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
                <label className="field-label">Tag</label>
                <div id="drawerTagDropdownContainer">
                  <CustomDropdown
                    options={[
                      ...PRODUCT_TAGS,
                      ...activeCategories.filter(c => !PRODUCT_TAGS.some(pt => pt.value === c)).map(c => ({ value: c, label: c })),
                      { value: '__NEW__', label: '+ Add New Tag...' }
                    ]}
                    value={formTag}
                    onChange={(newVal) => setFormTag(newVal)}
                  />
                </div>
                {formTag === '__NEW__' && (
                  <div id="newTagInputWrap" style={{ marginTop: '8px' }}>
                    <input
                      type="text"
                      className="field-input"
                      id="prodFormNewTagInput"
                      placeholder="Enter new tag name..."
                      value={formNewTagInput}
                      onChange={(e) => setFormNewTagInput(e.target.value)}
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

            {/* 4. Tag */}
            <div className="field-group">
              <label className="field-label">Tag</label>
              <div id="drawerTagDropdownContainer">
                <CustomDropdown
                  options={[
                    ...PRODUCT_TAGS,
                    ...activeCategories.filter(c => !PRODUCT_TAGS.some(pt => pt.value === c)).map(c => ({ value: c, label: c })),
                    { value: '__NEW__', label: '+ Add New Tag...' }
                  ]}
                  value={formTag}
                  onChange={(newVal) => setFormTag(newVal)}
                />
              </div>
            </div>

            {/* 5. Description */}
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

            {/* 6. Details & Benefits */}
            <div className="field-group">
              <label className="field-label">Details & Benefits</label>
              <div style={{ marginBottom: '0.5rem' }}>
                {formDetails.map((detail, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ flex: 1 }}>{detail}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newDetails = [...formDetails];
                        newDetails.splice(idx, 1);
                        setFormDetails(newDetails);
                      }}
                      style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx > 0) {
                          const newDetails = [...formDetails];
                          [newDetails[idx - 1], newDetails[idx]] = [newDetails[idx], newDetails[idx - 1]];
                          setFormDetails(newDetails);
                        }
                      }}
                      disabled={idx === 0}
                      style={{ padding: '4px 8px', fontSize: '12px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (idx < formDetails.length - 1) {
                          const newDetails = [...formDetails];
                          [newDetails[idx], newDetails[idx + 1]] = [newDetails[idx + 1], newDetails[idx]];
                          setFormDetails(newDetails);
                        }
                      }}
                      disabled={idx === formDetails.length - 1}
                      style={{ padding: '4px 8px', fontSize: '12px', cursor: idx === formDetails.length - 1 ? 'not-allowed' : 'pointer' }}
                    >
                      ↓
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  className="field-input"
                  placeholder="Add a detail"
                  value={formNewDetail}
                  onChange={(e) => setFormNewDetail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddDetail();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddDetail}
                  disabled={formDetails.length >= 10}
                  style={{ padding: '8px 16px', cursor: formDetails.length >= 10 ? 'not-allowed' : 'pointer' }}
                >
                  Add
                </button>
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <small style={{ color: 'var(--text-muted)' }}>Quick add:</small>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {getQuickAddSuggestions().slice(0, 12).map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!formDetails.includes(suggestion)) {
                          setFormDetails([...formDetails, suggestion]);
                        }
                      }}
                      disabled={formDetails.includes(suggestion) || formDetails.length >= 10}
                      style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        background: formDetails.includes(suggestion) ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                        cursor: formDetails.includes(suggestion) || formDetails.length >= 10 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <small style={{ color: 'var(--text-muted)' }}>{formDetails.length}/10 details</small>
            </div>

            {/* 7. Size / Type */}
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

            {/* 8. Bestseller & Trending Checkboxes */}
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
                onChange={handleImageUpload}
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

      {/* Password confirmation modal */}
      <PasswordConfirmModal
        isOpen={showPwConfirm}
        onClose={() => { setShowPwConfirm(false); setPendingDeleteAction(null); }}
        onConfirm={handlePasswordConfirm}
        title="Confirm Deletion"
      />
    </div>
  );
}
