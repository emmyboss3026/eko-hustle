import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fonts are served from our own site (no requests to Google Fonts, so no IP addresses go to Google)
import '@fontsource/bungee/400.css'
import '@fontsource/atkinson-hyperlegible/400.css'
import '@fontsource/atkinson-hyperlegible/700.css'
import '@fontsource/atkinson-hyperlegible/400-italic.css'
import '@fontsource/courier-prime/400.css'
import '@fontsource/courier-prime/700.css'
import './index.css'
import App from './App.tsx'
import ConsentedAnalytics from './components/ConsentedAnalytics'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ConsentedAnalytics />
  </StrictMode>,
)
