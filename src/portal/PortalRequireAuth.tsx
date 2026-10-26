import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/* Redirects to /portal/login when there's no access token in local
 * storage. The main CRM has its own auth gate for admin surfaces;
 * this is the portal counterpart — strict and simple. */
export const PortalRequireAuth = ({ children }: { children: ReactNode }) => {
	const loc = useLocation()
	let hasToken = false
	try {
		hasToken = !!localStorage.getItem('access_token')
	} catch {
		hasToken = false
	}
	if (!hasToken) {
		return (
			<Navigate
				to='/portal/login'
				replace
				state={{ from: loc.pathname + loc.search }}
			/>
		)
	}
	return <>{children}</>
}
