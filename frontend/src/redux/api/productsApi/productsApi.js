// Need to use the React-specific entry point to allow generating React hooks
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Define a service using a base URL and expected endpoints
export const productApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/' }),
  endpoints: (build) => ({
    getProducts: build.query(
      { query: () => "products"}
    ),
    // Fetch a single product by its MongoDB _id
    getProduct: build.query({
      query: (id) => `products/${id}`,
    }),
   //ADD NEW PRODUCT

  }),
})

// Export hooks for usage in function components, which are
// auto-generated based on the defined endpoints
export const { useGetProductsQuery, useGetProductQuery } = productApi