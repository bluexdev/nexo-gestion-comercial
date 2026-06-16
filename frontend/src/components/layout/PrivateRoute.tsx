import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';

export function PrivateRoute() {
  const { accessToken, hydrated } = useAuthStore();
  if (!hydrated) return <div className="flex min-h-screen items-center justify-center bg-base font-grotesk text-primary">Cargando NEXO.</div>;
  return accessToken ? <Outlet /> : <Navigate to="/login" replace />;
}
