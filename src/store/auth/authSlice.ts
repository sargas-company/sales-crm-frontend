import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const REFRESH_TOKEN_KEY = 'refreshToken'

interface AuthState {
	accessToken: string | null
	refreshToken: string | null
	isInitialized: boolean // true = initial auth check complete (success or fail)
}

const initialState: AuthState = {
	accessToken: null,
	refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
	// No refresh token stored → no async check needed → already initialized
	isInitialized: !localStorage.getItem(REFRESH_TOKEN_KEY),
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
			state.isInitialized = true
			localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken)
		},
		logout: (state) => {
			state.accessToken = null
			state.refreshToken = null
			state.isInitialized = true
			localStorage.removeItem(REFRESH_TOKEN_KEY)
		},
		setInitialized: (state) => {
			state.isInitialized = true
		},
	},
})

export const { setCredentials, logout, setInitialized } = authSlice.actions
export default authSlice.reducer
