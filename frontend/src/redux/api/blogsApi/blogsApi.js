import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";

export const blogsApi = createApi({
  reducerPath: "blogsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("access-token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Blogs"],
  refetchOnFocus: true,
  refetchOnReconnect: true,
  endpoints: (build) => ({
    // Fetch either the full newest-first collection or one paginated slice.
    getBlogs: build.query({
      query: ({ all = false, page = 1, limit = 6 } = {}) => ({
        url: all ? "blogs?all=true" : `blogs?page=${page}&limit=${limit}`,
        cache: "no-store",
      }),
      providesTags: (result) => [
        { type: "Blogs", id: "LIST" },
        ...(result?.blogs || []).map((blog) => ({ type: "Blogs", id: blog._id })),
      ],
    }),
    getBlog: build.query({
      query: (id) => ({ url: `blogs/${id}`, cache: "no-store" }),
      providesTags: (result, error, id) => [{ type: "Blogs", id }],
    }),

    getFeaturedBlogs: build.query({
      query: ({ limit = 3, excludeId } = {}) => {
        const params = new URLSearchParams({ limit: String(limit) });
        if (excludeId) params.set("excludeId", excludeId);
        return { url: `blogs/featured?${params.toString()}`, cache: "no-store" };
      },
      providesTags: [{ type: "Blogs", id: "FEATURED" }],
    }),

    uploadBlogCover: build.mutation({
      query: ({ file }) => ({
        url: "blogs/cover",
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      }),
    }),

    addBlog: build.mutation({
      query: ({ blog }) => ({
        url: "blogs",
        method: "POST",
        body: blog,
      }),
      invalidatesTags: [{ type: "Blogs", id: "LIST" }, { type: "Blogs", id: "FEATURED" }],
    }),

    // Update a blog post (admin dashboard)
    updateBlog: build.mutation({
      query: ({ id, ...patch }) => ({
        url: `blogs/${id}`,
        method: "PATCH",
        body: patch,
      }),
      invalidatesTags: [
        { type: "Blogs", id: "LIST" },
        { type: "Blogs", id: "FEATURED" },
      ],
    }),

    // Delete a blog post (admin dashboard)
    deleteBlog: build.mutation({
      query: (id) => ({
        url: `blogs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [
        { type: "Blogs", id: "LIST" },
        { type: "Blogs", id: "FEATURED" },
      ],
    }),
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogQuery,
  useGetFeaturedBlogsQuery,
  useUploadBlogCoverMutation,
  useAddBlogMutation,
  useUpdateBlogMutation,
  useDeleteBlogMutation,
} = blogsApi;