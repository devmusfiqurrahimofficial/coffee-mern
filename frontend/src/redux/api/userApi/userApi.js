import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";
 
export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/` }), 
  endpoints: (build) => ({
    generateJWT: build.mutation({
      query: (email) => ({
        url: "jwt",
        method: "POST",
        body: { email },
      }),
    }),
  }),
});
 
export const { useGenerateJWTMutation } = userApi;
 