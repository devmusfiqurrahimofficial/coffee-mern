import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BoltIcon,
  CheckIcon,
  CreditCardIcon,
  EnvelopeIcon,
  ExclamationCircleIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  TruckIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { clearCart } from "../redux/features/cartSlice/cartSlice";
import { usePlaceOrderMutation } from "../redux/api/ordersApi/ordersApi";
import { useGetSettingsQuery } from "../redux/api/settingsApi/settingsApi";
import OrderConfirmation from "../components/uiElements/OrderConfirmation";

const currency = (value) =>
  `\u09f3${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const STEPS = [
  { id: 1, label: "Checkout" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Confirmation" },
];

const DELIVERY_META = [
  { id: "standard", label: "Standard Delivery", note: "Arrives in 3-5 business days", Icon: TruckIcon },
  { id: "express", label: "Express Delivery", note: "Arrives in 1-2 business days", Icon: BoltIcon },
  { id: "pickup", label: "Store Pickup", note: "Ready to collect in 2 hours", Icon: ShoppingBagIcon },
];

const DEFAULT_DELIVERY_PRICES = { standard: 60, express: 150, pickup: 0 };

const PAYMENT_METHODS = [
  {
    id: "card",
    label: "Credit / Debit Card",
    note: "Visa, Mastercard, American Express",
    Icon: CreditCardIcon,
  },
  {
    id: "cod",
    label: "Cash on Delivery",
    note: "Pay with cash when your order arrives",
    Icon: BanknotesIcon,
  },
];

const CARD_BRANDS = [
  { test: /^4/, label: "Visa" },
  { test: /^5[1-5]/, label: "Mastercard" },
  { test: /^3[47]/, label: "American Express" },
  { test: /^6/, label: "Discover" },
];

const formatCardNumber = (value) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm text-[#1d1d1d] outline-none transition placeholder:text-neutral-400 focus:border-[#e11d48]";

const Stepper = ({ current }) => (
  <ol className="flex flex-wrap items-center gap-3">
    {STEPS.map((step, index) => {
      const isActive = step.id === current;
      const isDone = step.id < current;
      return (
        <li key={step.id} className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2.5 rounded-full border px-4 py-2 transition ${
              isActive
                ? "border-[#1d1d1d] bg-[#1d1d1d] text-white"
                : isDone
                ? "border-[#e11d48] bg-[#e11d48]/10 text-[#e11d48]"
                : "border-black/10 bg-white text-neutral-400"
            }`}
          >
            <span
              className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                isActive
                  ? "bg-white text-[#1d1d1d]"
                  : isDone
                  ? "bg-[#e11d48] text-white"
                  : "bg-black/5 text-neutral-400"
              }`}
            >
              {isDone ? (
                <CheckIcon className="h-3.5 w-3.5" />
              ) : (
                step.id
              )}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <span className="hidden h-px w-8 bg-black/10 sm:block" />
          )}
        </li>
      );
    })}
  </ol>
);

const Field = ({ label, icon: Icon, error, children }) => (
  <div>
    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-600">
      {Icon && <Icon className="h-4 w-4 text-neutral-400" />}
      {label}
    </label>
    {children}
    {error && (
      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-[#e11d48]">
        <ExclamationCircleIcon className="h-3.5 w-3.5" />
        {error}
      </p>
    )}
  </div>
);

const OrderSummary = ({ items, subtotal, shipping, total }) => (
  <aside className="sticky top-8 overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm">
    <div className="border-b border-black/10 px-6 py-5">
      <h2 className="font-serif text-xl font-black text-[#1d1d1d]">
        Order Summary
      </h2>
      <p className="text-xs text-neutral-500">
        {items.length} {items.length === 1 ? "product" : "products"} in your cart
      </p>
    </div>

    <div className="max-h-72 space-y-4 overflow-y-auto px-6 py-5">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <img
            src={item.image}
            alt={item.name}
            className="h-16 w-16 flex-shrink-0 rounded-xl border border-black/5 object-cover"
          />
          <div className="flex flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold leading-tight text-[#1d1d1d]">
                {item.name}
              </h4>
              <span className="text-sm font-bold text-[#1d1d1d]">
                {currency(item.price * item.quantity)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-neutral-500">
              {currency(item.price)} x {item.quantity}
            </p>
          </div>
        </div>
      ))}
    </div>

    <div className="space-y-2 border-t border-black/10 px-6 py-5 text-sm">
      <div className="flex items-center justify-between text-neutral-600">
        <span>Subtotal</span>
        <span className="font-semibold text-[#1d1d1d]">{currency(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-neutral-600">
        <span>Shipping</span>
        <span className="font-semibold text-[#1d1d1d]">
          {shipping === 0 ? "Free" : currency(shipping)}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">
        <span className="font-serif text-lg font-bold text-[#1d1d1d]">
          Total
        </span>
        <span className="font-serif text-2xl font-black text-[#1d1d1d]">
          {currency(total)}
        </span>
      </div>
    </div>

    <p className="flex items-center justify-center gap-1.5 border-t border-black/10 bg-[#f3efe7]/60 px-6 py-4 text-xs text-neutral-500">
      <LockClosedIcon className="h-3.5 w-3.5" />
      Your payment details are encrypted & secure
    </p>
  </aside>
);

const EmptyCart = () => (
  <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-black/10 bg-white/60 py-24 text-center">
    <ShoppingCartIcon className="h-12 w-12 text-neutral-300" />
    <h1 className="font-serif text-2xl font-black text-[#1d1d1d]">
      Your cart is empty
    </h1>
    <p className="text-sm text-neutral-500">
      Add some fresh coffee to your cart before checking out.
    </p>
    <Link
      to="/shop"
      className="rounded-full bg-[#e11d48] px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
    >
      Browse Products
    </Link>
  </div>
);

const CheckoutPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cartItems, totalAmount, totalQuantity } = useSelector(
    (state) => state.cart
  );
  const [placeOrder, { isLoading: isPlacing }] = usePlaceOrderMutation();

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "United States",
    detailAddress: "",
  });
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [card, setCard] = useState({
    number: "",
    name: "",
    expiry: "",
    cvc: "",
  });
  const [errors, setErrors] = useState({});
  const [placedOrder, setPlacedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const { data: storeSettings } = useGetSettingsQuery();

  // Delivery prices come from store settings (fall back to defaults)
  const deliveryOptions = useMemo(
    () =>
      DELIVERY_META.map((option) => ({
        ...option,
        price: Number(storeSettings?.deliveryPrices?.[option.id] ?? DEFAULT_DELIVERY_PRICES[option.id]),
      })),
    [storeSettings]
  );

  const selectedDelivery =
    deliveryOptions.find((option) => option.id === deliveryMethod) ||
    deliveryOptions[0];
  const shipping = selectedDelivery ? selectedDelivery.price : 0;
  const total = totalAmount + shipping;

  const cardBrand = useMemo(
    () =>
      CARD_BRANDS.find((brand) => brand.test.test(card.number.replace(/\D/g, "")))
        ?.label || "",
    [card.number]
  );

  const validateDetails = () => {
    const nextErrors = {};
    if (!customer.firstName.trim()) nextErrors.firstName = "First name is required";
    if (!customer.lastName.trim()) nextErrors.lastName = "Last name is required";
    if (!customer.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }
    if (!customer.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    } else if (customer.phone.replace(/\D/g, "").length < 7) {
      nextErrors.phone = "Enter a valid phone number";
    }
    if (!address.street.trim()) nextErrors.street = "Street address is required";
    if (!address.detailAddress.trim()) {
      nextErrors.detailAddress = "Detailed address is required";
    }
    if (!address.city.trim()) nextErrors.city = "City is required";
    if (deliveryMethod !== "pickup" && !address.zip.trim()) {
      nextErrors.zip = "ZIP / Postal code is required";
    }
    if (!address.country.trim()) nextErrors.country = "Country is required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePayment = () => {
    const nextErrors = {};
    if (paymentMethod === "card") {
      const digits = card.number.replace(/\D/g, "");
      if (!digits) nextErrors.number = "Card number is required";
      else if (digits.length < 13 || digits.length > 16) {
        nextErrors.number = "Enter a valid card number";
      }
      if (!card.name.trim()) nextErrors.cardName = "Name on card is required";
      if (!card.expiry.trim()) {
        nextErrors.expiry = "Expiry date is required";
      } else {
        const [month, year] = card.expiry.split("/");
        const monthValue = Number(month);
        const yearValue = Number(year);
        if (
          !monthValue ||
          monthValue < 1 ||
          monthValue > 12 ||
          !yearValue
        ) {
          nextErrors.expiry = "Use MM/YY format";
        } else {
          const expiryDate = new Date(2000 + yearValue, monthValue, 0, 23, 59);
          if (expiryDate < new Date()) {
            nextErrors.expiry = "Card has expired";
          }
        }
      }
      if (!card.cvc.trim()) {
        nextErrors.cvc = "CVC is required";
      } else if (!/^\d{3,4}$/.test(card.cvc.trim())) {
        nextErrors.cvc = "3-4 digits";
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    setSubmitError("");
    if (validateDetails()) {
      setStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    setSubmitError("");
    if (!validatePayment()) return;

    const cardDigits = card.number.replace(/\D/g, "");

    const order = {
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      totalQuantity: Number(totalQuantity),
      customer: {
        firstName: customer.firstName.trim(),
        lastName: customer.lastName.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
      },
      address: {
        street: address.street.trim(),
        detailAddress: address.detailAddress.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zip: address.zip.trim(),
        country: address.country.trim(),
      },
      deliveryMethod,
      payment:
        paymentMethod === "card"
          ? {
              method: "card",
              cardBrand: cardBrand || null,
              cardLast4: cardDigits.slice(-4),
            }
          : { method: "cod" },
      subtotal: Number(totalAmount),
      shipping: Number(shipping),
      total: Number(total),
    };

    try {
      // Render free tier sleeps — the first request after idle can drop the
      // socket while the service wakes up, so retry once on network failure.
      let response;
      try {
        response = await placeOrder(order).unwrap();
      } catch (firstError) {
        if (firstError?.status === "FETCH_ERROR") {
          await new Promise((resolve) => setTimeout(resolve, 2500));
          response = await placeOrder(order).unwrap();
        } else {
          throw firstError;
        }
      }
      setPlacedOrder(response);
      setStep(3);
      dispatch(clearCart());
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const validationMessage = Array.isArray(error?.data?.errors)
        ? error.data.errors.map((e) => e.msg).filter(Boolean).join(". ")
        : "";
      setSubmitError(
        validationMessage ||
          error?.data?.error ||
          (error?.status === "FETCH_ERROR"
            ? "Server is waking up. Please wait a few seconds and try again."
            : "We could not place your order. Please try again in a moment.")
      );
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen px-5 py-12 md:px-10 md:py-16">
        <OrderConfirmation
          order={placedOrder}
          onDone={() => navigate("/shop")}
        />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen px-5 py-12 md:px-10 md:py-16">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
            <Link to="/" className="transition hover:text-[#1d1d1d]">
              Home
            </Link>
            <span className="text-neutral-300">/</span>
            <Link to="/shop" className="transition hover:text-[#1d1d1d]">
              Shop
            </Link>
            <span className="text-neutral-300">/</span>
            <span className="text-[#e11d48]">Checkout</span>
          </nav>
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#e11d48]">
            Almost there
          </p>
          <h1 className="mt-2 font-serif text-4xl font-black leading-tight text-[#1d1d1d] md:text-5xl">
            Checkout
          </h1>
        </header>

        <div className="mb-8">
          <Stepper current={step} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            {submitError && (
              <div className="mb-6 flex items-center gap-2 rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-4 py-3 text-sm font-medium text-[#c81a40]">
                <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />
                {submitError}
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-6">
                <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1d] text-white">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                        Contact Details
                      </h2>
                      <p className="text-xs text-neutral-500">
                        We'll use this to send your order updates
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First Name" icon={UserIcon} error={errors.firstName}>
                      <input
                        type="text"
                        value={customer.firstName}
                        onChange={(e) =>
                          setCustomer({ ...customer, firstName: e.target.value })
                        }
                        placeholder="Jane"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Last Name" error={errors.lastName}>
                      <input
                        type="text"
                        value={customer.lastName}
                        onChange={(e) =>
                          setCustomer({ ...customer, lastName: e.target.value })
                        }
                        placeholder="Doe"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Email Address" icon={EnvelopeIcon} error={errors.email}>
                      <input
                        type="email"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer({ ...customer, email: e.target.value })
                        }
                        placeholder="jane@example.com"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Phone Number" icon={PhoneIcon} error={errors.phone}>
                      <input
                        type="tel"
                        value={customer.phone}
                        onChange={(e) =>
                          setCustomer({ ...customer, phone: e.target.value })
                        }
                        placeholder="+1 (555) 000-0000"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </section>

                <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1d] text-white">
                      <MapPinIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                        Shipping Address
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Where should we deliver your order?
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Field label="Street Address" icon={MapPinIcon} error={errors.street}>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) =>
                            setAddress({ ...address, street: e.target.value })
                          }
                          placeholder="123 Coffee Lane"
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    <Field label="City" error={errors.city}>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                        placeholder="Portland"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="State / Province" error={errors.state}>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) =>
                          setAddress({ ...address, state: e.target.value })
                        }
                        placeholder="Oregon"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="ZIP / Postal Code" error={errors.zip}>
                      <input
                        type="text"
                        value={address.zip}
                        onChange={(e) =>
                          setAddress({ ...address, zip: e.target.value })
                        }
                        placeholder="97205"
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Country" error={errors.country}>
                      <input
                        type="text"
                        value="Bangladesh"
                        onChange={(e) =>
                          setAddress({ ...address, country: e.target.value })
                        }
                        placeholder="Bangladesh"
                        className={inputClass}
                      />
                    </Field>
                     <Field label="Details Address" icon={MapPinIcon} error={errors.detailAddress}>
                        <input
                          type="text"
                          value={address.detailAddress}
                          onChange={(e) =>
                            setAddress({ ...address, detailAddress: e.target.value })
                          }
                          placeholder="Flat/House No, Road No, Area, Block, etc."
                          className={inputClass}
                        />
                      </Field>
                   
                  </div>
                </section>

                <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1d] text-white">
                      <TruckIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                        Delivery Method
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Choose how you want your coffee
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {deliveryOptions.map((option) => {
                      const isActive = deliveryMethod === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setDeliveryMethod(option.id)}
                          className={`flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition ${
                            isActive
                              ? "border-[#e11d48] bg-[#e11d48]/5"
                              : "border-black/10 bg-white hover:border-black/30"
                          }`}
                        >
                          <div className="flex w-full items-center justify-between">
                            <option.Icon
                              className={`h-6 w-6 ${
                                isActive ? "text-[#e11d48]" : "text-neutral-400"
                              }`}
                            />
                            <span
                              className={`grid h-5 w-5 place-items-center rounded-full border-2 ${
                                isActive
                                  ? "border-[#e11d48] bg-[#e11d48]"
                                  : "border-black/20"
                              }`}
                            >
                              {isActive && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-[#1d1d1d]">
                            {option.label}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {option.note}
                          </span>
                          <span
                            className={`text-xs font-bold ${
                              isActive ? "text-[#e11d48]" : "text-neutral-500"
                            }`}
                          >
                            {option.price === 0 ? "Free" : currency(option.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    to="/shop"
                    className="flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#e11d48] hover:text-[#e11d48]"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back to Shop
                  </Link>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#e11d48] px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40]"
                  >
                    Next
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#1d1d1d] text-white">
                      <CreditCardIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                        Payment Method
                      </h2>
                      <p className="text-xs text-neutral-500">
                        Select how you'd like to pay
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {PAYMENT_METHODS.map((method) => {
                      const isActive = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                            isActive
                              ? "border-[#e11d48] bg-[#e11d48]/5"
                              : "border-black/10 bg-white hover:border-black/30"
                          }`}
                        >
                          <div
                            className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full ${
                              isActive
                                ? "bg-[#e11d48] text-white"
                                : "bg-[#f3efe7] text-neutral-500"
                            }`}
                          >
                            <method.Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#1d1d1d]">
                              {method.label}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {method.note}
                            </p>
                          </div>
                          <span
                            className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border-2 ${
                              isActive
                                ? "border-[#e11d48] bg-[#e11d48]"
                                : "border-black/20"
                            }`}
                          >
                            {isActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {paymentMethod === "card" ? (
                  <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-5 flex items-center justify-between">
                      <h2 className="font-serif text-xl font-bold text-[#1d1d1d]">
                        Card Details
                      </h2>
                      {cardBrand && (
                        <span className="rounded-full bg-[#f3efe7] px-3 py-1 text-xs font-semibold text-[#1d1d1d]">
                          {cardBrand}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <Field label="Card Number" icon={CreditCardIcon} error={errors.number}>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={card.number}
                          onChange={(e) =>
                            setCard({ ...card, number: formatCardNumber(e.target.value) })
                          }
                          placeholder="1234 5678 9012 3456"
                          className={`${inputClass} font-mono tracking-widest`}
                        />
                      </Field>
                      <Field label="Name on Card" icon={UserIcon} error={errors.cardName}>
                        <input
                          type="text"
                          value={card.name}
                          onChange={(e) =>
                            setCard({ ...card, name: e.target.value })
                          }
                          placeholder="JANE DOE"
                          className={inputClass}
                        />
                      </Field>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Expiry (MM/YY)" error={errors.expiry}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={card.expiry}
                            onChange={(e) =>
                              setCard({ ...card, expiry: formatExpiry(e.target.value) })
                            }
                            placeholder="08/28"
                            className={`${inputClass} font-mono`}
                          />
                        </Field>
                        <Field label="CVC" icon={LockClosedIcon} error={errors.cvc}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={card.cvc}
                            onChange={(e) =>
                              setCard({
                                ...card,
                                cvc: e.target.value.replace(/\D/g, "").slice(0, 4),
                              })
                            }
                            placeholder="123"
                            className={`${inputClass} font-mono`}
                          />
                        </Field>
                      </div>
                    </div>

                    <p className="mt-5 flex items-start gap-2 rounded-xl bg-[#f3efe7] px-4 py-3 text-xs text-neutral-500">
                      <LockClosedIcon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      For your security, only the card brand and last 4 digits are
                      stored with your order.
                    </p>
                  </section>
                ) : (
                  <section className="rounded-3xl border border-black/5 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex items-start gap-4 rounded-2xl bg-[#f3efe7] p-5">
                      <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-[#1d1d1d] text-white">
                        <BanknotesIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-[#1d1d1d]">
                          Pay with cash on delivery
                        </h3>
                        <p className="mt-1 text-sm text-neutral-600">
                          Please keep {currency(total)} ready in cash for the day
                          your order arrives. Our courier will provide a printed
                          receipt at your doorstep.
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3.5 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#e11d48] hover:text-[#e11d48]"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    disabled={isPlacing}
                    className="flex items-center justify-center gap-2 rounded-full bg-[#e11d48] px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPlacing ? (
                      "Placing Order..."
                    ) : (
                      <>
                        <LockClosedIcon className="h-4 w-4" />
                        Pay {currency(total)}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <OrderSummary
            items={cartItems}
            subtotal={totalAmount}
            shipping={shipping}
            total={total}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
