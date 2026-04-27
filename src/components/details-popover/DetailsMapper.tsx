import { ReactNode } from 'react'

import {
	InfoOutlined,
	BusinessOutlined,
	PublicOutlined,
	PaymentsOutlined,
	QueryStatsOutlined,
	WorkOutlineOutlined,
	DescriptionOutlined,
	SellOutlined,
	NotesOutlined,
	PersonOutline,
} from '@mui/icons-material'

type DetailField = {
	label: string
	value?: string | number | null
	variant?: 'row' | 'stacked'
	icon?: ReactNode
	display?: 'default' | 'pill'
	color?: 'green' | 'gray' | 'blue' | 'red'
}

const iconSize = { fontSize: 16 }

const formatPercent = (value?: string | number | null): string | null => {
	if (value === null || value === undefined || value === '') return null
	const str = String(value)
	return str.endsWith('%') ? str : `${str}%`
}

const formatRate = (value?: string | number | null): string | null => {
	if (value === null || value === undefined || value === '') return null
	const str = String(value)
	if (str.includes('/hr')) return str.replace(/\/hr/g, '/h')
	const numeric = typeof value === 'number' ? value : Number(str.replace(/[^0-9.]/g, ''))
	if (Number.isNaN(numeric)) return str
	return `$${numeric}/h`
}

const formatMoney = (value?: string | number | null): string | null => {
	if (value === null || value === undefined || value === '') return null
	const str = String(value)
	if (str.startsWith('$')) return str
	const numeric = typeof value === 'number' ? value : Number(str.replace(/[^0-9.]/g, ''))
	if (Number.isNaN(numeric)) return str
	return `$${numeric.toLocaleString()}`
}

const parseNumericValue = (value?: string | number | null): number | null => {
	if (value === null || value === undefined || value === '') return null
	if (typeof value === 'number') return Number.isNaN(value) ? null : value

	const normalized = String(value).replace(/,/g, '').trim()
	const match = normalized.match(/-?\d+(\.\d+)?/)
	if (!match) return null

	const numeric = Number(match[0])
	return Number.isNaN(numeric) ? null : numeric
}

const parseMoneyToNumber = (value?: string | number | null): number | null => {
	if (value === null || value === undefined || value === '') return null
	if (typeof value === 'number') return Number.isNaN(value) ? null : value

	const normalized = String(value).toLowerCase().replace(/,/g, '').replace(/\$/g, '').trim()

	const match = normalized.match(/(\d+(\.\d+)?)/)
	if (!match) return null

	let numeric = Number(match[1])
	if (Number.isNaN(numeric)) return null

	if (normalized.includes('k')) numeric *= 1000
	if (normalized.includes('m')) numeric *= 1000000

	return numeric
}

const getLeadStatusColor = (status?: string | null): DetailField['color'] => {
	if (!status) return 'gray'

	const normalized = status.toLowerCase()

	if (normalized.includes('discussion')) return 'green'
	if (normalized.includes('new')) return 'blue'
	if (normalized.includes('rejected')) return 'red'

	return 'gray'
}

const getProposalStatusColor = (status?: string | null): DetailField['color'] => {
	if (!status) return 'gray'

	const normalized = status.toLowerCase()

	if (normalized.includes('draft')) return 'blue'
	if (normalized.includes('sent')) return 'green'
	if (normalized.includes('rejected')) return 'red'

	return 'gray'
}

const getJobPostScoreColor = (score?: string | number | null): DetailField['color'] => {
	const numeric = parseNumericValue(score)

	if (numeric === null) return 'gray'
	if (numeric < 30) return 'red'
	if (numeric < 50) return 'blue'
	return 'green'
}

const getBudgetColor = (budget?: string | number | null): DetailField['color'] => {
	const numeric = parseMoneyToNumber(budget)

	if (numeric === null) return 'gray'
	if (numeric < 5000) return 'red'
	if (numeric <= 10000) return 'blue'
	return 'green'
}

const getTotalSpentColor = (totalSpent?: string | number | null): DetailField['color'] => {
	const numeric = parseMoneyToNumber(totalSpent)

	if (numeric === null) return 'gray'
	if (numeric < 10000) return 'red'
	if (numeric < 30000) return 'blue'
	return 'green'
}

const getAvgRatePaidColor = (avgRatePaid?: string | number | null): DetailField['color'] => {
	const numeric = parseMoneyToNumber(avgRatePaid) ?? parseNumericValue(avgRatePaid)

	if (numeric === null) return 'gray'
	if (numeric < 20) return 'red'
	if (numeric < 30) return 'blue'
	return 'green'
}

const getHireRateColor = (hireRate?: string | number | null): DetailField['color'] => {
	const numeric = parseMoneyToNumber(hireRate) ?? parseNumericValue(hireRate)

	if (numeric === null) return 'gray'
	if (numeric < 20) return 'red'
	if (numeric < 30) return 'blue'
	return 'green'
}

export const mapLeadToFields = (lead?: {
	name?: string | null
	companyName?: string | null
	status?: string | null
	clientType?: string | null
	location?: string | null
}): DetailField[] => {
	return [
		{
			label: 'Name',
			value: lead?.name,
			icon: <PersonOutline style={iconSize} />,
		},
		{
			label: 'Company',
			value: lead?.companyName,
			icon: <BusinessOutlined style={iconSize} />,
		},
		{
			label: 'Status',
			value: lead?.status,
			display: 'pill',
			color: getLeadStatusColor(lead?.status),
			icon: <InfoOutlined style={iconSize} />,
		},
		{
			label: 'Client Type',
			value: lead?.clientType,
			icon: <PersonOutline style={iconSize} />,
		},
		{
			label: 'Location',
			value: lead?.location,
			icon: <PublicOutlined style={iconSize} />,
		},
	]
}

export const mapProposalToFields = (proposal?: {
	title?: string | null
	status?: string | null
	proposalType?: string | null
	boosted?: boolean | null
	connects?: number | null
	boostedConnects?: number | null
	platform?: { id: string; name: string } | null
	vacancy?: string | null
	coverLetter?: string | null
}): DetailField[] => {
	return [
		{
			label: 'Title',
			value: proposal?.title,
			icon: <DescriptionOutlined style={iconSize} />,
		},
		{
			label: 'Status',
			value: proposal?.status,
			display: 'pill',
			color: getProposalStatusColor(proposal?.status),
			icon: <InfoOutlined style={iconSize} />,
		},
		{
			label: 'Type',
			value: proposal?.proposalType,
			icon: <WorkOutlineOutlined style={iconSize} />,
		},
		{
			label: 'Boosted',
			value: proposal?.boosted == null ? null : proposal.boosted ? 'Yes' : 'No',
			display: 'pill',
			color: proposal?.boosted ? 'green' : 'gray',
			icon: <InfoOutlined style={iconSize} />,
		},
		{
			label: 'Connects',
			value: proposal?.connects,
			icon: <DescriptionOutlined style={iconSize} />,
		},
		{
			label: 'Boosted Connects',
			value: proposal?.boostedConnects,
			icon: <DescriptionOutlined style={iconSize} />,
		},
		{
			label: 'Platform',
			value: proposal?.platform?.name,
			icon: <BusinessOutlined style={iconSize} />,
		},
		{
			label: 'Vacancy',
			value: proposal?.vacancy,
			variant: 'stacked',
			icon: <NotesOutlined style={iconSize} />,
		},
		{
			label: 'Cover Letter',
			value: proposal?.coverLetter,
			variant: 'stacked',
			icon: <NotesOutlined style={iconSize} />,
		},
	]
}

export const mapJobPostToFields = (jobPost?: {
	title?: string | null
	description?: string | null
	score?: string | number | null
	gigRadarScore?: string | number | null
	budget?: string | null
	source?: string | null
	totalSpent?: string | number | null
	avgRatePaid?: string | number | null
	hireRate?: string | number | null
	location?: string | null
}): DetailField[] => {
	return [
		{
			label: 'Title',
			value: jobPost?.title,
			icon: <DescriptionOutlined style={iconSize} />,
		},
		{
			label: 'Description',
			value: jobPost?.description,
			variant: 'stacked',
			icon: <NotesOutlined style={iconSize} />,
		},
		{
			label: 'Budget',
			value: formatRate(jobPost?.budget),
			display: 'pill',
			color: getBudgetColor(jobPost?.budget),
			icon: <PaymentsOutlined style={iconSize} />,
		},
		{
			label: 'Match Score',
			value: formatPercent(jobPost?.score),
			display: 'pill',
			color: getJobPostScoreColor(jobPost?.score),
			icon: <QueryStatsOutlined style={iconSize} />,
		},
		{
			label: 'GigRadar Score',
			value: jobPost?.gigRadarScore,
			display: 'pill',
			color: getJobPostScoreColor(jobPost?.gigRadarScore),
			icon: <QueryStatsOutlined style={iconSize} />,
		},
		{
			label: 'Location',
			value: jobPost?.location,
			icon: <PublicOutlined style={iconSize} />,
		},
		{
			label: 'Source',
			value: jobPost?.source,
			icon: <SellOutlined style={iconSize} />,
		},
		{
			label: 'Total Spent',
			value: formatMoney(jobPost?.totalSpent),
			display: 'pill',
			color: getTotalSpentColor(jobPost?.totalSpent),
			icon: <PaymentsOutlined style={iconSize} />,
		},
		{
			label: 'Avg Rate Paid',
			value: formatRate(jobPost?.avgRatePaid),
			display: 'pill',
			color: getAvgRatePaidColor(jobPost?.avgRatePaid),
			icon: <QueryStatsOutlined style={iconSize} />,
		},
		{
			label: 'Hire Rate',
			value: jobPost?.hireRate,
			display: 'pill',
			color: getHireRateColor(jobPost?.hireRate),
			icon: <WorkOutlineOutlined style={iconSize} />,
		},
	]
}
