import {
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
} from "../redux/features/cartSlice/cartSlice";

const currency = (value) => `\u09f3${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CartDrawer = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, totalAmount, totalQuantity } = useSelector(
    (state) => state.cart
  );

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col bg-[#EAE7DE] shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-black/10 px-6 py-5">
          <div>
            <h2 className="font-serif text-2xl font-black text-[#1d1d1d]">
              Your Cart
            </h2>
            <p className="text-xs text-neutral-500">
              {totalQuantity} {totalQuantity === 1 ? "item" : "items"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="rounded-full p-2 text-[#1d1d1d] transition hover:bg-black/5"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </header>

        {cartItems.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCartIcon className="h-12 w-12 text-neutral-300" />
            <p className="font-serif text-xl text-[#1d1d1d]">Your cart is empty</p>
            <p className="text-sm text-neutral-500">
              Add some fresh coffee to get started.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/shop");
              }}
              className="mt-2 rounded-full bg-[#1d1d1d] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#e11d48]"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl bg-white p-3 shadow-sm"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-[#1d1d1d]">
                        {item.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => dispatch(removeFromCart(item.id))}
                        aria-label={`Remove ${item.name}`}
                        className="text-neutral-400 transition hover:text-[#e11d48]"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {currency(item.price)}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-black/10 px-2 py-1">
                        <button
                          type="button"
                          onClick={() => dispatch(decreaseQuantity(item.id))}
                          aria-label="Decrease quantity"
                          className="text-neutral-500 transition hover:text-[#e11d48]"
                        >
                          <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold text-[#1d1d1d]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => dispatch(increaseQuantity(item.id))}
                          aria-label="Increase quantity"
                          className="text-neutral-500 transition hover:text-[#e11d48]"
                        >
                          <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-[#1d1d1d]">
                        {currency(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="border-t border-black/10 px-6 py-5">
              <div className="flex items-center justify-between">
                <span className="font-serif text-lg font-bold text-[#1d1d1d]">
                  Subtotal
                </span>
                <span className="font-serif text-2xl font-black text-[#1d1d1d]">
                  {currency(totalAmount)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate("/checkout");
                }}
                className="mt-4 w-full rounded-full bg-[#e11d48] py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
              >
                Checkout
              </button>
              <button
                type="button"
                onClick={() => dispatch(clearCart())}
                className="mt-2 w-full py-2 text-xs font-medium text-neutral-500 transition hover:text-[#1d1d1d]"
              >
                Clear cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
};

export default CartDrawer;
