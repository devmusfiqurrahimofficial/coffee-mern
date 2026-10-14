import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useGetProductsQuery, useDeleteProductMutation } from "../../../redux/api/productsApi/productsApi";
import PageHeader from "./PageHeader";
import EditProductModal from "./EditProductModal";
import { formatBdt } from "../../../utils/currency";

const PAGE_SIZE = 8;

export const ManageProducts = () => {
  const { data: products = [], isLoading, isError } = useGetProductsQuery();
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage] = useState(1);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "All" || product.category === category;
      const matchesQuery =
        !term ||
        [product.name, product.description].some((field) =>
          field?.toLowerCase().includes(term)
        );
      return matchesCategory && matchesQuery;
    });
  }, [products, query, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const visible = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(
      `Delete "${product.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setMessage({ type: "", text: "" });
    try {
      await deleteProduct(product._id).unwrap();
      setMessage({ type: "success", text: `"${product.name}" deleted.` });
    } catch (error) {
      console.error("Failed to delete product:", error);
      setMessage({
        type: "error",
        text: error?.data?.error || "Failed to delete product.",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="All Products"
        description="Search, edit, or remove products from your store."
        actions={
          <Link
            to="/dashboard/products/add"
            className="flex items-center gap-2 rounded-full bg-[#e11d48] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add Product
          </Link>
        }
      />

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search products…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
        >
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">
          {filtered.length} of {products.length} products
        </span>
      </div>

      {message.text && (
        <p
          role="status"
          className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
            message.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-[#e11d48]/30 bg-[#e11d48]/10 text-[#c81a40]"
          }`}
        >
          <ExclamationCircleIcon className="h-4 w-4" />
          {message.text}
        </p>
      )}

      {isLoading && (
        <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
          Loading products…
        </p>
      )}

      {isError && (
        <p className="rounded-2xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-5 py-10 text-center text-sm text-[#c81a40]">
          Failed to load products. Is the server running on port 5000?
        </p>
      )}

      {!isLoading && !isError && products.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-serif text-xl text-[#1d1d1d]">No products yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            Add your first product to start selling.
          </p>
        </div>
      )}

      {!isLoading && !isError && products.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Rating</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visible.map((product) => (
                  <tr key={product._id} className="transition hover:bg-black/[0.02]">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-11 w-11 flex-shrink-0 rounded-xl border border-black/5 object-cover"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#1d1d1d]">
                            {product.name}
                          </p>
                          {product.badge && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#e11d48]">
                              {product.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-neutral-600">{product.category}</td>
                    <td className="px-5 py-3 font-bold text-[#1d1d1d]">
                      {formatBdt(product.price)}
                    </td>
                    <td className="px-5 py-3 text-neutral-600">
                      {product.rating ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditing(product)}
                          className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d]"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          disabled={isDeleting}
                          className="flex items-center gap-1.5 rounded-full border border-[#e11d48]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#e11d48] transition hover:bg-[#e11d48] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={safePage === 1}
              aria-label="Previous page"
              className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white text-neutral-500 transition enabled:hover:border-[#e11d48] enabled:hover:text-[#e11d48] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={safePage === totalPages}
              aria-label="Next page"
              className="grid h-9 w-9 place-items-center rounded-full border border-black/10 bg-white text-neutral-500 transition enabled:hover:border-[#e11d48] enabled:hover:text-[#e11d48] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditProductModal
          product={editing}
          onClose={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null);
            setMessage({ type: "success", text: `"${name}" updated.` });
          }}
        />
      )}
    </div>
  );
};
