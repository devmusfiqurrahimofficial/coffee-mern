import { useMemo, useState, Fragment } from "react";
import { Link } from "react-router";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/solid";
import { useGetOrdersQuery } from "../../../redux/api/ordersApi/ordersApi";
import { OrderStatusBadge } from "../Dashboard";
import PageHeader from "./PageHeader";
import { formatMoney, formatDate } from "./stats";

export const ManageCustomers = () => {
  const { data: orders = [], isLoading, isError } = useGetOrdersQuery({});
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(null);

  const customers = useMemo(() => {
    const map = new Map();

    orders.forEach((order) => {
      const email = order.customer?.email?.toLowerCase() || "unknown";
      const entry = map.get(email) || {
        email,
        name: `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim(),
        phone: order.customer?.phone || "",
        city: order.address?.city || "",
        orders: 0,
        spent: 0,
        lastOrder: order.createdAt,
        orderList: [],
      };
      entry.orders += 1;
      if (order.status !== "rejected") {
        entry.spent += Number(order.total || 0);
      }
      if (new Date(order.createdAt) > new Date(entry.lastOrder)) {
        entry.lastOrder = order.createdAt;
      }
      entry.orderList.push(order);
      map.set(email, entry);
    });

    return [...map.values()].sort((a, b) => b.spent - a.spent);
  }, [orders]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.city].some((field) =>
        field?.toLowerCase().includes(term)
      )
    );
  }, [customers, query]);

  const totalSpent = filtered.reduce((sum, customer) => sum + customer.spent, 0);

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone who has ordered from your store, with lifetime value."
      />

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, city…"
            className="w-full rounded-full border border-black/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[var(--color-text)] outline-none transition placeholder:text-neutral-400 focus:border-[var(--color-primary)]"
          />
        </div>
        <p className="text-sm text-neutral-500">
          <span className="font-bold text-[var(--color-text)]">{filtered.length}</span> customers
          · {" "}
          <span className="font-bold text-[var(--color-primary)]">{formatMoney(totalSpent)}</span>{" "}
          lifetime value
        </p>
      </div>

      {isLoading && (
        <p className="rounded-2xl border border-black/5 bg-white px-5 py-10 text-center text-sm text-neutral-500 shadow-sm">
          Loading customers…
        </p>
      )}

      {isError && (
        <p className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-5 py-10 text-center text-sm text-[var(--color-primary-hover)]">
          Failed to load customers. Is the server running on port 5000?
        </p>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-16 text-center">
          <p className="font-serif text-xl text-[var(--color-text)]">No customers yet</p>
          <p className="mt-2 text-sm text-neutral-500">
            Customers appear here once they place an order.
          </p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-black/10 text-[11px] uppercase tracking-wider text-neutral-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Phone</th>
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold">Orders</th>
                  <th className="px-5 py-3 font-semibold">Spent</th>
                  <th className="px-5 py-3 font-semibold">Last order</th>
                  <th className="px-5 py-3 text-right font-semibold">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.map((customer) => (
                  <Fragment key={customer.email}>
                    <tr className="transition hover:bg-black/[0.02]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[var(--color-text)] text-xs font-bold text-white">
                            {(customer.name || customer.email || "?").charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--color-text)]">
                              {customer.name || "Unknown"}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
                              {customer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-neutral-600">{customer.phone || "—"}</td>
                      <td className="px-5 py-3 text-neutral-600">{customer.city || "—"}</td>
                      <td className="px-5 py-3 text-neutral-600">{customer.orders}</td>
                      <td className="px-5 py-3 font-bold text-[var(--color-primary)]">
                        {formatMoney(customer.spent)}
                      </td>
                      <td className="px-5 py-3 text-neutral-600">
                        {formatDate(customer.lastOrder)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            setExpanded(expanded === customer.email ? null : customer.email)
                          }
                          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-text)] transition hover:border-[var(--color-text)]"
                        >
                          {expanded === customer.email ? (
                            <>
                              Hide <ChevronUpIcon className="h-3.5 w-3.5" />
                            </>
                          ) : (
                            <>
                              View <ChevronDownIcon className="h-3.5 w-3.5" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                    {expanded === customer.email && (
                      <tr>
                        <td colSpan={7} className="bg-[#f3efe7]/60 px-5 py-4">
                          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                            Order history
                          </p>
                          <ul className="space-y-2">
                            {customer.orderList.map((order) => (
                              <li
                                key={order._id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5"
                              >
                                <span className="text-sm font-semibold text-[var(--color-text)]">
                                  #{order.orderNumber}
                                </span>
                                <span className="text-xs text-neutral-500">
                                  {formatDate(order.createdAt)}
                                </span>
                                <span className="text-sm font-bold text-[var(--color-text)]">
                                  {formatMoney(order.total)}
                                </span>
                                <OrderStatusBadge status={order.status} />
                                <Link
                                  to="/dashboard/orders"
                                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                >
                                  Open
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
