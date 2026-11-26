import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

// Traduce los errores de Supabase Auth a mensajes en español.
function traducirError(error) {
  if (error.code === 'user_already_exists' || error.message === 'User already registered') {
    return 'Ya existe una cuenta con ese email'
  }
  // El trigger crear_perfil() cancela el alta si el nombre está repetido o no es válido.
  if (error.message === 'Database error saving new user') {
    return 'Ese nombre de usuario ya está en uso o no es válido'
  }
  return `No se ha podido crear la cuenta: ${error.message}`
}

// Página de registro: crea la cuenta en Supabase Auth enviando el nombre en los metadatos.
export function Registro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  // true si la cuenta se creó pero falta confirmar el email.
  const [pendienteConfirmar, setPendienteConfirmar] = useState(false)

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setError('')

    // Validación solo para dar feedback rápido: la regla real está en la base de datos.
    const nombreLimpio = nombre.trim()
    if (nombreLimpio.length < 3 || nombreLimpio.length > 30) {
      setError('El nombre debe tener entre 3 y 30 caracteres')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setEnviando(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre: nombreLimpio } },
    })
    setEnviando(false)

    if (error) {
      setError(traducirError(error))
      return
    }
    // Con sesión, RutaInvitado redirige sola a "/". Sin sesión, falta confirmar el email.
    if (!data.session) setPendienteConfirmar(true)
  }

  if (pendienteConfirmar) {
    return (
      <>
        <h2>Registro</h2>
        <p>Te hemos enviado un correo para confirmar la cuenta</p>
        <Link to="/login">Ir a iniciar sesión</Link>
      </>
    )
  }

  return (
    <>
      <h2>Registro</h2>
      <form onSubmit={manejarEnvio}>
        <label>
          Nombre de usuario
          <input
            type="text"
            autoComplete="username"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </label>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>
      </form>
      <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
    </>
  )
}
