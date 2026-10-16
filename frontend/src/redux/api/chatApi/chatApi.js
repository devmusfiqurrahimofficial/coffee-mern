import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";

export const chatApi = createApi({
  reducerPath: "chatApi",
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
  tagTypes: ["Chats", "Messages"],
  endpoints: (build) => ({
    // Admin: list all customer conversations (one per user)
    getChats: build.query({
      query: () => "admin/chats",
      providesTags: ["Chats"],
    }),
    // Customer/Admin: fetch message history for a session from MongoDB
    getMessages: build.query({
      query: (sessionId) => `api/chats/${sessionId}/messages`,
      providesTags: (result, error, sessionId) => [
        { type: "Messages", id: sessionId },
      ],
    }),
  }),
});

export const { useGetChatsQuery, useGetMessagesQuery } = chatApi;