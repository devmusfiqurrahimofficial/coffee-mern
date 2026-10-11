import coffeeBeansBg from "../../assets/image/hero-3.png";

const HeroArea2 = () => {
  return (
  <section
      className="relative max-w-[1400px] mx-auto rounded-[28px] flex h-[662px] items-center justify-center overflow-hidden bg-cover bg-center px-5 md:min-h-[420px]"
      style={{ backgroundImage: `url(${coffeeBeansBg})` }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/60"/>

      <div className="relative z-10 text-center">
        <h2 className="font-serif text-3xl font-black leading-[1.12] text-white md:text-5xl lg:text-6xl">
          PROFESSIONAL EQUIPMENT
          <br />
          AND B2B SOLUTIONS
        </h2>

        <button className="mt-7 rounded-md bg-[#f9324c] px-9 py-3 text-[10px] font-medium uppercase text-white transition hover:bg-[#d91f39]">
          Send an Inquiry
        </button>
      </div>
    </section>
  )
}

export default HeroArea2
