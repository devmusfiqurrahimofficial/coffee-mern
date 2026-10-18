import { useState } from "react";
import { useNavigate } from "react-router";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import {
  useAddBlogMutation,
  useUploadBlogCoverMutation,
} from "../../../redux/api/blogsApi/blogsApi";
import { useAuth } from "../../../hooks/auth";
import PageHeader from "./PageHeader";

const CATEGORIES = ["Community", "Brewing", "Origins", "Culture", "Process"];
const MAX_COVER_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_COVER_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const AddBlog = () => {
  const [addBlog, { isLoading }] = useAddBlogMutation();
  const [uploadBlogCover, { isLoading: isUploading }] = useUploadBlogCoverMutation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    category: "Community",
    story: "",
  });
  const [coverPreview, setCoverPreview] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [error, setError] = useState("");

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0] || null;
    setError("");
    if (!file) {
      setCoverFile(null);
      setCoverPreview("");
      return;
    }
    if (!ALLOWED_COVER_IMAGE_TYPES.includes(file.type)) {
      setError("Cover images must be JPEG, PNG, WebP, or GIF files.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_COVER_IMAGE_SIZE) {
      setError("Cover images must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("A title is required.");
      return;
    }
    if (!form.story.trim()) {
      setError("Please write the story before publishing.");
      return;
    }
    if (!user?.email) {
      setError("Your session expired. Please sign in again.");
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
          email: user.email,
          image,
        },
      }).unwrap();

      navigate("/dashboard/blogs");
    } catch (err) {
      console.error("Failed to publish blog:", err);
      setError(err?.data?.error || "Failed to publish the blog.");
    }
  };

  const isBusy = isLoading || isUploading;

  return (
    <div>
      <PageHeader title="Add Blog" description="Write and publish a new story." />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
      >
        <div>
          <label htmlFor="blog-title" className="mb-1.5 block text-sm font-medium text-neutral-600">
            Title
          </label>
          <input
            id="blog-title"
            type="text"
            value={form.title}
            onChange={updateField("title")}
            placeholder="A title worth remembering…"
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
          />
        </div>

        <div>
          <label htmlFor="blog-category" className="mb-1.5 block text-sm font-medium text-neutral-600">
            Category
          </label>
          <select
            id="blog-category"
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
          <label htmlFor="blog-cover" className="mb-1.5 block text-sm font-medium text-neutral-600">
            Cover image (optional)
          </label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-dashed border-black/15 bg-[#f3efe7]">
              {coverPreview && (
                <img src={coverPreview} alt="Cover preview" className="h-full w-full object-cover" />
              )}
            </div>
            <input
              id="blog-cover"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleCoverChange}
              disabled={isBusy}
              className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-text)] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white hover:file:bg-[var(--color-primary)]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="blog-story" className="mb-1.5 block text-sm font-medium text-neutral-600">
            Story
          </label>
          <textarea
            id="blog-story"
            rows={10}
            value={form.story}
            onChange={updateField("story")}
            placeholder="Start writing…"
            className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm leading-7 text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
          />
        </div>

        <p className="rounded-xl bg-[#f3efe7] px-4 py-3 text-xs text-neutral-500">
          Publishing as{" "}
          <span className="font-semibold text-[var(--color-text)]">{user?.email}</span> — this
          email is shown as the author.
        </p>

        {error && (
          <p role="alert" className="rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-4 py-3 text-sm font-medium text-[var(--color-primary-hover)]">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/blogs")}
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-text)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusCircleIcon className="h-5 w-5" />
            {isUploading ? "Uploading…" : isLoading ? "Publishing…" : "Publish Blog"}
          </button>
        </div>
      </form>
    </div>
  );
};
