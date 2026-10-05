import { useMemo, useState } from 'react'
import styled from 'styled-components'
import { CloseOutlined, OpenInNewOutlined } from '@mui/icons-material'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import EmptyState from '../_shared/EmptyState'
import ErrorState from '../_shared/ErrorState'
import { emitPostDetail } from '../posts/JobPostDrawerBus'
import { T } from '../_shared/tokens'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetJobPostsPageQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
/* ClientTier label/rule lookup — inlined after the deferred-tab mock
 * dataset (which previously exported this) was removed. The constant
 * is still used by AllPostsList's tier-highlight tooltips. */
const CLIENT_TIER_META: Record<
	'elite' | 'strong' | 'standard' | 'new' | 'unverified',
	{ label: string; rule: string }
> = {
	elite: {
		label: 'Elite',
		rule: 'Verified · spent ≥ $50k · rating ≥ 4.6 · ≥ 15 jobs posted',
	},
	strong: { label: 'Strong', rule: 'Verified · spent ≥ $10k · rating ≥ 4.3' },
	standard: { label: 'Standard', rule: 'Verified · spent ≥ $1k or ≥ 3 jobs posted' },
	new: { label: 'New', rule: 'Verified · limited history' },
	unverified: { label: 'Unverified', rule: 'Payment method not verified' },
}
import type { MockJobPost } from '../../../store/sales-analytics/types/jobPost'

const PAGE_SIZE = 20

const Wrap = styled('div')`
	display: flex;
	flex-direction: column;
	gap: 12px;

	.list-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.list-title {
		font-size: 15px;
		font-weight: 500;
		color: ${T.textStrong};
	}
	.list-sub {
		font-size: 12.5px;
		color: ${T.textMuted};
		margin-top: 2px;
	}
	.list-close {
		background: transparent;
		border: none;
		margin: 0;
		min-width: 0;
		color: ${T.primary};
		font-family: inherit;
		font-size: 13px;
		font-weight: 600;
		text-transform: none;
		letter-spacing: normal;
		line-height: 1.4;
		cursor: pointer;
		padding: 6px 12px;
		border-radius: ${T.radiusXs};
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.list-close:hover {
		background: ${T.primaryTint};
	}

	table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		font-size: 13px;
	}
	thead th {
		text-align: left;
		font-size: 11px;
		font-weight: 700;
		color: ${T.textSecondary};
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 10px 12px;
		background: ${T.subtleBg};
		border-bottom: 1px solid ${T.divider};
	}
	thead th:first-child {
		border-top-left-radius: ${T.radiusXs};
		border-bottom-left-radius: ${T.radiusXs};
	}
	thead th:last-child {
		border-top-right-radius: ${T.radiusXs};
		border-bottom-right-radius: ${T.radiusXs};
	}
	tbody td {
		padding: 12px;
		border-bottom: 1px solid ${T.divider};
		vertical-align: middle;
	}
	tbody tr:hover {
		background: ${T.subtleBg};
	}
	.title-btn {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		min-width: 0;
		text-align: left;
		text-transform: none;
		letter-spacing: normal;
		font-family: inherit;
		font-size: 13px;
		font-weight: 700;
		line-height: 1.35;
		color: ${T.textStrong};
		cursor: pointer;
	}
	.title-btn:hover {
		color: ${T.primary};
	}
	.title-btn:focus-visible {
		outline: 2px solid ${T.primary};
	}
	.direction {
		color: ${T.purple};
		font-weight: 600;
	}
	.tech {
		color: ${T.primary};
	}
	.client-country {
		font-weight: 600;
	}
	.client-tier {
		font-size: 11.5px;
		color: ${T.textMuted};
	}
	.link {
		color: ${T.primary};
		text-decoration: none;
	}
	.link:hover {
		text-decoration: underline;
	}

	.pager {
		display: flex;
		align-items: center;
		gap: 12px;
		justify-content: flex-end;
		padding: 10px 0 0;
	}
	.pager button {
		background: ${T.cardBg};
		border: 1px solid ${T.border};
		border-radius: ${T.radiusXs};
		margin: 0;
		min-width: 0;
		font-family: inherit;
		font-size: 12.5px;
		font-weight: 600;
		text-transform: none;
		letter-spacing: normal;
		line-height: 1.4;
		color: ${T.textPrimary};
		padding: 6px 14px;
		cursor: pointer;
		transition:
			border-color 160ms ${T.ease},
			color 160ms ${T.ease};
	}
	.pager button:hover:not(:disabled) {
		border-color: ${T.primary};
		color: ${T.primary};
	}
	.pager button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.pager-status {
		font-size: 12.5px;
		color: ${T.textSecondary};
	}
`

const budgetLabel = (p: MockJobPost): string => {
	if (p.contractType === 'fixed' && p.fixedBudget != null)
		return `$${p.fixedBudget.toLocaleString()}`
	if (p.contractType === 'hourly' && p.hourlyRateMax != null) {
		return `$${p.hourlyRateMin ?? p.hourlyRateMax}${p.hourlyRateMin != null && p.hourlyRateMin !== p.hourlyRateMax ? `–${p.hourlyRateMax}` : ''}/h`
	}
	return '—'
}

const clientTierOf = (p: MockJobPost): string => {
	if (!p.clientPaymentVerified) return CLIENT_TIER_META.unverified.label
	const spent = p.clientTotalSpent ?? 0
	const rating = p.clientRating ?? 0
	const hires = p.clientJobsPosted ?? 0
	if (spent >= 50000 && rating >= 4.6 && hires >= 15) return CLIENT_TIER_META.elite.label
	if (spent >= 10000 && rating >= 4.3) return CLIENT_TIER_META.strong.label
	if (spent >= 1000 || hires >= 3) return CLIENT_TIER_META.standard.label
	return CLIENT_TIER_META.new.label
}

interface Props {
	onClose: () => void
}

const AllPostsList = ({ onClose }: Props) => {
	const { filters } = useSalesFilters()
	const [page, setPage] = useState(1)
	const { data, isLoading, isError, refetch } = useGetJobPostsPageQuery({
		filters,
		page,
		limit: PAGE_SIZE,
	})

	const totalPages = useMemo(
		() => (data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1),
		[data]
	)

	return (
		<SectionCard>
			<Wrap>
				<div className='list-head'>
					<div>
						<div className='list-title'>All posts</div>
					</div>
					<button type='button' className='list-close' onClick={onClose}>
						<CloseOutlined style={{ fontSize: 16 }} />
						Close
					</button>
				</div>

				{isLoading || !data ? (
					<SkeletonBlock height={320} />
				) : isError ? (
					<ErrorState onRetry={() => refetch()} />
				) : data.items.length === 0 ? (
					<EmptyState
						title='No posts match the current filters'
						description='Adjust your filters, then re-open this list.'
					/>
				) : (
					<>
						<table>
							<thead>
								<tr>
									<th>Score</th>
									<th>Title</th>
									<th>Direction</th>
									<th>Technologies</th>
									<th>Budget</th>
									<th>Client</th>
									<th>Relevance</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{data.items.map((p) => (
									<tr key={p.id}>
										<td style={{ fontWeight: 700 }}>{p.score}</td>
										<td>
											<button className='title-btn' onClick={() => emitPostDetail(p.id)}>
												{p.title}
											</button>
										</td>
										<td className='direction'>{p.directions[0] ?? '—'}</td>
										<td className='tech'>{p.technologies.slice(0, 3).join(', ')}</td>
										<td>{budgetLabel(p)}</td>
										<td>
											<div className='client-country'>{p.clientCountry}</div>
											<div className='client-tier'>{clientTierOf(p)}</div>
										</td>
										<td>
											{p.originalUrl && (
												<a
													href={p.originalUrl}
													target='_blank'
													rel='noreferrer'
													className='link'
													title='Open original'
												>
													<OpenInNewOutlined style={{ fontSize: 14 }} />
												</a>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
						<div className='pager'>
							<button
								type='button'
								onClick={() => setPage((v) => Math.max(1, v - 1))}
								disabled={page <= 1}
							>
								Prev
							</button>
							<span className='pager-status'>
								Page {page} / {totalPages}
							</span>
							<button
								type='button'
								onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
								disabled={page >= totalPages}
							>
								Next
							</button>
						</div>
					</>
				)}
			</Wrap>
		</SectionCard>
	)
}

export default AllPostsList
