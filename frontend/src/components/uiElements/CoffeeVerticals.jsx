import leaf from '../../assets/image/leaf.png'
import vertical1 from '../../assets/image/verticals-1.png'
import vertical2 from '../../assets/image/verticals-2.png'
import vertical3 from '../../assets/image/verticals-3.png'


export default function CoffeeVerticals() {
  const cards = [
    {
      title: "COFFEE ROASTER",
      image: vertical1,
      className: "md:row-span-2 min-h-[490px]",
    },
    {
      title: "CAFE",
      image: vertical2,
      className: "min-h-[235px]",
    },
    {
      title: "RETAIL",
      image: vertical3,
      className: "min-h-[235px]",
    },
  ];

  return (
    <section className=" px-4 py-12 md:px-10 max-w-[1400px] mx-auto md:py-16">
      <div className="mx-auto max-w-6xl">
      
        <div className="mb-5 text-center">
          <p className="mb-1 text-xs font-bold tracking-[0.25em] text-[#ff6375]">
            OUR VERTICALS
          </p>

          <h2 className="font-serif text-4xl font-black leading-[1.05] text-[#1d1d1d] md:text-6xl">
            Taking in mind every step of
            <br />
            the <span className="text-[#f2354d]">coffee journey</span>
          </h2>

          <div className="mt-7 flex items-center justify-center gap-3 text-[#78972a]">
            <img src={leaf} alt="" className="w-27" />
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 md:grid-rows-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`group relative overflow-hidden rounded-[26px] ${card.className}`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-7 md:p-8">
                <div className="text-white">
                  <h3 className="font-serif text-2xl font-black md:text-3xl">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-[10px] font-bold tracking-[0.27em] md:text-xs">
                    ELEVATE YOUR COFFEE EXPERIENCE
                  </p>
                </div>

                <button
                  aria-label={`Explore ${card.title}`}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/70 text-xl text-white transition hover:bg-white hover:text-black"
                >
                  ›
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-center gap-3 text-[#78972a]">
          <img src={leaf} alt="" className=" w-27"  />
        </div>
      </div>
    </section>
  );
}