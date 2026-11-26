import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Layout para login y registro: si ya hay sesión, redirige al inicio.
export function RutaInvitado() {
  const { sesion, cargando } = useAuth()

  // Espera a que Supabase recupere la sesión antes de decidir.
  if (cargando) return <p>Cargando...</p>
  if (sesion) return <Navigate to="/" replace />
  return <Outlet />
}
