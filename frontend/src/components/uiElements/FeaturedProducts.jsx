import { Link } from "react-router";
import { StarIcon } from "@heroicons/react/24/solid";
import { useGetProductsQuery } from "../../redux/api/productsApi/productsApi";
import WishlistButton from "./WishlistButton";

const currency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

// Single product card used in the home featured grid
const FeaturedCard = ({ product }) => (
  <Link
    to={`/product/${product._id}`}
    className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/10"
  >
    <div className="relative aspect-square overflow-hidden bg-[#f3efe7]">
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300" />
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
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
        {product.name}
      </h3>
      <div className="mt-3 flex items-center gap-1">
        <>
          <StarIcon
            className={`h-3.5 w-3.5 ${
              product.reviewCount > 0 ? "text-[var(--color-primary)]" : "text-neutral-300"
            }`}
          />
          <span className="text-xs font-medium text-neutral-500">
            {product.reviewCount > 0
              ? Number(product.rating).toFixed(1)
              : "—"}
            <span className="text-neutral-400">
              ({product.reviewCount || 0})
            </span>
          </span>
        </>
      </div>
      <span className="mt-3 text-base font-bold text-[var(--color-text)]">
        {currency(product.price)}
      </span>
    </div>
  </Link>
);

// Home section showcasing a few products from the shop with a "See More" link
export default function FeaturedProducts() {
  const { data: products = [], isLoading } = useGetProductsQuery();

  // Show only the first 4 products from the catalog
  const featured = products.slice(0, 4);

  return (
    <section className="px-4 py-12 md:px-10 max-w-[1400px] mx-auto md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 text-center">
          <p className="mb-1 text-[9px] font-bold tracking-[0.25em] uppercase text-[var(--color-accent)]">
            From our shop
          </p>
          <h2 className="font-serif text-3xl font-black leading-[1.05] text-[var(--color-text)] md:text-5xl">
            Fresh picks, <span className="text-[var(--color-primary)]">handpicked</span> for you
          </h2>
        </header>

        {isLoading ? (
          <p className="py-16 text-center text-sm text-neutral-400">
            Loading products…
          </p>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {featured.map((product) => (
              <FeaturedCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-sm text-neutral-400">
            No products available yet.
          </p>
        )}

        <div className="mt-12 flex items-center justify-center">
          <Link
            to="/shop"
            className="btn-primary text-black/90 hover:text-white"
          >
            See More
          </Link>
        </div>
      </div>
    </section>
  );
}