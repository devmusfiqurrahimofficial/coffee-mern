import FooterColumn from "./uiElements/FooterColumn";
import logo from "../assets/image/logo-2.png";
import facebook from "../assets/image/facebook.png";
import insta from "../assets/image/insta.png";
import pinterest from "../assets/image/pinterest.png";
import { useSection } from "../hooks/useSection";

const Footer = () => {
  const brand = useSection("footer", "about");
  const col1 = useSection("footer", "column1");
  const col2 = useSection("footer", "column2");
  const col3 = useSection("footer", "column3");
  const bottom = useSection("footer", "bottom");

  const column1Links = (col1.links || "About\nContact\nLocations\nProducts\nBrands\nBlogs").split("\n").filter(Boolean);
  const column2Links = (col2.links || "New Products\nBest Selling\nGift Shop\nCoffee\nDiscount Coupons").split("\n").filter(Boolean);
  const column3Links = (col3.links || "Espresso Machines\nManual Grinders\nCeramic Cups\nBaristas Tools\nCoffee Brewers").split("\n").filter(Boolean);
  const policyLinks = (bottom.policyLinks || "Privacy Policy\nShipping Policy\nTerms and Conditions").split("\n").filter(Boolean);

  return (
    <div>
         <footer
       className="  mx-auto mx-3 mb-6 rounded-[28px] max-w-[1400px] bg-cover bg-center text-white"
       style={{
         backgroundImage:
           `linear-gradient(rgba(0,0,0,.7), rgba(0,0,0,.82)), url(${brand.image})`,
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
             {brand.description}
           </p>

           <p className="mt-5 text-sm">{brand.socialLabel}</p>

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
           title={col1.title}
           links={column1Links}
         />

         {/* Featured */}
         <FooterColumn
           title={col2.title}
           links={column2Links}
         />

         {/* Products */}
         <FooterColumn
           title={col3.title}
           links={column3Links}
         />
       </div>

       <div className="mt-16 flex flex-col gap-5 border-t border-zinc-500 pt-6 text-sm text-zinc-200 md:flex-row md:items-center md:justify-between">
         <p>{bottom.copyright}</p>

         <div className="flex flex-wrap gap-x-5 gap-y-2">
           {policyLinks.map((link, i) => (
             <a key={i} href="#">{link}</a>
           ))}
         </div>
       </div>
     </div>
   </footer>
   </div>
  )
}

export default Footer