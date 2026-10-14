import { Link } from "react-router";
import { StarIcon } from "@heroicons/react/24/solid";
import { useGetProductsQuery } from "../../redux/api/productsApi/productsApi";

const currency = (value) => `$${Number(value || 0).toFixed(2)}`;

// Single product card used in the home featured grid
const FeaturedCard = ({ product }) => (
  <Link
    to={`/product/${product._id}`}
    className="group flex flex-col overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
  >
    <div className="relative aspect-square overflow-hidden bg-[#f3efe7]">
      <img
        src={product.image}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      {product.badge && (
        <span className="absolute left-3 top-3 rounded-full bg-[#f2354d] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
          {product.badge}
        </span>
      )}
    </div>
    <div className="flex flex-1 flex-col p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
        {product.category}
      </p>
      <h3 className="mt-1 font-serif text-base font-bold leading-tight text-[#1d1d1d] transition group-hover:text-[#f2354d]">
        {product.name}
      </h3>
      <div className="mt-2 flex items-center gap-1">
        {product.rating ? (
          <>
            <StarIcon className="h-3.5 w-3.5 text-[#f2354d]" />
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

// Home section showcasing a few products from the shop with a "See More" link
export default function FeaturedProducts() {
  const { data: products = [], isLoading } = useGetProductsQuery();

  // Show only the first 4 products from the catalog
  const featured = products.slice(0, 4);

  return (
    <section className="px-4 py-12 md:px-10 max-w-[1400px] mx-auto md:py-16">
      <div className="mx-auto max-w-6xl">
        <header className="mb-9 text-center">
          <p className="mb-1 text-[9px] font-bold tracking-[0.2em] text-[#ff6375]">
            FROM OUR SHOP
          </p>
          <h2 className="font-serif text-3xl font-black leading-[1.05] text-[#1d1d1d] md:text-5xl">
            Fresh picks, <span className="text-[#f2354d]">handpicked</span> for you
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

        <div className="mt-10 flex items-center justify-center">
          <Link
            to="/shop"
            className="rounded-full bg-[#f2354d] px-8 py-3.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#dc1e37]"
          >
            See More
          </Link>
        </div>
      </div>
    </section>
  );
}
