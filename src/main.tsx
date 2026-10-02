import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import AuthProvider from './context/AuthProvider'
import UserCartProvider from './context/UserCartProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <UserCartProvider>
        <App />
      </UserCartProvider>
    </AuthProvider>
  </StrictMode>,
)