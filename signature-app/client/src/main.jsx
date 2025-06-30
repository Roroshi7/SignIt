import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import { pdfjs } from 'react-pdf'
import axios from 'axios'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

// Set base URL for axios
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
