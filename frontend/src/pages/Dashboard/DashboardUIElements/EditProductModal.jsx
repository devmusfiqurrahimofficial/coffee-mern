import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import {
  useUpdateProductMutation,
  useUploadProductImageMutation,
} from "../../../redux/api/productsApi/productsApi";
import { bdtToUsd, formatBdt } from "../../../utils/currency";

const CATEGORIES = ["Coffee", "Equipment", "Food", "Tea", "Accessories"];
const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const initialForm = (product) =>
  product
    ? {
        name: product.name || "",
        category: product.category || "",
        priceBdt: String(Number(product.price || 0)),
        weight: product.weight || "",
        badge: product.badge || "",
        image: product.image || "",
        description: product.description || "",
        rating: product.rating ? String(product.rating) : "",
      }
    : {
        name: "",
        category: "",
        priceBdt: "",
        weight: "",
        badge: "",
        image: "",
        description: "",
        rating: "",
      };

const EditProductModal = ({ product, onClose, onSaved }) => {
  const [updateProduct, { isLoading }] = useUpdateProductMutation();
  const [uploadProductImage, { isLoading: isUploading }] =
    useUploadProductImageMutation();

  const [form, setForm] = useState(() => initialForm(product));
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [error, setError] = useState("");

  const updateField = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;
    setError("");
    if (!file) {
      setImageFile(null);
      setImagePreview("");
      return;
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Product images must be JPEG, PNG, WebP, or GIF files.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Product images must be 100 MB or smaller.");
      event.target.value = "";
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const isBusy = isLoading || isUploading;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    const priceBdt = Number(form.priceBdt);
    if (!Number.isFinite(priceBdt) || priceBdt <= 0) {
      setError("Enter a valid price in taka.");
      return;
    }

    try {
      // Upload a replacement image if one was chosen; otherwise keep the
      // product's current image untouched.
      let image = form.image.trim();
      if (imageFile) {
        ({ image } = await uploadProductImage({ file: imageFile }).unwrap());
      }
      await updateProduct({
        id: product._id,
        name: form.name.trim(),
        category: form.category.trim() || "Coffee",
        price: bdtToUsd(priceBdt),
        weight: form.weight.trim(),
        badge: form.badge.trim(),
        image,
        description: form.description.trim(),
        rating: form.rating ? Number(form.rating) : undefined,
      }).unwrap();
      onSaved?.(form.name.trim());
    } catch (err) {
      console.error("Failed to update product:", err);
      setError(err?.data?.error || "Failed to update product.");
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  const priceBdtNumber = Number(form.priceBdt) || 0;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-lg rounded-3xl border border-black/5 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
            Edit Product
          </h2>
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
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={form.name}
              onChange={updateField("name")}
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-category" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Category
              </label>
              <input
                id="edit-category"
                type="text"
                list="edit-category-options"
                value={form.category}
                onChange={updateField("category")}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
              />
              <datalist id="edit-category-options">
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="edit-price" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Price (৳)
              </label>
              <input
                id="edit-price"
                type="number"
                min="1"
                step="1"
                value={form.priceBdt}
                onChange={updateField("priceBdt")}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Currently {formatBdt(priceBdtNumber)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-weight" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Weight / Size
              </label>
              <input
                id="edit-weight"
                type="text"
                value={form.weight}
                onChange={updateField("weight")}
                placeholder="250g"
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
              />
            </div>
            <div>
              <label htmlFor="edit-badge" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Badge
              </label>
              <input
                id="edit-badge"
                type="text"
                value={form.badge}
                onChange={updateField("badge")}
                placeholder="Best Seller"
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
            <div>
              <label htmlFor="edit-image" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Product image
              </label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-dashed border-black/15 bg-[#f3efe7]">
                  {(imagePreview || product.image) && (
                    <img
                      src={imagePreview || product.image}
                      alt="Product"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <input
                  id="edit-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={isBusy}
                  className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-[#1d1d1d] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white hover:file:bg-[#e11d48]"
                />
              </div>
            </div>
            <div>
              <label htmlFor="edit-rating" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Rating
              </label>
              <input
                id="edit-rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={form.rating}
                onChange={updateField("rating")}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-description" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Description
            </label>
            <textarea
              id="edit-description"
              rows={3}
              value={form.description}
              onChange={updateField("description")}
              className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-4 py-2.5 text-sm font-medium text-[#c81a40]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="rounded-full bg-[#e11d48] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "Uploading…" : isLoading ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductModal;
