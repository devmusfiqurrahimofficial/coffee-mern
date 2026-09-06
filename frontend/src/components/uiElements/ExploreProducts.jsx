import { useEffect } from "react";
import { HSStaticMethods } from "preline";
import coffeeBag from "../../assets/image/coffee-bag.png";
import coffeeCup from "../../assets/image/coffee-cup.jpg";
import productThree from "../../assets/image/product-three.jpg";

export default function ExploreProducts() {
  useEffect(() => {
    HSStaticMethods.autoInit();

    // Keyboard navigation: Left/Right arrow keys trigger carousel prev/next
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') {
        document.querySelector('.hs-carousel-prev')?.click();
      } else if (e.key === 'ArrowRight') {
        document.querySelector('.hs-carousel-next')?.click() ;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
  
<div >
  <div className="flex flex-col lg:flex-row justify-between items-center gap-10  py-20">
      <div id="text" className="flex flex-1 min-h-[538px] flex-col justify-center  px-[71px]">
        <h2 className="font-serif text-[52px] font-black leading-[1.1] tracking-[-0.04em] text-[#1e1e1e]">
          Explore our
          <br />
          products
        </h2>

        <button className="mt-14 h-[39px] w-[122px] rounded-md bg-[#f9324c] text-[10px] font-medium text-white transition hover:bg-[#dc1e37]">
          SHOP NOW
        </button>
      </div>
      <div>
       <div className="carousel flex-1 gap-3 carousel-end rounded-box">
          <div className="carousel-item">
            <img src={coffeeBag} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
          </div>
          <div className="carousel-item">
            <img
              src={coffeeCup} className="rounded-box w-[350px] h-[425px]"
              alt="Drink" />
          </div>
          <div className="carousel-item">
            <img
              src={productThree}
              className="rounded-box w-[350px] h-[425px]"
              alt="Drink" />
          </div>
       
          <div className="carousel-item">
            <img src={coffeeBag} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
          </div>
          <div className="carousel-item">
            <img src={coffeeCup} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
          </div>
          <div className="carousel-item">
            <img
              src={productThree}
              className="rounded-box w-[350px] h-[425px]"
              alt="Drink" />
          </div>
       </div>  
      </div>
  </div>


 

</div>

  );
}