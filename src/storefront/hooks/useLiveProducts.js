import { useState, useEffect, useCallback } from 'react';
import { fetchLiveProducts, getCachedProducts, subscribeToProducts } from '../data/liveProducts';

/**
 * Hook to fetch and subscribe to live products from Supabase
 * Returns { products, loading, error, source }
 */
export function useLiveProducts() {
  const [products, setProducts] = useState(() => getCachedProducts() || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('cache');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchLiveProducts();
      setProducts(result.products);
      setSource(result.source);
    } catch (err) {
      setError(err.message);
      // Keep existing products on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    // If we have cached products, show them immediately
    const cached = getCachedProducts();
    if (cached && cached.length > 0) {
      setProducts(cached);
      setSource('cache');
    }
    
    // Then refresh in background
    refresh();
  }, [refresh]);

  // Subscribe to Realtime changes
  useEffect(() => {
    const unsubscribe = subscribeToProducts((updatedProducts) => {
      setProducts(updatedProducts);
      setSource('live');
    });

    return unsubscribe;
  }, []);

  // Refetch when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refresh]);

  return { products, loading, error, source, refresh };
}
