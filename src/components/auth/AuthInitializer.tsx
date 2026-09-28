import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { setCredentials, setMe, logout, setInitialized } from '../../store/auth/authSlice'
import axiosInstance, { refreshMyPermissions } from '../../api/axiosInstance'
import type { MeResponse } from '../../store/auth/authApi'

const AuthInitializer = () => {
	const dispatch = useAppDispatch()
	const refreshToken = useAppSelector((state) => state.auth.refreshToken)
	const isInitialized = useAppSelector((state) => state.auth.isInitialized)
	const isAuthenticated = useAppSelector((state) => !!state.auth.accessToken)

	useEffect(() => {
		if (isInitialized) return

		axiosInstance
			.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
			.then(async ({ data }) => {
				dispatch(setCredentials(data))
				// Hydrate role + permissions from the backend before the
				// app renders any permission-gated UI. Failure here does
				// not invalidate the session — the store just keeps the
				// default empty permission set until the next mount that
				// refetches `/auth/me`.
				try {
					const me = await axiosInstance.get<MeResponse>('/auth/me')
					dispatch(setMe({ role: me.data.role, permissions: me.data.permissions }))
				} catch {}
			})
			.catch(() => dispatch(logout()))
			.finally(() => dispatch(setInitialized()))
	}, [])

	// Refresh permissions when the tab regains focus, so a role change
	// made by an Owner in another window takes effect on return.
	// Guarded by axiosInstance's debounce (at most once per 5 s) and
	// gated on an authenticated session.
	useEffect(() => {
		if (!isAuthenticated) return
		const onFocus = () => {
			void refreshMyPermissions()
		}
		const onVisibility = () => {
			if (document.visibilityState === 'visible') onFocus()
		}
		window.addEventListener('focus', onFocus)
		document.addEventListener('visibilitychange', onVisibility)
		return () => {
			window.removeEventListener('focus', onFocus)
			document.removeEventListener('visibilitychange', onVisibility)
		}
	}, [isAuthenticated])

	return null
}

export default AuthInitializer
