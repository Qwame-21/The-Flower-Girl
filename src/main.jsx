import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './responsive-overlays.css'
import App from './App.jsx'
import './admin/chrome.css'
import './admin/liquid.css'
import './admin/overview.css'
import './admin/workspace.css'
import './admin/records.css'
import './admin/palette.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
