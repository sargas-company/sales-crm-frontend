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
    AssignmentOutlined,
} from '@mui/icons-material'

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
    label: "Dashboard",
    path: "/dashboards/analytics",
    icon: <Home />,
  },
  {
    label: "Chats",
    path: "/chats",
    icon: <ChatBubbleOutlineRounded />,
  },
  // {
  //   parent: formatGroupButton("Proposal", <DescriptionOutlined />, "/proposal/"),
  //   childrens: [
  //     format("List", "/proposal/list/"),
  //     format("Preview", "/proposal/preview/"),
  //     format("Edit", "/proposal/edit/"),
  //     format("Add", "/proposal/add/"),
  //   ],
  // },
  {
    label: "Proposals",
    path: "/proposal/list/",
    icon: <RequestQuoteOutlined />,
  },
  {
    label: "Leads",
    path: "/leads/list/",
    icon: <PeopleOutlined />,
  },
    {
        label: "Client Requests",
        path: "/client-requests/list/",
        icon: <AssignmentOutlined />,
    },
    {
        label: 'Invoices',
        path: '/invoices/list',
        icon: <ReceiptLongOutlined />,
    },
  {
    label: "Base Knowledge",
    path: "/knowledge/list",
    icon: <MenuBookOutlined />,
  },
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
];

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
