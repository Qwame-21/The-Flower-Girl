import { useState, useEffect } from 'react';
import { readAdminData, subscribeAdminData } from '../api/adminStore';

export function useAdminData() {
  const [adminData, setAdminData] = useState(readAdminData);
  const [products, setProducts] = useState(() => readAdminData().products);

  useEffect(() => {
    return subscribeAdminData(data => {
      setAdminData(data);
      setProducts(data.products || []);
    });
  }, []);

  return { adminData, setAdminData, products, setProducts };
}
