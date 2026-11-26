import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './AuthContext'

// Envuelve la app y mantiene la sesión sincronizada con Supabase Auth.
export function AuthProvider({ children }) {
  // Sesión actual de Supabase (null si no hay usuario conectado).
  const [sesion, setSesion] = useState(null)
  // true mientras Supabase recupera la sesión guardada en el navegador.
  const [cargandoSesion, setCargandoSesion] = useState(true)
  // Última respuesta de la consulta del perfil, junto al id del usuario al que pertenece.
  const [resultadoPerfil, setResultadoPerfil] = useState(null)

  useEffect(() => {
    // Supabase avisa de la sesión inicial y de cada cambio (login, logout, renovación del token).
    // Aquí no se consulta Supabase: hacerlo dentro de este callback puede bloquear el cliente.
    const { data } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion)
      setCargandoSesion(false)
      // Al cerrar sesión se descarta el perfil anterior.
      if (!nuevaSesion) setResultadoPerfil(null)
    })

    // Deja de escuchar al desmontar el componente.
    return () => data.subscription.unsubscribe()
  }, [])

  const usuarioId = sesion?.user.id ?? null

  // Carga el perfil (tabla perfiles) cada vez que cambia el usuario de la sesión.
  useEffect(() => {
    if (!usuarioId) return

    // Si el usuario cambia antes de que llegue la respuesta, esta se ignora.
    let ignorar = false

    supabase
      .from('perfiles')
      .select('id, nombre, rol, baneado, fecha_registro')
      .eq('id', usuarioId)
      .single()
      .then(({ data, error }) => {
        if (ignorar) return
        setResultadoPerfil({ usuarioId, perfil: error ? null : data, error: error ?? null })
      })

    return () => {
      ignorar = true
    }
  }, [usuarioId])

  // Solo vale la respuesta que corresponde al usuario actual.
  const perfilAlDia = usuarioId !== null && resultadoPerfil?.usuarioId === usuarioId
  const perfil = perfilAlDia ? resultadoPerfil.perfil : null
  const errorPerfil = perfilAlDia ? resultadoPerfil.error : null
  // Se espera a la sesión y, si hay usuario, también a su perfil.
  const cargando = cargandoSesion || (usuarioId !== null && !perfilAlDia)

  return (
    <AuthContext.Provider value={{ sesion, perfil, errorPerfil, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}
