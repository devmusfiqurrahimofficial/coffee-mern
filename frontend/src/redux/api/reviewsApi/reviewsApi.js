import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/" }),
  tagTypes: ["Reviews"],
  endpoints: (build) => ({
    // Get all reviews across all products (admin dashboard)
    getAllReviews: build.query({
      query: () => "reviews",
      providesTags: ["Reviews"],
    }),

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
        "Reviews",
        // Product cards show the average rating from reviews
        "Products",
      ],
    }),

    // Admin comment on a review (author is always "admin")
    addReviewReply: build.mutation({
      query: ({ reviewId, text }) => ({
        url: `reviews/${reviewId}/reply`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Reviews"],
    }),
  }),
});

export const {
  useGetAllReviewsQuery,
  useGetReviewsQuery,
  useAddReviewMutation,
  useAddReviewReplyMutation,
} = reviewsApi;
