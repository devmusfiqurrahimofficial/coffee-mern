import { useEffect, useRef } from "react";
import { HSStaticMethods } from "preline";

export default function InstagramCarousel({ posts = [] }) {
  const carouselRef = useRef(null);

  useEffect(() => {
    HSStaticMethods.autoInit();

    const handleKey = (e) => {
      if (!carouselRef.current) return;
      if (e.key === 'ArrowLeft') {
        carouselRef.current.querySelector('.hs-carousel-prev')?.click();
      } else if (e.key === 'ArrowRight') {
        carouselRef.current.querySelector('.hs-carousel-next')?.click();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <section className="overflow-hidden py-16 md:py-20">
      <h2 className="mb-9 text-center font-serif text-4xl font-black leading-[1.08] text-[#202020] md:text-5xl">
        Checkout Our
        <br />
        Instagram Posts
      </h2>

      <div
        ref={carouselRef}
        className="relative pl-5 md:pl-12 lg:pl-16"
        data-hs-carousel={JSON.stringify({
          loadingClasses: "opacity-0",
          isSnap: true,
          isCentered: false,
          slidesQty: {
            xs: 1.15,
            sm: 2.2,
            lg: 3.25,
          },
        })}
      >
        <div className="hs-carousel w-full overflow-hidden">
          <div className="hs-carousel-body flex gap-4 opacity-0 transition-transform duration-700">
            {posts.map((post, index) => (
              <div
                key={post.id || index}
                className="hs-carousel-slide !h-[350px] !w-[350px] shrink-0 basis-[350px]"
              >
                <a
                  href={post.link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="group block h-full w-full overflow-hidden rounded-lg"
                >
                  <img
                    src={post.image}
                    alt={`Instagram post ${index + 1}`}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </a>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="hs-carousel-prev absolute left-7 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
        >
          ←
          <span className="sr-only">Previous</span>
        </button>

        <button
          type="button"
          className="hs-carousel-next absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-black shadow-md transition hover:bg-white disabled:pointer-events-none disabled:opacity-40"
        >
          →
          <span className="sr-only">Next</span>
        </button>
      </div>
    </section>
  );
}