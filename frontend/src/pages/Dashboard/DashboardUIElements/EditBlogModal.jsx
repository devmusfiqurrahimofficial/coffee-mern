import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { useUpdateBlogMutation } from "../../../redux/api/blogsApi/blogsApi";

const CATEGORIES = ["Community", "Brewing", "Origins", "Culture", "Process"];

const EditBlogModal = ({ blog, onClose, onSaved }) => {
  const [updateBlog, { isLoading }] = useUpdateBlogMutation();
  const [form, setForm] = useState({
    title: blog?.title || "",
    category: blog?.category || "Community",
    story: blog?.content || "",
    image: blog?.image || "",
  });
  const [error, setError] = useState("");

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!form.story.trim()) {
      setError("The story cannot be empty.");
      return;
    }

    try {
      await updateBlog({
        id: blog._id,
        title: form.title.trim(),
        category: form.category,
        content: form.story.trim(),
        excerpt: form.story.trim().slice(0, 160),
        image: form.image.trim(),
      }).unwrap();
      onSaved?.(form.title.trim());
    } catch (err) {
      console.error("Failed to update blog:", err);
      setError(err?.data?.error || "Failed to update the blog.");
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-black/5 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[var(--color-text)]">Edit Blog</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-neutral-500 transition hover:bg-black/5"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div>
            <label htmlFor="edit-blog-title" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Title
            </label>
            <input
              id="edit-blog-title"
              type="text"
              value={form.title}
              onChange={updateField("title")}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-blog-category" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Category
              </label>
              <select
                id="edit-blog-category"
                value={form.category}
                onChange={updateField("category")}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="edit-blog-image" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Cover image URL
              </label>
              <input
                id="edit-blog-image"
                type="text"
                value={form.image}
                onChange={updateField("image")}
                placeholder="https://coffee-mern.onrender.com/images/…"
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-blog-story" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Story
            </label>
            <textarea
              id="edit-blog-story"
              rows={10}
              value={form.story}
              onChange={updateField("story")}
              className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm leading-7 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-2.5 text-sm font-medium text-[var(--color-primary-hover)]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBlogModal;
