import FooterColumn from "./uiElements/FooterColumn"
import footerBg from "../assets/image/Footer-bg.png"
import facebook from "../assets/image/facebook.png"
import insta from "../assets/image/insta.png"
import pinterest from "../assets/image/pinterest.png"
import logo from "../assets/image/logo-2.png"


const Footer = () => {
    
  return (
    <div>
         <footer
      className="  mx-auto mx-3 mb-6 rounded-[28px] max-w-[1400px] bg-cover bg-center text-white"
      style={{
        backgroundImage:
          `linear-gradient(rgba(0,0,0,.7), rgba(0,0,0,.82)), url(${footerBg})`,
      }}
    >
      <div className="px-12 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.25fr]">
          {/* Brand */}
          <div>
            <a href="/" className="inline-block text-4xl font-bold">
             <img src={logo} className="size-6  w-23 h-15" />
            </a>

          

            <p className="mt-10 max-w-60 text-sm leading-4 text-zinc-200">
              Coffie4 is a specialty coffee company based in United States that
              is passionate about exceptional and ethical coffee experiences.
            </p>

            <p className="mt-5 text-sm">Our social media:</p>

            <div className="mt-2 flex gap-4 text-lg">
              <a href="#" aria-label="Facebook">
                <img src={facebook} className="size-6" alt="Facebook" />
              </a>
              <a href="#" aria-label="Instagram">
                <img src={insta} className="size-6" alt="Instagram" />
              </a>
              <a href="#" aria-label="Pinterest">
                <img src={pinterest} className="size-6" alt="Pinterest" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <FooterColumn
            title="Quick Links"
            links={["About", "Contact", "Locations", "Products", "Brands", "Blogs"]}
          />

          {/* Featured */}
          <FooterColumn
            title="Featured"
            links={[
              "New Products",
              "Best Selling",
              "Gift Shop",
              "Coffee",
              "Discount Coupons",
            ]}
          />

          {/* Products */}
          <FooterColumn
            title="Products"
            links={[
              "Espresso Machines",
              "Manual Grinders",
              "Ceramic Cups",
              "Baristas Tools",
              "Coffee Brewers",
            ]}
          />
        </div>

        <div className="mt-16 flex flex-col gap-5 border-t border-zinc-500 pt-6 text-sm text-zinc-200 md:flex-row md:items-center md:justify-between">
          <p>All rights reserved 2023</p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href="#">Privacy Policy</a>
            <a href="#">Shipping Policy</a>
            <a href="#">Terms and Conditions</a>
          </div>
        </div>
      </div>
    </footer>
    </div>
  )
}

export default Footer
