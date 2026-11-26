import { useAuth } from './context/AuthContext'

function App() {
  const { sesion, cargando } = useAuth()

  return (
    <main>
      <h1>Feudo</h1>
      {/* Comprobación temporal del estado de la sesión */}
      <p>{cargando ? 'Cargando...' : sesion ? 'Con sesión' : 'Sin sesión'}</p>
    </main>
  )
}

export default App
