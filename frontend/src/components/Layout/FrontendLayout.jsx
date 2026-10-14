import { Outlet } from "react-router"
import Header from "../Header"
import Footer from "../Footer"
import CartDrawer from "../CartDrawer"
import ChatBot from "../uiElements/ChatBot"


const FrontendLayout = ({ cartOpen, setCartOpen }) => {
  return (
    <div>
        <Header cartOpen={cartOpen} setCartOpen={setCartOpen} />
        <main>
            <Outlet/>
        </main>
        <Footer />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        <ChatBot />
      
    </div>
  )
}

export default FrontendLayout
