
import ProductCategoryCard from "./ProductCategoryCard";

export default function ProductCategories({ eyebrow, title, accent, cards }) {
  return (
    <section className=" px-4 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 text-center">
          {eyebrow && (
            <p className="mb-1 text-[9px] font-bold tracking-[0.2em] text-[var(--color-accent)]">
              {eyebrow}
            </p>
          )}
          <h2 className="font-serif text-3xl font-black leading-[1.05] text-[var(--color-text)] md:text-5xl">
            Taking in mind every step of
            <br />
            {accent ? title.split(new RegExp(`(${accent})`, "gi")).map((part, i) =>
              part.toLowerCase() === accent.toLowerCase()
                ? <span key={i} className="text-[var(--color-accent)]">{part}</span>
                : <span key={i}>{part}</span>
            ) : title}
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
          {cards.map((category) => (
            <ProductCategoryCard
              key={category.title}
              title={category.title}
              image={category.image}
              image2={category.image2}
              className={category.className}
            />
          ))}
        </div>
      </div>
    </section>
  );
}