import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";

export const messagesApi = createApi({
  reducerPath: "messagesApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/` }),
  tagTypes: ["Messages"],
  endpoints: (build) => ({
    // Public: submit a message from the contact page
    sendMessage: build.mutation({
      query: (message) => ({
        url: "massage",
        method: "POST",
        body: message,
      }),
    }),

    // Public: admin replies shown on the contact page feedback section
    getFeedback: build.query({
      query: () => "massage/feedback",
      providesTags: ["Messages"],
    }),

    // Admin: all contact messages
    getMessages: build.query({
      query: () => "massage",
      providesTags: ["Messages"],
    }),

    // Admin: reply to a message (author is always "admin")
    replyToMessage: build.mutation({
      query: ({ id, reply }) => ({
        url: `massage/${id}`,
        method: "PATCH",
        body: { reply },
      }),
      invalidatesTags: ["Messages"],
    }),

    // Admin: delete a message
    deleteMessage: build.mutation({
      query: (id) => ({
        url: `massage/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Messages"],
    }),
  }),
});

export const {
  useSendMessageMutation,
  useGetFeedbackQuery,
  useGetMessagesQuery,
  useReplyToMessageMutation,
  useDeleteMessageMutation,
} = messagesApi;
