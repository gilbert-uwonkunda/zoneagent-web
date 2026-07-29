import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Bundled rather than pulled from unpkg so the map still renders offline and
// first paint doesn't wait on a third-party CDN.
import 'leaflet/dist/leaflet.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Register the service worker for offline shell + installability.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err)
    })
  })
}
