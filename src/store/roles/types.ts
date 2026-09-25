export type RoleType = 'system' | 'default' | 'custom'

export interface ResourceMeta {
	key: string
	label: string
	hint: string
}

export type ActionKey = 'read' | 'create' | 'update' | 'delete'

export interface Role {
	id: string
	name: string
	description: string
	type: RoleType
	locked?: boolean
	userIds: string[]
	permissions: Set<string>
}

export interface UserPreview {
	id: string
	name: string
}

export const RESOURCES: ResourceMeta[] = [
	{ key: 'leads', label: 'leads', hint: 'Leads and funnel' },
	{ key: 'proposals', label: 'proposals', hint: 'Proposals' },
	{ key: 'platforms', label: 'platforms', hint: 'Search platforms' },
	{ key: 'accounts', label: 'accounts', hint: 'Response accounts' },
	{ key: 'counterparties', label: 'counterparties', hint: 'Counterparties' },
	{ key: 'client_requests', label: 'client_requests', hint: 'Client requests' },
	{ key: 'client_calls', label: 'client_calls', hint: 'Calls' },
	{ key: 'job_posts', label: 'job_posts', hint: 'Job postings' },
	{ key: 'invoices', label: 'invoices', hint: 'Invoices' },
	{ key: 'prompts', label: 'prompts', hint: 'Prompts' },
	{ key: 'settings', label: 'settings', hint: 'Application settings' },
	{ key: 'users', label: 'users', hint: 'Users' },
	{ key: 'roles', label: 'roles', hint: 'Roles and permissions' },
]

export const ACTIONS: ActionKey[] = ['read', 'create', 'update', 'delete']

export const buildPermission = (resource: string, action: ActionKey) => `${resource}:${action}`

export const allPermissions = (): Set<string> => {
	const s = new Set<string>()
	RESOURCES.forEach((r) => ACTIONS.forEach((a) => s.add(buildPermission(r.key, a))))
	return s
}
