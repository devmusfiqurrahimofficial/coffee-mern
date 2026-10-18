import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/auth";
import { useSection } from "../hooks/useSection";
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
      className={`inline-flex items-center justify-center rounded-full bg-[var(--color-text)] font-bold text-white ${className}`}
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
              <div className="flex h-full items-center justify-center bg-[var(--color-text)] px-6 text-center font-serif text-2xl font-bold italic text-white/70">
                {blog.title}
              </div>
            )}
            <span className="absolute left-5 top-5 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--color-accent)] backdrop-blur-md">
              Featured · {blog.category || "Community"}
            </span>
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
              <span>{formatDateTime(blog.createdAt)}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]" />
              <span className="text-[var(--color-accent)]">Editor's Pick</span>
            </div>

            <h2 className="mt-5 font-serif text-3xl font-semibold leading-[1.1] tracking-[-0.03em] text-[var(--color-text)] transition-colors duration-300 group-hover:text-[var(--color-accent)] sm:text-4xl lg:text-5xl">
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
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {blog.author || "Caffeine Lab"}
                </p>
                <p className="text-[10px] uppercase tracking-[0.13em] text-[#9CA3AF]">
                  Story contributor
                </p>
              </div>
              <span className="ml-auto inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] transition-transform duration-300 group-hover:translate-x-1">
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
            <div className="flex h-full items-center justify-center bg-[var(--color-text)] px-6 text-center font-serif text-xl font-bold italic text-white/70">
              {blog.title}
            </div>
          )}
          <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--color-accent)] backdrop-blur-md">
            {blog.category || "Community"}
          </span>
        </div>

        {/* Content */}
        <div className="mt-6">
          <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF]">
            <span>{formatDateTime(blog.createdAt)}</span>
          </div>

          <h2 className="mt-3 font-serif text-xl font-semibold leading-[1.2] tracking-[-0.02em] text-[var(--color-text)] transition-colors duration-300 group-hover:text-[var(--color-accent)] sm:text-2xl">
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
            <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--color-accent)] transition-transform duration-300 group-hover:translate-x-1">
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
  const { user, loading: authLoading } = useAuth();
  const hero = useSection("blog", "hero");
  const stories = useSection("blog", "stories");

  const [form, setForm] = useState({
    title: "",
    category: "Community",
    story: "",
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
    const email = user?.email?.trim();
    if (!user || !email) {
      setFormError("Please sign in to publish your story.");
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

      setForm({ title: "", category: "Community", story: "" });
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
    <div className="min-h-screen bg-[#EAE7DE] font-sans text-[var(--color-text)]">
      {/* ================= HERO ================= */}
      <section className="relative isolate flex min-h-[570px] items-center overflow-hidden sm:min-h-[660px]">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${hero.image})` }}
        />
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/70 to-black/20" />
        <div className="absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-[#EAE7DE]/40 to-transparent" />

        <div className="relative z-20 mx-auto w-full max-w-[1400px] px-5 py-24 sm:px-10 lg:px-16">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#F2A088] sm:text-xs">
              <span className="h-px w-9 bg-[#F2A088]" />
              {hero.eyebrow}
            </p>
            <h1 className="font-serif text-5xl font-semibold leading-[0.98] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              {hero.title}
              <br />
              <span className="italic text-[#F2A088]">{hero.accentTitle}</span>
            </h1>
            <p className="mt-7 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              {hero.description}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <a
                href="#all-stories"
                className="group rounded-full bg-[var(--color-accent)] px-7 py-3.5 text-xs font-bold uppercase tracking-[0.13em] text-white transition-all duration-300 hover:bg-[var(--color-accent-hover)] hover:shadow-lg hover:shadow-[var(--color-accent)]/30"
              >
                {hero.buttonText} <span aria-hidden="true" className="ml-2 inline-block transition-transform group-hover:translate-y-1">↓</span>
              </a>
              <a
                href="#share-your-story"
                className="text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:text-[#F2A088]"
              >
                {hero.secondaryText} <span aria-hidden="true" className="ml-1">↗</span>
              </a>
            </div>
          </div>
          <div className="mt-20 hidden items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:flex">
            <span className="h-px w-12 bg-white/35" />
            {hero.note}
          </div>
        </div>
      </section>

      {/* ================= ALL STORIES ================= */}
      <section id="all-stories" className="relative z-10 mx-auto max-w-[1400px] px-5 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
        <header className="mb-12 flex flex-wrap items-end justify-between gap-4 sm:mb-16">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--color-accent)]">Notes from the coffee table</p>
            <h2 className="font-serif text-4xl font-semibold leading-none tracking-[-0.04em] text-[var(--color-text)] sm:text-5xl">
              Stories worth <span className="italic text-[var(--color-accent)]">savoring.</span>
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
                  <div className="h-3 w-24 rounded bg-[var(--color-text)]/10" />
                  <div className="h-6 w-4/5 rounded bg-[var(--color-text)]/10" />
                  <div className="h-4 w-full rounded bg-[var(--color-text)]/5" />
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
          <div className="rounded-3xl border border-dashed border-[var(--color-text)]/15 px-6 py-24 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-text)]/5 text-2xl text-[var(--color-accent)]" aria-hidden="true">✳</span>
            <h3 className="mt-5 font-serif text-2xl font-semibold text-[var(--color-text)]">A fresh page awaits.</h3>
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
      <section id="share-your-story" className="relative z-10 scroll-mt-20 border-t border-[var(--color-text)]/10 bg-white/40">
        {/* Soft terracotta glow behind form */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[var(--color-accent)] opacity-[0.05] blur-[140px]" />

        <div className="mx-auto max-w-3xl px-5 py-24 sm:px-10 sm:py-32 lg:py-40">
          {/* Section Header */}
          <div className="text-center">
            <p className="mb-4 inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">
              <span className="h-px w-8 bg-[var(--color-accent)]" />
              From your table to ours
              <span className="h-px w-8 bg-[var(--color-accent)]" />
            </p>
            <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-[var(--color-text)] sm:text-5xl lg:text-6xl">
              Your coffee story
              <br />
              <span className="italic text-[var(--color-accent)]">belongs here.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-sm leading-7 text-[#4B5563] sm:text-base">
              A first sip in a new city. A recipe passed down. A café that feels like home. Share the moment you keep coming back to.
            </p>
          </div>

          <p className="mt-10 text-center text-sm leading-6 text-[#4B5563]">
            Share your story with the community.
          </p>

          {authLoading ? (
            <div className="mt-14 rounded-3xl border border-dashed border-[var(--color-text)]/20 bg-white/60 px-6 py-16 text-center">
              <p className="text-sm text-[#4B5563]">Checking your session…</p>
            </div>
          ) : !user ? (
            <div className="mt-14 rounded-3xl border border-dashed border-[var(--color-text)]/20 bg-white/60 px-6 py-16 text-center">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-accent)]/30 text-xl text-[var(--color-accent)]"
                aria-hidden="true"
              >
                🔒
              </span>
              <h3 className="mt-5 font-serif text-2xl font-semibold text-[var(--color-text)]">
                Sign in to share your story
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#4B5563]">
                You need an account to publish a story on Caffeine Lab. It only takes a moment — your email will be shown as the author.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  to="/auth/login"
                  className="rounded-full bg-[var(--color-text)] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[var(--color-text)]/10 transition hover:bg-[var(--color-accent)] hover:shadow-[var(--color-accent)]/30"
                >
                  Login to continue
                </Link>
                <Link
                  to="/auth/register"
                  className="rounded-full border border-[var(--color-text)]/20 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  Create an account
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-[var(--color-success)]">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                Signed in as {user.email}
              </p>
              <form onSubmit={handleSubmit} className="mt-10 space-y-10">
              {/* Account email (from the logged-in account, not editable) */}
              <div>
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                  Posting as
                </label>
                <div className="flex items-center gap-3 border-b border-[var(--color-text)]/15 pb-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-text)] text-[11px] font-bold text-white">
                    {initials(user.displayName || user.email || "")}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {user.displayName || "Community member"}
                    </p>
                    <p className="truncate text-xs text-[#4B5563]">{user.email}</p>
                  </div>
                  <span className="ml-auto shrink-0 rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-success)]">
                    Signed in
                  </span>
                </div>
              </div>

              {/* Title */}
            <div>
              <label htmlFor="blog-title" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Your title <span className="text-[var(--color-accent)]">*</span>
              </label>
              <input
                id="blog-title"
                type="text"
                value={form.title}
                onChange={updateField("title")}
                required
                disabled={isSubmitting}
                placeholder="A title worth remembering…"
                className="w-full border-b border-[var(--color-text)]/15 bg-transparent pb-4 font-serif text-2xl font-semibold text-[var(--color-text)] outline-none transition placeholder:text-[#9CA3AF] focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 sm:text-3xl"
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
                        ? "border-[var(--color-text)] bg-[var(--color-text)] text-white"
                        : "border-[var(--color-text)]/15 text-[#4B5563] hover:border-[var(--color-accent)]/60 hover:text-[var(--color-accent)]"
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
                className="relative flex min-h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[var(--color-text)]/20 bg-white/60 text-center transition hover:border-[var(--color-accent)]/60 hover:bg-[var(--color-accent)]/[0.03]"
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
                    <span className="relative z-10 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-[var(--color-text)] shadow-lg">
                      Change cover
                    </span>
                  </>
                ) : (
                  <span className="flex flex-col items-center px-4 py-6">
                    <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-accent)]/30 text-lg text-[var(--color-accent)]" aria-hidden="true">＋</span>
                    <span className="text-xs font-semibold text-[var(--color-text)]">Choose a cover image</span>
                    <span className="mt-1 text-[10px] text-[#9CA3AF]">PNG · JPG · WEBP · GIF · up to 5 MB</span>
                  </span>
                )}
              </label>
            </div>

            {/* Story */}
            <div>
              <label htmlFor="blog-story" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#9CA3AF]">
                Your story <span className="text-[var(--color-accent)]">*</span>
              </label>
              <textarea
                id="blog-story"
                rows={8}
                value={form.story}
                onChange={updateField("story")}
                required
                disabled={isSubmitting}
                placeholder="Start writing. Tell us about the cup, the place, or the moment…"
                className="w-full resize-none border-b border-[var(--color-text)]/15 bg-transparent pb-4 text-base leading-8 text-[var(--color-text)] outline-none transition placeholder:text-[#9CA3AF] focus:border-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Feedback */}
            {formError && (
              <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                {formError}
              </p>
            )}
            {successMessage && (
              <p role="status" className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-3 text-sm text-[var(--color-success)]">
                {successMessage}
              </p>
            )}

            {/* Submit */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || !user}
                className="group inline-flex items-center gap-3 rounded-full bg-[var(--color-text)] px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-[var(--color-text)]/10 transition-all duration-300 hover:bg-[var(--color-accent)] hover:shadow-[var(--color-accent)]/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {isSubmitting ? "Publishing…" : "Publish your story"}
                {!isSubmitting && <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>}
              </button>
            </div>
            </form>
          </>
          )}
        </div>
      </section>
    </div>
  );
}