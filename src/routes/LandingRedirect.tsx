import { Navigate } from 'react-router-dom'
import usePermissions from '../hooks/usePermissions'
import { firstAvailableLandingPath } from './landing'

/**
 * Cold-boot / root landing target. Sends the user to the first
 * primary nav section they actually have access to. If they have
 * none, sends them to `/access-denied` — never to a page they will
 * be redirected off of (no loop). Backend authentication is checked
 * higher up by `ProtectedRoute`, so this component runs only for an
 * already-authenticated caller.
 */
const LandingRedirect = () => {
	const { has } = usePermissions()
	const target = firstAvailableLandingPath(has) ?? '/access-denied'
	return <Navigate to={target} replace />
}

export default LandingRedirect
