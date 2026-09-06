
import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Home from './pages/Home'
import Contact from './pages/Contact'
import Shop from './pages/Shop'
import About from './pages/About'
import FrontendLayout from './components/Layout/FrontendLayout'
import DashboardLayout from './components/Layout/DashboardLayout'
import Login from './pages/Auth/Login'
import SingUp from './pages/Auth/SingUp'
function App() {
  return (
    <BrowserRouter >
     <Routes>
      <Route path="/" element={<FrontendLayout />}>
        <Route index element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shop" element={<Shop/>} />
        <Route path="/about" element={<About />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<SingUp />} />
     </Route>

     <Route path="/dashboard" element={<DashboardLayout />}>
       
     </Route>

     <Route path="*" element={<div className='flex min-h-screen items-center justify-center p-5 text-black'>404 Not Found</div>} />
     </Routes>
    </BrowserRouter>
  )
}

export default App
