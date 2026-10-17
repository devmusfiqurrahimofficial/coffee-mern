import {
  ArrowRightIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

import { Link, NavLink, useNavigate } from "react-router";
import logo from "../../assets/image/logo.png";
import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { signOut } from "firebase/auth";
import { clearWishlist } from "../../redux/features/wishlistSlice/wishlistSlice";
import { useAuth } from "../../hooks/auth";
import { auth } from "../../../firebase.config";
import { useGetProductsQuery } from "../../redux/api/productsApi/productsApi";
import { isAdminEmail } from "../../utils/admin";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/dashboard", label: "Dashboard" },
];

const Nav = ({ setCartOpen }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const dispatch = useDispatch();
  const { totalQuantity } = useSelector((state) => state.cart);

  const { data: products = [] } = useGetProductsQuery();
  const navigate = useNavigate();

  const currency = (value) =>
    `৳${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;

  const suggestions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return products.filter((product) =>
      product.name?.toLowerCase().includes(term)
    ).slice(0, 5);
  }, [products, searchTerm]);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  const visibleLinks = useMemo(
    () =>
      NAV_LINKS.filter(
        (link) => link.to !== "/dashboard" || isAdminEmail(user?.email)
      ),
    [user?.email]
  );

  const logout = () => {
    setLoading(true);
    signOut(auth)
      .then(() => {
        dispatch(clearWishlist());
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-black">
        Loading...
      </div>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-[1400px] px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo + desktop nav */}
            <div className="flex items-center gap-8 md:gap-12 flex-1">
              <Link to="/" className="flex items-center gap-2 group cursor-pointer">
                <img
                  src={logo}
                  alt="Logo"
                  className="h-8 w-16 group-hover:rotate-12 transition-transform duration-300"
                />
             
              </Link>

              <nav className="hidden md:flex items-center gap-2">
                {visibleLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-[#e11d48] text-white shadow-md shadow-[#e11d48]/30"
                          : "text-[#1d1d1d]/80 hover:text-[#e11d48] hover:bg-black/5 hover:shadow-sm"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Center: Search */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-auto">
              <form onSubmit={submitSearch} className="relative group w-full">
                <MagnifyingGlassIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 group-focus-within:text-[#e11d48] transition-colors"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-10 pr-4 py-2.5 rounded-full border border-black/10 bg-white text-sm text-[#1d1d1d] outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48] transition-all duration-200"
                />
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-[#e11d48] transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                )}
              </form>
            </div>

            {/* Right: Auth + Cart + Menu toggle */}
            <div className="flex items-center gap-2">
              {!authLoading && user ? (
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="p-2 rounded-full border border-black/10 bg-white text-[#e11d48] transition-all hover:bg-[#e11d48]/10 hover:text-[#c81a40] hover:shadow-sm"
                  aria-label="Profile"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex items-center justify-center h-5 w-5 text-xs font-semibold text-[#e11d48]">
                      {(user.displayName || user.email?.split("@")[0] || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  )}
                </button>
              ) : (
                <Link
                  to="/auth/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 bg-white text-xs font-semibold text-[#1d1d1d] transition-all hover:bg-black/5 hover:text-[#e11d48] hover:shadow-sm"
                >
                  <span className="hidden sm:inline">Login</span>
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}

              <button
                type="button"
                className="relative p-2 rounded-full bg-[#e11d48] text-white shadow-lg shadow-[#e11d48]/30 transition-all hover:scale-105 hover:shadow-[#e11d48]/40 active:scale-95"
                onClick={() => setCartOpen(true)}
                aria-label={`Cart, ${totalQuantity} items`}
              >
                <ShoppingCartIcon className="h-5 w-5" />
                {totalQuantity > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[#e11d48] text-[10px] font-bold border border-[#e11d48]">
                    {totalQuantity}
                  </span>
                )}
              </button>

              <button
                type="button"
                className="md:hidden p-2 rounded-full border border-black/10 bg-white text-[#1d1d1d] transition-all hover:bg-black/5 hover:shadow-sm"
                onClick={() => setMenuOpen(true)}
                aria-label="Open menu"
              >
                <Bars3Icon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Search overlay on mobile */}
      {searchOpen && (
        <div className="fixed inset-0 z-[50] bg-white lg:hidden">
          <div className="p-4 border-b border-black/5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="p-2 rounded-full hover:bg-black/5 text-[#1d1d1d]"
              aria-label="Close search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <form onSubmit={submitSearch} className="flex-1 relative mx-4">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-[#faf9f6] text-lg text-[#1d1d1d] outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
              />
            </form>
          </div>
          <div className="p-4 overflow-y-auto max-h-[calc(100vh-160px)]">
            {searchTerm.trim() ? (
              suggestions.length > 0 ? (
                <>
                  <p className="mb-3 px-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                    Results
                  </p>
                  <div className="space-y-2">
                    {suggestions.map((product) => (
                      <Link
                        key={product._id}
                        to={`/product/${product._id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition hover:bg-black/5"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 flex-shrink-0 rounded-lg border border-black/5 object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="block text-sm font-medium text-[#1d1d1d] truncate">
                            {product.name}
                          </span>
                          <span className="text-xs font-bold text-[#e11d48]">
                            {currency(product.price)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <p className="px-4 py-8 text-sm text-neutral-500 text-center">
                  No results found
                </p>
              )
            ) : (
              <p className="px-4 py-8 text-sm text-neutral-500 text-center">
                Start typing to search products
              </p>
            )}
          </div>
        </div>
      )}

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      {menuOpen && (
        <aside
          className="fixed inset-y-0 right-0 z-[61] w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden"
          style={{ transform: menuOpen ? "translateX(0)" : "translateX(100%)" }}
        >
          <div className="p-6 border-b border-black/5 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="Logo" className="h-7 w-7" />
              <span className="font-serif text-lg font-black tracking-tight text-[#1d1d1d] hidden sm:inline">
                Coffee<span className="text-[#e11d48]">Mern</span>
              </span>
            </Link>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-black/5 transition-colors"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <form onSubmit={submitSearch} className="relative mb-2">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-black/10 bg-[#faf9f6] text-lg text-[#1d1d1d] outline-none focus:ring-2 focus:ring-[#e11d48]/30 focus:border-[#e11d48]"
              />
            </form>

            {searchTerm.trim() && (
              <div className="max-h-60 overflow-y-auto border-t border-black/5 pt-4 space-y-2">
                {suggestions.length > 0 ? (
                  <>
                    <p className="px-2 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Results
                    </p>
                    {suggestions.map((product) => (
                      <Link
                        key={product._id}
                        to={`/product/${product._id}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition hover:bg-black/5"
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-10 w-10 flex-shrink-0 rounded-lg border border-black/5 object-cover"
                        />
                        <span className="flex-1 text-sm font-medium text-[#1d1d1d] truncate">
                          {product.name}
                        </span>
                        <span className="text-xs font-bold text-[#e11d48]">
                          {currency(product.price)}
                        </span>
                      </Link>
                    ))}
                  </>
                ) : (
                  <p className="px-4 py-4 text-sm text-neutral-500">No results found</p>
                )}
              </div>
            )}

            <nav className="space-y-1">
              {visibleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-[#e11d48] text-white shadow-md"
                        : "text-[#1d1d1d]/80 hover:bg-black/5 hover:text-[#e11d48]"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
              {!authLoading && user && (
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-[#e11d48] border border-[#e11d48]/20 bg-[#e11d48]/5 transition-all hover:bg-[#e11d48] hover:text-white hover:shadow-sm"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Logout
                </button>
              )}
            </nav>
          </div>

          <div className="mt-auto p-6 border-t border-black/5">
            <p className="text-xs text-neutral-500 text-center">
              © {new Date().getFullYear()} Coffee Mern. All rights reserved.
            </p>
          </div>
        </aside>
      )}
    </>
  );
};

export default Nav;
