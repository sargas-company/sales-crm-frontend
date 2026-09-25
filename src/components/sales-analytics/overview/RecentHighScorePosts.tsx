import styled from 'styled-components'
import { OpenInNewOutlined } from '@mui/icons-material'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import EmptyState from '../_shared/EmptyState'
import ErrorState from '../_shared/ErrorState'
import RelevanceControl from '../posts/RelevanceControl'
import { emitPostDetail } from '../posts/JobPostDrawerBus'
import { T } from '../_shared/tokens'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetRecentHighScorePostsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import type { JobPostAnalyticsSummary } from '../../../store/sales-analytics/types/jobPost'

const Table = styled('table')`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 14px;

	thead th {
		text-align: left;
		font-size: 12px;
		font-weight: 700;
		color: ${T.textSecondary};
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 12px 12px;
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
		padding: 16px 12px;
		border-bottom: 1px solid ${T.divider};
		vertical-align: middle;
	}
	tbody tr:last-child td {
		border-bottom: none;
	}
	tbody tr {
		transition: background 160ms ${T.ease};
	}
	tbody tr:hover {
		background: ${T.subtleBg};
	}

	.score {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 42px;
		height: 42px;
		border-radius: ${T.radiusXs};
		font-weight: 800;
		color: #ffffff;
		font-size: 14px;
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
		font-size: 14.5px;
		font-weight: 700;
		font-family: inherit;
		color: ${T.textStrong};
		cursor: pointer;
		line-height: 1.35;
	}
	.title-btn:hover {
		color: #0369a1;
	}
	.title-btn:focus-visible {
		outline: 2px solid #0369a1;
		outline-offset: 2px;
	}
	.chip {
		display: inline-block;
		padding: 3px 10px;
		border-radius: ${T.radiusPill};
		background: #f0f9ff;
		color: #0369a1;
		font-size: 12px;
		font-weight: 600;
		margin-right: 4px;
	}
	.chip.dir {
		background: ${T.purpleTint};
		color: ${T.purple};
	}
	.age {
		font-size: 13.5px;
		color: ${T.textSecondary};
		font-weight: 500;
	}
	.status {
		display: inline-block;
		font-size: 11.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		padding: 4px 10px;
		border-radius: ${T.radiusPill};
	}
	.status.sent {
		background: ${T.successTint};
		color: #065f46;
	}
	.status.pending {
		background: ${T.warningTint};
		color: #92400e;
	}
	.status.failed {
		background: ${T.errorTint};
		color: #7f1d1d;
	}
	.status.not_required {
		background: ${T.subtleBg};
		color: ${T.textSecondary};
	}

	.link {
		background: transparent;
		border: none;
		padding: 0;
		margin: 0;
		min-width: 0;
		font-family: inherit;
		text-transform: none;
		letter-spacing: normal;
		color: #0369a1;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
	}
	.link:hover {
		text-decoration: underline;
	}
	.client-country {
		font-weight: 600;
		color: ${T.textPrimary};
		font-size: 14px;
	}
	.client-tier {
		font-size: 12.5px;
		color: ${T.textMuted};
		text-transform: capitalize;
	}
`

const ViewAllBtn = styled('button')`
	background: transparent;
	border: none;
	margin: 0;
	min-width: 0;
	color: #0369a1;
	font-family: inherit;
	font-weight: 600;
	font-size: 13px;
	text-transform: none;
	letter-spacing: normal;
	cursor: pointer;
	padding: 4px 10px;
	border-radius: ${T.radiusXs};
	line-height: 1.4;

	&:hover {
		background: #f0f9ff;
	}
	&:focus-visible {
		outline: 2px solid #0369a1;
		outline-offset: 2px;
	}
`

const scoreColor = (s: number): string => {
	if (s >= 90) return '#10b981'
	if (s >= 75) return '#0369a1'
	if (s >= 50) return '#0284c7'
	if (s >= 25) return '#f59e0b'
	return '#ef4444'
}

const timeAgo = (iso: string): string => {
	const diff = Math.max(0, Date.now() - new Date(iso).getTime())
	if (diff < 60_000) return 'just now'
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`
	return `${Math.floor(diff / 86_400_000)}d`
}

const Row = ({ item }: { item: JobPostAnalyticsSummary }) => (
	<tr>
		<td>
			<span className='score' style={{ background: scoreColor(item.score) }}>
				{item.score}
			</span>
		</td>
		<td>
			<button type='button' className='title-btn' onClick={() => emitPostDetail(item.id)}>
				{item.title}
			</button>
			<div style={{ marginTop: 6 }}>
				{item.directions.slice(0, 2).map((d) => (
					<span key={d} className='chip dir'>
						{d}
					</span>
				))}
				{item.technologies.slice(0, 3).map((t) => (
					<span key={t} className='chip'>
						{t}
					</span>
				))}
			</div>
		</td>
		<td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{item.budgetLabel}</td>
		<td>
			<div className='client-country'>{item.clientCountry}</div>
			<div className='client-tier'>{item.clientTier} client</div>
		</td>
		<td className='age' style={{ whiteSpace: 'nowrap' }}>
			{timeAgo(item.receivedAt)}
		</td>
		<td>
			<span className={`status ${item.notificationStatus}`}>
				{item.notificationStatus.replace('_', ' ')}
			</span>
		</td>
		<td>
			<RelevanceControl postId={item.id} compact />
		</td>
		<td style={{ whiteSpace: 'nowrap' }}>
			<button type='button' className='link' onClick={() => emitPostDetail(item.id)}>
				Details
			</button>
			{item.originalUrl && (
				<>
					{' · '}
					<a
						className='link'
						href={item.originalUrl}
						target='_blank'
						rel='noreferrer'
						title='Open original'
					>
						<OpenInNewOutlined style={{ fontSize: 13 }} />
					</a>
				</>
			)}
		</td>
	</tr>
)

const RecentHighScorePosts = ({ onViewAll }: { onViewAll?: () => void }) => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetRecentHighScorePostsQuery({
		filters,
		limit: 6,
	})

	if (isLoading || !data) {
		return (
			<SectionCard title='Recent high-score posts'>
				<SkeletonBlock height={220} />
			</SectionCard>
		)
	}

	if (isError) {
		return (
			<SectionCard title='Recent high-score posts'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	}

	return (
		<SectionCard
			title='Recent high-score posts'
			hint={`${data.total} qualified in period`}
			action={
				onViewAll && data.total > data.items.length ? (
					<ViewAllBtn type='button' onClick={onViewAll}>
						View all →
					</ViewAllBtn>
				) : undefined
			}
			padding='0'
		>
			{data.items.length === 0 ? (
				<div style={{ padding: 20 }}>
					<EmptyState
						title='No qualified posts in this period'
						description='Posts that score 50+ will show up here.'
					/>
				</div>
			) : (
				<Table>
					<thead>
						<tr>
							<th>Score</th>
							<th>Title &amp; tags</th>
							<th>Budget</th>
							<th>Client</th>
							<th>Age</th>
							<th>Notification</th>
							<th>Relevance</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{data.items.map((item) => (
							<Row key={item.id} item={item} />
						))}
					</tbody>
				</Table>
			)}
		</SectionCard>
	)
}

export default RecentHighScorePosts
