import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { PrivateRoute } from './components/layout/PrivateRoute';
import { DashboardPage } from './pages/DashboardPage';
import { DispatchPage } from './pages/DispatchPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { LoginPage } from './pages/LoginPage';
import { ProductsPage } from './pages/ProductsPage';
import { PurchaseOrdersPage } from './pages/PurchaseOrdersPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { api } from './services/api';
import { useAuthStore } from './store/auth';
import type { ApiResponse, User } from './types';

export function App() {
  const { setSession, setHydrated } = useAuthStore();
  useEffect(() => {
    api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/refresh')
      .then(({ data }) => setSession(data.data.accessToken, data.data.user))
      .catch(() => setHydrated(true));
  }, [setHydrated, setSession]);
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/dispatch" element={<DispatchPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
