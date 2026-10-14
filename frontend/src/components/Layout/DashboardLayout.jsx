
import { Outlet } from 'react-router'
import Footer from '../Footer'
import Header from '../Header'
import { Sidebar } from '../../pages/Dashboard/DashboardUIElements/Sidebar'


const DashboardLayout = () => {
  return (
    <div>
       <Header />
      
       <div className="flex">
        
         <Sidebar />
        <main className="flex-1 ">
            <Outlet/>
        </main>

       </div>
        <Footer />
    </div>
  )
}

export default DashboardLayout
