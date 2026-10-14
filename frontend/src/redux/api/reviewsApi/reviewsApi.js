import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/" }),
  tagTypes: ["Reviews"],
  endpoints: (build) => ({
    // Get all reviews for a product -> { reviews, average, count }
    getReviews: build.query({
      query: (productId) => `reviews/${productId}`,
      providesTags: (result, error, productId) => [
        { type: "Reviews", id: productId },
      ],
    }),

    // Add a review for a product
    addReview: build.mutation({
      query: (review) => ({
        url: "reviews",
        method: "POST",
        body: review,
      }),
      invalidatesTags: (result, error, review) => [
        { type: "Reviews", id: review?.productId },
      ],
    }),
  }),
});

export const { useGetReviewsQuery, useAddReviewMutation } = reviewsApi;
