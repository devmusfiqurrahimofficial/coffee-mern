import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";

export const contentApi = createApi({
  reducerPath: "contentApi",
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
  tagTypes: ["Content"],
  endpoints: (build) => ({
    // Public: all page content (sections saved from the dashboard).
    // Missing pages/sections simply render the built-in defaults.
    getContent: build.query({
      query: () => "content",
      providesTags: ["Content"],
    }),

    // Admin: replace one page's sections.
    updateContentPage: build.mutation({
      query: ({ page, sections }) => ({
        url: `content/${page}`,
        method: "PUT",
        body: { sections },
      }),
      invalidatesTags: ["Content"],
    }),

    // Admin: import an image from disk. The API stores it in MongoDB and
    // returns { image: "content/<id>" } — never a URL typed by hand.
    uploadContentImage: build.mutation({
      query: ({ file }) => ({
        url: "content/image",
        method: "POST",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      }),
    }),
  }),
});

export const {
  useGetContentQuery,
  useUpdateContentPageMutation,
  useUploadContentImageMutation,
} = contentApi;