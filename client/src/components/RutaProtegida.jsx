import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Layout para las rutas que requieren sesión: sin usuario, redirige al login.
// Solo mejora la experiencia: la seguridad real está en las políticas RLS.
export function RutaProtegida() {
  const { sesion, cargando } = useAuth()

  // Espera a que Supabase recupere la sesión antes de decidir.
  if (cargando) return <p>Cargando...</p>
  if (!sesion) return <Navigate to="/login" replace />
  return <Outlet />
}
