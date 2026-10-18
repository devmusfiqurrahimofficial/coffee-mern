import { useState } from "react";
import { useSendMessageMutation, useGetFeedbackQuery } from "../redux/api/messagesApi/messagesApi";
import { useSection } from "../hooks/useSection";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
    

const FeedbackCard = ({ item }) => {
  const replies = Array.isArray(item.replies) ? item.replies : [];

  return (
    <article className="flex flex-col rounded-[1.5rem] bg-white p-6 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[#2f241d] text-sm font-bold text-white">
          {initials(item.name)}
        </span>
        <div>
          <p className="font-semibold text-slate-800">{item.name}</p>
          <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-600">"{item.message}"</p>

      {replies.map((reply, index) => (
        <div
          key={`${reply.createdAt || index}`}
          className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#2f241d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Admin
            </span>
            <span className="text-xs text-slate-500">{formatDate(reply.createdAt)}</span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{reply.text}</p>
        </div>
      ))}
    </article>
  );
};

const FeedbackSection = () => {
  const { data: feedback = [] } = useGetFeedbackQuery();
  const content = useSection("contact", "form");

  if (feedback.length === 0) return null;

  return (
    <section className="mx-auto mt-8 max-w-6xl">
      <div className="mb-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
          {content.feedbackEyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-bold text-slate-800">{content.feedbackTitle}</h2>
        <p className="mt-2 text-slate-600">
          {content.feedbackDescription}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {feedback.map((item) => (
          <FeedbackCard key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
};

const Contact = () => {
  const [sendMessage, { isLoading }] = useSendMessageMutation();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ type: "", text: "" });

  const intro = useSection("contact", "intro");
  const info = useSection("contact", "info");
  const formContent = useSection("contact", "form");

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (status.text) setStatus({ type: "", text: "" });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "", text: "" });

    const name = form.name.trim();
    const email = form.email.trim();
    const message = form.message.trim();

    if (!name) {
      setStatus({ type: "error", text: "Please enter your name." });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus({ type: "error", text: "Please enter a valid email address." });
      return;
    }
    if (!message) {
      setStatus({ type: "error", text: "Please write your message." });
      return;
    }

    try {
      await sendMessage({ name, email, message }).unwrap();
      setForm({ name: "", email: "", message: "" });
      setStatus({
        type: "success",
        text: "Thanks for reaching out! We will get back to you soon.",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus({
        type: "error",
        text: error?.data?.error || "Something went wrong. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-5 py-10 text-slate-800">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] bg-white p-8 shadow-lg md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">{intro.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-bold">{intro.title}</h1>
          <p className="mt-4 text-lg text-slate-600">
            {intro.description}
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <h3 className="font-semibold">{info.visitTitle}</h3>
              <p className="text-slate-600">{info.visitText}</p>
            </div>
            <div>
              <h3 className="font-semibold">{info.callTitle}</h3>
              <p className="text-slate-600">{info.callText}</p>
            </div>
            <div>
              <h3 className="font-semibold">{info.emailTitle}</h3>
              <p className="text-slate-600">{info.emailText}</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-[#2f241d] p-8 text-white shadow-lg md:p-10">
          <h2 className="text-2xl font-semibold">{formContent.formTitle}</h2>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={updateField("name")}
              placeholder="Your Name"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none ring-0 placeholder:text-white/70"
            />
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField("email")}
              placeholder="Your Email"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none ring-0 placeholder:text-white/70"
            />
            <textarea
              rows="5"
              name="message"
              value={form.message}
              onChange={updateField("message")}
              placeholder="Your Message"
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 outline-none ring-0 placeholder:text-white/70"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-amber-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending…" : "Send Message"}
            </button>

            {status.text && (
              <p
                role={status.type === "error" ? "alert" : "status"}
                className={`rounded-xl px-4 py-3 text-sm ${
                  status.type === "error"
                    ? "bg-red-500/20 text-red-100"
                    : "bg-green-500/20 text-green-100"
                }`}
              >
                {status.text}
              </p>
            )}
          </form>
        </section>
      </div>

      <FeedbackSection />
    </div>
  );
};

export default Contact;
