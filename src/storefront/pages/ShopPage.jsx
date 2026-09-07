import { useEffect, useMemo, useState } from 'react';
import { readAdminData, subscribeAdminData } from '../../data/adminStore';
import { PRODUCTS } from '../../data/products';
import ProductCard from '../components/ProductCard';
import SiteFooter from '../components/SiteFooter';
import CheckoutModal from '../modals/CheckoutModal';
import ProductDetail from '../modals/ProductDetail';
import RequestModal from '../modals/RequestModal';
import WishlistModal from '../modals/WishlistModal';

export default function ShopPage({ onNavigate, cart, setCart, wishlist, setWishlist, openCheckout, onCheckoutHandled, openWishlist, onWishlistHandled }) {
  const [requestProduct, setRequestProduct] = useState(null);
  const [detailProduct, setDetailProduct] = useState(null);
  const [addedProduct, setAddedProduct] = useState('');
  const [promotions, setPromotions] = useState(() => readAdminData().promotions || []);
  useEffect(() => subscribeAdminData(data => setPromotions(data.promotions || [])), []);
  const shopProducts = useMemo(() => PRODUCTS.map(product => { const promotion = promotions.find(item => item.productId === product.id && item.status === 'active' && Number(item.percent) > 0); if (!promotion) return product; const discountPercent = Math.min(90, Number(promotion.percent)); const salePrice = Math.round(product.price * (100 - discountPercent) / 100); return { ...product, originalPriceLabel: product.priceLabel, discountPercent, price: salePrice, priceLabel: `GHS ${salePrice.toLocaleString()}` }; }), [promotions]);
  useEffect(() => {
    setCart(current => current.map(item => {
      const liveProduct = shopProducts.find(product => product.id === item.id);
      return liveProduct ? { ...item, ...liveProduct, quantity: item.quantity } : item;
    }));
  }, [shopProducts, setCart]);
  const add = (product, quantity = 1) => {
    setCart(current => current.some(item => item.id === product.id) ? current : [...current, { ...product, quantity }]);
    setWishlist(current => current.filter(id => id !== product.id));
  };
  const addWithFeedback = product => {
    add(product);
    setAddedProduct(product.id);
    window.setTimeout(() => setAddedProduct(current => current === product.id ? '' : current), 1600);
  };
  const updateQuantity = (id, quantity) => setCart(current => quantity < 1 ? current.filter(item => item.id !== id) : current.map(item => item.id === id ? { ...item, quantity } : item));
  const toggleWishlist = id => setWishlist(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const savedProducts = shopProducts.filter(product => wishlist.includes(product.id));
  const productOverlays = <>
    {requestProduct && <RequestModal service={requestProduct} onClose={() => setRequestProduct(null)} />}
    {detailProduct && <ProductDetail product={detailProduct} saved={wishlist.includes(detailProduct.id)} onClose={() => setDetailProduct(null)} onAdd={add} onToggleWishlist={toggleWishlist} onCustomize={setRequestProduct} />}
  </>;
  if (openCheckout) return <main className="commerce-page" aria-label="Checkout"><CheckoutModal cart={cart} onClose={onCheckoutHandled} onQuantity={updateQuantity} onNavigate={onNavigate} /></main>;
  if (openWishlist) return <main className="commerce-page" aria-label="Wishlist"><WishlistModal products={savedProducts} onClose={onWishlistHandled} onView={setDetailProduct} onRemove={toggleWishlist} />{productOverlays}</main>;
  return (
    <main className="content-page shop-page">
      <header className="content-page-heading shop-heading"><div><span>ORDERS & BOOKINGS</span><h1>Shop</h1></div></header>
      <div className="shop-custom-banner"><div><span>BUILD YOUR OWN</span><h2>Choose every detail.</h2><p>Start with flowers or a box, then add perfume, chocolate, fashion, jewelry, engraving and delivery.</p></div><button className="primary-action" onClick={() => onNavigate?.('customize')}>OPEN GIFT BUILDER</button></div><div className="product-grid">{shopProducts.map(product => <ProductCard key={product.id} product={product} saved={wishlist.includes(product.id)} added={addedProduct === product.id} onSave={() => toggleWishlist(product.id)} onView={() => setDetailProduct(product)} onAdd={() => addWithFeedback(product)} />)}</div>
      {productOverlays}
      <SiteFooter onNavigate={onNavigate} />
    </main>
  );
}
