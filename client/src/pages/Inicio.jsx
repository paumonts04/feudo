import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { supabase } from '../lib/supabaseClient'

// Página de inicio (provisional), solo accesible con sesión.
export function Inicio() {
  const { sesion } = useAuth()
  const [error, setError] = useState('')

  // Al cerrar sesión, RutaProtegida redirige sola a "/login".
  async function cerrarSesion() {
    setError('')
    const { error } = await supabase.auth.signOut()
    if (error) setError(`No se ha podido cerrar la sesión: ${error.message}`)
  }

  return (
    <>
      <h2>Inicio</h2>
      <p>Has iniciado sesión como {sesion.user.email}</p>
      {/* Provisional: el botón se moverá a la barra de navegación (tarea T09). */}
      <button type="button" onClick={cerrarSesion}>
        Cerrar sesión
      </button>
      {error && <p role="alert">{error}</p>}
    </>
  )
}
