import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { OlympicsProvider } from './context/OlympicsContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <OlympicsProvider>
          <App />
        </OlympicsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
