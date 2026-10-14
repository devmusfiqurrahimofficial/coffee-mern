import { useState } from "react";
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  TrashIcon,
  TruckIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import { useUpdateOrderStatusMutation } from "../../../redux/api/ordersApi/ordersApi";
import { OrderStatusBadge } from "../Dashboard";
import { downloadOrderChalan } from "../../../utils/orderChalanPdf";
import { formatBdt } from "../../../utils/currency";

const currency = (value) => formatBdt(value);

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const DELIVERY_LABELS = {
  standard: "Standard Delivery (3-5 days)",
  express: "Express Delivery (1-2 days)",
  pickup: "Store Pickup",
};

const OrderDetailModal = ({ order, onClose }) => {
  const [updateOrderStatus, { isLoading }] = useUpdateOrderStatusMutation();
  const [error, setError] = useState("");

  if (!order) return null;

  const customer = order.customer || {};
  const address = order.address || {};
  const payment = order.payment || {};
  const items = Array.isArray(order.items) ? order.items : [];
  const status = order.status || "pending";

  const changeStatus = async (nextStatus) => {
    setError("");
    try {
      await updateOrderStatus({ id: order._id, status: nextStatus }).unwrap();
    } catch (err) {
      console.error("Failed to update order:", err);
      setError(err?.data?.error || "Failed to update the order.");
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose?.();
  };

  const subtotal =
    Number(order.subtotal) ||
    items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 0), 0);
  const shipping = Number(order.shipping) || 0;
  const total = Number(order.total) || subtotal + shipping;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-w-2xl rounded-3xl border border-black/5 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
              Order details
            </p>
            <h2 className="mt-1 font-serif text-xl font-black text-[#1d1d1d]">
              #{order.orderNumber}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={status} />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-1.5 text-neutral-500 transition hover:bg-black/5"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-5">
          {/* Customer + address */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-[#f3efe7]/60 p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Customer
              </h3>
              <p className="mt-2 text-sm font-semibold text-[#1d1d1d]">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="mt-0.5 text-sm text-neutral-600">{customer.email}</p>
              <p className="text-sm text-neutral-600">{customer.phone}</p>
            </div>
            <div className="rounded-2xl border border-black/5 bg-[#f3efe7]/60 p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                Delivery
              </h3>
              <p className="mt-2 text-sm font-semibold text-[#1d1d1d]">
                {DELIVERY_LABELS[order.deliveryMethod] || order.deliveryMethod}
              </p>
              <p className="mt-0.5 text-sm text-neutral-600">
                {address.street}, {address.city}
                {address.state ? `, ${address.state}` : ""} {address.zip}
              </p>
              <p className="text-sm text-neutral-600">{address.country}</p>
            </div>
          </div>

          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-black/5">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Product</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {items.map((item, index) => (
                  <tr key={`${item.name}-${index}`}>
                    <td className="px-4 py-2.5 text-[#1d1d1d]">
                      {item.name}
                      {item.productId && (
                        <span className="ml-2 text-[10px] text-neutral-400">
                          {item.productId}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-neutral-600">
                      {currency(item.price)}
                    </td>
                    <td className="px-4 py-2.5 text-center text-neutral-600">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[#1d1d1d]">
                      {currency((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals + payment */}
          <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
            <div className="space-y-1.5 text-sm text-neutral-600">
              <p className="flex items-center justify-between">
                <span>Payment</span>
                <span className="font-semibold text-[#1d1d1d]">
                  {payment.method === "cod"
                    ? "Cash on Delivery"
                    : `Card${payment.cardLast4 ? ` •••• ${payment.cardLast4}` : ""}${
                        payment.cardBrand ? ` (${payment.cardBrand})` : ""
                      }`}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Items</span>
                <span className="font-semibold text-[#1d1d1d]">
                  {order.totalQuantity ?? items.length}
                </span>
              </p>
              <p className="flex items-center justify-between">
                <span>Placed on</span>
                <span className="font-semibold text-[#1d1d1d]">
                  {formatDate(order.createdAt)}
                </span>
              </p>
            </div>
            <div className="space-y-1.5 rounded-2xl border border-black/5 bg-[#f3efe7]/60 p-4 text-sm">
              <p className="flex items-center justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-semibold text-[#1d1d1d]">{currency(subtotal)}</span>
              </p>
              <p className="flex items-center justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="font-semibold text-[#1d1d1d]">
                  {shipping === 0 ? "Free" : currency(shipping)}
                </span>
              </p>
              <p className="flex items-center justify-between border-t border-black/10 pt-1.5">
                <span className="font-bold text-[#1d1d1d]">Total</span>
                <span className="font-serif text-lg font-black text-[#e11d48]">
                  {currency(total)}
                </span>
              </p>
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-[#e11d48]/30 bg-[#e11d48]/10 px-4 py-2.5 text-sm font-medium text-[#c81a40]">
              {error}
            </p>
          )}

          {/* Status actions */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-black/10 pt-4">
            <button
              type="button"
              onClick={() => downloadOrderChalan(order)}
              className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[#1d1d1d] transition hover:border-[#1d1d1d]"
            >
              <DocumentArrowDownIcon className="h-4 w-4" />
              Chalan (PDF)
            </button>
            {status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => changeStatus("rejected")}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-full border border-[#e11d48]/30 bg-white px-5 py-2.5 text-sm font-semibold text-[#e11d48] transition hover:bg-[#e11d48] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <TrashIcon className="h-4 w-4" />
                  Reject Order
                </button>
                <button
                  type="button"
                  onClick={() => changeStatus("accepted")}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-full bg-[#1d1d1d] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#e11d48] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Accept Order
                </button>
              </>
            )}
            {status === "accepted" && (
              <button
                type="button"
                onClick={() => changeStatus("out_for_delivery")}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-full bg-[#e11d48] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-[#c81a40] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TruckIcon className="h-4 w-4" />
                Out for Delivery
              </button>
            )}
            {status === "out_for_delivery" && (
              <button
                type="button"
                onClick={() => changeStatus("delivered")}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-full bg-[#1d1d1d] px-6 py-2.5 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Mark as Delivered
              </button>
            )}
            {(status === "rejected" || status === "delivered") && (
              <p className="flex items-center gap-2 text-sm font-medium text-neutral-500">
                {status === "rejected" ? (
                  <XCircleIcon className="h-5 w-5 text-[#e11d48]" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                )}
                This order is {status === "rejected" ? "rejected" : "completed"} — no further actions.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
