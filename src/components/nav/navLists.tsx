import NavOptions from './type'

import {
	ChatBubbleOutlineRounded,
	Home,
	MenuBookOutlined,
	PeopleOutlined,
	RequestQuoteOutlined,
	LayersOutlined,
	AccountCircleOutlined,
	ReceiptLongOutlined,
} from '@mui/icons-material'

const navList: NavOptions[] = [
	{
		label: 'Dashboard',
		path: '/dashboards/analytics',
		icon: <Home />,
	},
	{
		label: 'Chats',
		path: '/chats',
		icon: <ChatBubbleOutlineRounded />,
	},
	{
		label: 'Proposals',
		path: '/proposal/list/',
		icon: <RequestQuoteOutlined />,
	},
	{
		label: 'Leads',
		path: '/leads/list/',
		icon: <PeopleOutlined />,
	},
	{
		label: 'Base Knowledge',
		path: '/knowledge/list',
		icon: <MenuBookOutlined />,
	},
	{
		label: 'Invoices',
		path: '/invoices/list',
		icon: <ReceiptLongOutlined />,
	},
]

export const secondaryNavList: NavOptions[] = [
	{
		label: 'Platforms',
		path: '/platforms/list/',
		icon: <LayersOutlined />,
	},
	{
		label: 'Accounts',
		path: '/accounts/list/',
		icon: <AccountCircleOutlined />,
	},
]

export default navList
