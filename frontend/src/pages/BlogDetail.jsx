import { Link, useParams } from "react-router";
import {
  useGetBlogQuery,
  useGetFeaturedBlogsQuery,
} from "../redux/api/blogsApi/blogsApi";

const BLOG_POLLING_INTERVAL_MS = 10_000;
const LIVE_BLOG_QUERY_OPTIONS = {
  pollingInterval: BLOG_POLLING_INTERVAL_MS,
  refetchOnMountOrArgChange: true,
  skipPollingIfUnfocused: true,
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
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

function AuthorAvatar({ author, photoURL }) {
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={`${author}'s profile`}
        className="h-12 w-12 rounded-full object-cover"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
      {initials(author)}
    </span>
  );
}

export default function BlogDetail() {
  const { id } = useParams();
  const { data: blog, isLoading, isError, error } = useGetBlogQuery(
    id,
    LIVE_BLOG_QUERY_OPTIONS
  );
  const { data: featuredBlogs = [], isLoading: isLoadingFeatured } = useGetFeaturedBlogsQuery(
    { limit: 3, excludeId: id },
    { ...LIVE_BLOG_QUERY_OPTIONS, skip: !id }
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-24 text-center text-gray-600">
        Loading story…
      </main>
    );
  }

  if (isError) {
    const message = error?.status === 404
      ? "This blog post no longer exists."
      : "We could not load this blog post.";

    return (
      <main className="min-h-screen bg-[#f4f1ea] px-4 py-24 text-center">
        <p className="text-lg font-semibold text-gray-800">{message}</p>
        <Link to="/blog" className="mt-5 inline-block font-bold text-[var(--color-primary)] hover:underline">
          ← Back to all stories
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f1ea] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <Link to="/blog" className="text-sm font-bold text-[var(--color-primary)] hover:underline">
          ← All stories
        </Link>

        <div className="mt-7 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm lg:col-span-2">
            {blog.image ? (
              <img src={blog.image} alt={blog.title} className="h-64 w-full object-cover sm:h-96" />
            ) : (
              <div className="flex h-64 items-center justify-center bg-[#2a1d18] p-8 text-center text-3xl font-extrabold italic text-white sm:h-96">
                {blog.title}
              </div>
            )}

            <div className="p-6 sm:p-10">
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold uppercase tracking-[0.14em]">
                <span className="text-[var(--color-primary)]">{blog.category || "Community"}</span>
                <span className="text-gray-400">{formatDateTime(blog.createdAt)}</span>
              </div>
              <h1 className="text-3xl font-extrabold italic leading-tight text-gray-900 sm:text-5xl">
                {blog.title}
              </h1>

              <div className="my-8 flex items-center gap-3 border-y border-gray-100 py-5">
                <AuthorAvatar author={blog.author || "Caffeine Lab"} photoURL={blog.authorPhotoURL} />
                <div>
                  <p className="font-bold text-gray-900">{blog.author || "Caffeine Lab"}</p>
                  <p className="text-sm text-gray-500">Published {formatDateTime(blog.createdAt)}</p>
                </div>
              </div>

              <div className="whitespace-pre-wrap text-base leading-8 text-gray-700 sm:text-lg">
                {blog.content}
              </div>
            </div>
          </article>

          <aside>
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">Keep reading</p>
              <h2 className="mt-2 text-2xl font-extrabold italic text-gray-900">Featured stories</h2>

              <div className="mt-6 space-y-5">
                {isLoadingFeatured && <p className="text-sm text-gray-500">Loading featured stories…</p>}
                {!isLoadingFeatured && featuredBlogs.length === 0 && (
                  <p className="text-sm text-gray-500">More featured stories will appear here soon.</p>
                )}
                {featuredBlogs.map((featured) => (
                  <Link
                    key={featured._id}
                    to={`/blog/${featured._id}`}
                    className="group block overflow-hidden rounded-xl border border-gray-100 transition-shadow hover:shadow-md"
                  >
                    {featured.image && <img src={featured.image} alt="" className="h-32 w-full object-cover" />}
                    <div className="p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                        {featured.category || "Community"}
                      </p>
                      <h3 className="mt-2 font-extrabold leading-snug text-gray-900 group-hover:text-[var(--color-primary-hover)]">
                        {featured.title}
                      </h3>
                      <p className="mt-2 text-xs text-gray-500">{formatDateTime(featured.createdAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <Link to="/blog" className="mt-7 inline-block text-sm font-bold text-[var(--color-primary)] hover:underline">
                See all stories →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}