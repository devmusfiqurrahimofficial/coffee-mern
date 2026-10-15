import {
  ArrowRightIcon,
  Bars3Icon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';


import { Link, NavLink, useNavigate } from 'react-router';
import logo from '../../assets/image/logo.png';
import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signOut } from 'firebase/auth';
import { clearWishlist } from '../../redux/features/wishlistSlice/wishlistSlice';
import { useAuth } from '../../hooks/auth';
import { auth } from '../../../firebase.config';
import { useGetProductsQuery } from '../../redux/api/productsApi/productsApi';
import { isAdminEmail } from '../../utils/admin';

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
  { to: "/dashboard", label: "Dashboard" },
];

const Nav = ({  setCartOpen }) => {
  const { user, loading: authLoading } = useAuth();
  const[loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cart item count from the Redux store (drives the badge on the cart icon)
  const dispatch = useDispatch();
  const { totalQuantity } = useSelector((state) => state.cart);

  // Products power the live search suggestions in the navbar
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
    return products.filter((product) => product.name?.toLowerCase().includes(term)).slice(0, 5);
  }, [products, searchTerm]);

  const submitSearch = (event) => {
    event.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;
    navigate(`/shop?search=${encodeURIComponent(term)}`);
    setSearchOpen(false);
    setMenuOpen(false);
  };

  // The dashboard link is only visible to admin accounts
  const visibleLinks = useMemo(
    () => NAV_LINKS.filter((link) => link.to !== "/dashboard" || isAdminEmail(user?.email)),
    [user?.email]
  );

  const logout = () => {
    setLoading(true);
    signOut(auth).then(() => {
      console.log('User signed out successfully');
      dispatch(clearWishlist());
      setLoading(false);
    
  // Sign-out successful.
}).catch((error) => {
  console.log(error);
  setLoading(false);
});
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-black">
        Loading...
      </div>
    );
  }

  const linkClass = "text-black transition hover:text-[#e11d48]";
  const mobileLinkClass = ({ isActive }) =>
    `rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
      isActive ? "bg-[#1d1d1d] text-white" : "text-[#1d1d1d] hover:bg-black/5"
    }`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-[#EAE7DE]/90 backdrop-blur-md">
        <div className="navbar mx-auto max-w-[1400px] justify-between px-4 py-2">
          {/* Left: desktop navigation links */}
          <div className="navbar-start hidden flex-1 items-center lg:flex">
            <ul className="menu menu-horizontal flex items-center gap-4 px-1">
              {visibleLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    className={({ isActive }) =>
                      isActive ? "text-[#e11d48] font-semibold" : linkClass
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Left (mobile): hamburger toggle */}
          <div className="navbar-start flex flex-1 items-center lg:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              className="rounded-full p-2 text-[#1d1d1d] transition hover:bg-black/5"
            >
              {menuOpen ? (
                <XMarkIcon className="size-6" />
              ) : (
                <Bars3Icon className="size-6" />
              )}
            </button>
          </div>

          {/* Center: logo */}
          <div className="navbar-center">
            <Link to="/" aria-label="Home">
              <img className="h-12 w-auto" src={logo} alt="Logo" />
            </Link>
          </div>

          {/* Right: account, search, cart */}
          <div className="navbar-end flex flex-1 items-center justify-end gap-2 sm:gap-3">
            {authLoading ? null : user ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 rounded-full transition hover:opacity-80"
                aria-label="My profile"
              >
                <img
                  src={user.photoURL}
                  alt="Profile"
                  className="h-9 w-9 rounded-full object-cover ring-1 ring-black/10"
                />
                <span className="hidden text-sm text-black transition hover:text-[#e11d48] sm:inline">
                  {user.displayName || 'User'}
                </span>
              </Link>
              ) : (
              <Link
                to="/auth/login"
                className="text-sm text-black transition hover:text-[#e11d48] sm:text-base"
              >
                Login / Sign up
              </Link>
            )}

            <div className="relative">
              <button
                type="button"
                aria-label="Search"
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setMenuOpen(false);
                }}
                className="rounded-full p-1 text-[#1d1d1d] transition hover:text-[#e11d48]"
              >
                <MagnifyingGlassIcon className="size-6" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
                  <form onSubmit={submitSearch} className="flex items-center gap-2 border-b border-black/10 p-3">
                    <MagnifyingGlassIcon className="h-4 w-4 flex-shrink-0 text-neutral-400" />
                    <input
                      autoFocus
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setSearchOpen(false);
                      }}
                      placeholder="Search for coffee..."
                      className="w-full bg-transparent text-sm text-[#1d1d1d] outline-none placeholder:text-neutral-400"
                    />
                    {searchTerm && (
                      <button
                        type="submit"
                        aria-label="Search"
                        className="rounded-full bg-[#e11d48] p-1.5 text-white transition hover:bg-[#c81a40]"
                      >
                        <ArrowRightIcon className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </form>

                  {suggestions.length > 0 && (
                    <ul className="max-h-80 overflow-y-auto py-1">
                      {suggestions.map((product) => (
                        <li key={product._id}>
                          <Link
                            to={`/product/${product._id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 transition hover:bg-black/5"
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 flex-shrink-0 rounded-lg border border-black/5 object-cover"
                            />
                            <span className="flex-1 text-sm font-medium text-[#1d1d1d]">
                              {product.name}
                            </span>
                            <span className="text-xs font-bold text-[#e11d48]">
                              {currency(product.price)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {searchTerm.trim() && (
                    <button
                      type="button"
                      onClick={submitSearch}
                      className="w-full border-t border-black/10 px-3 py-2.5 text-left text-xs font-semibold text-neutral-500 transition hover:text-[#e11d48]"
                    >
                      See all results for "{searchTerm.trim()}"
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className="relative rounded-full p-1 text-[#1d1d1d] transition hover:text-[#e11d48]"
              onClick={() => setCartOpen(true)}
              aria-label={`Cart, ${totalQuantity} items`}
            >
              <ShoppingCartIcon className="size-6" />
              {totalQuantity > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#e11d48] text-[10px] font-bold text-white">
                  {totalQuantity}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="border-t border-black/5 bg-[#EAE7DE] px-4 pb-4 pt-3 lg:hidden">
            <ul className="mx-auto flex max-w-[1400px] flex-col gap-1">
              {visibleLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end={link.to === "/"}
                    onClick={() => setMenuOpen(false)}
                    className={mobileLinkClass}
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
              {!authLoading && user && (
                <li>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-[#e11d48] transition hover:bg-black/5"
                  >
                    {user.displayName || 'User'}, Logout
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}
      </header>
    </>
  );
};

export default Nav;
