import { zodResolver } from '@hookform/resolvers/zod';
import { Moon, Sun } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { GrainOverlay } from '../components/ui/GrainOverlay';
import { useTheme } from '../hooks/useTheme';
import { api, messageFromError } from '../services/api';
import { useAuthStore } from '../store/auth';
import type { ApiResponse, User } from '../types';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});
type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { accessToken, setSession } = useAuthStore();
  const [loginError, setLoginError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'admin@nexo.local', password: 'Admin123!' },
  });
  if (accessToken) return <Navigate to="/dashboard" replace />;
  const submit = async (values: LoginForm) => {
    setLoginError('');
    try {
      const { data } = await api.post<ApiResponse<{ accessToken: string; user: User }>>('/auth/login', values);
      setSession(data.data.accessToken, data.data.user);
      navigate('/dashboard');
    } catch (error) {
      const message = messageFromError(error);
      setLoginError(message);
      toast.error(message);
    }
  };
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-base p-5">
      <button className="liquid-glass fixed right-6 top-6 z-10 rounded-[14px] p-3 text-muted" onClick={toggle} aria-label="Cambiar tema">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center font-grotesk text-[32px] text-primary">NEXO<span className="text-accent">.</span></div>
        <form className="liquid-glass rounded-[32px] p-8 md:p-12" onSubmit={handleSubmit(submit)}>
          <div className="mb-8 text-center">
            <h1 className="font-grotesk text-2xl text-primary">Acceso al sistema</h1>
            <p className="mt-1 font-condiment text-lg normal-case text-accent">gestión inteligente</p>
          </div>
          <label className="mb-5 block"><span className="label">Email</span><input className="field text-[13px]" type="email" {...register('email')} />{errors.email && <small className="mt-2 block text-[11px] text-danger">{errors.email.message}</small>}</label>
          <label className="mb-7 block"><span className="label">Contraseña</span><input className="field text-[13px]" type="password" {...register('password')} />{errors.password && <small className="mt-2 block text-[11px] text-danger">{errors.password.message}</small>}</label>
          {loginError && <div className="liquid-glass mb-5 rounded-[14px] px-4 py-3 text-xs text-muted" role="alert">{loginError}</div>}
          <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Ingresando...' : 'Ingresar'}</button>
        </form>
      </div>
      <GrainOverlay />
    </main>
  );
}
