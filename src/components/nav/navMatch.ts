// Shared helpers for computing sidebar-nav active state.
//
// A nav item is configured with a single URL (typically the section's
// list page, e.g. `/leads/list/`). The active-state rules for the sidebar
// are:
//
//   1. The item stays highlighted on every route inside the same section,
//      not just the list URL. `/leads/list`, `/leads/add`, `/leads/edit/:id`,
//      `/leads/:id` (view/preview) all light up "Leads".
//   2. The parent group stays expanded whenever any of its children is
//      active, or the URL falls under the group's `rootPath`.
//
// We derive the "section root" from the configured nav path by stripping
// a trailing `/list` segment; nav paths without that suffix (dashboards,
// audit-log tabs, roles) match on their own path. Callers pair the root
// with `matchPath({ path, end: false }, pathname)` so any sub-route
// underneath it matches.

const stripTrailingSlashes = (p: string): string => p.replace(/\/+$/, '')

export const navSectionRoot = (rawPath: string): string => {
	const noTrail = stripTrailingSlashes(rawPath)
	const withoutList = noTrail.replace(/\/list$/, '')
	return withoutList || '/'
}
