
import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Home from './pages/Home'
import Contact from './pages/Contact'

import About from './pages/About'
import FrontendLayout from './components/Layout/FrontendLayout'
import DashboardLayout from './components/Layout/DashboardLayout'
import SingUp from './pages/Auth/SingUp'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { PrivateRoute } from './PrivateRoute/PrivateRoute'
import { AddProduct } from './pages/Dashboard/DashboardUIElements/AddProduct'
import Login from './pages/Auth/Login'
import Shop from './pages/Shop'
import ProductPage from './pages/ProductPage'
import { useState } from 'react'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
function App() {

       const [cartOpen, setCartOpen] = useState(false);
  
  return (
    <BrowserRouter >
     <Routes>
      <Route path="/" element={<FrontendLayout cartOpen={cartOpen} setCartOpen={setCartOpen} />}>
          <Route index element={<Home />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shop" element={<Shop cartOpen={cartOpen} setCartOpen={setCartOpen} />} />
          <Route path="/product/:id" element={<ProductPage cartOpen={cartOpen} setCartOpen={setCartOpen} />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<SingUp />} />
          <Route path="/blog" element={<Blog />} />
           <Route path="/blog/:id" element={<BlogDetail />} />
      </Route>

      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout/></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard/add-product" element={<AddProduct />} />
      </Route>

      <Route path="*" element={<div className='flex min-h-screen items-center justify-center p-5 text-black'>404 Not Found</div>} />
     </Routes>
    </BrowserRouter>
  )
}

export default App
