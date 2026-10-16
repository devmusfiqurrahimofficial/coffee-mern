import { useState } from 'react'
import { Outlet, Link } from 'react-router'
import { Bars3Icon } from '@heroicons/react/24/solid'
import { Sidebar } from '../../pages/Dashboard/DashboardUIElements/Sidebar'
import logo from '../../assets/image/logo-2.png'

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#EAE7DE]">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-[#EAE7DE]/90 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="rounded-full p-1.5 text-[#1d1d1d] transition hover:bg-black/5"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        <Link to="/dashboard">
          <img src={logo} alt="Coffee Mern" className="h-9 w-auto" />
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold uppercase tracking-wider text-neutral-500 transition hover:text-[#e11d48]"
        >
          Store
        </Link>
      </div>

      <div className="lg:flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-10">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
