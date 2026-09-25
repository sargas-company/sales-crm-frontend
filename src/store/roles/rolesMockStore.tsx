import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react'
import {
	ACTIONS,
	allPermissions,
	buildPermission,
	RESOURCES,
	Role,
	UserPreview,
} from './types'

interface RolesContextValue {
	roles: Role[]
	users: UserPreview[]
	getRole: (id: string) => Role | undefined
	saveRolePermissions: (id: string, permissions: Set<string>) => void
	createRole: (name: string, description: string) => Role
	duplicateRole: (id: string) => Role | undefined
	deleteRole: (id: string) => void
}

const RolesContext = createContext<RolesContextValue | null>(null)

const MOCK_USERS: UserPreview[] = [
	{ id: 'u_owner', name: 'Dmytro Chervonchenko' },
	{ id: 'u_1', name: 'Alex Poroshko' },
	{ id: 'u_2', name: 'Iryna Voloshyna' },
	{ id: 'u_3', name: 'Sergii Diachenko' },
	{ id: 'u_4', name: 'Anna Melnyk' },
	{ id: 'u_5', name: 'Roman Vus' },
	{ id: 'u_6', name: 'Kate Havryliuk' },
	{ id: 'u_7', name: 'Bohdan Lys' },
	{ id: 'u_8', name: 'Yuliia Kravets' },
	{ id: 'u_9', name: 'Mykhailo Bilyk' },
	{ id: 'u_10', name: 'Olena Popova' },
	{ id: 'u_11', name: 'Vadym Rud' },
	{ id: 'u_12', name: 'Igor Sokil' },
	{ id: 'u_13', name: 'Nina Zub' },
]

const managerBase = new Set<string>([
	buildPermission('leads', 'read'),
	buildPermission('leads', 'create'),
	buildPermission('leads', 'update'),
	buildPermission('proposals', 'read'),
	buildPermission('proposals', 'create'),
	buildPermission('proposals', 'update'),
	buildPermission('platforms', 'read'),
	buildPermission('accounts', 'read'),
	buildPermission('counterparties', 'read'),
	buildPermission('client_requests', 'read'),
	buildPermission('client_requests', 'create'),
	buildPermission('client_requests', 'update'),
	buildPermission('client_calls', 'read'),
	buildPermission('client_calls', 'create'),
	buildPermission('client_calls', 'update'),
	buildPermission('job_posts', 'read'),
	buildPermission('invoices', 'read'),
	buildPermission('prompts', 'read'),
])

const salesLeadBase = new Set<string>([
	...managerBase,
	buildPermission('leads', 'delete'),
	buildPermission('proposals', 'delete'),
	buildPermission('job_posts', 'create'),
	buildPermission('job_posts', 'update'),
	buildPermission('job_posts', 'delete'),
	buildPermission('accounts', 'create'),
	buildPermission('accounts', 'update'),
	buildPermission('platforms', 'create'),
	buildPermission('platforms', 'update'),
	buildPermission('invoices', 'create'),
	buildPermission('invoices', 'update'),
	buildPermission('users', 'read'),
])

const readOnlyBase = (() => {
	const s = new Set<string>()
	;['leads', 'proposals', 'platforms', 'accounts', 'counterparties', 'client_requests', 'client_calls', 'job_posts', 'invoices', 'prompts'].forEach(
		(r) => s.add(buildPermission(r, 'read'))
	)
	return s
})()

const seedRoles = (): Role[] => [
	{
		id: 'owner',
		name: 'Owner',
		description: 'Full access to the entire application.',
		type: 'system',
		locked: true,
		userIds: ['u_owner'],
		permissions: allPermissions(),
	},
	{
		id: 'manager',
		name: 'Manager',
		description: 'Works with the funnel: leads, proposals, calls, requests.',
		type: 'default',
		userIds: ['u_1', 'u_2', 'u_3', 'u_4', 'u_5', 'u_6', 'u_7', 'u_8'],
		permissions: new Set(managerBase),
	},
	{
		id: 'sales_lead',
		name: 'Sales Lead',
		description: 'Runs the manager team, distributes requests, handles invoices.',
		type: 'custom',
		userIds: ['u_9', 'u_10', 'u_11'],
		permissions: new Set(salesLeadBase),
	},
	{
		id: 'observer',
		name: 'Observer',
		description: 'Read-only access - for analytics and external observers.',
		type: 'custom',
		userIds: ['u_12', 'u_13'],
		permissions: new Set(readOnlyBase),
	},
]

export const RolesProvider = ({ children }: { children: ReactNode }) => {
	const [roles, setRoles] = useState<Role[]>(() => seedRoles())

	const getRole = useCallback((id: string) => roles.find((r) => r.id === id), [roles])

	const saveRolePermissions = useCallback((id: string, permissions: Set<string>) => {
		setRoles((prev) =>
			prev.map((r) => (r.id === id ? { ...r, permissions: new Set(permissions) } : r))
		)
	}, [])

	const createRole = useCallback((name: string, description: string) => {
		const role: Role = {
			id: `role_${Date.now()}`,
			name: name.trim() || 'Новая роль',
			description: description.trim() || 'Описание не задано.',
			type: 'custom',
			userIds: [],
			permissions: new Set<string>(),
		}
		setRoles((prev) => [...prev, role])
		return role
	}, [])

	const duplicateRole = useCallback(
		(id: string) => {
			const src = roles.find((r) => r.id === id)
			if (!src) return undefined
			const copy: Role = {
				id: `role_${Date.now()}`,
				name: `${src.name} (копия)`,
				description: src.description,
				type: 'custom',
				userIds: [],
				permissions: new Set(src.permissions),
			}
			setRoles((prev) => [...prev, copy])
			return copy
		},
		[roles]
	)

	const deleteRole = useCallback((id: string) => {
		setRoles((prev) => prev.filter((r) => r.id !== id))
	}, [])

	const value = useMemo<RolesContextValue>(
		() => ({
			roles,
			users: MOCK_USERS,
			getRole,
			saveRolePermissions,
			createRole,
			duplicateRole,
			deleteRole,
		}),
		[roles, getRole, saveRolePermissions, createRole, duplicateRole, deleteRole]
	)

	return <RolesContext.Provider value={value}>{children}</RolesContext.Provider>
}

export const useRoles = () => {
	const ctx = useContext(RolesContext)
	if (!ctx) throw new Error('useRoles must be used within RolesProvider')
	return ctx
}

export const RESOURCES_TABLE = RESOURCES
export const ACTIONS_TABLE = ACTIONS
