import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ChatBubbleLeftEllipsisIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  StarIcon,
} from "@heroicons/react/24/solid";
import {
  useGetAllReviewsQuery,
  useAddReviewReplyMutation,
} from "../../../redux/api/reviewsApi/reviewsApi";
import { useGetProductsQuery } from "../../../redux/api/productsApi/productsApi";
import PageHeader from "./PageHeader";

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

const Stars = ({ value = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        className={`h-4 w-4 ${star <= value ? "text-[#e11d48]" : "text-neutral-300"}`}
      />
    ))}
  </div>
);

const ReviewCard = ({ review, productName }) => {
  const [addReviewReply, { isLoading }] = useAddReviewReplyMutation();
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const replies = Array.isArray(review.replies) ? review.replies : [];

  const handleReply = async (event) => {
    event.preventDefault();
    setError("");
    if (!reply.trim()) {
      setError("Write a reply first.");
      return;
    }
    try {
      await addReviewReply({ reviewId: review._id, text: reply.trim() }).unwrap();
      setReply("");
    } catch (err) {
      console.error("Failed to add reply:", err);
      setError(err?.data?.error || "Failed to add your reply.");
    }
  };

  return (
    <article className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1d] text-sm font-bold text-white">
            {(review.name || "A").charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1d1d1d]">{review.name || "Anonymous"}</p>
            <p className="text-xs text-neutral-400">{formatDate(review.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Stars value={review.rating} />
          {productName && (
            <Link
              to={`/product/${review.productId}`}
              className="rounded-full bg-[#f3efe7] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1d1d1d] transition hover:bg-[#1d1d1d] hover:text-white"
            >
              {productName}
            </Link>
          )}
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-neutral-600">{review.comment}</p>

      {replies.length > 0 && (
        <ul className="mt-4 space-y-2.5 border-l-2 border-[#e11d48]/30 pl-4">
          {replies.map((item, index) => (
            <li key={`${item.createdAt || index}`}>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#1d1d1d] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Admin
                </span>
                <span className="text-xs text-neutral-400">{formatDate(item.createdAt)}</span>
              </div>
              <p className="mt-1 text-sm text-neutral-600">{item.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleReply} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply as admin…"
          className="w-full rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="flex flex-shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#1d1d1d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e11d48] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChatBubbleLeftEllipsisIcon className="h-4 w-4" />
          {isLoading ? "Sending…" : "Reply"}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-[#e11d48]">
          {error}
        </p>
      )}
    </article>
  );
};

export const ManageReviews = () => {
  const { data: reviews = [], isLoading, isError } = useGetAllReviewsQuery();
  const { data: products = [] } = useGetProductsQuery();

  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("all");
  const [productId, setProductId] = useState("all");

  const productNames = products.reduce((map, product) => {
    map[product._id] = product.name;
    return map;
  }, {});

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesQuery =
        !term ||
        [review.name, review.comment, productNames[review.productId]].some((field) =>
          field?.toLowerCase().includes(term)
        );
      const matchesRating = rating === "all" || String(review.rating) === rating;
      const matchesProduct =
        productId === "all" || review.productId === productId;
      return matchesQuery && matchesRating && matchesProduct;
    });
  }, [reviews, query, rating, productId, productNames]);

  return (
    <div>
      <PageHeader
        title="All Reviews"
        description="Reply to customer reviews — your name is shown as Admin."
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reviews, customers, products…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
          />
        </div>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
        >
          <option value="all">All products</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[#1d1d1d] outline-none transition focus:border-[#e11d48]"
        >
          <option value="all">Any rating</option>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={String(value)}>
              {value} star{value > 1 ? "s" : ""}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">
          {visible.length} of {reviews.length} reviews
        </span>
      </div>

      {isLoading && (
        <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
          Loading reviews…
        </p>
      )}

      {isError && (
        <p className="flex items-center justify-center gap-2 rounded-2xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-5 py-10 text-center text-sm text-[#c81a40]">
          <ExclamationCircleIcon className="h-4 w-4" />
          Failed to load reviews. Is the server running on port 5000?
        </p>
      )}

      {!isLoading && !isError && visible.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-serif text-xl text-[#1d1d1d]">No reviews match your filters</p>
          <p className="mt-2 text-sm text-neutral-500">
            Try a different product, rating, or search term.
          </p>
        </div>
      )}

      {!isLoading && !isError && visible.length > 0 && (
        <div className="grid gap-4 xl:grid-cols-2">
          {visible.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              productName={productNames[review.productId]}
            />
          ))}
        </div>
      )}
    </div>
  );
};
