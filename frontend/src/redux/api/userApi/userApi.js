import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
 
export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/" }), 
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
 