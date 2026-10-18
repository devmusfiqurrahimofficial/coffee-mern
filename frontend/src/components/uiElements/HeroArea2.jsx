import { Link } from "react-router";
import coffeeBeansBg from "../../assets/image/hero-3.png";

const HeroArea2 = ({
  eyebrow,
  title,
  accent,
  description,
  buttonText,
  buttonPath,
  image,
}) => {
  const bg = image || coffeeBeansBg;
  const titleChunks = accent && title ? [
    ...title.split(new RegExp(`(${accent})`, "gi")).map((part, i) =>
      part.toLowerCase() === accent.toLowerCase()
        ? <span key={i} className="text-[var(--color-primary)]">{part}</span>
        : <span key={i}>{part}</span>
    )
  ] : <>{title}</>;

  return (
  <section
      className="relative max-w-[1400px] mx-auto rounded-[28px] flex h-[662px] items-center justify-center overflow-hidden bg-cover bg-center px-5 md:min-h-[420px]"
      style={{ backgroundImage: `url(${bg})` }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60"/>

      <div className="relative z-10 text-center">
        {eyebrow && (
          <p className="mb-3 text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--color-accent)]">
            {eyebrow}
          </p>
        )}
        <h2 className="font-serif text-3xl font-black leading-[1.12] text-white md:text-5xl lg:text-6xl">
          {titleChunks}
          <br />
          <span className="text-[var(--color-primary)]">AND B2B SOLUTIONS</span>
        </h2>
        {description && (
          <p className="mt-4 text-sm text-white/80 max-w-xl mx-auto leading-relaxed">
            {description}
          </p>
        )}
        {buttonText && buttonPath && (
          <Link to={buttonPath}>
            <button className="mt-7 rounded-md bg-[var(--color-primary)] px-9 py-3 text-[10px] font-medium uppercase text-white transition hover:bg-[var(--color-primary-hover)]">
              {buttonText}
            </button>
          </Link>
        )}
      </div>
    </section>
  )
}

export default HeroArea2
