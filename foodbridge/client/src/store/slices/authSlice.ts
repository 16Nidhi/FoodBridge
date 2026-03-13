import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  verificationStatus?: VerificationStatus;
  email?: string;
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: null | AuthUser;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true, // Start true so we can validate token on first load
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    login(state, action: PayloadAction<AuthUser>) {
      state.isAuthenticated = true;
      state.user = action.payload;
      state.isLoading = false;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.isLoading = false;
    },
    updateVerificationStatus(state, action: PayloadAction<VerificationStatus>) {
      if (state.user) state.user.verificationStatus = action.payload;
    },
  },
});

export const { login, logout, setUser, setLoading, updateVerificationStatus } = authSlice.actions;
export const registerUser = login; // alias used by Register.tsx
export default authSlice.reducer;