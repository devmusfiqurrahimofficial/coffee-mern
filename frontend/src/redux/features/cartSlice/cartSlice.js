import { createSlice } from "@reduxjs/toolkit";

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cartItems: [],
    totalAmount: 0,
    totalQuantity: 0,
  },
  reducers: {
    // Add a product, or bump its quantity if it is already in the cart
    addToCart: (state, action) => {
      const product = action.payload;
      const existingItem = state.cartItems.find(
        (item) => item.id === product.id
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.cartItems.push({ ...product, quantity: 1 });
      }
      recalculateTotals(state);
    },

    // Increase quantity of an existing cart item
    increaseQuantity: (state, action) => {
      const item = state.cartItems.find((item) => item.id === action.payload);
      if (item) {
        item.quantity += 1;
        recalculateTotals(state);
      }
    },

    // Decrease quantity, removing the item when it reaches 0
    decreaseQuantity: (state, action) => {
      const item = state.cartItems.find((item) => item.id === action.payload);
      if (item) {
        item.quantity -= 1;
        if (item.quantity <= 0) {
          state.cartItems = state.cartItems.filter(
            (item) => item.id !== action.payload
          );
        }
        recalculateTotals(state);
      }
    },

    // Remove an item entirely regardless of quantity
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter(
        (item) => item.id !== action.payload
      );
      recalculateTotals(state);
    },

    // Empty the whole cart
    clearCart: (state) => {
      state.cartItems = [];
      recalculateTotals(state);
    },
  },
});

// Keep the aggregated totals in sync with the items array
function recalculateTotals(state) {
  state.totalQuantity = state.cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );
  state.totalAmount = state.cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
}

export const {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;
