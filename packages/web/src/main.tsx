import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
// Font serviti dal sito (niente Google Fonts: la CSP accetta solo font-src 'self')
import '@fontsource-variable/inter'
import '@fontsource-variable/playfair-display'
import '@fontsource-variable/playfair-display/wght-italic.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
