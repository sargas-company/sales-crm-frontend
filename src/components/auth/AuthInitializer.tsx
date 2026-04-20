import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { setCredentials, logout, setInitialized } from '../../store/auth/authSlice'
import axiosInstance from '../../api/axiosInstance'

const AuthInitializer = () => {
	const dispatch = useAppDispatch()
	const refreshToken = useAppSelector((state) => state.auth.refreshToken)
	const isInitialized = useAppSelector((state) => state.auth.isInitialized)

	useEffect(() => {
		if (isInitialized) return

		axiosInstance
			.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken })
			.then(({ data }) => dispatch(setCredentials(data)))
			.catch(() => dispatch(logout()))
			.finally(() => dispatch(setInitialized()))
	}, [])

	return null
}

export default AuthInitializer
