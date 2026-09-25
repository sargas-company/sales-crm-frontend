import styled from 'styled-components'
import { useGetSalesDataSourceQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { T } from './tokens'

const MockDataBadge = () => {
	const { data } = useGetSalesDataSourceQuery()
	if (!data || data.dataSource !== 'mock') return null

	return (
		<Pill role='status' aria-label='Data source: mock'>
			<span className='badge-dot' aria-hidden='true' />
			Mock data
		</Pill>
	)
}

export default MockDataBadge

const Pill = styled('span')`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	background: ${T.subtleBg};
	color: ${T.textSecondary};
	border: 1px solid ${T.border};
	border-radius: ${T.radiusPill};
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;

	.badge-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.textMuted};
	}
`
