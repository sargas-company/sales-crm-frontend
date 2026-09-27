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
	DescriptionOutlined,
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
	// {
	//   parent: formatGroupButton("Dashboards", <Home />, "/dashboards/"),
	//   childrens: [
	//     format("CRM", "/dashboards/crm/"),
	//     format("Analytics", "/dashboards/analytics/"),
	//     format("Ecommerce", "/dashboards/ecommerce/"),
	//   ],
	// },
	{
		parent: formatGroupButton('Dashboard', <SpaceDashboardOutlined />, '/dashboards'),
		childrens: [
			format('Sales', '/dashboards/sales', <TrendingUpOutlined />),
			format('Finance', '/dashboards/finance', <PaidOutlined />),
		],
	},
	// {
	// 	label: 'Chats',
	// 	path: '/chats',
	// 	icon: <ChatBubbleOutlineRounded />,
	// },
	{
		parent: formatGroupButton('Proposals', <RequestQuoteOutlined />, '/proposal'),
		childrens: [
			format('List', '/proposal/list/', <DescriptionOutlined />),
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
	// {
	// 	label: 'Base Knowledge',
	// 	path: '/knowledge/list',
	// 	icon: <MenuBookOutlined />,
	// },
	// {
	//   parent: formatGroupButton("User", <PersonOutline />, "/user/"),
	//   childrens: [format("List", "/user/list/"), format("View", "/user/view/")],
	// },
	// {
	//   parent: formatGroupButton("Pages", <ContactPageOutlined />, "/pages/"),
	//   childrens: [
	//     {
	//       parent: formatGroupButton(
	//         "User Profile",
	//         <AccountCircleOutlined />,
	//         "/pages/user-profile/"
	//       ),
	//       childrens: [
	//         formatWithHidenIcon("Profile", "/pages/user-profile/profile/"),
	//         formatWithHidenIcon("Teams", "/pages/user-profile/teams/"),
	//         formatWithHidenIcon("Projects", "/pages/user-profile/projects/"),
	//         formatWithHidenIcon(
	//           "Connections",
	//           "/pages/user-profile/connections/"
	//         ),
	//       ],
	//     },
	//     {
	//       parent: formatGroupButton(
	//         "Account Settings",
	//         <ManageAccountsOutlined />,
	//         "/pages/account-settings/"
	//       ),
	//       childrens: [
	//         formatWithHidenIcon("Account", "/pages/account-settings/account/"),
	//         formatWithHidenIcon("Security", "/pages/account-settings/security/"),
	//         formatWithHidenIcon("Billing", "/pages/account-settings/billing/"),
	//         formatWithHidenIcon(
	//           "Notifications",
	//           "/pages/account-settings/notifications/"
	//         ),
	//         formatWithHidenIcon(
	//           "Connections",
	//           "/pages/account-settings/connections/"
	//         ),
	//       ],
	//     },
	//     format("Pricing", "/pages/pricing/", <SellOutlined />),
	//     format("FAQ", "/pages/faq/", <CampaignOutlined />),
	//   ],
	// },
	// {
	//   parent: formatGroupButton(
	//     "Charts",
	//     <Icon icon="mdi:chart-donut" />,
	//     "/charts/"
	//   ),
	//   childrens: [
	//     format("Apex", "/charts/apex-charts/"),
	//     format("Recharts", "/charts/recharts/"),
	//     format("ChartJs", "/charts/chartjs/"),
	//   ],
	// },
	// {
	//   parent: formatGroupButton(
	//     "Cards",
	//     <Icon icon="system-uicons:cube" />,
	//     "/ui/cards/"
	//   ),
	//   childrens: [
	//     format("Advanced", "/ui/cards/advanced/"),
	//     format("Statistics", "/ui/cards/statistics/"),
	//     format("Widgets", "/ui/cards/widgets/"),
	//   ],
	// },
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
