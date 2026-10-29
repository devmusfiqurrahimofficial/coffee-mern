import { NavLink } from "react-router";
import { signOut } from "firebase/auth";
import {
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  HomeIcon,
  PaintBrushIcon,
  PlusCircleIcon,
  Squares2X2Icon,
  UsersIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../../../hooks/auth";
import { auth } from "../../../../firebase.config";
import { useDispatch } from "react-redux";
import { clearWishlist } from "../../../redux/features/wishlistSlice/wishlistSlice";
import logo from "../../../assets/image/logo.png";
import DashboardNavLink from "./DashboardNavLink";
import { useGetMessagesQuery } from "../../../redux/api/messagesApi/messagesApi";

const NAV_SECTIONS = [
  {
    items: [{ to: "/dashboard", label: "Overview", Icon: Squares2X2Icon, end: true }],
  },
  {
    title: "Products",
    items: [
      { to: "/dashboard/products", label: "All Products", Icon: CubeIcon },
      { to: "/dashboard/products/add", label: "Add Product", Icon: PlusCircleIcon },
    ],
  },
  {
    title: "Blogs",
    items: [
      { to: "/dashboard/blogs", label: "All Blogs", Icon: DocumentTextIcon },
      { to: "/dashboard/blogs/add", label: "Add Blog", Icon: PlusCircleIcon },
    ],
  },
  {
    title: "Orders",
    items: [
      { to: "/dashboard/orders", label: "All Orders", Icon: ClipboardDocumentListIcon, end: true },
      { to: "/dashboard/orders/accepted", label: "Accepted", Icon: HomeIcon },
      { to: "/dashboard/orders/rejected", label: "Rejected", Icon: XCircleIcon },
      { to: "/dashboard/orders/delivered", label: "Delivered", Icon: ClipboardDocumentListIcon },
      { to: "/dashboard/orders/on-process", label: "On Process", Icon: CubeIcon },
    ],
  },
  {
    title: "Store",
    items: [
      { to: "/dashboard/customers", label: "Customers", Icon: UsersIcon },
      { to: "/dashboard/messages", label: "Messages", Icon: EnvelopeIcon, badgeKey: "messages" },
      { to: "/dashboard/reviews", label: "Reviews", Icon: ChatBubbleLeftEllipsisIcon },
      { to: "/dashboard/content", label: "Page Content", Icon: PaintBrushIcon },
      { to: "/dashboard/settings", label: "Settings", Icon: Cog6ToothIcon },
    ],
  },
];

export const Sidebar = ({ open, onClose }) => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const { data: messages = [] } = useGetMessagesQuery();

  const badges = {
    messages: messages.filter((item) => item.status === "unread").length,
  };

  const withBadges = (sections) =>
    sections.map((section) => ({
      ...section,
      items: section.items.map((item) =>
        item.badgeKey ? { ...item, badge: badges[item.badgeKey] } : item
      ),
    }));

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-black/5 bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
          <NavLink to="/dashboard" onClick={onClose} className="flex items-center gap-3">
            <img src={logo} alt="Coffee Mern" className="h-10 w-auto" />
            <span>
              <span className="block font-serif text-base font-black leading-tight text-[var(--color-text)]">
                Coffee Mern
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                Admin Panel
              </span>
            </span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-full p-1.5 text-neutral-500 transition hover:bg-black/5 lg:hidden"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Admin info */}
        <div className="border-b border-black/5 px-5 py-4">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "Admin"}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-black/10"
              />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-text)] text-sm font-bold text-white">
                {(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                {user?.displayName || "Admin"}
              </p>
              <p className="truncate text-xs text-neutral-500">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {withBadges(NAV_SECTIONS).map((section) => (
            <div key={section.title || "main"}>
              {section.title && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {section.title}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <DashboardNavLink {...item} onClose={onClose} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="space-y-1 border-t border-black/5 px-3 py-4">
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-black/5 hover:text-[var(--color-text)]"
          >
            <HomeIcon className="h-5 w-5 text-neutral-400" />
            View Store
          </NavLink>
          <button
            type="button"
            onClick={() => {
              signOut(auth);
              dispatch(clearWishlist());
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--color-primary)] transition hover:bg-[var(--color-primary)]/10"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};
