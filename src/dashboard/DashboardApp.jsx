// App.jsx — Stage 2: Layout shell integrated with page stubs
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';

// Page stubs
import OverviewPage   from './pages/OverviewPage';
import OrdersPage     from './pages/OrdersPage';
import InsightsPage   from './pages/InsightsPage';
import SettingsPage   from './pages/SettingsPage';
import GalleryPage    from './pages/GalleryPage';
import ReviewsPage    from './pages/ReviewsPage';
import LogPage        from './pages/LogPage';
import ProductsPage   from './pages/ProductsPage';
import ShopPOSPage    from './pages/ShopPOSPage';
import CustomersPage  from './pages/CustomersPage';
import RequestsPage   from './pages/RequestsPage';
import CareersPage    from './pages/CareersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview"   element={<OverviewPage />} />
          <Route path="/orders"     element={<OrdersPage />} />
          <Route path="/insights"   element={<InsightsPage />} />
          <Route path="/settings"   element={<SettingsPage />} />
          <Route path="/gallery"    element={<GalleryPage />} />
          <Route path="/reviews"    element={<ReviewsPage />} />
          <Route path="/log"        element={<LogPage />} />
          <Route path="/products"   element={<ProductsPage />} />
          <Route path="/shop-pos"   element={<ShopPOSPage />} />
          <Route path="/customers"  element={<CustomersPage />} />
          <Route path="/requests"   element={<RequestsPage />} />
          <Route path="/careers"    element={<CareersPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
