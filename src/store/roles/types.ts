// Shape mirrors the T-08 Roles administration API response
// (spec §3.3). Backend is the source of truth.

export interface RolePermission {
	id: string
	key: string
	module: string
	action: string
	label?: string | null
}

export interface Role {
	id: string
	name: string
	label: string
	description: string | null
	system: boolean
	createdAt: string
	updatedAt: string
	permissions: RolePermission[]
	userCount: number
}

export interface Permission {
	id: string
	key: string
	module: string
	action: string
	label?: string | null
	description?: string | null
}

// Machine-readable 400 codes from spec §6.
export type RoleErrorCode =
	| 'RESERVED_ROLE_SLUG'
	| 'ROLE_NAME_TAKEN'
	| 'UNKNOWN_PERMISSION_KEYS'
	| 'SYSTEM_ROLE_SLUG_LOCKED'
	| 'OWNER_PERMISSIONS_LOCKED'
	| 'SYSTEM_ROLE_UNDELETABLE'
	| 'ROLE_HAS_USERS'
	| 'LAST_OWNER_LOCK'
	| 'ROLE_NOT_FOUND'
	| 'USER_NOT_FOUND'

export const ROLE_ERROR_MESSAGES: Record<RoleErrorCode, string> = {
	RESERVED_ROLE_SLUG: 'This slug is reserved for a system role.',
	ROLE_NAME_TAKEN: 'A role with this slug already exists.',
	UNKNOWN_PERMISSION_KEYS: 'One or more permission keys are unknown.',
	SYSTEM_ROLE_SLUG_LOCKED: 'A role’s slug is immutable.',
	OWNER_PERMISSIONS_LOCKED: 'The Owner role permission set is locked.',
	SYSTEM_ROLE_UNDELETABLE: 'System roles cannot be deleted.',
	ROLE_HAS_USERS: 'Reassign users off this role before deleting it.',
	LAST_OWNER_LOCK: 'Cannot leave the system without an Owner.',
	ROLE_NOT_FOUND: 'Role not found.',
	USER_NOT_FOUND: 'User not found.',
}

export const RESERVED_SLUGS = new Set(['owner', 'admin_manager', 'regular_manager'])
export const OWNER_SLUG = 'owner'

export const SLUG_REGEX = /^[a-z][a-z0-9_]*$/
