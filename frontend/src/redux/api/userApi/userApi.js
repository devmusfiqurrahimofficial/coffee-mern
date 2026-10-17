import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";
 
export const userApi = createApi({
  reducerPath: "userApi",
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
  endpoints: (build) => ({
    // Exchanges a Firebase ID token (proves account ownership) for our short
    // backend JWT. Never accepts a raw email — that would let anyone mint
    // tokens (incl. admin) for any address.
    generateJWT: build.mutation({
      query: (idToken) => ({
        url: "jwt",
        method: "POST",
        body: { idToken },
      }),
    }),
  }),
});
 
export const { useGenerateJWTMutation } = userApi;
 