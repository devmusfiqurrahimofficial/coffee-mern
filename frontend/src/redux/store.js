import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { productApi } from "./api/productsApi/productsApi";
import { reviewsApi } from "./api/reviewsApi/reviewsApi";
import { blogsApi } from "./api/blogsApi/blogsApi";
import cartReducer from "./features/cartSlice/cartSlice";
import { userApi } from "./api/userApi/userApi";


const store = configureStore({
  reducer: {
    // Add your reducers here
    cart: cartReducer,
    [productApi.reducerPath]: productApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [blogsApi.reducerPath]: blogsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(productApi.middleware, reviewsApi.middleware, blogsApi.middleware, userApi.middleware),
});

setupListeners(store.dispatch);

export default store;