export default function CoffeeVerticals({ eyebrow, title, accent, cards }) {
  return (
    <section className="px-4 py-12 md:px-10 max-w-[1400px] mx-auto md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          {eyebrow && (
            <p className="mb-1 text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--color-accent)]">
              {eyebrow}
            </p>
          )}
          <h2 className="font-serif text-3xl font-black leading-[1.05] text-[var(--color-text)] md:text-6xl">
            {accent ? title.split(new RegExp(`(${accent})`, "gi")).map((part, i) =>
              part.toLowerCase() === accent.toLowerCase()
                ? <span key={i} className="text-[var(--color-primary)]">{part}</span>
                : <span key={i}>{part}</span>
            ) : title}
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
                  {card.subtitle && (
                    <p className="mt-2 text-xs font-medium text-white/70 max-w-xs">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <button
                  aria-label={`Explore ${card.title}`}
                  className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-primary)] text-white transition-all duration-300 hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/40 active:scale-95"
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