import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ContexApi from './contexApi/ContexApi.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ContexApi>
      <App />
    </ContexApi>
    
  </StrictMode>,
)
