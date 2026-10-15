import { Link } from "react-router";

const HeroArea = ({ p, title, path, description, buttonText, bg, accentText = false }) => {
  return (
    <section
      className="relative max-w-[1400px] mx-auto rounded-[36px] overflow-hidden text-white min-h-[600px] flex items-center bg-cover bg-center"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f]/90 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-[#000]/20" />
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#e11d48]/20 blur-[120px] pointer-events-none" />
      <div className="relative z-10 px-8 py-16 sm:px-14 sm:py-24 max-w-2xl">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          <span className="h-1.5 w-1.5 rounded-full bg-[#e11d48] animate-pulse" />
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-white/90">{p}</p>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl lg:text-[4rem] font-black leading-[1.05] mb-6 text-white text-balance">
          {accentText && title.toLowerCase().includes("coffee journey")
            ? title.split(/(coffee journey)/gi).map((part, index) =>
                part.toLowerCase() === "coffee journey" ? (
                  <span className="text-[#e11d48]" key={index}>{part}</span>
                ) : (
                  part
                )
              )
            : title}
        </h1>
        {description && (
          <p className="text-sm sm:text-base text-white/70 leading-relaxed mb-8 max-w-lg">
            {description}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link to={path}>
            <button className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-[#e11d48] text-white font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-[#c81a40] hover:shadow-lg hover:shadow-[#e11d48]/40 hover:-translate-y-1 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:ring-offset-2">
              {buttonText}
            </button>
          </Link>
          <button className="flex-1 sm:flex-none px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold text-sm uppercase tracking-wider transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 active:scale-95">
            Explore
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroArea;
