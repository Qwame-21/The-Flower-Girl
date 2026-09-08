import { adminView } from '../utils/workspaceData';
import { useState, useEffect } from 'react';
import { readAdminData, subscribeAdminData } from '../api/adminStore';

export function useAdminData() {
  const [adminData, setAdminData] = useState(() => adminView(readAdminData()));
  const [products, setProducts] = useState(() => adminView(readAdminData()).products);

  useEffect(() => {
    return subscribeAdminData(data => {
      setAdminData(current => current.ordersSource === 'supabase'
        ? { ...adminView(data), ordersSource: 'supabase', orders: current.orders }
        : adminView(data));
      setProducts(adminView(data).products);
    });
  }, []);

  return { adminData, setAdminData, products, setProducts };
}
