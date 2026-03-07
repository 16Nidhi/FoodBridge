import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import listingReducer from './slices/listingSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    listings: listingReducer,
  },
});

export default store;