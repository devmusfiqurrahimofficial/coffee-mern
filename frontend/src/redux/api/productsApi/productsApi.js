// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { API_BASE_URL } from "../../../utils/apiConfig";

// Define a service using a base URL and expected endpoints
export const productApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/` }),
  tagTypes: ["Products"],
  endpoints: (build) => ({
    getProducts: build.query({
      query: () => "products",
      // Prices arrive from the API in BDT
      providesTags: (result) => [
        "Products",
        ...(result || []).map((product) => ({ type: "Products", id: product._id })),
      ],
    }),
    // Fetch a single product by its MongoDB _id
    getProduct: build.query({
      query: (id) => `products/${id}`,
      providesTags: (result, error, id) => [{ type: "Products", id }],
    }),
    // Add a new product (price is sent in USD and shown back as BDT)
    addProduct: build.mutation({
      query: (product) => ({
        url: "products",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["Products"],
    }),
    // Upload a product image; the API stores it in MongoDB and returns
    // { image: "products/<id>" }
    uploadProductImage: build.mutation({
      query: ({ file }) => ({
        url: "products/image",
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      }),
    }),
    // Update an existing product
    updateProduct: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `products/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: ["Products"],
    }),
    // Delete a product
    deleteProduct: build.mutation({
      query: (id) => ({
        url: `products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Products"],
    }),
  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const {
  useGetProductsQuery,
  useGetProductQuery,
  useAddProductMutation,
  useUploadProductImageMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi
