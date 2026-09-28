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
	ListAltOutlined,
	BeachAccessOutlined,
	VpnKeyOutlined,
	FolderOutlined,
	AssessmentOutlined,
	AccountBalanceOutlined,
	PaymentOutlined,
	AttachMoneyOutlined,
	AccountBalanceWalletOutlined,
	LocalOfferOutlined,
	LinkedIn,
	LightbulbOutlined,
	ArticleOutlined,
	HistoryEduOutlined,
	HistoryOutlined,
	ShieldOutlined,
	ChangeHistoryOutlined,
	LockOpenOutlined,
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
			// Finance dashboard is a Coming Soon placeholder — no permission gate.
			format('Finance', '/dashboards/finance', <PaidOutlined />),
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
		parent: formatGroupButton('Employees', <BadgeOutlined />, '/employees', true),
		childrens: [
			format('List', '/employees/list', <ListAltOutlined />),
			format('Time Off', '/employees/time-off', <BeachAccessOutlined />),
			format('Credentials', '/employees/credentials', <VpnKeyOutlined />),
		],
	},
	{
		parent: formatGroupButton('Projects', <FolderOutlined />, '/projects', true),
		childrens: [
			format('List', '/projects/list', <ListAltOutlined />),
			format('Reports', '/projects/reports', <AssessmentOutlined />),
		],
	},
	{
		parent: formatGroupButton('Finances', <AccountBalanceOutlined />, '/finances', true),
		childrens: [
			format('Payments', '/finances/payments', <PaymentOutlined />),
			format('Salaries', '/finances/salaries', <AttachMoneyOutlined />),
			format('Payment Source', '/finances/payment-source', <AccountBalanceWalletOutlined />),
			format('Promotions', '/finances/promotions', <LocalOfferOutlined />),
		],
	},
	{
		parent: formatGroupButton('LinkedIn', <LinkedIn />, '/linkedin', true),
		childrens: [
			format('Ideas', '/linkedin/ideas', <LightbulbOutlined />),
			format('Posts', '/linkedin/posts', <ArticleOutlined />),
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
			format('Data changes', '/audit-log/data-changes', <ChangeHistoryOutlined />),
			format('Sensitive access', '/audit-log/sensitive-access', <LockOpenOutlined />),
		],
	},
]

export default navList
