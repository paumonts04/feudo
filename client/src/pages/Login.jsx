import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Traduce los errores de Supabase Auth a mensajes en español.
function traducirError(error) {
  if (error.code === 'invalid_credentials' || error.message === 'Invalid login credentials') {
    return 'Email o contraseña incorrectos'
  }
  return `No se ha podido iniciar sesión: ${error.message}`
}

// Página de inicio de sesión con email y contraseña.
export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError('')

    setEnviando(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setEnviando(false)

    // Si va bien no se navega aquí: RutaInvitado redirige a "/" al cambiar la sesión.
    if (error) setError(traducirError(error))
  }

  return (
    <>
      <h2>Login</h2>
      <form onSubmit={manejarEnvio}>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <Link to="/registro">¿No tienes cuenta? Regístrate</Link>
    </>
  )
}
