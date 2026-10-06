import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const REFRESH_TOKEN_KEY = 'refreshToken'

export interface AuthRole {
	id: string
	name: string
	label: string
}

export interface AuthMePayload {
	role: AuthRole | null
	permissions: string[]
}

interface AuthState {
	accessToken: string | null
	refreshToken: string | null
	isInitialized: boolean // true = initial auth check complete (success or fail)
	// Populated by `GET /auth/me` after login / refresh / cold-boot.
	// Backend is the source of truth per spec §2; the frontend copy is
	// UX-only (sidebar filter, PermissionGate, ProtectedRoute).
	role: AuthRole | null
	permissions: string[]
}

const initialState: AuthState = {
	accessToken: null,
	refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
	// No refresh token stored → no async check needed → already initialized
	isInitialized: !localStorage.getItem(REFRESH_TOKEN_KEY),
	role: null,
	permissions: [],
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
			// `isInitialized` is intentionally NOT flipped here. On cold-
			// boot the flag stays `false` until `setInitialized` fires
			// after both `setCredentials` and `setMe` have committed, so
			// `<ProtectedRoute>` waits for `role` + `permissions` to
			// hydrate before rendering any authenticated child (spec §5).
			// Mid-session refresh via the axios interceptor is a no-op on
			// this flag: `isInitialized` was already `true`.
			localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refreshToken)
		},
		setMe: (state, action: PayloadAction<AuthMePayload>) => {
			state.role = action.payload.role
			state.permissions = action.payload.permissions
		},
		logout: (state) => {
			state.accessToken = null
			state.refreshToken = null
			state.isInitialized = true
			state.role = null
			state.permissions = []
			localStorage.removeItem(REFRESH_TOKEN_KEY)
		},
		setInitialized: (state) => {
			state.isInitialized = true
		},
		// Fresh-login hydration gate. On cold-boot with a stored refresh
		// token `isInitialized` already starts `false` so `ProtectedRoute`
		// waits for `setMe` before letting the user through; a fresh login
		// path never hits that gate because at page load there was no
		// refresh token to park on. Calling `setLoggingIn` just before
		// `setCredentials` reopens the same gate for the brief window
		// between tokens being committed and `/auth/me` returning — so
		// the authenticated-but-empty-permissions state cannot leak out
		// and flash `/access-denied` between the two. `setInitialized`
		// closes the gate afterwards (or on login failure).
		setLoggingIn: (state) => {
			state.isInitialized = false
		},
	},
})

export const { setCredentials, setMe, logout, setInitialized, setLoggingIn } = authSlice.actions
export default authSlice.reducer
