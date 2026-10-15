import { useEffect } from "react";
import { HSStaticMethods } from "preline";
import { Link } from "react-router";
import coffeeBag from "../../assets/image/coffee-bag.png";
import coffeeCup from "../../assets/image/coffee-cup.jpg";
import productThree from "../../assets/image/product-three.jpg";

export default function ExploreProducts() {
  useEffect(() => {
    HSStaticMethods.autoInit();

    const handleKey = (e) => {
      if (e.key === "ArrowLeft") {
        document.querySelector(".hs-carousel-prev")?.click();
      } else if (e.key === "ArrowRight") {
        document.querySelector(".hs-carousel-next")?.click();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-[1400px] px-4">
        <div className="flex flex-col lg:flex-row items-start gap-12">
          <div className="flex-1 max-w-[480px] animate-slide-up stagger-1">
            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-[#e11d48]/10 border border-[#e11d48]/20">
              <span className="h-1.5 w-1.5 rounded-full bg-[#e11d48]" />
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#e11d48]">
                Explore now
              </p>
            </div>
            <h2 className="font-serif text-3xl font-black leading-[1.05] text-[#1d1d1d] md:text-5xl">
              Discover our<br />
              <span className="text-[#e11d48]">premium products</span>
            </h2>
            <p className="mt-6 text-sm text-neutral-600 leading-relaxed">
              Carefully selected coffee beans, brewing equipment, and
              accessories for every coffee enthusiast.
            </p>
            <Link to="/shop" className="mt-8 btn-primary">
              Shop all products
            </Link>
          </div>
          <div className="flex-1 animate-slide-up stagger-2">
            <div className="relative h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-xl border border-black/10">
              <div className="carousel flex-1 gap-4">
                <div className="carousel-item">
                  <img src={coffeeBag} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
                </div>
                <div className="carousel-item">
                  <img src={coffeeCup} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
                </div>
                <div className="carousel-item">
                  <img src={productThree} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
                </div>
                <div className="carousel-item">
                  <img src={coffeeBag} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
                </div>
                <div className="carousel-item">
                  <img src={coffeeCup} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
                </div>
                <div className="carousel-item">
                  <img src={productThree} className="rounded-box w-[350px] h-[425px]" alt="Drink" />
                </div>
              </div>
              <button
                type="button"
                className="hs-carousel-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black shadow-md transition-all hover:bg-[#e11d48] hover:text-white disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="sr-only">Previous</span>
              </button>
              <button
                type="button"
                className="hs-carousel-next absolute right-4 top-1/2 -translate-y-1/2 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black shadow-md transition-all hover:bg-[#e11d48] hover:text-white disabled:pointer-events-none disabled:opacity-40"
              >
                <span className="sr-only">Next</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
