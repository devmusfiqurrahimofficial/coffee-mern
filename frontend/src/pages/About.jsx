const values = [
  {
    title: 'Crafted with Care',
    description: 'Every cup is prepared with premium beans and a passion for detail.',
  },
  {
    title: 'Warm Atmosphere',
    description: 'We create a welcoming space where each visit feels like home.',
  },
  {
    title: 'Community First',
    description: 'We support local growers and make every sip a shared experience.',
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-[#f7f2ea] px-5 py-10 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-lg">
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">About Us</p>
              <h1 className="mt-3 text-4xl font-bold md:text-5xl">A coffee experience rooted in comfort and quality.</h1>
              <p className="mt-4 text-lg text-slate-600">
                We believe great coffee brings people together. From bean to cup, every detail is designed to feel cozy, fresh, and memorable.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-gradient-to-br from-amber-100 to-orange-200 p-8">
              <div className="rounded-[1.25rem] bg-white/70 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">Our Story</p>
                <p className="mt-3 text-slate-700">
                  Founded with a love for slow mornings, handcrafted drinks, and warm conversations, our cafe continues to inspire both regulars and newcomers.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {values.map((item) => (
            <div key={item.title} className="rounded-[1.5rem] bg-white p-6 shadow-md">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-3 text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default About
