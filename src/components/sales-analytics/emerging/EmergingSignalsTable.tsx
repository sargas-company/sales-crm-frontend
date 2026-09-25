import { useState } from 'react'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { SortableTable } from '../market/sortableTable.styled'
import { StatusPill } from '../../../page/analytics/emerging.styled'
import TrendPill from '../_shared/TrendPill'
import { emitEmergingDetail } from './EmergingDetailBus'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetEmergingListQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

type StatusFilter =
	| 'all'
	| 'candidate'
	| 'watching'
	| 'approved'
	| 'merged'
	| 'rejected'
	| 'ignored'

const STATUSES: { key: StatusFilter; label: string }[] = [
	{ key: 'all', label: 'All' },
	{ key: 'candidate', label: 'Candidate' },
	{ key: 'watching', label: 'Watching' },
	{ key: 'approved', label: 'Approved' },
	{ key: 'merged', label: 'Merged' },
	{ key: 'rejected', label: 'Rejected' },
	{ key: 'ignored', label: 'Ignored' },
]

const EmergingSignalsTable = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetEmergingListQuery(filters)
	const [status, setStatus] = useState<StatusFilter>('all')

	if (isLoading || !data)
		return (
			<SectionCard title='Taxonomy candidates'>
				<SkeletonBlock height={280} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Taxonomy candidates'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (data.length === 0)
		return (
			<SectionCard title='Taxonomy candidates'>
				<EmptyState
					title='No candidates yet'
					description='Signals show up here once the analyzer sees repeated unmatched terms.'
				/>
			</SectionCard>
		)

	const rows = status === 'all' ? data : data.filter((r) => r.status === status)

	return (
		<SectionCard title='Taxonomy candidates' hint={`${rows.length} shown · ${data.length} total`}>
			<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
				{STATUSES.map((s) => (
					<button
						key={s.key}
						type='button'
						onClick={() => setStatus(s.key)}
						style={{
							background: s.key === status ? 'rgba(3, 105, 161, 0.08)' : '#f8fafc',
							color: s.key === status ? 'rgba(3, 105, 161, 1)' : '#64748b',
							border: `1px solid ${s.key === status ? 'rgba(3, 105, 161, 0.16)' : '#eef1f6'}`,
							borderRadius: 999,
							fontSize: 11.5,
							fontWeight: 700,
							padding: '4px 10px',
							cursor: 'pointer',
						}}
						aria-pressed={s.key === status}
					>
						{s.label}
					</button>
				))}
			</div>
			{rows.length === 0 ? (
				<EmptyState title='No candidates match this filter' />
			) : (
				<div style={{ overflowX: 'auto' }}>
					<SortableTable>
						<thead>
							<tr>
								<th>Name</th>
								<th>Type</th>
								<th>Status</th>
								<th className='numeric'>Posts</th>
								<th className='numeric'>Clients</th>
								<th className='numeric'>Avg score</th>
								<th className='numeric'>Fit</th>
								<th className='numeric'>Growth</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{rows.map((r) => (
								<tr key={r.id}>
									<td className='name'>
										<button
											type='button'
											onClick={() => emitEmergingDetail(r.id)}
											style={{
												background: 'transparent',
												border: 'none',
												padding: 0,
												textAlign: 'left',
												color: '#0f172a',
												fontWeight: 600,
												cursor: 'pointer',
											}}
										>
											{r.name}
										</button>
										{r.newToDataset && (
											<span
												style={{
													marginLeft: 6,
													fontSize: 10,
													background: '#dcfce7',
													color: '#065f46',
													padding: '1px 6px',
													borderRadius: 999,
													textTransform: 'uppercase',
													letterSpacing: 0.3,
													fontWeight: 700,
												}}
											>
												New
											</span>
										)}
									</td>
									<td style={{ textTransform: 'capitalize' }}>{r.proposedType}</td>
									<td>
										<StatusPill $status={r.status}>{r.status}</StatusPill>
									</td>
									<td className='numeric'>{r.postCount}</td>
									<td className='numeric'>{r.uniqueClientCount ?? '—'}</td>
									<td className='numeric'>{r.averageScore}</td>
									<td className='numeric'>{r.sargasFit}</td>
									<td className='numeric'>
										<TrendPill value={r.growthPct} />
									</td>
									<td>
										<button
											type='button'
											onClick={() => emitEmergingDetail(r.id)}
											style={{
												background: 'transparent',
												border: 'none',
												color: 'rgba(3, 105, 161, 1)',
												fontSize: 12,
												fontWeight: 600,
												cursor: 'pointer',
											}}
										>
											Details →
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</SortableTable>
				</div>
			)}
		</SectionCard>
	)
}

export default EmergingSignalsTable
