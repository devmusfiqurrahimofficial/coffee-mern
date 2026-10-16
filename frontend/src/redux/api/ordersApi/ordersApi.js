import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";

const baseQuery = fetchBaseQuery({
  baseUrl: `${API_BASE_URL}/`,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("access-token");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

// Clear a stale/invalid JWT and send the user to login on 401 so the
// frontend does not fail silently when the backend token is missing/expired.
const baseQueryWithAuthHandling = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    localStorage.removeItem("access-token");
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  }
  return result;
};

export const ordersApi = createApi({
  reducerPath: "ordersApi",
  baseQuery: baseQueryWithAuthHandling,
  tagTypes: ["Orders"],
  endpoints: (build) => ({
    // Place a new order (checkout details + payment) -> stored in /orders
    placeOrder: build.mutation({
      query: (order) => ({
        url: "orders",
        method: "POST",
        body: order,
      }),
      invalidatesTags: [{ type: "Orders", id: "all" }],
    }),

    // Fetch a single order by id (used for the confirmation view)
    getOrder: build.query({
      query: (id) => `orders/${id}`,
      providesTags: (result, error, id) => [{ type: "Orders", id }],
    }),

    // List orders, optionally filtered by status and/or customer email
    getOrders: build.query({
      query: ({ status, email } = {}) => {
        const params = new URLSearchParams();
        if (status) params.set("status", status);
        if (email) params.set("email", email);
        const query = params.toString();
        return query ? `orders?${query}` : "orders";
      },
      providesTags: (result) => [
        { type: "Orders", id: "all" },
        ...(result || []).map((order) => ({ type: "Orders", id: order._id })),
      ],
    }),

    // Move an order to its next status (accept / reject / out for delivery / delivered)
    updateOrderStatus: build.mutation({
      query: ({ id, status }) => ({
        url: `orders/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: [{ type: "Orders", id: "all" }],
    }),
  }),
});

export const {
  usePlaceOrderMutation,
  useGetOrderQuery,
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
} = ordersApi;
