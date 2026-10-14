import { createSlice } from "@reduxjs/toolkit";

const WISHLIST_KEY = "wishlist";

const loadWishlist = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(WISHLIST_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const persistWishlist = (items) => {
  try {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable — wishlist simply stays in memory
  }
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    items: loadWishlist(),
  },
  reducers: {
    // Add a product, ignoring duplicates
    addToWishlist: (state, action) => {
      const product = action.payload;
      if (!state.items.some((item) => item.id === product.id)) {
        state.items.push({
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        });
      }
      persistWishlist(state.items);
    },

    // Remove a product by id
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      persistWishlist(state.items);
    },

    // Add if missing, remove if already saved
    toggleWishlist: (state, action) => {
      const product = action.payload;
      const exists = state.items.some((item) => item.id === product.id);
      state.items = exists
        ? state.items.filter((item) => item.id !== product.id)
        : [
            ...state.items,
            { id: product.id, name: product.name, price: product.price, image: product.image },
          ];
      persistWishlist(state.items);
    },

    clearWishlist: (state) => {
      state.items = [];
      persistWishlist(state.items);
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export const selectWishlistItems = (state) => state.wishlist.items;

export const selectIsWishlisted = (id) => (state) =>
  state.wishlist.items.some((item) => item.id === id);

export default wishlistSlice.reducer;
