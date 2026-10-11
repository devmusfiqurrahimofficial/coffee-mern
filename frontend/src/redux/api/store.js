import { configureStore } from "@reduxjs/toolkit";
import { productApi } from "./productsApi/productsApi";
import cartReducer from "../features/cartSlice/cartSlice";


const store = configureStore({
  reducer: {
    // Add your reducers here
    cart: cartReducer,
    [productApi.reducerPath]: productApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>getDefaultMiddleware().concat(productApi.middleware),



});

export default store;