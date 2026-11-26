import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Comparte la sesión del usuario con toda la app */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
