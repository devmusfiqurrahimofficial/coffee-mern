import Nav from "./uiElements/Nav"


const Header = ({ cartOpen, setCartOpen }) => {
  return (
    <>
      <Nav cartOpen={cartOpen} setCartOpen={setCartOpen} />
    </>
  )
}

export default Header
