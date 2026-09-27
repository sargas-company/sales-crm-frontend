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
} from '@mui/icons-material'
import { ReactNode } from 'react'

const format = (label: string, path: string, icon?: ReactNode): NavItemType => {
	return icon ? { label, path, icon } : { label, path }
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
			format('Sales', '/dashboards/sales', <TrendingUpOutlined />),
			format('Finance', '/dashboards/finance', <PaidOutlined />),
		],
	},
	{
		parent: formatGroupButton('Proposals', <RequestQuoteOutlined />, '/proposal'),
		childrens: [
			format('Platforms', '/platforms/list/', <LayersOutlined />),
			format('Job Posts', '/job-posts/list/', <WorkOutlineOutlined />),
			format('Accounts', '/accounts/list/', <AccountCircleOutlined />),
		],
	},
	{
		parent: formatGroupButton('Leads', <PeopleOutlined />, '/leads'),
		childrens: [
			format('List', '/leads/list/', <PeopleOutlined />),
			format('Client Calls', '/client-calls/list/', <PhoneOutlined />),
			format('Client Requests', '/client-requests/list/', <AssignmentOutlined />),
		],
	},
	{
		parent: formatGroupButton('Invoices', <ReceiptLongOutlined />, '/invoices'),
		childrens: [
			format('List', '/invoices/list/', <ReceiptLongOutlined />),
			format('Counterparties', '/counterparties/list/', <ContactsOutlined />),
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
]

export default navList
