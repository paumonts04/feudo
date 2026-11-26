import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './AuthContext'

// Envuelve la app y mantiene la sesión sincronizada con Supabase Auth.
export function AuthProvider({ children }) {
  // Sesión actual de Supabase (null si no hay usuario conectado).
  const [sesion, setSesion] = useState(null)
  // true mientras Supabase recupera la sesión guardada en el navegador.
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // Supabase avisa de la sesión inicial y de cada cambio (login, logout, renovación del token).
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion)
      setCargando(false)
    })

    // Deja de escuchar al desmontar el componente.
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ sesion, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}
