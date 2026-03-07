import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  user: null | { id: string; name: string; role: string };
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ id: string; name: string; role: string }>) {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
    },
    setUser(state, action: PayloadAction<{ id: string; name: string; role: string } | null>) {
      state.user = action.payload;
    },
  },
});

export const { login, logout, setUser } = authSlice.actions;
export const registerUser = login; // alias used by Register.tsx
export default authSlice.reducer;