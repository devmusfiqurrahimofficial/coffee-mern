import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ShoppingCartIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/solid";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/features/cartSlice/cartSlice";
import { useGetProductQuery, useGetProductsQuery } from "../redux/api/productsApi/productsApi";
import { useGetReviewsQuery, useAddReviewMutation } from "../redux/api/reviewsApi/reviewsApi";

const currency = (value) => `$${Number(value || 0).toFixed(2)}`;

// Featured carousel settings
const FEATURED_POOL = 8; // total featured products to pull from
const FEATURED_VISIBLE = 4; // how many are shown at once

// Interactive star picker used in the review form
const StarPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
        className="transition-transform hover:scale-110"
      >
        <StarIcon
          className={`h-7 w-7 ${
            star <= value ? "text-[#e11d48]" : "text-neutral-300"
          }`}
        />
      </button>
    ))}
    <span className="ml-2 text-sm text-neutral-500">
      {value ? `${value}/5` : "Select"}
    </span>
  </div>
);

// Read-only average rating with numeric value
const RatingStars = ({ value = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        className={`h-5 w-5 ${
          star <= Math.round(value) ? "text-[#e11d48]" : "text-neutral-300"
        }`}
      />
    ))}
  </div>
);

// Section header with a "See all" link to the shop.
// `actions` is an optional slot (e.g. carousel arrows) rendered next to the link.
const SectionHeader = ({
  title,
  subtitle,
  linkText = "See More",
  to = "/shop",
  actions,
}) => (
  <div className="mb-6 flex items-end justify-between gap-4">
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e11d48]">
        {subtitle}
      </p>
      <h2 className="mt-1 font-serif text-3xl font-black text-[#1d1d1d] md:text-4xl">
        {title}
      </h2>
    </div>
    <div className="flex flex-shrink-0 items-center gap-2">
      {actions}
      <Link
        to={to}
        className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-semibold text-[#1d1d1d] transition hover:border-[#e11d48] hover:text-[#e11d48]"
      >
        {linkText}
      </Link>
    </div>
  </div>
);

// Compact product card used in the "similar" / "featured" grids
const MiniProductCard = ({ product }) => (
  <Link
    to={`/product/${product._id}`}
    className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="relative aspect-square overflow-hidden bg-[#f3efe7]">
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {product.badge && (
        <span className="absolute left-3 top-3 rounded-full bg-[#e11d48] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
          {product.badge}
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {product.category}
      </p>
      <h3 className="mt-1 font-serif text-base font-bold leading-tight text-[#1d1d1d] transition group-hover:text-[#e11d48]">
        {product.name}
      </h3>
      <div className="mt-2 flex items-center gap-1">
        {product.rating ? (
          <>
            <StarIcon className="h-3.5 w-3.5 text-[#e11d48]" />
            <span className="text-xs font-medium text-neutral-500">
              {product.rating}
            </span>
          </>
        ) : null}
      </div>
      <span className="mt-2 text-base font-bold text-[#1d1d1d]">
        {currency(product.price)}
      </span>
    </div>
  </Link>
);



// ---------------------------------------------------------------------------
// Review submission form
// ---------------------------------------------------------------------------
const ReviewForm = ({ productId, onSubmitted }) => {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [addReview, { isLoading }] = useAddReviewMutation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;

    try {
      await addReview({ productId, name, rating, comment }).unwrap();
      setName("");
      setRating(0);
      setComment("");
      onSubmitted?.();
    } catch (error) {
      console.error("Failed to submit review:", error);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
    >
      <h3 className="font-serif text-xl font-bold text-[#1d1d1d]">
        Write a review
      </h3>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-neutral-600">
          Your rating
        </label>
        <StarPicker value={rating} onChange={setRating} />
      </div>

      <div className="mt-4">
        <label
          htmlFor="reviewer-name"
          className="mb-1 block text-sm font-medium text-neutral-600"
        >
          Name
        </label>
        <input
          id="reviewer-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="reviewer-comment"
          className="mb-1 block text-sm font-medium text-neutral-600"
        >
          Review
        </label>
        <textarea
          id="reviewer-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this product..."
          className="w-full resize-none rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]"
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={!rating || isLoading}
          className="rounded-full bg-[#e11d48] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Submitting..." : "Submit Review"}
        </button>
        {!rating && (
          <span className="text-xs text-neutral-400">
            Please select a rating
          </span>
        )}
      </div>
    </form>
  );
};



// ---------------------------------------------------------------------------
// Single product page
// ---------------------------------------------------------------------------
const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();

  // Fetch the product and its reviews from the database
  const { data: product, isLoading, isError } = useGetProductQuery(id, {
    skip: !id,
  });
  const { data: reviewData, isLoading: reviewsLoading } = useGetReviewsQuery(
    id,
    { skip: !id }
  );

  // Fetch all products to build "similar" and "featured" sections
  const { data: allProducts = [] } = useGetProductsQuery();

  // Products in the same category (excluding the current one)
  const similarProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p._id !== product._id && p.category === product.category)
      .slice(0, 4);
  }, [allProducts, product]);

  // Featured = top-rated products across the catalog (excluding current)
  const featuredProducts = useMemo(() => {
    if (!product) return [];
    return allProducts
      .filter((p) => p._id !== product._id)
      .slice()
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, FEATURED_POOL);
  }, [allProducts, product]);

  // Carousel position for the featured section (how many products to skip)
  const [featuredStart, setFeaturedStart] = useState(0);

  // Reset the carousel back to the start whenever the product changes
  useEffect(() => {
    setFeaturedStart(0);
  }, [product?._id]);

  // Toast state for "added to cart" feedback
  const [added, setAdded] = useState(false);
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2500);
    return () => clearTimeout(timer);
  }, [added]);

  const reviews = reviewData?.reviews ?? [];
  const average = reviewData?.average ?? 0;
  const reviewCount = reviewData?.count ?? 0;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-10 text-neutral-500">
        Loading product…
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-10 text-center">
        <p className="text-lg text-[#1d1d1d]">Product not found.</p>
        <Link
          to="/shop"
          className="rounded-full bg-[#1d1d1d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e11d48]"
        >
          Back to Shop
        </Link>
      </div>
    );
  }

  const handleAdd = () => {
    dispatch(
      addToCart({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    );
    setAdded(true);
  };

  // Derived carousel state for the featured section
  const maxFeaturedStart = Math.max(
    0,
    featuredProducts.length - FEATURED_VISIBLE
  );
  const safeFeaturedStart = Math.min(featuredStart, maxFeaturedStart);
  const visibleFeatured = featuredProducts.slice(
    safeFeaturedStart,
    safeFeaturedStart + FEATURED_VISIBLE
  );
  const canPrevFeatured = safeFeaturedStart > 0;
  const canNextFeatured = safeFeaturedStart < maxFeaturedStart;

  const prevFeatured = () =>
    setFeaturedStart((start) => Math.max(0, start - 1));
  const nextFeatured = () =>
    setFeaturedStart((start) => Math.min(maxFeaturedStart, start + 1));

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
          <Link to="/" className="transition hover:text-[#1d1d1d]">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <Link to="/shop" className="transition hover:text-[#1d1d1d]">
            Shop
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-[#e11d48]">{product.name}</span>
        </nav>

        {/* Product top section */}
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Image */}
          <div className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
            <div className="relative aspect-square overflow-hidden bg-[#f3efe7]">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {product.badge && (
                <span className="absolute left-4 top-4 rounded-full bg-[#e11d48] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {product.category}
            </p>
            <h1 className="mt-2 font-serif text-4xl font-black leading-tight text-[#1d1d1d] md:text-5xl">
              {product.name}
            </h1>

            {/* Rating summary (from DB reviews) */}
            <div className="mt-4 flex items-center gap-3">
              <RatingStars value={average} />
              <span className="text-sm font-medium text-neutral-600">
                {average ? average.toFixed(1) : "—"}
              </span>
              <span className="text-sm text-neutral-400">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Price */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="font-serif text-4xl font-black text-[#1d1d1d]">
                {currency(product.price)}
              </span>
            </div>

            {product.weight && (
              <p className="mt-2 text-sm text-neutral-500">{product.weight}</p>
            )}

            {/* Product details */}
            <div className="mt-8 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-[#1d1d1d]">
                Product details
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {product.description ||
                  `${product.name} — a premium selection from our ${
                    product.category?.toLowerCase() || "coffee"
                  } range, crafted to elevate your everyday experience.`}
              </p>
            </div>

            {/* Add to cart */}
            <div className="mt-8 flex items-center gap-4">
              <button
                type="button"
                onClick={handleAdd}
                className="flex items-center gap-2 rounded-full bg-[#e11d48] px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
              </button>
              {added && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  Added to cart
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <section className="mt-16">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row">
            {/* Header + average */}
            <div className="lg:w-64">
              <h2 className="font-serif text-3xl font-black text-[#1d1d1d]">
                Ratings & Reviews
              </h2>
              <div className="mt-4 flex items-center gap-3">
                <span className="font-serif text-5xl font-black text-[#1d1d1d]">
                  {average ? average.toFixed(1) : "—"}
                </span>
                <div>
                  <RatingStars value={average} />
                  <p className="mt-1 text-sm text-neutral-500">
                    {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>
            </div>

            {/* Review form */}
            <div className="flex-1">
              <ReviewForm
                productId={product._id}
                onSubmitted={() => {
                  /* RTK Query auto-refetches via invalidatesTags */
                }}
              />
            </div>
          </div>

          {/* Reviews list */}
          <div className="space-y-4">
            {reviewsLoading ? (
              <p className="text-sm text-neutral-400">Loading reviews…</p>
            ) : reviews.length > 0 ? (
              reviews.map((review) => (
                <article
                  key={review._id}
                  className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1d] text-sm font-bold text-white">
                        {(review.name || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-[#1d1d1d]">
                          {review.name || "Anonymous"}
                        </h4>
                        {review.createdAt && (
                          <p className="text-xs text-neutral-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "text-[#e11d48]"
                              : "text-neutral-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                      {review.comment}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-black/10 bg-white/50 p-8 text-center text-sm text-neutral-500">
                No reviews yet. Be the first to review this product!
              </p>
            )}
          </div>
        </section>

        {/* Similar products (same category) */}
        {similarProducts.length > 0 && (
          <section className="mt-16">
            <SectionHeader
              subtitle="You may also like"
              title="Similar Products"
              linkText="See More"
              to="/shop"
            />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {similarProducts.map((item) => (
                <MiniProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}

        {/* Featured products (top rated) */}
        {featuredProducts.length > 0 && (
          <section className="mt-16">
            <SectionHeader
              subtitle="Handpicked for you"
              title="Featured Products"
              linkText="See More"
              to="/shop"
              actions={
                featuredProducts.length > FEATURED_VISIBLE ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={prevFeatured}
                      disabled={!canPrevFeatured}
                      aria-label="Previous featured products"
                      className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-[#1d1d1d] transition hover:border-[#e11d48] hover:text-[#e11d48] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextFeatured}
                      disabled={!canNextFeatured}
                      aria-label="Next featured products"
                      className="grid h-10 w-10 place-items-center rounded-full border border-black/10 bg-white text-[#1d1d1d] transition hover:border-[#e11d48] hover:text-[#e11d48] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                ) : null
              }
            />
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {visibleFeatured.map((item) => (
                <MiniProductCard key={item._id} product={item} />
              ))}
            </div>
          </section>
        )}

        {/* See all products */}
        <section className="mt-16">
          <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-black/5 bg-white p-10 text-center shadow-sm sm:flex-row sm:text-left">
            <div>
              <h2 className="font-serif text-2xl font-black text-[#1d1d1d] md:text-3xl">
                Explore our full collection
              </h2>
              <p className="mt-2 text-sm text-neutral-500">
                Discover everything from freshly roasted beans to professional
                equipment.
              </p>
            </div>
            <Link
              to="/shop"
              className="flex-shrink-0 rounded-full bg-[#e11d48] px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
            >
              See All Products
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductPage;
