import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { productApi } from "./api/productsApi/productsApi";
import { reviewsApi } from "./api/reviewsApi/reviewsApi";
import { blogsApi } from "./api/blogsApi/blogsApi";
import cartReducer from "./features/cartSlice/cartSlice";
import wishlistReducer from "./features/wishlistSlice/wishlistSlice";
import { userApi } from "./api/userApi/userApi";
import { ordersApi } from "./api/ordersApi/ordersApi";
import { settingsApi } from "./api/settingsApi/settingsApi";
import { messagesApi } from "./api/messagesApi/messagesApi";


const store = configureStore({
  reducer: {
    // Add your reducers here
    cart: cartReducer,
    wishlist: wishlistReducer,
    [productApi.reducerPath]: productApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [blogsApi.reducerPath]: blogsApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [ordersApi.reducerPath]: ordersApi.reducer,
    [settingsApi.reducerPath]: settingsApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(productApi.middleware, reviewsApi.middleware, blogsApi.middleware, userApi.middleware, ordersApi.middleware, settingsApi.middleware, messagesApi.middleware),
});

setupListeners(store.dispatch);

export default store;