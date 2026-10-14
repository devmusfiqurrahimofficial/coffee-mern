import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_BASE_URL } from "../../../utils/apiConfig";

export const settingsApi = createApi({
  reducerPath: "settingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: `${API_BASE_URL}/` }),
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
