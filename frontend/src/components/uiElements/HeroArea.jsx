


const HeroArea = ({p,title,description,buttonText,bg,accentText = false}) => {
  return (
     <section
      className="relative max-w-[1400px] mx-auto rounded-3xl overflow-hidden text-white min-h-[540px] flex items-center bg-cover bg-center bg-gradient-to-br from-[#1a2b23] via-[#241a1a] to-[#0d0d0d]"
      style={{ backgroundImage: `url(${bg})` } }
    >
      {/* Darkening overlay so text stays legible over any photo */}
      <div className="absolute inset-0 bg-black/35" />

      <div className="relative px-8 py-16 sm:px-14 sm:py-20 max-w-xl">
        <p className={`text-xs sm:text-sm tracking-[0.25em] uppercase mb-4 ${accentText ? "text-red-500" : "text-white/90"}`}>
        {p}
        </p>

        <h1 className=" italic font-bold text-4xl  sm:text-5xl lg:text-[3.2rem] leading-[1.15] mb-8">
         {accentText && title.toLowerCase().includes("coffee journey")
           ? title.split(/(coffee journey)/gi).map((part, index) =>
             part.toLowerCase() === "coffee journey" ? (
             <span className="text-red-500" key={index}>{part}</span>
           ) : (
             part
           )
           )
           : title}
        </h1>
        {description && (
          <p className="text-sm text-black leading-relaxed">
            {description}
          </p>
        )}

        <button className="bg-[#e11d48] hover:bg-[#c81a40] mt-4 transition-colors text-white text-xs font-semibold tracking-widest uppercase px-6 py-3.5 rounded-md">
          {buttonText}
        </button>
      </div>
    </section>
  )
}

export default HeroArea
