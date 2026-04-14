import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const REFRESH_TOKEN_KEY = 'refreshToken'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
}

const initialState: AuthState = {
  accessToken: null,
  // Rehydrate refreshToken from localStorage on app start
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>
    ) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken)
    },
    logout: (state) => {
      state.accessToken = null
      state.refreshToken = null
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
