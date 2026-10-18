
export default function ProductCategoryCard({
  title,
  image,
  image2,
  className = "",
}) {
  return (
    <article
      className={`group relative h-[400px] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10 ${className}`}
    >
      {image2 && (
        <img
          src={image2}
          alt=""
          className="absolute inset-0 h-full w-full object-cover z-0 opacity-80 group-hover:opacity-90 transition-opacity duration-300"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      {/* Product image */}
      <img
        src={image}
        alt={title}
        className="absolute right-4 top-4 h-[65%] w-[55%] object-contain object-right-top transition-transform duration-500 group-hover:scale-110 z-10"
      />

      {/* Text */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
        <span className="inline-flex items-center gap-1.5 mb-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur border border-white/30 text-[var(--color-primary)]/90 text-xs font-bold uppercase tracking-wider">
          Shop now
        </span>
        <h3 className="font-serif text-2xl font-black leading-tight text-white md:text-3xl">
          {title}
        </h3>
        <p className="mt-2 text-xs font-medium text-white/70 max-w-md">
          Explore our curated {title.toLowerCase()} collection
        </p>
      </div>
    </article>
  );
}