import { createSlice } from "@reduxjs/toolkit";


const cartSlice = createSlice({

    name: "cart",
    initialState: {
        cartItems: [],
        totalAmount: 0,
        totalQuantity: 0,
    },
    reducers: {
        

    }
    
})


export default cartSlice.reducer;