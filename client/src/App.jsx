import { Navigate, Route, Routes } from 'react-router-dom'
import { RutaInvitado } from './components/RutaInvitado'
import { RutaProtegida } from './components/RutaProtegida'
import { Inicio } from './pages/Inicio'
import { Login } from './pages/Login'
import { Registro } from './pages/Registro'

function App() {
  return (
    <main>
      <h1>Feudo</h1>
      <Routes>
        {/* Solo sin sesión: login y registro */}
        <Route element={<RutaInvitado />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
        </Route>

        {/* Solo con sesión */}
        <Route element={<RutaProtegida />}>
          <Route path="/" element={<Inicio />} />
        </Route>

        {/* Cualquier otra URL vuelve al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  )
}

export default App
