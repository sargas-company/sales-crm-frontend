import NavOptions, { NavItemType } from './type'

import {
	SpaceDashboardOutlined,
	TrendingUpOutlined,
	PaidOutlined,
	PeopleOutlined,
	RequestQuoteOutlined,
	LayersOutlined,
	AccountCircleOutlined,
	ContactsOutlined,
	ReceiptLongOutlined,
	AssignmentOutlined,
	WorkOutlineOutlined,
	TuneOutlined,
	PhoneOutlined,
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
	CalendarMonthOutlined,
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
} from '@mui/icons-material'
import { ReactNode } from 'react'

const format = (
	label: string,
	path: string,
	icon?: ReactNode,
	permission?: string | string[],
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
			format('Time Off', '/dashboards/time-off', <BeachAccessOutlined />, 'employee_analytics:view'),
			format('Compensation', '/dashboards/compensation', <PaidOutlined />, 'compensation_analytics:view'),
		],
	},
	{
		parent: formatGroupButton('Proposals', <RequestQuoteOutlined />, '/proposal'),
		childrens: [
			format('Platforms', '/platforms/list/', <LayersOutlined />, 'platforms:view'),
			format('Job Posts', '/job-posts/list/', <WorkOutlineOutlined />, 'job_posts:view'),
			format('Accounts', '/accounts/list/', <AccountCircleOutlined />, 'accounts:view'),
		],
	},
	{
		parent: formatGroupButton('Leads', <PeopleOutlined />, '/leads'),
		childrens: [
			format('List', '/leads/list/', <PeopleOutlined />, 'leads:view'),
			format('Client Calls', '/client-calls/list/', <PhoneOutlined />, 'client_calls:view'),
			format('Client Requests', '/client-requests/list/', <AssignmentOutlined />, 'client_requests:view'),
		],
	},
	{
		parent: formatGroupButton('Invoices', <ReceiptLongOutlined />, '/invoices'),
		childrens: [
			format('List', '/invoices/list/', <ReceiptLongOutlined />, 'invoices:view'),
			format('Counterparties', '/counterparties/list/', <ContactsOutlined />, 'counterparties:view'),
		],
	},
	{
		parent: formatGroupButton('Employees', <BadgeOutlined />, '/employees'),
		childrens: [
			format('List', '/employees/list', <ListAltOutlined />, 'employees:view'),
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
			format('Payments List', '/finances/payments-list', <ListAltOutlinedFw />, 'finances_weekly:view'),
			format('Salaries', '/finances/salaries', <AttachMoneyOutlined />, 'salaries:view'),
			format('Monthly run', '/finances/salaries/run', <ChecklistRtlOutlined />, 'salaries:view'),
			format('Salary Reviews', '/finances/promotions', <LocalOfferOutlined />, 'compensation_reviews:view'),
			format('Payment Sources', '/finances/payment-source', <AccountBalanceWalletOutlined />, 'payment_sources:view'),
		],
	},
	{
		parent: formatGroupButton('LinkedIn', <LinkedIn />, '/linkedin'),
		childrens: [
			format('Posts', '/linkedin/posts', <ArticleOutlined />, 'linkedin_posts:view'),
			format('Calendar', '/linkedin/posts/calendar', <CalendarMonthOutlined />, 'linkedin_posts:view'),
			format('Ideas', '/linkedin/ideas', <LightbulbOutlined />, 'linkedin_ideas:view'),
			format('Accounts', '/linkedin/accounts', <AccountCircleOutlined />, 'linkedin_accounts:view'),
		],
	},
	{
		parent: formatGroupButton('Phone Numbers', <PhoneAndroidOutlined />, '/phone-numbers'),
		permission: 'phone_numbers:view',
		childrens: [
			format('Numbers', '/phone-numbers', <PhoneAndroidOutlined />, 'phone_numbers:view'),
			format('Service Assignments', '/phone-numbers/assignments', <AssignmentIndOutlined />, 'phone_numbers:view'),
			format('Maintenance', '/phone-numbers/maintenance', <BuildOutlined />, 'phone_numbers:view'),
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
		parent: formatGroupButton('Backup & Recovery', <BackupOutlined />, '/backups'),
		permission: 'backups:view',
		childrens: [
			format('List', '/backups/list', <ListAltOutlined />, 'backups:view'),
		],
	},
	{
		label: 'Notifications',
		path: '/notifications/list',
		icon: <NotificationsNoneOutlined />,
		permission: 'notifications:view',
	},
]

export default navList
