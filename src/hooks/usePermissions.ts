import { useMemo } from 'react'
import { useAppSelector } from '.'

/**
 * Read the caller's capability permissions from the auth slice (hydrated
 * by `GET /auth/me` — see T-04). Backend is the sole source of truth for
 * authorization; this hook is UX-only (sidebar filter, PermissionGate,
 * ProtectedRoute). Every server call is still guarded by
 * `PermissionGuard`, so a stale local set never grants unauthorized
 * access — it only affects which controls the UI renders.
 */
export interface UsePermissions {
	has(key: string): boolean
	hasAll(keys: string[]): boolean
	hasAny(keys: string[]): boolean
}

const usePermissions = (): UsePermissions => {
	const permissions = useAppSelector((state) => state.auth.permissions)

	return useMemo(() => {
		const set = new Set(permissions)
		return {
			has: (key) => set.has(key),
			hasAll: (keys) => keys.every((k) => set.has(k)),
			hasAny: (keys) => keys.some((k) => set.has(k)),
		}
	}, [permissions])
}

export default usePermissions
