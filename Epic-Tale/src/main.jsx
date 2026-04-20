import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import NewMedia from './NewMedia.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <NewMedia />
  </StrictMode>,
)
