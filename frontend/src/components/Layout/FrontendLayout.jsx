import { Outlet } from "react-router"
import Header from "../Header"
import Footer from "../Footer"


const FrontendLayout = ({ cartOpen, setCartOpen }) => {
  return (
    <div>
        <Header cartOpen={cartOpen} setCartOpen={setCartOpen} />
        <main>
            <Outlet/>
        </main>
        <Footer />
      
    </div>
  )
}

export default FrontendLayout
