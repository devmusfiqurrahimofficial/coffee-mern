import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { useDispatch, useSelector } from "react-redux";
import { useGetProductsQuery } from "../redux/api/productsApi/productsApi";
import { addToCart } from "../redux/features/cartSlice/cartSlice";
import WishlistButton from "../components/uiElements/WishlistButton";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const currency = (value) => `\u09f3${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;


const PAGE_SIZE = 8;



// Small star-rating renderer (value comes from the reviews average in MongoDB)
const Rating = ({ value, count }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <StarIcon
        key={star}
        className={`h-3.5 w-3.5 ${
          star <= Math.round(value || 0) ? "text-[var(--color-primary)]" : "text-neutral-300"
        }`}
      />
    ))}
    <span className="ml-1 text-xs font-medium text-neutral-500">
      {count > 0 ? Number(value || 0).toFixed(1) : "—"}
      <span className="text-neutral-400"> ({count || 0})</span>
    </span>
  </div>
);


// Fallback shown when a product has no usable image URL. Keeps the shop
// grid looking complete even when a product image is missing or fails to load.
const PRODUCT_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22400%22%20height=%22500%22%20viewBox=%220%200%20400%22%20500%22%3E%3Crect%20width=%22400%22%20height=%22500%22%20fill=%22%23f3efe7%22/%3E%3Ccircle%20cx=%22200%22%20cy=%22200%22%20r=%2250%22%20fill=%22%23d6d3d1%22/%3E%3Cpath%20d=%22M150%20260%20Q150%20340%20200%20340%20Q250%20340%20250%20260%22%20fill=%22none%22%20stroke=%22%23b9b7b5%22%20stroke-width=%2214%22%20stroke-linecap=%22round%22/%3E%3Ctext%20x=%22200%22%20y=%22430%22%20font-family=%22serif%22%20font-size=%2222%22%20font-weight=%22bold%22%20fill=%22%239ca3af%22%20text-anchor=%22middle%22%3ENo%20Image%3C/text%3E%3C/svg%3E";

// Product card

const ProductCard = ({ product, onAdd }) => (
  <article className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10">
    <div className="relative aspect-[4/5] overflow-hidden bg-[#f3efe7]">
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
      <Link to={`/product/${product.id}`} aria-label={product.name}>
        <img
          src={product.image || PRODUCT_PLACEHOLDER}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = PRODUCT_PLACEHOLDER;
          }}
        />
      </Link>
      {product.badge && (
        <span className="absolute left-3 top-3 rounded-full bg-[var(--color-primary)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
          {product.badge}
        </span>
      )}
      <div className="absolute right-3 top-3 flex gap-2">
        <WishlistButton product={product} className="h-9 w-9 grid place-items-center rounded-full bg-white/90 backdrop-blur-sm border border-white/50 text-[var(--color-text)] transition-all hover:bg-[var(--color-primary)] hover:text-white" />
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-400">
        {product.category}
      </p>
      <h3 className="mt-1.5 font-serif text-base font-bold leading-tight text-[var(--color-text)] transition group-hover:text-[var(--color-primary)]">
        <Link to={`/product/${product.id}`} className="transition hover:text-[var(--color-primary)]">
          {product.name}
        </Link>
      </h3>
      <p className="mt-1 text-xs text-neutral-500">{product.weight}</p>

      <div className="mt-3">
        <Rating value={product.rating} count={product.reviewCount} />
      </div>

      <div className="mt-4 flex items-center justify-between pt-2">
        <span className="text-lg font-bold text-[var(--color-text)]">
          {currency(product.price)}
        </span>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="btn-primary text-xs px-6 py-2.5"
        >
          <ShoppingCartIcon className="h-4 w-4" />
          Add
        </button>
      </div>
    </div>
  </article>
);

// Pagination

const Pagination = ({ page, totalPages, onChange }) => {
  if (totalPages <= 1) return null;

  // Build the page-number list, inserting ellipses when there are many pages
  const getPageItems = () => {
    const items = [];
    const push = (value) => items.push(value);

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) push(i);
      return items;
    }

    push(1);
    if (page <= 4) {
      push(2, 3, 4, 5);
      push("…");
      push(totalPages);
    } else if (page >= totalPages - 3) {
      push("…");
      for (let i = totalPages - 4; i <= totalPages; i++) push(i);
    } else {
      push("…");
      push(page - 1, page, page + 1);
      push("…");
      push(totalPages);
    }
    return items;
  };

  const arrowClass =
    "flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white text-neutral-500 transition enabled:hover:border-[var(--color-primary)] enabled:hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav className="mt-12 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={arrowClass}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-1">
        {getPageItems().map((item, index) =>
          item === "…" ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-10 w-10 items-center justify-center text-sm text-neutral-400"
            >
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onChange(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? "page" : undefined}
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                item === page
                  ? "bg-[var(--color-text)] text-white"
                  : "border border-black/10 bg-white text-neutral-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              }`}
            >
              {item}
            </button>
          )
        )}
      </div>

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
        className={arrowClass}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </nav>
  );
};

// Shop page
const Shop = ({ setCartOpen }) => {
  const dispatch = useDispatch();
  const { totalQuantity } = useSelector((state) => state.cart);

  // The search query lives in the URL (?search=) so the navbar search can
  // open the shop page with results already filtered
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";

  const [activeCategory, setActiveCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [page, setPage] = useState(1);

  const updateQuery = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set("search", value);
    } else {
      nextParams.delete("search");
    }
    setSearchParams(nextParams, { replace: true });
    setPage(1);
  };

  // Fetch products from the database (MongoDB via the Express API)
  const { data: productsFromDb = [], isLoading, isError } = useGetProductsQuery();

  // Derive the category list automatically from the products in the database.
  // "All" is always first; the rest are the unique categories actually present.
  const categories = useMemo(() => {
    const unique = [
      ...new Set(
        productsFromDb.map((p) => p.category).filter(Boolean)
      ),
    ];
    return ["All", ...unique];
  }, [productsFromDb]);

  // Reference to the results section so we can scroll it into view on page change
  const resultsRef = useRef(null);

  const visibleProducts = useMemo(() => {
    // Map DB documents (MongoDB `_id`) into the shape this page expects
    let items = productsFromDb.map((p) => ({
      id: p._id, // MongoDB uses _id — cart/product rely on `id`
      name: p.name,
      category: p.category,
      price: p.price,
      image: p.image, // must be an image URL string stored in the DB
      rating: p.rating ?? 0,
      reviewCount: p.reviewCount ?? 0,
      badge: p.badge,
      weight: p.weight,
    }));

    if (activeCategory !== "All") {
      items = items.filter((p) => p.category === activeCategory);
    }

    if (query.trim()) {
      items = items.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      );
    }

    switch (sort) {
      case "price-asc":
        items = [...items].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        items = [...items].sort((a, b) => b.price - a.price);
        break;
      case "rating":
        items = [...items].sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return items;
  }, [productsFromDb, activeCategory, query, sort]);

  // Pagination math derived from the filtered/sorted list
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedProducts = visibleProducts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  // Reset to the first page whenever the filters/sort change (handled in the
  // event handlers below, which is preferred over an effect)

  // Bring the results grid into view when the page changes (skips initial load)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [safePage]);

  // Loading / error states (declared after all hooks to respect the Rules of Hooks)
  if (isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-10 text-center text-neutral-500">
        Loading products…
      </div>
    );
  if (isError)
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-10 text-center text-neutral-500">
        Failed to load products. Please try again later.
      </div>
    );

  const handleAdd = (product) =>
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })
    );

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10 md:py-16">
        {/* Page header */}
        <header className="mb-10">
          <nav className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
            <span>Home</span>
            <span className="text-neutral-300">/</span>
            <span className="text-[var(--color-primary)]">Shop</span>
          </nav>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-primary)]">
            Elevate your coffee experience
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black leading-tight text-[var(--color-text)] md:text-6xl">
            Our <span className="text-[var(--color-primary)]">Shop</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm text-neutral-500 md:text-base">
            From freshly roasted beans to professional-grade equipment —
            everything you need for the perfect cup.
          </p>
        </header>
        {/* Toolbar */}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setPage(1);
                }}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  activeCategory === category
                    ? "border-[var(--color-text)] bg-[var(--color-text)] text-white"
                    : "border-black/10 bg-white text-neutral-600 hover:border-black/30"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Search + sort + cart */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="Search products..."
                className="w-48 rounded-full border border-black/10 bg-white py-2.5 pl-9 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)] md:w-56"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Cart</span>
              {totalQuantity > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[var(--color-text)] text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>
        {/* Results count */}
        <div ref={resultsRef} className="mb-6 scroll-mt-6">
          <p className="text-sm text-neutral-500">
            Showing{" "}
            <span className="font-semibold text-[var(--color-text)]">
              {visibleProducts.length === 0
                ? 0
                : `${startIndex + 1}–${startIndex + paginatedProducts.length}`}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-[var(--color-text)]">
              {visibleProducts.length}
            </span>{" "}
            {visibleProducts.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Product grid / empty state */}
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={handleAdd} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-black/10 bg-white/50 py-24 text-center">
            <MagnifyingGlassIcon className="h-10 w-10 text-neutral-300" />
            <p className="font-serif text-xl text-[var(--color-text)]">No products found</p>
            <p className="text-sm text-neutral-500">
              Try a different category or search term.
            </p>
            <button
              type="button"
                onClick={() => {
                  setActiveCategory("All");
                  updateQuery("");
                }}
              className="mt-2 rounded-full bg-[var(--color-text)] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--color-primary)]"
            >
              Reset filters
            </button>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={setPage}
        />
      </div>
    </div>
  );
};

export default Shop;
