import { ReactNode } from 'react'
import usePermissions from '../../hooks/usePermissions'

/**
 * Renders `children` only when the caller holds every listed permission
 * key (AND-semantics). When any key is missing, renders `fallback`
 * (defaults to `null`).
 *
 * Backend is the source of truth (spec §2); this gate is UX-only.
 *
 * ```
 * <PermissionGate permission='prompts:create'><Button>New</Button></PermissionGate>
 * <PermissionGate permission={['roles:update', 'roles:assign']}>…</PermissionGate>
 * ```
 */
interface PermissionGateProps {
	permission: string | string[]
	fallback?: ReactNode
	children: ReactNode
}

const PermissionGate = ({ permission, fallback = null, children }: PermissionGateProps) => {
	const { hasAll } = usePermissions()
	const keys = Array.isArray(permission) ? permission : [permission]
	if (keys.length === 0 || !hasAll(keys)) return <>{fallback}</>
	return <>{children}</>
}

export default PermissionGate
