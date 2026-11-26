import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// Hook para leer la sesión desde cualquier componente: const { sesion, cargando } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
