import { PaymentStatus } from '../../store/finance-weekly/financeWeeklyApi'

interface StatusMeta {
	label: string
	color: string
	bg: string
	fg: string
}

/**
 * "Pastel breeze" palette — max-light pastels for a spacious,
 * airy grid.
 */
export const STATUS_META: Record<PaymentStatus, StatusMeta> = {
	received: {
		label: 'Received',
		color: '#5aa08a',
		bg: '#eaf5f0',
		fg: '#2f5a4a',
	},
	in_transit: {
		label: 'In transit',
		color: '#6b90c0',
		bg: '#e8f0f8',
		fg: '#2c4870',
	},
	expected_this_month: {
		label: 'This month',
		color: '#9080c0',
		bg: '#efe8f5',
		fg: '#4a3d78',
	},
	expected_later: {
		label: 'Later',
		color: '#d0916b',
		bg: '#f8e8dc',
		fg: '#754a2a',
	},
	planned_invoice: {
		label: 'Invoice',
		color: '#8a8f98',
		bg: '#e8eaee',
		fg: '#454a52',
	},
	no_work: {
		label: 'No work',
		color: '#b0b3ba',
		bg: '#f2f2f4',
		fg: '#75787f',
	},
}
