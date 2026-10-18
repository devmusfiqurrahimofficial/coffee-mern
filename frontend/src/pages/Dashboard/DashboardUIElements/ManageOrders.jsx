import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from "../../../redux/api/ordersApi/ordersApi";
import { OrderStatusBadge } from "../Dashboard";
import PageHeader from "./PageHeader";
import OrderDetailModal from "./OrderDetailModal";
import { formatMoney } from "./stats";

const STATUS_TABS = [
  { label: "All Orders", status: null, to: "/dashboard/orders" },
  { label: "Accepted", status: "accepted", to: "/dashboard/orders/accepted" },
  { label: "Rejected", status: "rejected", to: "/dashboard/orders/rejected" },
  { label: "Delivered", status: "delivered", to: "/dashboard/orders/delivered" },
  { label: "On Process", status: "out_for_delivery", to: "/dashboard/orders/on-process" },
];

const TITLES = {
  null: "All Orders",
  accepted: "Accepted Orders",
  rejected: "Rejected Orders",
  delivered: "Delivered Orders",
  out_for_delivery: "On Process Orders",
};

const DESCRIPTIONS = {
  null: "Every order placed in your store.",
  accepted: "Orders you accepted — send them out for delivery when ready.",
  rejected: "Orders you rejected.",
  delivered: "Orders completed and delivered.",
  out_for_delivery: "Orders currently out for delivery — mark them delivered on arrival.",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "amount-desc", label: "Highest amount" },
  { value: "amount-asc", label: "Lowest amount" },
];

const DATE_FILTERS = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const withinDateFilter = (value, filter) => {
  if (filter === "all") return true;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (filter === "today") return date.toDateString() === now.toDateString();
  const days = filter === "7d" ? 7 : 30;
  return date >= new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
};

const sortOrders = (orders, sort) => {
  const sorted = [...orders];
  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    case "amount-desc":
      return sorted.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
    case "amount-asc":
      return sorted.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
};

const exportOrdersCsv = (orders) => {
  const header = [
    "Order Number",
    "Date",
    "Customer",
    "Email",
    "Phone",
    "City",
    "Items",
    "Subtotal",
    "Shipping",
    "Total",
    "Payment",
    "Delivery",
    "Status",
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.createdAt ? new Date(order.createdAt).toLocaleString() : "",
    `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim(),
    order.customer?.email || "",
    order.customer?.phone || "",
    order.address?.city || "",
    (order.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    order.subtotal ?? "",
    order.shipping ?? "",
    order.total ?? "",
    order.payment?.method === "cod" ? "Cash on Delivery" : "Card",
    order.deliveryMethod || "",
    order.status || "pending",
  ]);

  const csv = [header, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

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

export const ManageOrders = ({ status }) => {
  const navigate = useNavigate();
  const { data: orders = [], isLoading, isError } = useGetOrdersQuery({ status });
  const [updateOrderStatus, { isLoading: isUpdating }] = useUpdateOrderStatusMutation();

  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [dateFilter, setDateFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const visibleOrders = useMemo(() => {
    const term = query.trim().toLowerCase();
    const filtered = orders.filter((order) => {
      const matchesQuery =
        !term ||
        [
          order.orderNumber,
          order.customer?.firstName,
          order.customer?.lastName,
          order.customer?.email,
          order.customer?.phone,
          order.address?.city,
        ].some((field) => field?.toLowerCase().includes(term));
      const matchesDate = withinDateFilter(order.createdAt, dateFilter);
      return matchesQuery && matchesDate;
    });
    return sortOrders(filtered, sort);
  }, [orders, query, dateFilter, sort]);

  const changeStatus = async (order, nextStatus) => {
    try {
      await updateOrderStatus({ id: order._id, status: nextStatus }).unwrap();
      setNotice(`Order #${order.orderNumber} → ${nextStatus.replace(/_/g, " ")}.`);
    } catch (error) {
      console.error("Failed to update order:", error);
      window.alert(error?.data?.error || "Failed to update the order.");
    }
  };

  const statusTotal = visibleOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  return (
    <div>
      <PageHeader
        title={TITLES[status ?? "null"]}
        description={DESCRIPTIONS[status ?? "null"]}
        actions={
          <button
            type="button"
            onClick={() => exportOrdersCsv(visibleOrders)}
            disabled={visibleOrders.length === 0}
            className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text)] transition hover:border-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            Export CSV
          </button>
        }
      />

      {notice && (
        <p
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700"
        >
          <CheckCircleIcon className="h-4 w-4" />
          {notice}
        </p>
      )}

      {/* Status tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => navigate(tab.to)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              tab.status === status
                ? "border-[var(--color-text)] bg-[var(--color-text)] text-white"
                : "border-black/10 bg-white text-neutral-600 hover:border-black/30"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-60 flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order no., name, email…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
        >
          {DATE_FILTERS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-neutral-500">
          {visibleOrders.length} orders ·{" "}
          <span className="font-bold text-[var(--color-primary)]">{formatMoney(statusTotal)}</span>
        </span>
      </div>

      {isLoading && (
        <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
          Loading orders…
        </p>
      )}

      {isError && (
        <p className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-5 py-10 text-center text-sm text-[var(--color-primary-hover)]">
          Failed to load orders. Is the server running on port 5000?
        </p>
      )}

      {!isLoading && !isError && visibleOrders.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-serif text-xl text-[var(--color-text)]">No orders here</p>
          <p className="mt-2 text-sm text-neutral-500">
            Orders will appear here as soon as customers check out.
          </p>
        </div>
      )}

      {!isLoading && !isError && visibleOrders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Items</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {visibleOrders.map((order) => {
                  const orderStatus = order.status || "pending";
                  const itemCount = Array.isArray(order.items)
                    ? order.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                    : 0;

                  return (
                    <tr key={order._id} className="transition hover:bg-black/[0.02]">
                      <td className="px-5 py-3 font-semibold text-[var(--color-text)]">
                        #{order.orderNumber}
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-medium text-[var(--color-text)]">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-xs text-neutral-500">{order.customer?.email}</p>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{itemCount}</td>
                      <td className="px-5 py-3 font-bold text-[var(--color-text)]">
                        {formatMoney(order.total)}
                      </td>
                      <td className="px-5 py-3">
                        <OrderStatusBadge status={orderStatus} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {orderStatus === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => changeStatus(order, "rejected")}
                                disabled={isUpdating}
                                aria-label={`Reject order ${order.orderNumber}`}
                                className="rounded-full border border-[var(--color-primary)]/30 p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-primary)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => changeStatus(order, "accepted")}
                                disabled={isUpdating}
                                aria-label={`Accept order ${order.orderNumber}`}
                                className="rounded-full border border-black/10 p-2 text-[var(--color-text)] transition hover:bg-[var(--color-text)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelected(order)}
                            className="flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-text)]"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <OrderDetailModal
          order={orders.find((order) => order._id === selected._id) || selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};
