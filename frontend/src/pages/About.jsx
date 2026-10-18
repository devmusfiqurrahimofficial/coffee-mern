import { useSection } from "../hooks/useSection";

const About = () => {
  const hero = useSection("about", "hero");
  const story = useSection("about", "story");
  const values = useSection("about", "values");

  const valueCards = [
    { title: values.value1Title, description: values.value1Description },
    { title: values.value2Title, description: values.value2Description },
    { title: values.value3Title, description: values.value3Description },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-5 py-10 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] bg-white shadow-lg">
          <div className="grid items-center gap-8 p-8 md:grid-cols-2 md:p-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">{hero.eyebrow}</p>
              <h1 className="mt-3 text-4xl font-bold md:text-5xl">{hero.title}</h1>
              <p className="mt-4 text-lg text-slate-600">
                {hero.description}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-gradient-to-br from-amber-100 to-orange-200 p-8">
              <div className="rounded-[1.25rem] bg-white/70 p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-600">{story.label}</p>
                <p className="mt-3 text-slate-700">
                  {story.text}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {valueCards.map((item) => (
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
