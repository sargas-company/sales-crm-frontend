import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import EmptyState from '../_shared/EmptyState'
import ErrorState from '../_shared/ErrorState'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetTimePatternsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

const tooltipStyle = {
	borderRadius: 10,
	border: 'none',
	boxShadow: '0 12px 30px -12px rgba(15,23,42,0.2)',
	fontSize: 12,
}

const Grid = ({ children }: { children: React.ReactNode }) => (
	<div
		style={{
			display: 'grid',
			gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
			gap: 16,
		}}
	>
		{children}
	</div>
)

const TimePatterns = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetTimePatternsQuery(filters)

	if (isLoading || !data)
		return (
			<SectionCard title='Time patterns'>
				<SkeletonBlock height={280} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Time patterns'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (data.sampleSize === 0)
		return (
			<SectionCard title='Time patterns'>
				<EmptyState title='No posts in this period' />
			</SectionCard>
		)

	const weeklyMerged = data.weeklyTrend.map((w, i) => ({
		label: w.label,
		current: w.value,
		previous: data.previousWeeklyTrend[i]?.value ?? 0,
	}))

	return (
		<SectionCard
			title='Time patterns'
			hint={`${data.sampleSize} posts · ${data.periodLabel} · ${data.timezone}`}
		>
			<Grid>
				<div>
					<Sub title='Posts by hour of day' />
					<ResponsiveContainer width='100%' height={180}>
						<BarChart data={data.byHour} margin={{ top: 6, right: 8, left: -20, bottom: 0 }}>
							<CartesianGrid strokeDasharray='3 6' stroke='#e2e8f0' vertical={false} />
							<XAxis
								dataKey='label'
								tick={{ fontSize: 10, fill: '#94a3b8' }}
								interval={2}
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
							<Tooltip contentStyle={tooltipStyle} />
							<Bar
								dataKey='value'
								name='Posts'
								fill='rgba(3, 105, 161, 1)'
								radius={[4, 4, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div>
					<Sub title='Posts by weekday' />
					<ResponsiveContainer width='100%' height={180}>
						<BarChart
							data={data.byWeekday}
							margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray='3 6' stroke='#e2e8f0' vertical={false} />
							<XAxis
								dataKey='label'
								tick={{ fontSize: 11, fill: '#94a3b8' }}
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
							<Tooltip contentStyle={tooltipStyle} />
							<Bar dataKey='value' name='Posts' fill='#6366f1' radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div>
					<Sub title='Qualified rate by hour (%)' />
					<ResponsiveContainer width='100%' height={180}>
						<BarChart
							data={data.qualifiedRateByHour}
							margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray='3 6' stroke='#e2e8f0' vertical={false} />
							<XAxis
								dataKey='label'
								tick={{ fontSize: 10, fill: '#94a3b8' }}
								interval={2}
								axisLine={false}
								tickLine={false}
							/>
							<YAxis
								tick={{ fontSize: 11, fill: '#94a3b8' }}
								axisLine={false}
								tickLine={false}
								width={30}
								unit='%'
							/>
							<Tooltip
								contentStyle={tooltipStyle}
								formatter={(v: unknown) => [`${v as number}%`, 'Qual. rate']}
							/>
							<Bar dataKey='value' name='Qual. rate' fill='#10b981' radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div>
					<Sub title='Hot posts by weekday' />
					<ResponsiveContainer width='100%' height={180}>
						<BarChart
							data={data.hotByWeekday}
							margin={{ top: 6, right: 8, left: -20, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray='3 6' stroke='#e2e8f0' vertical={false} />
							<XAxis
								dataKey='label'
								tick={{ fontSize: 11, fill: '#94a3b8' }}
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
							<Tooltip contentStyle={tooltipStyle} />
							<Bar dataKey='value' name='Hot posts' fill='#a855f7' radius={[4, 4, 0, 0]} />
						</BarChart>
					</ResponsiveContainer>
				</div>

				<div style={{ gridColumn: 'span 2' }}>
					<Sub title='Weekly trend vs previous comparable period' />
					<ResponsiveContainer width='100%' height={200}>
						<LineChart
							data={weeklyMerged}
							margin={{ top: 6, right: 12, left: -20, bottom: 0 }}
						>
							<CartesianGrid strokeDasharray='3 6' stroke='#e2e8f0' vertical={false} />
							<XAxis
								dataKey='label'
								tick={{ fontSize: 11, fill: '#94a3b8' }}
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
							<Tooltip contentStyle={tooltipStyle} />
							<Legend wrapperStyle={{ fontSize: 12 }} iconType='circle' />
							<Line
								type='monotone'
								dataKey='current'
								name={data.periodLabel}
								stroke='rgba(3, 105, 161, 1)'
								strokeWidth={2.5}
							/>
							<Line
								type='monotone'
								dataKey='previous'
								name={data.previousPeriodLabel}
								stroke='#94a3b8'
								strokeDasharray='4 4'
								strokeWidth={2}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</Grid>
		</SectionCard>
	)
}

const Sub = ({ title }: { title: string }) => (
	<div
		style={{
			fontSize: 11.5,
			fontWeight: 700,
			color: '#64748b',
			textTransform: 'uppercase',
			letterSpacing: 0.4,
			marginBottom: 6,
		}}
	>
		{title}
	</div>
)

export default TimePatterns
