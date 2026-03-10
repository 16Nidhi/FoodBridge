import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface AuthUser {
  id: string;
  name: string;
  role: string;
  verificationStatus?: VerificationStatus;
  phone?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: null | AuthUser;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<AuthUser>) {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
    },
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    updateVerificationStatus(state, action: PayloadAction<VerificationStatus>) {
      if (state.user) state.user.verificationStatus = action.payload;
    },
  },
});

export const { login, logout, setUser, updateVerificationStatus } = authSlice.actions;
export const registerUser = login; // alias used by Register.tsx
export default authSlice.reducer;