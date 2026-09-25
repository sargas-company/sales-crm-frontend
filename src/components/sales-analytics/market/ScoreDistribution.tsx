import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetScoreDistributionQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

const ScoreDistribution = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetScoreDistributionQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='Score distribution'>
				<SkeletonBlock height={240} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Score distribution'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (data.total === 0)
		return (
			<SectionCard title='Score distribution'>
				<EmptyState title='No analyzed posts in this period' />
			</SectionCard>
		)

	return (
		<SectionCard title='Score distribution' hint={`${data.total} analyzed`}>
			<ResponsiveContainer width='100%' height={220}>
				<BarChart data={data.buckets} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
					<CartesianGrid strokeDasharray='3 6' stroke='#e2e8f0' vertical={false} />
					<XAxis
						dataKey='label'
						tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={{ fontSize: 11, fill: '#94a3b8' }}
						axisLine={false}
						tickLine={false}
						width={30}
						allowDecimals={false}
					/>
					<Tooltip
						cursor={{ fill: 'rgba(148,163,184,0.1)' }}
						contentStyle={{
							borderRadius: 10,
							border: 'none',
							boxShadow: '0 12px 30px -12px rgba(15,23,42,0.2)',
							fontSize: 12,
						}}
						formatter={(v: unknown, _: unknown, ctx: { payload?: { share?: number } }) => [
							`${v as number} posts (${ctx.payload?.share ?? 0}%)`,
							'Count',
						]}
					/>
					<Bar dataKey='count' radius={[6, 6, 0, 0]}>
						{data.buckets.map((b) => (
							<Cell key={b.label} fill={b.color} />
						))}
					</Bar>
				</BarChart>
			</ResponsiveContainer>

			{data.hasFeedback && (
				<div style={{ marginTop: 12 }}>
					<div
						style={{
							fontSize: 11,
							fontWeight: 700,
							color: '#64748b',
							textTransform: 'uppercase',
							letterSpacing: 0.4,
							marginBottom: 6,
						}}
					>
						User relevance feedback per bucket
					</div>
					<div style={{ overflowX: 'auto' }}>
						<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
							<thead>
								<tr>
									{['Bucket', 'Very', 'Relevant', 'Not', 'Unrated'].map((h) => (
										<th
											key={h}
											style={{
												textAlign: 'left',
												padding: '6px 8px',
												fontSize: 10.5,
												color: '#64748b',
												fontWeight: 700,
												textTransform: 'uppercase',
												letterSpacing: 0.4,
												borderBottom: '1px solid #eef1f6',
											}}
										>
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{data.buckets.map((b) => (
									<tr key={b.label}>
										<td style={{ padding: '6px 8px', fontWeight: 600 }}>{b.label}</td>
										<td style={{ padding: '6px 8px', color: '#7c3aed' }}>
											{b.veryRelevant}
										</td>
										<td style={{ padding: '6px 8px', color: '#065f46' }}>{b.relevant}</td>
										<td style={{ padding: '6px 8px', color: '#991b1b' }}>
											{b.notRelevant}
										</td>
										<td style={{ padding: '6px 8px', color: '#94a3b8' }}>{b.unrated}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</SectionCard>
	)
}

export default ScoreDistribution
