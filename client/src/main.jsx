import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Gestiona la navegación entre pantallas con URLs propias */}
    <BrowserRouter>
      {/* Comparte la sesión del usuario con toda la app */}
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
