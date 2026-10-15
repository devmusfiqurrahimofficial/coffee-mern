import leaf from '../../assets/image/leaf.png'
import vertical1 from '../../assets/image/verticals-1.png'
import vertical2 from '../../assets/image/verticals-2.png'
import vertical3 from '../../assets/image/verticals-3.png'


export default function CoffeeVerticals() {
  const cards = [
    {
      title: "COFFEE ROASTER",
      image: vertical1,
      className: "md:row-span-2 min-h-[520px]",
    },
    {
      title: "CAFE",
      image: vertical2,
      className: "min-h-[260px]",
    },
    {
      title: "RETAIL",
      image: vertical3,
      className: "min-h-[260px]",
    },
  ];

  return (
    <section className="px-4 py-12 md:px-10 max-w-[1400px] mx-auto md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <p className="mb-1 text-[9px] font-bold tracking-[0.25em] uppercase text-[#f2354d]">
            Our verticals
          </p>
          <h2 className="font-serif text-3xl font-black leading-[1.05] text-[#1d1d1d] md:text-6xl">
            Taking in mind every step of
            <br />
            the <span className="text-[#e11d48]">coffee journey</span>
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:grid-rows-2">
          {cards.map((card) => (
            <article
              key={card.title}
              className={`group relative overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10 ${card.className}`}
            >
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              <div className="absolute inset-x-0 bottom-0 z-10 p-6 md:p-8 flex items-end justify-between">
                <div className="text-white">
                  <h3 className="font-serif text-2xl font-black leading-tight md:text-3xl">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-xs font-medium text-white/70 max-w-xs">
                    Elevate your coffee experience
                  </p>
                </div>
                <button
                  aria-label={`Explore ${card.title}`}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[#e11d48] text-white transition-all duration-300 hover:bg-[#c81a40] hover:shadow-lg hover:shadow-[#e11d48]/40 active:scale-95"
                >
                  ›
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}