import { CheckCircleIcon, ClipboardDocumentCheckIcon, DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { downloadOrderChalan } from "../../utils/orderChalanPdf";

const currency = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const OrderConfirmation = ({ order, onDone }) => {
  const customer = order?.customer || {};
  const payment = order?.payment || {};

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-3xl border border-black/5 bg-white p-8 text-center shadow-sm md:p-12">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100">
          <CheckCircleIcon className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="mt-6 font-serif text-3xl font-black text-[#1d1d1d] md:text-4xl">
          Order Confirmed!
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Thank you{customer.firstName ? `, ${customer.firstName}` : ""}! Your
          order has been placed successfully. A confirmation email is on its way
          to{" "}
          <span className="font-semibold text-[#1d1d1d]">
            {customer.email || "your inbox"}
          </span>
          .
        </p>

        <dl className="mt-8 divide-y divide-black/10 rounded-2xl border border-black/10 text-left text-sm">
          <div className="flex items-center justify-between px-5 py-4">
            <dt className="text-neutral-500">Order number</dt>
            <dd className="font-bold text-[#1d1d1d]">
              {order?.orderNumber || "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <dt className="text-neutral-500">Items</dt>
            <dd className="font-semibold text-[#1d1d1d]">
              {order?.totalQuantity || 0}
            </dd>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <dt className="text-neutral-500">Payment method</dt>
            <dd className="font-semibold text-[#1d1d1d]">
              {payment.method === "cod"
                ? "Cash on Delivery"
                : `Card${payment.cardLast4 ? ` ending in ${payment.cardLast4}` : ""}`}
            </dd>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <dt className="text-neutral-500">Delivery</dt>
            <dd className="font-semibold capitalize text-[#1d1d1d]">
              {order?.deliveryMethod === "pickup"
                ? "Store Pickup"
                : `${order?.deliveryMethod || "standard"} Delivery`}
            </dd>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <dt className="text-neutral-500">Total paid</dt>
            <dd className="font-serif text-xl font-black text-[#e11d48]">
              {currency(order?.total || 0)}
            </dd>
          </div>
        </dl>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-neutral-400">
          <ClipboardDocumentCheckIcon className="h-4 w-4" />
          Your order details have been saved to the orders database
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => downloadOrderChalan(order)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#e11d48] px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40] sm:w-auto"
          >
            <DocumentArrowDownIcon className="h-5 w-5" />
            Download Chalan (PDF)
          </button>
          <button
            type="button"
            onClick={onDone}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1d] px-8 py-3.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#e11d48] sm:w-auto"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
