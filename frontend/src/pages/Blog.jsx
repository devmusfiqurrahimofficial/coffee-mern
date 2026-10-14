import { useEffect, useState } from "react";
import { Link } from "react-router";
import heroImage from "../assets/image/hero-2.png";
import {
  useAddBlogMutation,
  useGetBlogsQuery,
  useUploadBlogCoverMutation,
} from "../redux/api/blogsApi/blogsApi";

const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;
const BLOG_POLLING_INTERVAL_MS = 10_000;
const ALLOWED_COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const formatDateTime = (value) => {
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
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CL";

const getErrorMessage = (error) =>
  error?.data?.error ||
  error?.message ||
  "Unable to publish your story. Please try again.";

// -- Avatar --
const AuthorAvatar = ({ author, photoURL, className = "" }) =>
  photoURL ? (
    <img
      src={photoURL}
      alt={`${author}'s profile`}
      className={`rounded-full object-cover ring-2 ring-[#EAE7DE] ${className}`}
      referrerPolicy="no-referrer"
    />
  ) : (
    <span
      aria-label={`${author}'s initials`}
      className={`inline-flex items-center justify-center rounded-full bg-[#1D1D1D] font-bold text-white ${className}`}
    >
      {initials(author)}
    </span>
  );

// ============================================================
// MINIMAL EDITORIAL BLOG CARD
// ============================================================
function BlogCard({ blog, featured = false }) {
  if (featured) {
    return (
      <article className="group col-span-1 md:col-span-2">
        <Link
          to={`/blog/${blog._id}`}
          className="grid grid-cols-1 gap-8 md:grid-cols-2 md:items-center"
        >
          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#DDD8CB]">
            {blog.image ? (
              <img
                src={blog.image}
                alt={blog.title}
                className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#1D1D1D] px-6 text-center font-serif text-2xl font-bold italic text-white/70">
                {blog.title}
              </div>
            )}
            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#E85D3A] backdrop-blur-md">
              Featured · {blog.category || "Community"}
            </span>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
              <span>{formatDateTime(blog.createdAt)}</span>
              <span className="h-1 w-1 rounded-full bg-[#E85D3A]" />
              <span className="text-[#E85D3A]">Editor's Pick</span>
            </div>

            <h2 className="mt-5 font-serif text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-[#1D1D1D] transition-colors duration-300 group-hover:text-[#E85D3A] sm:text-4xl lg:text-5xl">
              {blog.title}
            </h2>

            <p className="mt-5 line-clamp-3 text-sm leading-7 text-[#4B5563] sm:text-base">
              {blog.excerpt || blog.content}
            </p>

            <div className="mt-8 flex items-center gap-4">
              <AuthorAvatar
                author={blog.author || "Caffeine Lab"}
                photoURL={blog.authorPhotoURL}
                className="h-10 w-10 shrink-0 text-[11px]"
              />
              <div>
                <p className="text-sm font-semibold text-[#1D1D1D]">
                  {blog.author || "Caffeine Lab"}
                </p>
                <p className="text-[10px] uppercase tracking-[0.13em] text-[#9CA3AF]">
                  Story contributor
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[#E85D3A] transition-transform duration-300 group-hover:translate-x-1">
                Read story <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // Regular Card — minimal editorial
  return (
    <article className="group">
      <Link to={`/blog/${blog._id}`} className="block">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-[#DDD8CB]">
          {blog.image ? (
            <img
              src={blog.image}
              alt={blog.title}
              className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#1D1D1D] px-6 text-center font-serif text-xl font-bold italic text-white/70">
              {blog.title}
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#E85D3A] backdrop-blur-md">
            {blog.category || "Community"}
          </span>
        </div>

        {/* Content */}
        <div className="mt-6">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
            <span>{formatDateTime(blog.createdAt)}</span>
          </div>

          <h2 className="mt-3 font-serif text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-[#1D1D1D] transition-colors duration-300 group-hover:text-[#E85D3A] sm:text-2xl">
            {blog.title}
          </h2>

          <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#4B5563]">
            {blog.excerpt || blog.content}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <AuthorAvatar
              author={blog.author || "Caffeine Lab"}
              photoURL={blog.authorPhotoURL}
              className="h-7 w-7 shrink-0 text-[9px]"
            />
            <span className="text-xs font-medium text-[#4B5563]">
              {blog.author || "Caffeine Lab"}
            </span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#E85D3A] transition-transform duration-300 group-hover:translate-x-1">
              Read <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// ============================================================
// MAIN BLOG PAGE
// ============================================================
export default function Blog() {
  const { data, isLoading, isError } = useGetBlogsQuery({
    all: true,
  }, {
    pollingInterval: BLOG_POLLING_INTERVAL_MS,
    refetchOnMountOrArgChange: true,
    skipPollingIfUnfocused: true,
  });
  const [addBlog, { isLoading: isSubmitting }] = useAddBlogMutation();
  const [uploadBlogCover] = useUploadBlogCoverMutation();

  const [form, setForm] = useState({
    title: "",
    category: "Community",
    story: "",
    email: "",
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const blogs = data?.blogs || [];

  useEffect(() => {
    if (!coverPreview) return undefined;
    return () => URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (formError) setFormError("");
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setCoverFile(null);
      setCoverPreview("");
      return;
    }
    if (!ALLOWED_COVER_IMAGE_TYPES.includes(file.type)) {
      setCoverFile(null);
      setCoverPreview("");
      setFormError("Please select a JPEG, PNG, WebP, or GIF image for the blog cover.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_COVER_IMAGE_SIZE) {
      setCoverFile(null);
      setCoverPreview("");
      setFormError("Cover images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    if (formError) setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (!form.title.trim()) {
      setFormError("A title is required for your story.");
      return;
    }
    if (!form.story.trim()) {
      setFormError("Please write your story before publishing.");
      return;
    }
    const email = form.email.trim();
    if (!email) {
      setFormError("Please enter your email address.");
      return;
    }

    try {
      let image = "";
      if (coverFile) {
        ({ image } = await uploadBlogCover({ file: coverFile }).unwrap());
      }

      await addBlog({
        blog: {
          title: form.title.trim(),
          category: form.category,
          content: form.story.trim(),
          excerpt: form.story.trim().slice(0, 160),
          email,
          image,
        },
      }).unwrap();

      setForm({ title: "", category: "Community", story: "", email });
      setCoverFile(null);
      setCoverPreview("");
      const fileInput = document.getElementById("blog-cover-image");
      if (fileInput) fileInput.value = "";
      setSuccessMessage("Your story has been published.");
    } catch (error) {
      console.error("Failed to publish blog:", error);
      setFormError(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-[#EAE7DE] font-sans text-[#1D1D1D]">
      {/* ================= HERO ================= */}
      <section className="relative isolate flex min-h-[570px] items-center overflow-hidden sm:min-h-[660px]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/70 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#EAE7DE]/40 to-transparent" />

        <div className="relative z-20 mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-10 lg:px-16">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#F2A088] sm:text-xs">
              <span className="h-px w-9 bg-[#F2A088]" />
              Caffeine Lab Journal
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Good coffee.
              <br />
              <span className="italic text-[#F2A088]">Better stories.</span>
            </h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              Discover the people, places, and rituals behind every cup—from the first pour to the last sip.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <a
                href="#all-stories"
                className="group rounded-full bg-[#E85D3A] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.13em] text-white transition-all duration-300 hover:bg-[#C94A2A] hover:shadow-lg hover:shadow-[#E85D3A]/30"
              >
                Explore stories <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-y-1">↓</span>
              </a>
              <a
                href="#share-your-story"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:text-[#F2A088]"
              >
                Share your story <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            </div>
          </div>
          <div className="mt-20 hidden items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:flex">
            <span className="h-px w-12 bg-white/35" />
            Brewed from the community
          </div>
        </div>
      </section>

      {/* ================= ALL STORIES ================= */}
      <section id="all-stories" className="relative z-10 mx-auto max-w-[1400px] px-5 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4 sm:mb-16">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#E85D3A]">Notes from the coffee table</p>
            <h2 className="font-serif text-4xl font-semibold leading-none tracking-[-0.04em] text-[#1D1D1D] sm:text-5xl">
              Stories worth <span className="italic text-[#E85D3A]">savoring.</span>
            </h2>
          </div>
          {data?.pagination?.total > 0 && (
            <span className="text-xs font-medium text-[#9CA3AF]">
              {data.pagination.total} {data.pagination.total === 1 ? "story" : "stories"}
            </span>
          )}
        </header>

        {isLoading && (
          <div className="grid gap-12 md:grid-cols-2">
            {[0, 1, 2].map((item) => (
              <div key={item} className={`animate-pulse ${item === 0 ? "md:col-span-2" : ""}`}>
                <div className={`rounded-3xl bg-white/60 ${item === 0 ? "aspect-[4/3] md:aspect-[16/9]" : "aspect-[16/10]"}`} />
                <div className="mt-6 space-y-3">
                  <div className="h-3 w-24 rounded bg-[#1D1D1D]/10" />
                  <div className="h-6 w-4/5 rounded bg-[#1D1D1D]/10" />
                  <div className="h-4 w-full rounded bg-[#1D1D1D]/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-7 text-sm leading-6 text-red-700">
            We couldn't load the stories just now. Please refresh the page and try again.
          </div>
        )}

        {!isLoading && !isError && blogs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#1D1D1D]/15 px-6 py-24 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#1D1D1D]/5 text-2xl text-[#E85D3A]" aria-hidden="true">✳</span>
            <h3 className="mt-5 font-serif text-2xl font-semibold text-[#1D1D1D]">A fresh page awaits.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#4B5563]">There aren't any stories here yet. Be the first to share a coffee moment.</p>
          </div>
        )}

        {!isLoading && !isError && blogs.length > 0 && (
          <div className="grid gap-12 md:grid-cols-2 lg:gap-x-10 lg:gap-y-16">
            {blogs.map((blog, index) => (
              <BlogCard key={blog._id} blog={blog} featured={index === 0} />
            ))}
          </div>
        )}

      </section>

      {/* ================= SHARE YOUR STORY — MINIMAL CENTERED ================= */}
      <section id="share-your-story" className="relative z-10 scroll-mt-20 border-t border-[#1D1D1D]/10 bg-white/40">
        {/* Soft terracotta glow behind form */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#E85D3A] opacity-[0.05] blur-[140px]" />

        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
          {/* Section Header */}
          <div className="text-center">
            <p className="mb-4 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#E85D3A]">
              <span className="h-px w-8 bg-[#E85D3A]" />
              From your table to ours
              <span className="h-px w-8 bg-[#E85D3A]" />
            </p>
            <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[#1D1D1D] sm:text-5xl lg:text-6xl">
              Your coffee story
              <br />
              <span className="italic text-[#E85D3A]">belongs here.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[#4B5563] sm:text-base">
              A first sip in a new city. A recipe passed down. A café that feels like home. Share the moment you keep coming back to.
            </p>
          </div>

          <p className="mt-10 text-center text-sm leading-6 text-[#4B5563]">
            Share your story with the community. No account needed.
          </p>

          {/* The Form — Minimal, Underline Inputs */}
          <form onSubmit={handleSubmit} className="mt-14 space-y-10">
            {/* Email */}
            <div>
              <label htmlFor="blog-email" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Your email <span className="text-[#E85D3A]">*</span>
              </label>
              <input
                id="blog-email"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                required
                disabled={isSubmitting}
                placeholder="you@example.com"
                className="w-full border-b border-[#1D1D1D]/15 bg-transparent pb-3 text-base text-[#1D1D1D] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#E85D3A] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Title */}
            <div>
              <label htmlFor="blog-title" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Your title <span className="text-[#E85D3A]">*</span>
              </label>
              <input
                id="blog-title"
                type="text"
                value={form.title}
                onChange={updateField("title")}
                required
                disabled={isSubmitting}
                placeholder="A title worth remembering…"
                className="w-full border-b border-[#1D1D1D]/15 bg-transparent pb-4 font-serif text-2xl font-semibold text-[#1D1D1D] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#E85D3A] disabled:cursor-not-allowed disabled:opacity-50 sm:text-3xl"
              />
            </div>

            {/* Category pills */}
            <div>
              <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {["Community", "Brewing", "Origins", "Culture", "Process"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setForm((f) => ({ ...f, category: cat }))}
                    className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.12em] transition ${
                      form.category === cat
                        ? "border-[#1D1D1D] bg-[#1D1D1D] text-white"
                        : "border-[#1D1D1D]/15 text-[#4B5563] hover:border-[#E85D3A]/60 hover:text-[#E85D3A]"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Cover image */}
            <div>
              <label htmlFor="blog-cover-image" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Cover image <span className="text-[#9CA3AF]">(optional)</span>
              </label>
              <label
                htmlFor="blog-cover-image"
                className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#1D1D1D]/20 bg-white/60 text-center transition hover:border-[#E85D3A]/60 hover:bg-[#E85D3A]/[0.03]"
              >
                <input
                  id="blog-cover-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverChange}
                  disabled={isSubmitting}
                  className="sr-only"
                />
                {coverPreview ? (
                  <>
                    <img src={coverPreview} alt="Selected cover preview" className="absolute inset-0 h-full w-full object-cover opacity-90" />
                    <span className="relative z-10 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[#1D1D1D] shadow-lg">
                      Change cover
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center px-4 py-6">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[#E85D3A]/30 text-lg text-[#E85D3A]" aria-hidden="true">＋</span>
                    <span className="text-xs font-semibold text-[#1D1D1D]">Choose a cover image</span>
                    <span className="mt-1 text-[10px] text-[#9CA3AF]">PNG · JPG · WEBP · GIF · up to 5 MB</span>
                  </span>
                )}
              </label>
            </div>

            {/* Story */}
            <div>
              <label htmlFor="blog-story" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Your story <span className="text-[#E85D3A]">*</span>
              </label>
              <textarea
                id="blog-story"
                rows={8}
                value={form.story}
                onChange={updateField("story")}
                required
                disabled={isSubmitting}
                placeholder="Start writing. Tell us about the cup, the place, or the moment…"
                className="w-full resize-none border-b border-[#1D1D1D]/15 bg-transparent pb-4 text-base leading-8 text-[#1D1D1D] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#E85D3A] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Feedback */}
            {formError && (
              <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}
            {successMessage && (
              <p role="status" className="rounded-lg border border-[#10B981]/30 bg-[#10B981]/10 p-3 text-sm text-[#059669]">
                {successMessage}
              </p>
            )}

            {/* Submit */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex items-center gap-3 rounded-full bg-[#1D1D1D] px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[#1D1D1D]/10 transition-all duration-300 hover:bg-[#E85D3A] hover:shadow-[#E85D3A]/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {isSubmitting ? "Publishing…" : "Publish your story"}
                {!isSubmitting && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
              </button>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9CA3AF]">
                Your email will be shown as author
              </p>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}