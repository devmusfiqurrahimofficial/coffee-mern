

const Contact = () => {
 
  return (
    <div className="min-h-screen bg-[#f7f2ea] px-5 py-10 text-slate-800">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-lg md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">Contact Us</p>
          <h1 className="mt-3 text-4xl font-bold">We would love to hear from you.</h1>
          <p className="mt-4 text-lg text-slate-600">
            Whether you have a question about our menu, events, or special orders, we are here to help.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <h3 className="font-semibold">Visit Us</h3>
              <p className="text-slate-600">123 Coffee Street, Downtown</p>
            </div>
            <div>
              <h3 className="font-semibold">Call Us</h3>
              <p className="text-slate-600">+1 (555) 012-3456</p>
            </div>
            <div>
              <h3 className="font-semibold">Email</h3>
              <p className="text-slate-600">hello@coffeebloom.com</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#2f241d] p-8 text-white shadow-lg md:p-10">
          <h2 className="text-2xl font-semibold">Send a Message</h2>
          <form className="mt-6 space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none ring-0 placeholder:text-white/70"
            />
            <input
              type="email"
              name="email"
            
              placeholder="Your Email"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none ring-0 placeholder:text-white/70"
            />
            <textarea
              rows="5"
              name="message"
            
              placeholder="Your Message"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none ring-0 placeholder:text-white/70"
            />
            <button className="rounded-full bg-amber-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-400">
              Send Message
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Contact;
