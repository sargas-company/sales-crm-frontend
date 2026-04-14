import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks'
import { setCredentials, logout, setInitialized } from '../../store/auth/authSlice'
import axiosInstance from '../../api/axiosInstance'

/**
 * Runs once on app mount. If a refresh token exists in Redux (from localStorage),
 * exchanges it for a new access token. Marks auth as initialized either way.
 * Renders nothing — purely a side-effect component.
 */
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
