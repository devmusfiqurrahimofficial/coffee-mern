
import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import Home from './pages/Home'
import Contact from './pages/Contact'

import About from './pages/About'
import FrontendLayout from './components/Layout/FrontendLayout'
import DashboardLayout from './components/Layout/DashboardLayout'
import SingUp from './pages/Auth/SingUp'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { AdminRoute } from './PrivateRoute/AdminRoute'
import { AddProduct } from './pages/Dashboard/DashboardUIElements/AddProduct'
import { ManageProducts } from './pages/Dashboard/DashboardUIElements/ManageProducts'
import { AddBlog } from './pages/Dashboard/DashboardUIElements/AddBlog'
import { ManageBlogs } from './pages/Dashboard/DashboardUIElements/ManageBlogs'
import { ManageOrders } from './pages/Dashboard/DashboardUIElements/ManageOrders'
import { ManageReviews } from './pages/Dashboard/DashboardUIElements/ManageReviews'
import { ManageCustomers } from './pages/Dashboard/DashboardUIElements/ManageCustomers'
import { ManageMessages } from './pages/Dashboard/DashboardUIElements/ManageMessages'
import { StoreSettings } from './pages/Dashboard/DashboardUIElements/StoreSettings'
import Login from './pages/Auth/Login'
import AdminLogin from './pages/Auth/AdminLogin'
import Shop from './pages/Shop'
import ProductPage from './pages/ProductPage'
import Profile from './pages/Profile'
import { useState } from 'react'
import Blog from './pages/Blog'
import BlogDetail from './pages/BlogDetail'
import CheckoutPage from './pages/CheckoutPage'
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
          <Route path="/checkout" element={<CheckoutPage />} />
      </Route>

        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/profile" element={<Profile />} />

      <Route path="/dashboard" element={<AdminRoute><DashboardLayout/></AdminRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="/dashboard/products" element={<ManageProducts />} />
          <Route path="/dashboard/products/add" element={<AddProduct />} />
          <Route path="/dashboard/blogs" element={<ManageBlogs />} />
          <Route path="/dashboard/blogs/add" element={<AddBlog />} />
          <Route path="/dashboard/orders" element={<ManageOrders status={null} />} />
          <Route path="/dashboard/orders/accepted" element={<ManageOrders status="accepted" />} />
          <Route path="/dashboard/orders/rejected" element={<ManageOrders status="rejected" />} />
          <Route path="/dashboard/orders/delivered" element={<ManageOrders status="delivered" />} />
          <Route path="/dashboard/orders/on-process" element={<ManageOrders status="out_for_delivery" />} />
          <Route path="/dashboard/reviews" element={<ManageReviews />} />
          <Route path="/dashboard/customers" element={<ManageCustomers />} />
          <Route path="/dashboard/messages" element={<ManageMessages />} />
          <Route path="/dashboard/settings" element={<StoreSettings />} />
          <Route path="/dashboard/add-product" element={<AddProduct />} />
       </Route>

      <Route path="*" element={<div className='flex min-h-screen items-center justify-center p-5 text-black'>404 Not Found</div>} />
     </Routes>
    </BrowserRouter>
  )
}

export default App
