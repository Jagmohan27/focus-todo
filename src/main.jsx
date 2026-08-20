import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Default guest user profile (authentication bypassed)
const GUEST_USER = {
  id: 'guest-user-123',
  name: 'My Tasks',
  email: 'local@device',
  initials: 'TU',
  createdAt: new Date().toISOString(),
}

function Root() {
  return <App user={GUEST_USER} onLogout={() => {}} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>
)
