
import { Outlet } from 'react-router'
import Footer from '../Footer'
import Header from '../Header'

const DashboardLayout = () => {
  return (
    <div>
       <Header />
        <main>
            <Outlet/>
        </main>
        <Footer />
    </div>
  )
}

export default DashboardLayout
