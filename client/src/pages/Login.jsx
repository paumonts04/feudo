import { Link } from 'react-router-dom'

// Página de inicio de sesión (provisional).
export function Login() {
  return (
    <>
      <h2>Login</h2>
      <Link to="/registro">¿No tienes cuenta? Regístrate</Link>
    </>
  )
}
