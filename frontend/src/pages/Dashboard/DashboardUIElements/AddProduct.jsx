import { useState } from "react";
import { useNavigate } from "react-router";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import {
  useAddProductMutation,
  useUploadProductImageMutation,
} from "../../../redux/api/productsApi/productsApi";
import PageHeader from "./PageHeader";
import { bdtToUsd, formatBdt } from "../../../utils/currency";

const CATEGORIES = ["Coffee", "Equipment", "Food", "Tea", "Accessories"];
const MAX_IMAGE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const AddProduct = () => {
  const [addProduct, { isLoading }] = useAddProductMutation();
  const [uploadProductImage, { isLoading: isUploading }] =
    useUploadProductImageMutation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    category: "Coffee",
    priceBdt: "",
    weight: "",
    badge: "",
    description: "",
    rating: "",
  });
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

    const product = {
      name: form.name.trim(),
      category: form.category.trim() || "Coffee",
      price: bdtToUsd(priceBdt),
      weight: form.weight.trim(),
      badge: form.badge.trim(),
      description: form.description.trim(),
    };
    if (form.rating) product.rating = Number(form.rating);

    try {
      // Upload the selected image first; the API stores it in MongoDB and
      // returns a path like "products/<id>".
      let image = "";
      if (imageFile) {
        ({ image } = await uploadProductImage({ file: imageFile }).unwrap());
      }
      await addProduct({ ...product, image }).unwrap();
      navigate("/dashboard/products");
    } catch (err) {
      console.error("Failed to add product:", err);
      setError(err?.data?.error || "Failed to add product.");
    }
  };

  const priceBdtNumber = Number(form.priceBdt) || 0;
  const isBusy = isLoading || isUploading;

  return (
    <div>
      <PageHeader
        title="Add Product"
        description="Create a new product for your store."
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8"
      >
        <div>
          <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-neutral-600">
            Name
          </label>
          <input
            id="product-name"
            type="text"
            value={form.name}
            onChange={updateField("name")}
            placeholder="Ethiopian Yirgacheffe"
            className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Category
            </label>
            <select
              id="product-category"
              value={form.category}
              onChange={updateField("category")}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Price (৳)
            </label>
            <input
              id="product-price"
              type="number"
              min="1"
              step="1"
              value={form.priceBdt}
              onChange={updateField("priceBdt")}
              placeholder="1250"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
            />
            <p className="mt-1 text-xs text-neutral-400">
              Customers see {formatBdt(priceBdtNumber)}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="product-weight" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Weight / Size
            </label>
            <input
              id="product-weight"
              type="text"
              value={form.weight}
              onChange={updateField("weight")}
              placeholder="250g"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
            />
          </div>
          <div>
            <label htmlFor="product-badge" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Badge (optional)
            </label>
            <input
              id="product-badge"
              type="text"
              value={form.badge}
              onChange={updateField("badge")}
              placeholder="New"
              className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
          <div>
            <label htmlFor="product-image" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Product image (optional)
            </label>
            <div className="flex items-center gap-4">
              <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-dashed border-black/15 bg-[#f3efe7]">
                {imagePreview && (
                  <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
                )}
              </div>
              <input
                id="product-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageChange}
                disabled={isBusy}
                className="block w-full text-sm text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-[#1d1d1d] file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wider file:text-white hover:file:bg-[#e11d48]"
              />
            </div>
          </div>
          <div>
            <label htmlFor="product-rating" className="mb-1.5 block text-sm font-medium text-neutral-600">
              Rating (0-5)
            </label>
            <input
              id="product-rating"
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
          <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium text-neutral-600">
            Description
          </label>
          <textarea
            id="product-description"
            rows={4}
            value={form.description}
            onChange={updateField("description")}
            placeholder="Tell customers about this product…"
            className="w-full resize-none rounded-xl border border-black/10 px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-4 py-3 text-sm font-medium text-[#c81a40]">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/products")}
            className="rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="flex items-center justify-center gap-2 rounded-full bg-[#e11d48] px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusCircleIcon className="h-5 w-5" />
            {isUploading ? "Uploading…" : isLoading ? "Adding…" : "Add Product"}
          </button>
        </div>
      </form>
    </div>
  );
};
