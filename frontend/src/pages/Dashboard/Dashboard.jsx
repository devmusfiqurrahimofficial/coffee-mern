import { Link } from "react-router";
import { useGetAllReviewsQuery } from "../../redux/api/reviewsApi/reviewsApi";
import { useGetMessagesQuery } from "../../redux/api/messagesApi/messagesApi";
import { useGetBlogsQuery } from "../../redux/api/blogsApi/blogsApi";
import { useGetOrdersQuery } from "../../redux/api/ordersApi/ordersApi";
import { useGetProductsQuery } from "../../redux/api/productsApi/productsApi";
import { Welcome } from "./DashboardUIElements/Welcome";
import PageHeader from "./DashboardUIElements/PageHeader";

const countByStatus = (orders, status) =>
  orders.filter((order) => (order.status || "pending") === status).length;

const STATUS_STYLES = {
  pending: ["Pending", "#f59e0b"],
  accepted: ["Accepted", "#3b82f6"],
  rejected: ["Rejected", "#e11d48"],
  out_for_delivery: ["On Process", "#8b5cf6"],
  delivered: ["Delivered", "#10b981"],
};

const STATUS_COLORS = {
  pending: "#f59e0b",
  accepted: "#3b82f6",
  rejected: "#e11d48",
  out_for_delivery: "#8b5cf6",
  delivered: "#10b981",
};

export const OrderStatusBadge = ({ status }) => {
  const [label, color] = STATUS_STYLES[status] || STATUS_STYLES.pending;

  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {label}
    </span>
  );
};

const StatCard = ({ label, value, hint, to, accent }) => {
  const content = (
    <>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
        {label}
      </p>
      <p
        className={`mt-2 font-serif text-3xl font-black ${
          accent ? "text-[#e11d48]" : "text-[#1d1d1d]"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
    </>
  );

  const className =
    "block rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
};

const formatMoney = (value) =>
  `৳${Number(value || 0).toLocaleString("en-US")}`;

const last7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    days.push(date);
  }
  return days;
};

const dayKey = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const RevenueChart = ({ orders }) => {
  const days = last7Days();
  const totals = days.map(
    (day) =>
      orders
        .filter(
          (order) =>
            dayKey(order.createdAt) === dayKey(day) && order.status !== "rejected"
        )
        .reduce((sum, order) => sum + Number(order.total || 0), 0)
  );
  const max = Math.max(...totals, 1);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-[#1d1d1d]">
        Revenue — last 7 days
      </h2>
      <p className="text-xs text-neutral-500">Completed value of non-rejected orders.</p>
      <div className="mt-6 flex h-40 items-end gap-3">
        {days.map((day, index) => (
          <div key={day.toISOString()} className="flex flex-1 flex-col items-center gap-2">
            <span className="text-[10px] font-semibold text-neutral-400">
              {totals[index] > 0 ? formatMoney(totals[index]) : ""}
            </span>
            <div
              className="w-full rounded-t-lg bg-[#e11d48]/85 transition hover:bg-[#e11d48]"
              style={{ height: `${Math.max((totals[index] / max) * 100, 2)}%` }}
              title={`${day.toLocaleDateString()} — ${formatMoney(totals[index])}`}
            />
            <span className="text-[10px] font-medium text-neutral-500">
              {day.toLocaleDateString("en-US", { weekday: "short" })}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

const StatusDonut = ({ orders }) => {
  const statuses = ["pending", "accepted", "rejected", "out_for_delivery", "delivered"];
  const counts = statuses.map((status) => countByStatus(orders, status));
  const total = counts.reduce((sum, count) => sum + count, 0);

  let gradient = "conic-gradient(#e5e7eb 0deg 360deg)";
  if (total > 0) {
    let cursor = 0;
    const slices = statuses
      .map((status, index) => {
        const angle = (counts[index] / total) * 360;
        const slice = `${STATUS_COLORS[status]} ${cursor}deg ${cursor + angle}deg`;
        cursor += angle;
        return slice;
      })
      .join(", ");
    gradient = `conic-gradient(${slices})`;
  }

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg font-bold text-[#1d1d1d]">Order statuses</h2>
      <div className="mt-5 flex items-center gap-6">
        <div
          className="grid h-28 w-28 flex-shrink-0 place-items-center rounded-full"
          style={{ backgroundImage: gradient }}
        >
          <div className="grid h-18 w-18 place-items-center rounded-full bg-white">
            <span className="font-serif text-xl font-black text-[#1d1d1d]">{total}</span>
          </div>
        </div>
        <ul className="space-y-1.5 text-xs">
          {statuses.map((status, index) => (
            <li key={status} className="flex items-center gap-2 text-neutral-600">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[status] }}
              />
              {STATUS_STYLES[status][0]}
              <span className="ml-auto font-bold text-[#1d1d1d]">{counts[index]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

const TopProducts = ({ orders, products }) => {
  const tally = orders
    .filter((order) => order.status !== "rejected")
    .flatMap((order) => (Array.isArray(order.items) ? order.items : []))
    .reduce((map, item) => {
      const entry = map.get(item.productId) || {
        name: item.name,
        quantity: 0,
        revenue: 0,
      };
      entry.quantity += Number(item.quantity) || 0;
      entry.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      map.set(item.productId, entry);
      return map;
    }, new Map());

  const top = [...tally.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-[#1d1d1d]">Top products</h2>
        <span className="text-xs text-neutral-400">{products.length} total</span>
      </div>
      {top.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">
          No sales yet — best sellers appear here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-black/5">
          {top.map((item) => (
            <li key={item.name} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1d1d1d]">{item.name}</p>
                <p className="text-xs text-neutral-500">{item.quantity} sold</p>
              </div>
              <span className="flex-shrink-0 text-sm font-bold text-[#e11d48]">
                {formatMoney(item.revenue)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const Dashboard = () => {
  const { data: products = [] } = useGetProductsQuery();
  const { data: orders = [] } = useGetOrdersQuery({});
  const { data: reviews = [] } = useGetAllReviewsQuery();
  const { data: blogData } = useGetBlogsQuery({ all: true });
  const { data: messages = [] } = useGetMessagesQuery();

  const unreadMessages = messages.filter((item) => item.status === "unread").length;

  const pending = countByStatus(orders, "pending");
  const accepted = countByStatus(orders, "accepted");
  const rejected = countByStatus(orders, "rejected");
  const outForDelivery = countByStatus(orders, "out_for_delivery");
  const delivered = countByStatus(orders, "delivered");

  const revenue = orders
    .filter((order) => order.status !== "rejected")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);

  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <Welcome />

      <PageHeader
        title="Store overview"
        description="Live snapshot of products, orders and reviews."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Products" value={products.length} to="/dashboard/products" />
        <StatCard label="Blogs" value={blogData?.blogs?.length || 0} to="/dashboard/blogs" />
        <StatCard label="Reviews" value={reviews.length} to="/dashboard/reviews" />
        <StatCard
          label="Messages"
          value={messages.length}
          hint={unreadMessages > 0 ? `${unreadMessages} unread` : "All answered"}
          to="/dashboard/messages"
          accent={unreadMessages > 0}
        />
        <StatCard
          label="Revenue (not rejected)"
          value={formatMoney(revenue)}
          accent
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Pending"
          value={pending}
          to="/dashboard/orders"
          accent={pending > 0}
        />
        <StatCard label="Accepted" value={accepted} to="/dashboard/orders/accepted" />
        <StatCard label="Rejected" value={rejected} to="/dashboard/orders/rejected" />
        <StatCard label="On Process" value={outForDelivery} to="/dashboard/orders/on-process" />
        <StatCard label="Delivered" value={delivered} to="/dashboard/orders/delivered" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <RevenueChart orders={orders} />
        <StatusDonut orders={orders} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TopProducts orders={orders} products={products} />

        <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
            <h2 className="font-serif text-lg font-bold text-[#1d1d1d]">
              Latest Orders
            </h2>
            <Link
              to="/dashboard/orders"
              className="text-xs font-semibold uppercase tracking-wider text-[#e11d48] transition hover:text-[#1d1d1d]"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-neutral-500">
              No orders yet.
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {recentOrders.map((order) => (
                <li
                  key={order._id}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#1d1d1d]">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.customer?.firstName} {order.customer?.lastName} ·{" "}
                      {order.customer?.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-[#1d1d1d]">
                      {formatMoney(order.total)}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
