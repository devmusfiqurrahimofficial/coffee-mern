
export default function ProductCategoryCard({
  title,
  image,
  image2,
  className = "",
}) {
  return (
    <article
      className={`group relative h-[380px] overflow-hidden rounded-lg ${className}`}
    >
      {image2 && (
        <img
          src={image2}
          alt=""
          className="absolute inset-0 h-full w-full object-cover z-0"
        />
      )}

      {/* Transparent product image */}
      <img
        src={image}
        alt={title}
        className="absolute right-3 top-2 h-[70%] w-[58%] object-contain object-right-top transition-transform duration-500 group-hover:scale-105 z-10"
      />

      {/* Text */}
      <div className="absolute bottom-0 left-0 z-20 p-4 md:p-5">
        <h3 className="font-serif text-lg font-black uppercase text-[#202020] md:text-xl">
          {title}
        </h3>

        <p className="mt-1 text-[8px] font-bold tracking-[0.18em] text-[#202020] md:text-[9px]">
          ELEVATE YOUR COFFEE EXPERIENCE
        </p>
      </div>
    </article>
  );
}