import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Listing {
  id: string;
  title: string;
  description: string;
  quantity: number;
  location: string;
  createdAt: string;
}

interface ListingState {
  listings: Listing[];
  loading: boolean;
  error: string | null;
}

const initialState: ListingState = {
  listings: [],
  loading: false,
  error: null,
};

const listingSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    fetchListingsStart(state) {
      state.loading = true;
      state.error = null;
    },
    fetchListingsSuccess(state, action: PayloadAction<Listing[]>) {
      state.loading = false;
      state.listings = action.payload;
    },
    fetchListingsFailure(state, action: PayloadAction<string>) {
      state.loading = false;
      state.error = action.payload;
    },
    addListing(state, action: PayloadAction<Listing>) {
      state.listings.push(action.payload);
    },
    removeListing(state, action: PayloadAction<string>) {
      state.listings = state.listings.filter(listing => listing.id !== action.payload);
    },
    claimFoodListing(state, action: PayloadAction<string>) {
      // handled server-side; local state update is a no-op placeholder
    },
  },
});

export const {
  fetchListingsStart,
  fetchListingsSuccess,
  fetchListingsFailure,
  addListing,
  removeListing,
  claimFoodListing,
} = listingSlice.actions;

export default listingSlice.reducer;