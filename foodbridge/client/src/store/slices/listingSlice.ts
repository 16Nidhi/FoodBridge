import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Donation } from '../../types';
import * as api from '../../services/api';

// Async Thunk for claiming a donation
export const claimDonationThunk = createAsyncThunk(
  'listings/claimDonation',
  async (donationId: string, { rejectWithValue }) => {
    try {
      const response = await api.claimDonation(donationId);
      return { donationId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to claim donation');
    }
  }
);

interface ListingState {
  listings: Donation[];
  loading: boolean;
  error: string | null;
  optimisticUpdates: Record<string, Partial<Donation>>;
}

const initialState: ListingState = {
  listings: [],
  loading: false,
  error: null,
  optimisticUpdates: {},
};

const listingSlice = createSlice({
  name: 'listings',
  initialState,
  reducers: {
    optimisticClaim(state, action: PayloadAction<{ id: string; user: any }>) {
      state.optimisticUpdates[action.payload.id] = {
        status: 'claimed',
        claimedBy: action.payload.user,
      };
    },
    clearOptimisticUpdate(state, action: PayloadAction<string>) {
      delete state.optimisticUpdates[action.payload];
    }
  },
  extraReducers: (builder) => {
    builder.addCase(claimDonationThunk.fulfilled, (state, action) => {
      // Keep optimistic update or clear and rely on fetch
    });
    builder.addCase(claimDonationThunk.rejected, (state, action) => {
      // Will be handled in component to revert optimistic state
    });
  }
});

export const {
  optimisticClaim,
  clearOptimisticUpdate
} = listingSlice.actions;

export default listingSlice.reducer;