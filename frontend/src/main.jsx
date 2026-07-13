import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import axios from 'axios'
import App from './App'
import './index.css'

// Configure global axios request interceptor to pass the user ID header
axios.interceptors.request.use((config) => {
  const userId = localStorage.getItem('devmind_user_id')
  if (userId) {
    config.headers['X-User-Id'] = userId
  }
  return config
}, (error) => {
  return Promise.reject(error)
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
