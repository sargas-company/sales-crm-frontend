import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import PageLoading from '../components/loading/PageLoading'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
	const { isAuthenticated } = useAuth()

	if (isAuthenticated === null) return <PageLoading />
	if (!isAuthenticated) return <Navigate to='/auth/login' replace />
	return <>{children}</>
}

export default ProtectedRoute
