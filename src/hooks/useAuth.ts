import { useAppSelector } from '.'

/**
 * Returns current auth state derived from Redux.
 * isAuthenticated:
 *   null  → app is still initializing (checking stored refresh token)
 *   true  → user is authenticated
 *   false → user is not authenticated
 */
const useAuth = () => {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const isInitialized = useAppSelector((state) => state.auth.isInitialized)

  if (!isInitialized) return { isAuthenticated: null } as const
  return { isAuthenticated: !!accessToken } as const
}

export default useAuth
