import { useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router";
import { signOut } from "firebase/auth";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  ArrowLeftOnRectangleIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  HeartIcon,
  PencilSquareIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  TrashIcon,
  UserIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { useAuth } from "../hooks/auth";
import { auth, db, storage } from "../../firebase.config";
import { useDispatch, useSelector } from "react-redux";
import { useGetOrdersQuery } from "../redux/api/ordersApi/ordersApi";
import {
  addToCart,
  clearCart,
} from "../redux/features/cartSlice/cartSlice";
import {
  clearWishlist,
} from "../redux/features/wishlistSlice/wishlistSlice";
import WishlistButton from "../components/uiElements/WishlistButton";

const currency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const STATUS_STYLES = {
  pending: ["Pending", "bg-amber-100 text-amber-700"],
  accepted: ["Accepted", "bg-blue-100 text-blue-700"],
  rejected: ["Rejected", "bg-red-100 text-red-700"],
  out_for_delivery: ["On Process", "bg-purple-100 text-purple-700"],
  delivered: ["Delivered", "bg-green-100 text-green-700"],
};

const StatusBadge = ({ status }) => {
  const [label, className] = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}
    >
      {label}
    </span>
  );
};

const TABS = [
  { id: "overview", label: "Overview", Icon: UserIcon },
  { id: "orders", label: "My Orders", Icon: ShoppingBagIcon },
  { id: "wishlist", label: "Wishlist", Icon: HeartIcon },
  { id: "settings", label: "Settings", Icon: Cog6ToothIcon },
];

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]";

const Profile = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);

  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery(
    { email: user?.email },
    { skip: !user?.email }
  );

  const [tab, setTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [form, setForm] = useState({
    name: user?.displayName || "",
    phone: "",
    bio: "",
  });
  const [newsletter, setNewsletter] = useState(
    () => localStorage.getItem("newsletter") === "true"
  );
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Load the stored profile once per session (async, so no cascading render)
  if (user && !profileLoaded) {
    setProfileLoaded(true);
    getDoc(doc(db, "users", user.uid))
      .then((snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setForm({
            name: data.displayName || user.displayName || "",
            phone: data.phone || "",
            bio: data.bio || "",
          });
        }
      })
      .catch((error) => console.error("Failed to load profile:", error));
  }

  const orderStats = useMemo(() => {
    const totals = { total: orders.length, delivered: 0, active: 0 };
    orders.forEach((order) => {
      if (order.status === "delivered") totals.delivered += 1;
      else totals.active += 1;
    });
    return totals;
  }, [orders]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-5 text-[#1d1d1d]">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate to="/auth/login" replace state={{ from: location.pathname }} />
    );
  }

  const loadProfile = async () => {
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (snapshot.exists()) {
        const data = snapshot.data();
        setForm({
          name: data.displayName || user.displayName || "",
          phone: data.phone || "",
          bio: data.bio || "",
        });
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    }
  };

  const startEditing = () => {
    setForm({
      name: user.displayName || "",
      phone: "",
      bio: "",
    });
    setIsEditing(true);
    setMessage({ type: "", text: "" });
    loadProfile();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Profile picture must be 5 MB or smaller." });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setMessage({ type: "", text: "" });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty." });
      return;
    }

    setIsSaving(true);
    setMessage({ type: "", text: "" });
    try {
      let photoURL = user.photoURL || "";
      if (photoFile) {
        const storageRef = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(auth.currentUser, {
        displayName: form.name.trim(),
        photoURL: photoURL || null,
      });

      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          displayName: form.name.trim(),
          email: user.email,
          phone: form.phone.trim(),
          bio: form.bio.trim(),
          photoURL,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      setPhotoFile(null);
      setPhotoPreview("");
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated." });
    } catch (error) {
      console.error("Failed to save profile:", error);
      setMessage({ type: "error", text: error?.message || "Failed to save profile." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setPhotoFile(null);
    setPhotoPreview("");
    setMessage({ type: "", text: "" });
  };

  const toggleNewsletter = () => {
    const next = !newsletter;
    setNewsletter(next);
    localStorage.setItem("newsletter", String(next));
  };

  const memberSince = user?.metadata?.creationTime
    ? formatDate(user.metadata.creationTime)
    : "—";

  return (
    <div className="min-h-screen bg-[#EAE7DE] px-5 py-10 md:px-10 md:py-14">
      <div className="mx-auto max-w-[1100px]">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
          <Link to="/" className="transition hover:text-[#1d1d1d]">
            Home
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="text-[#e11d48]">My Profile</span>
        </nav>

        {/* Profile header */}
        <header className="flex flex-col gap-5 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="flex items-center gap-5">
            <div className="relative">
              {photoPreview || user.photoURL ? (
                <img
                  src={photoPreview || user.photoURL}
                  alt={user.displayName || "Profile"}
                  className="h-20 w-20 rounded-full object-cover ring-1 ring-black/10"
                />
              ) : (
                <span className="grid h-20 w-20 place-items-center rounded-full bg-[#1d1d1d] font-serif text-2xl font-black text-white">
                  {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                </span>
              )}
              {isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full bg-[#e11d48] text-white shadow transition hover:bg-[#c81a40]"
                    aria-label="Change profile picture"
                  >
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </>
              )}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e11d48]">
                My Profile
              </p>
              <h1 className="mt-1 font-serif text-3xl font-black text-[#1d1d1d]">
                {user.displayName || "Coffee Lover"}
              </h1>
              <p className="text-sm text-neutral-500">{user.email}</p>
              <p className="mt-1 text-xs text-neutral-400">
                Member since {memberSince}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isEditing ? (
              <button
                type="button"
                onClick={startEditing}
                className="flex items-center gap-2 rounded-full bg-[#1d1d1d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e11d48]"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit Profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full bg-[#e11d48] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </header>

        {message.text && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`mt-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              message.type === "error"
                ? "border border-[#e11d48]/30 bg-[#e11d48]/10 text-[#c81a40]"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message.type === "error" ? (
              <ExclamationCircleIcon className="h-4 w-4" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {message.text}
          </p>
        )}

        {/* Edit form */}
        {isEditing && (
          <div className="mt-5 grid gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-sm sm:grid-cols-2 md:p-8">
            <div>
              <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Full name
              </label>
              <input
                id="profile-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Phone
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+8801XXXXXXXXX"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-neutral-600">
                Bio
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell us about your coffee ritual…"
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Orders", value: orderStats.total },
            { label: "Active orders", value: orderStats.active },
            { label: "Delivered", value: orderStats.delivered },
            { label: "Wishlist", value: wishlistItems.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                {stat.label}
              </p>
              <p className="mt-2 font-serif text-3xl font-black text-[#1d1d1d]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                tab === item.id
                  ? "border-[#1d1d1d] bg-[#1d1d1d] text-white"
                  : "border-black/10 bg-white text-neutral-600 hover:border-black/30"
              }`}
            >
              <item.Icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-5">
          {tab === "overview" && (
            <div className="space-y-5">
              <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                  Account details
                </h2>
                <dl className="mt-4 divide-y divide-black/5 text-sm">
                  {[
                    ["Name", user.displayName || "—"],
                    ["Email", user.email || "—"],
                    ["Email verified", user.emailVerified ? "Yes" : "Not verified"],
                    ["Phone", form.phone || "Not added"],
                    ["Bio", form.bio || "No bio yet"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 py-3">
                      <dt className="text-neutral-500">{label}</dt>
                      <dd className="text-right font-semibold text-[#1d1d1d]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                  Recent orders
                </h2>
                {orders.length === 0 ? (
                  <p className="mt-4 text-sm text-neutral-500">
                    You have not placed any orders yet.{" "}
                    <Link to="/shop" className="font-semibold text-[#e11d48]">
                      Start shopping
                    </Link>
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-black/5">
                    {orders.slice(0, 3).map((order) => (
                      <li key={order._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <div>
                          <p className="text-sm font-semibold text-[#1d1d1d]">
                            #{order.orderNumber}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {formatDate(order.createdAt)} · {order.totalQuantity ?? 0} items
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#1d1d1d]">
                            {currency(order.total)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}

          {tab === "orders" && (
            <section className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
              <div className="border-b border-black/10 px-6 py-4">
                <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">My Orders</h2>
                <p className="text-xs text-neutral-500">
                  Every order placed with {user.email}.
                </p>
              </div>

              {ordersLoading ? (
                <p className="px-6 py-10 text-center text-sm text-neutral-500">
                  Loading your orders…
                </p>
              ) : orders.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <ShoppingBagIcon className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-4 font-serif text-lg text-[#1d1d1d]">No orders yet</p>
                  <Link
                    to="/shop"
                    className="mt-4 inline-block rounded-full bg-[#e11d48] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-black/5">
                  {orders.map((order) => (
                    <li key={order._id} className="px-6 py-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-serif text-lg font-bold text-[#1d1d1d]">
                            #{order.orderNumber}
                          </p>
                          <p className="mt-0.5 text-xs text-neutral-500">
                            {formatDate(order.createdAt)} · {order.payment?.method === "cod"
                              ? "Cash on Delivery"
                              : "Card payment"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-[#1d1d1d]">
                            {currency(order.total)}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>

                      <ul className="mt-3 space-y-1.5">
                        {(order.items || []).map((item, index) => (
                          <li
                            key={`${item.name}-${index}`}
                            className="flex items-center justify-between text-sm text-neutral-600"
                          >
                            <span>
                              {item.name} × {item.quantity}
                            </span>
                            <span>{currency((item.price || 0) * (item.quantity || 0))}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "wishlist" && (
            <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">Wishlist</h2>
                {wishlistItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => dispatch(clearWishlist())}
                    className="flex items-center gap-1.5 rounded-full border border-[#e11d48]/30 px-4 py-2 text-xs font-semibold text-[#e11d48] transition hover:bg-[#e11d48] hover:text-white"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                )}
              </div>

              {wishlistItems.length === 0 ? (
                <div className="py-16 text-center">
                  <HeartIcon className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-4 font-serif text-lg text-[#1d1d1d]">
                    Your wishlist is empty
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Tap the heart on any product to save it for later.
                  </p>
                  <Link
                    to="/shop"
                    className="mt-4 inline-block rounded-full bg-[#e11d48] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                  {wishlistItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-4 rounded-2xl border border-black/5 p-3"
                    >
                      <Link to={`/product/${item.id}`} className="flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-20 w-20 rounded-xl border border-black/5 object-cover"
                        />
                      </Link>
                      <div className="flex flex-1 flex-col">
                        <Link
                          to={`/product/${item.id}`}
                          className="text-sm font-semibold text-[#1d1d1d] transition hover:text-[#e11d48]"
                        >
                          {item.name}
                        </Link>
                        <span className="mt-0.5 text-sm font-bold text-[#1d1d1d]">
                          {currency(item.price)}
                        </span>
                        <div className="mt-auto flex items-center gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() =>
                              dispatch(
                                addToCart({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  image: item.image,
                                })
                              )
                            }
                            className="flex items-center gap-1.5 rounded-full bg-[#1d1d1d] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#e11d48]"
                          >
                            <ShoppingCartIcon className="h-3.5 w-3.5" />
                            Add to cart
                          </button>
                          <WishlistButton
                            product={item}
                            className="border border-black/10"
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {tab === "settings" && (
            <div className="space-y-5">
              <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                  Preferences
                </h2>

                <label className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-black/5 p-4">
                  <span>
                    <span className="block text-sm font-semibold text-[#1d1d1d]">
                      Newsletter
                    </span>
                    <span className="text-xs text-neutral-500">
                      Brew guides, new arrivals, and subscriber-only offers.
                    </span>
                  </span>
                  <span className="relative inline-flex">
                    <input
                      type="checkbox"
                      checked={newsletter}
                      onChange={toggleNewsletter}
                      className="peer sr-only"
                    />
                    <span className="block h-6 w-11 rounded-full bg-neutral-300 transition peer-checked:bg-[#e11d48]" />
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                  </span>
                </label>
              </section>

              <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">Account</h2>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      signOut(auth);
                      dispatch(clearWishlist());
                    }}
                    className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d]"
                  >
                    <ArrowLeftOnRectangleIcon className="h-4 w-4" />
                    Logout
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch(clearCart())}
                    disabled={cartItems.length === 0}
                    className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Clear cart
                  </button>
                </div>
                <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
                  <ClipboardDocumentCheckIcon className="h-4 w-4" />
                  Profile changes are saved to your account.
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
