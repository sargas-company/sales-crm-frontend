// Landing candidates for a freshly logged-in user, or for a user who
// just landed on the app root. The list mirrors the primary nav order
// so the user opens the topmost section they actually have access to.
// Coming Soon nav entries are intentionally excluded.
//
// Every ProtectedRoute uses this same predicate on redirect, so the
// user never lands on a page they cannot open — no redirect loop, no
// flash of a permission-guarded child.

export interface LandingCandidate {
	path: string
	permission: string
}

export const LANDING_CANDIDATES: LandingCandidate[] = [
	{ path: '/dashboards/sales', permission: 'sales_analytics:view' },
	{ path: '/dashboards/finances', permission: 'finances_weekly:view' },
	{ path: '/dashboards/projects', permission: 'project_analytics:view' },
	{ path: '/dashboards/time-off', permission: 'employee_analytics:view' },
	{ path: '/dashboards/compensation', permission: 'compensation_analytics:view' },
	{ path: '/finances/payments', permission: 'finances_weekly:view' },
	{ path: '/platforms/list/', permission: 'platforms:view' },
	{ path: '/job-posts/list/', permission: 'job_posts:view' },
	{ path: '/accounts/list/', permission: 'accounts:view' },
	{ path: '/leads/list/', permission: 'leads:view' },
	{ path: '/client-calls/list/', permission: 'client_calls:view' },
	{ path: '/client-requests/list/', permission: 'client_requests:view' },
	{ path: '/invoices/list/', permission: 'invoices:view' },
	{ path: '/counterparties/list/', permission: 'counterparties:view' },
	{ path: '/employees/list', permission: 'employees:view' },
	{ path: '/employees/time-off', permission: 'time_off:view' },
	{ path: '/projects/list', permission: 'projects:view' },
	{ path: '/prompts/list', permission: 'prompts:view' },
	{ path: '/linkedin/posts', permission: 'linkedin_posts:view' },
	{ path: '/linkedin/ideas', permission: 'linkedin_ideas:view' },
	{ path: '/linkedin/accounts', permission: 'linkedin_accounts:view' },
	{ path: '/roles', permission: 'roles:view' },
	{ path: '/audit-log/all-activity', permission: 'audit_logs:view' },
]

export const firstAvailableLandingPath = (
	has: (key: string) => boolean,
): string | null => {
	for (const c of LANDING_CANDIDATES) {
		if (has(c.permission)) return c.path
	}
	return null
}
