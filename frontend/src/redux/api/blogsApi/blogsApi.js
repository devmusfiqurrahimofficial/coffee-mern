import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const blogsApi = createApi({
  reducerPath: "blogsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/" }),
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
  }),
});

export const {
  useGetBlogsQuery,
  useGetBlogQuery,
  useGetFeaturedBlogsQuery,
  useUploadBlogCoverMutation,
  useAddBlogMutation,
} = blogsApi;