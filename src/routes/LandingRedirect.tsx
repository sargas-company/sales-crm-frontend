import { Navigate } from 'react-router-dom'
import usePermissions from '../hooks/usePermissions'
import { useGetMeQuery } from '../store/auth/authApi'
import { firstAvailableLandingPath } from './landing'

/**
 * Cold-boot / root landing target. Sends the user to the first
 * primary nav section they actually have access to. If they have
 * none, sends them to `/access-denied` — never to a page they will
 * be redirected off of (no loop). Backend authentication is checked
 * higher up by `ProtectedRoute`, so this component runs only for an
 * already-authenticated caller.
 *
 * Per-role override: admin_manager lands on /dashboards/projects
 * instead of /dashboards/sales — the role is intended to operate
 * away from the Sales dashboard, and the preset still carries
 * `sales_analytics:view` so the plain cascade would stop there
 * first. Falls through to the generic cascade if that caller
 * does not actually have project_analytics access.
 */
const LandingRedirect = () => {
	const { has } = usePermissions()
	const { data: me } = useGetMeQuery()

	if (me?.role?.name === 'admin_manager' && has('project_analytics:view')) {
		return <Navigate to='/dashboards/projects' replace />
	}

	const target = firstAvailableLandingPath(has) ?? '/access-denied'
	return <Navigate to={target} replace />
}

export default LandingRedirect
