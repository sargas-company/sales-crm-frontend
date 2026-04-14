import { useState, useLayoutEffect } from 'react'
import { useAppDispatch, useAppSelector } from '.'
import { setCredentials, logout } from '../store/auth/authSlice'
import { API_BASE_URL } from '../api/baseApi'

const useAuth = () => {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const refreshToken = useAppSelector((state) => state.auth.refreshToken)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useLayoutEffect(() => {
    // Already have a valid access token in memory
    if (accessToken) {
      setIsAuthenticated(true)
      return
    }

    // No access token but have a refresh token — try to restore the session
    if (refreshToken) {
      fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: { accessToken: string; refreshToken: string }) => {
          dispatch(setCredentials(data))
          setIsAuthenticated(true)
        })
        .catch(() => {
          dispatch(logout())
          setIsAuthenticated(false)
        })
      return
    }

    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated } as const
}

export default useAuth
