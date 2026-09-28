import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import usePermissions from '../hooks/usePermissions'
import PageLoading from '../components/loading/PageLoading'

interface ProtectedRouteProps {
	children: ReactNode
	// Optional capability gate. When set and the caller lacks the
	// permission (single key or AND-list), redirect to
	// `/access-denied` (a plain authenticated-only page — cannot
	// loop). Backend `PermissionGuard` remains the source of truth;
	// this is UX-only (spec §4, §5).
	permission?: string | string[]
}

const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
	const { isAuthenticated } = useAuth()
	const { hasAll } = usePermissions()

	if (isAuthenticated === null) return <PageLoading />
	if (!isAuthenticated) return <Navigate to='/auth/login' replace />
	if (permission) {
		const keys = Array.isArray(permission) ? permission : [permission]
		if (keys.length > 0 && !hasAll(keys)) {
			return <Navigate to='/access-denied' replace />
		}
	}
	return <>{children}</>
}

export default ProtectedRoute
