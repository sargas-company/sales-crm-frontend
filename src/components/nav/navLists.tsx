import NavOptions, { NavItemType } from './type'

import {
	SpaceDashboardOutlined,
	TrendingUpOutlined,
	PaidOutlined,
	PeopleOutlined,
	AccountCircleOutlined,
	ContactsOutlined,
	ReceiptLongOutlined,
	AssignmentOutlined,
	WorkOutlineOutlined,
	TuneOutlined,
	PhoneOutlined,
	GridViewOutlined,
	AdminPanelSettingsOutlined,
	BadgeOutlined,
	GroupsOutlined,
	ListAltOutlined,
	BeachAccessOutlined,
	VpnKeyOutlined,
	FolderOutlined,
	AssessmentOutlined,
	AccountBalanceOutlined,
	PaymentOutlined,
	AttachMoneyOutlined,
	ChecklistRtlOutlined,
	AccountBalanceWalletOutlined,
	InsightsOutlined,
	LocalOfferOutlined,
	LinkedIn,
	LightbulbOutlined,
	ArticleOutlined,
	HistoryEduOutlined,
	HistoryOutlined,
	ShieldOutlined,
	ChangeHistoryOutlined,
	LockOpenOutlined,
	ListAltOutlined as ListAltOutlinedFw,
	PhoneAndroidOutlined,
	AppsOutlined,
	AssignmentIndOutlined,
	BuildOutlined,
	FolderSpecialOutlined,
	BackupOutlined,
	NotificationsNoneOutlined,
	StoreOutlined,
} from '@mui/icons-material'
import { ReactNode } from 'react'

const format = (
	label: string,
	path: string,
	icon?: ReactNode,
	permission?: string | string[]
): NavItemType => {
	const base: NavItemType = icon ? { label, path, icon } : { label, path }
	return permission !== undefined ? { ...base, permission } : base
}

const formatGroupButton = (title: string, icon: ReactNode, rootPath: string, soon = false) => ({
	title,
	icon,
	rootPath,
	soon,
})

const navList: NavOptions[] = [
	{
		parent: formatGroupButton('Dashboard', <SpaceDashboardOutlined />, '/dashboards'),
		childrens: [
			format('Sales', '/dashboards/sales', <TrendingUpOutlined />, 'sales_analytics:view'),
			format('Finances', '/dashboards/finances', <InsightsOutlined />, 'finances_weekly:view'),
			format('Projects', '/dashboards/projects', <FolderOutlined />, 'project_analytics:view'),
			format(
				'Time Off',
				'/dashboards/time-off',
				<BeachAccessOutlined />,
				'employee_analytics:view'
			),
			format(
				'Compensation',
				'/dashboards/compensation',
				<PaidOutlined />,
				'compensation_analytics:view'
			),
		],
	},
	// Proposals, Accounts, Platforms are hidden from the menu while
	// Sales is parked (we're only running Job Posts today). Code,
	// routes, data and FKs stay intact — the entries will be restored
	// or re-grouped if those surfaces come back.
	{
		label: 'Job Posts',
		path: '/job-posts/list/?status=any',
		icon: <WorkOutlineOutlined />,
		permission: 'job_posts:view',
	},
	{
		parent: formatGroupButton('Sales', <PeopleOutlined />, '/leads'),
		childrens: [
			format('Leads', '/leads/list/', <PeopleOutlined />, 'leads:view'),
			format('Clients', '/clients/list/', <ContactsOutlined />, 'clients:view'),
			format(
				'Website Requests',
				'/client-requests/list/',
				<AssignmentOutlined />,
				'client_requests:view'
			),
			format('Calls', '/client-calls/list/', <PhoneOutlined />, 'client_calls:view'),
			format('Platforms', '/platforms/list/', <StoreOutlined />, 'platforms:view'),
		],
	},
	{
		parent: formatGroupButton('Invoices', <ReceiptLongOutlined />, '/invoices'),
		childrens: [
			format('List', '/invoices/list/', <ReceiptLongOutlined />, 'invoices:view'),
			format(
				'Counterparties',
				'/counterparties/list/',
				<ContactsOutlined />,
				'counterparties:view'
			),
		],
	},
	{
		parent: formatGroupButton('Employees', <BadgeOutlined />, '/employees'),
		childrens: [
			format('List', '/employees/list', <ListAltOutlined />, 'employees:view'),
			format('Positions', '/positions/list/', <WorkOutlineOutlined />, 'positions:view'),
			format('Time Off', '/employees/time-off', <BeachAccessOutlined />, 'time_off:view'),
			format('Credentials', '/credentials', <VpnKeyOutlined />, 'credentials:view'),
		],
	},
	{
		parent: formatGroupButton('Projects', <FolderOutlined />, '/projects'),
		childrens: [
			format('List', '/projects/list', <ListAltOutlined />, 'projects:view'),
			format('Reports', '/projects/reports', <AssessmentOutlined />, 'project_reports:view'),
			format('Portfolio', '/portfolio', <FolderSpecialOutlined />, 'portfolio:view'),
		],
	},
	{
		parent: formatGroupButton('Finances', <AccountBalanceOutlined />, '/finances'),
		childrens: [
			format('Payments', '/finances/payments', <PaymentOutlined />, 'finances_weekly:view'),
			format(
				'Payments List',
				'/finances/payments-list',
				<ListAltOutlinedFw />,
				'finances_weekly:view'
			),
			format('Salaries', '/finances/salaries', <AttachMoneyOutlined />, 'salaries:view'),
			format('Monthly run', '/finances/salaries/run', <ChecklistRtlOutlined />, 'salaries:view'),
			format(
				'Salary Reviews',
				'/finances/promotions',
				<LocalOfferOutlined />,
				'compensation_reviews:view'
			),
			format(
				'Payment Sources',
				'/finances/payment-source',
				<AccountBalanceWalletOutlined />,
				'payment_sources:view'
			),
		],
	},
	{
		parent: formatGroupButton('LinkedIn', <LinkedIn />, '/linkedin'),
		childrens: [
			format('Posts', '/linkedin/posts', <ArticleOutlined />, 'linkedin_posts:view'),
			format('Ideas', '/linkedin/ideas', <LightbulbOutlined />, 'linkedin_ideas:view'),
			format(
				'Accounts',
				'/linkedin/accounts',
				<AccountCircleOutlined />,
				'linkedin_accounts:view'
			),
		],
	},
	{
		parent: formatGroupButton('Phone Numbers', <PhoneAndroidOutlined />, '/phone-numbers'),
		permission: 'phone_numbers:view',
		childrens: [
			format('Numbers', '/phone-numbers', <PhoneAndroidOutlined />, 'phone_numbers:view'),
			format(
				'Board',
				'/phone-numbers/board',
				<GridViewOutlined />,
				'phone_numbers:view'
			),
			format(
				'Service Assignments',
				'/phone-numbers/assignments',
				<AssignmentIndOutlined />,
				'phone_numbers:view'
			),
			format(
				'Maintenance',
				'/phone-numbers/maintenance',
				<BuildOutlined />,
				'phone_numbers:maintain'
			),
			format('Services', '/phone-numbers/services', <AppsOutlined />, 'phone_numbers:view'),
		],
	},
]

export const secondaryNavList: NavOptions[] = [
	{
		label: 'Prompts',
		path: '/prompts/list',
		icon: <TuneOutlined />,
		permission: 'prompts:view',
	},
	{
		label: 'Roles & Access',
		path: '/roles',
		icon: <AdminPanelSettingsOutlined />,
		permission: 'roles:view',
	},
	{
		parent: formatGroupButton('Audit Log', <HistoryEduOutlined />, '/audit-log'),
		permission: 'audit_logs:view',
		childrens: [
			format('All activity', '/audit-log/all-activity', <HistoryOutlined />),
			format('Access & security', '/audit-log/access-security', <ShieldOutlined />),
			format('Financial activity', '/audit-log/financial-activity', <AccountBalanceOutlined />),
			format('Data changes', '/audit-log/data-changes', <ChangeHistoryOutlined />),
			format('Sensitive access', '/audit-log/sensitive-access', <LockOpenOutlined />),
		],
	},
	{
		label: 'Backup & Recovery',
		path: '/backups/list',
		icon: <BackupOutlined />,
		permission: 'backups:view',
	},
	{
		label: 'Notifications',
		path: '/notifications/list',
		icon: <NotificationsNoneOutlined />,
		permission: 'notifications:view',
	},
]

export default navList
