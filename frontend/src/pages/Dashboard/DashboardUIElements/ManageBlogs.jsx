import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useGetBlogsQuery, useDeleteBlogMutation } from "../../../redux/api/blogsApi/blogsApi";
import PageHeader from "./PageHeader";
import EditBlogModal from "./EditBlogModal";
import { formatDate } from "./stats";

export const ManageBlogs = () => {
  const { data, isLoading, isError } = useGetBlogsQuery({ all: true });
  const [deleteBlog, { isLoading: isDeleting }] = useDeleteBlogMutation();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const blogs = useMemo(() => data?.blogs || [], [data]);

  const categories = useMemo(
    () => ["All", ...new Set(blogs.map((blog) => blog.category).filter(Boolean))],
    [blogs]
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return blogs.filter((blog) => {
      const matchesCategory = category === "All" || blog.category === category;
      const matchesQuery =
        !term ||
        [blog.title, blog.content, blog.author].some((field) =>
          field?.toLowerCase().includes(term)
        );
      return matchesCategory && matchesQuery;
    });
  }, [blogs, query, category]);

  const handleDelete = async (blog) => {
    const confirmed = window.confirm(`Delete "${blog.title}"? This cannot be undone.`);
    if (!confirmed) return;

    setMessage({ type: "", text: "" });
    try {
      await deleteBlog(blog._id).unwrap();
      setMessage({ type: "success", text: `"${blog.title}" deleted.` });
    } catch (error) {
      console.error("Failed to delete blog:", error);
      setMessage({
        type: "error",
        text: error?.data?.error || "Failed to delete blog.",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="All Blogs"
        description="Publish new stories or remove existing ones."
        actions={
          <Link
            to="/dashboard/blogs/add"
            className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add Blog
          </Link>
        }
      />

      {message.text && (
        <p
          role="status"
          className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary-hover)]"
          }`}
        >
          <ExclamationCircleIcon className="h-4 w-4" />
          {message.text}
        </p>
      )}

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blogs…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
        >
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">
          {visible.length} of {blogs.length} posts
        </span>
      </div>

      {isLoading && (
        <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
          Loading blogs…
        </p>
      )}

      {isError && (
        <p className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-5 py-10 text-center text-sm text-[var(--color-primary-hover)]">
          Failed to load blogs. Is the server running on port 5000?
        </p>
      )}

      {!isLoading && !isError && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-serif text-xl text-[var(--color-text)]">No blog posts yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            Write your first story to share with the community.
          </p>
        </div>
      )}

      {!isLoading && !isError && visible.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((blog) => (
            <article
              key={blog._id}
              className="flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="aspect-[16/10] overflow-hidden bg-[#f3efe7]">
                {blog.image ? (
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center font-serif text-lg font-bold italic text-neutral-400">
                    {blog.title}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span className="rounded-full bg-[#f3efe7] px-2 py-0.5 text-[var(--color-text)]">
                    {blog.category || "Community"}
                  </span>
                  <span>{formatDate(blog.createdAt)}</span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-bold leading-tight text-[var(--color-text)]">
                  {blog.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                  {blog.excerpt || blog.content}
                </p>
                <p className="mt-2 text-xs text-neutral-400">by {blog.author}</p>

                <div className="mt-4 flex items-center justify-between border-t border-black/5 pt-3">
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/blog/${blog._id}`}
                      className="text-xs font-semibold text-neutral-600 transition hover:text-[var(--color-primary)]"
                    >
                      View post
                    </Link>
                    <button
                      type="button"
                      onClick={() => setEditing(blog)}
                      className="flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-text)]"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(blog)}
                    disabled={isDeleting}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <EditBlogModal
          blog={editing}
          onClose={() => setEditing(null)}
          onSaved={(title) => {
            setEditing(null);
            setMessage({ type: "success", text: `"${title}" updated.` });
          }}
        />
      )}
    </div>
  );
};
