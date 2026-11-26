import { Link } from 'react-router-dom'

// Página de registro (provisional).
export function Registro() {
  return (
    <>
      <h2>Registro</h2>
      <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
    </>
  )
}
