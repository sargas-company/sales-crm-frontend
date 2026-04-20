import axios from 'axios'
import type { Store } from '@reduxjs/toolkit'
import { setCredentials, logout } from '../store/auth/authSlice'

// Injected lazily from main.tsx to avoid circular dependency:
// main.tsx → store → baseApi → axiosInstance → store (circular)
let store: Store

export const injectStore = (_store: Store) => {
	store = _store
}

const axiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
	const token = store?.getState().auth.accessToken
	if (token) {
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

// ─── Response interceptor ────────────────────────────────────────────────────
// Handles 401 → refresh → retry with a queue so parallel requests don't
// trigger multiple refresh calls simultaneously.

let isRefreshing = false
type QueueItem = { resolve: (token: string) => void; reject: (err: unknown) => void }
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown, token: string | null = null) => {
	failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token!)))
	failedQueue = []
}

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const original = error.config

		if (error.response?.status !== 401 || original._retry) {
			return Promise.reject(error)
		}

		// Queue concurrent 401s while refreshing
		if (isRefreshing) {
			return new Promise<string>((resolve, reject) => {
				failedQueue.push({ resolve, reject })
			}).then((token) => {
				original.headers.Authorization = `Bearer ${token}`
				return axiosInstance(original)
			})
		}

		original._retry = true
		isRefreshing = true

		const refreshToken = store?.getState().auth.refreshToken

		if (!refreshToken) {
			store?.dispatch(logout())
			isRefreshing = false
			return Promise.reject(error)
		}

		try {
			// Use plain axios (not instance) to avoid interceptor loop
			const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
				`${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/auth/refresh`,
				{ refreshToken }
			)
			store.dispatch(setCredentials(data))
			processQueue(null, data.accessToken)
			original.headers.Authorization = `Bearer ${data.accessToken}`
			return axiosInstance(original)
		} catch (refreshError) {
			processQueue(refreshError, null)
			store?.dispatch(logout())
			return Promise.reject(refreshError)
		} finally {
			isRefreshing = false
		}
	}
)

export default axiosInstance
