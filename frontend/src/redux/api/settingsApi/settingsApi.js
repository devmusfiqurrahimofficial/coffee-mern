import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/" }),
  tagTypes: ["Settings"],
  endpoints: (build) => ({
    // Public store settings (store info + delivery prices)
    getSettings: build.query({
      query: () => "settings",
      providesTags: ["Settings"],
    }),

    // Admin updates store settings
    updateSettings: build.mutation({
      query: (settings) => ({
        url: "settings",
        method: "PUT",
        body: settings,
      }),
      invalidatesTags: ["Settings"],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;
