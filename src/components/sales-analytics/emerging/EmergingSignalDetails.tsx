import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { CloseOutlined } from '@mui/icons-material'
import {
	useGetEmergingDetailQuery,
	useGetEmergingListQuery,
} from '../../../store/sales-analytics/salesAnalyticsApi'
import { getMockState, subscribeMockState } from '../../../store/sales-analytics/mock/state'
import { emitEmergingDetail, subscribeEmergingDetail } from './EmergingDetailBus'
import { emitPostDetail } from '../posts/JobPostDrawerBus'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import SkeletonBlock from '../_shared/SkeletonBlock'
import { StatusPill } from '../../../page/analytics/emerging.styled'
import TaxonomyCandidateActions from './TaxonomyCandidateActions'
import { useSyncExternalStore } from 'react'
import type { EmergingScoreBreakdown } from '../../../store/sales-analytics/types/candidates'

const Backdrop = styled('div')`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.4);
	z-index: 55;
`

const Panel = styled('aside')`
	position: fixed;
	top: 0;
	right: 0;
	height: 100vh;
	width: min(760px, 100%);
	background: #ffffff;
	z-index: 56;
	display: flex;
	flex-direction: column;
	box-shadow: -10px 0 30px -12px rgba(15, 23, 42, 0.25);

	.hd {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 18px 22px;
		border-bottom: 1px solid #eef1f6;
		align-items: flex-start;
	}
	.hd-title {
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
	}
	.hd-sub {
		font-size: 12px;
		color: #94a3b8;
		margin-top: 4px;
		text-transform: capitalize;
	}
	.close {
		background: transparent;
		border: none;
		color: #64748b;
		border-radius: 8px;
		width: 32px;
		height: 32px;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.close:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
	.body {
		padding: 16px 22px 22px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.section-title {
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		padding: 3px 10px;
		border-radius: 999px;
		background: rgba(3, 105, 161, 0.08);
		color: rgba(3, 105, 161, 1);
		font-size: 12px;
		font-weight: 600;
		border: none;
		cursor: pointer;
	}
	.chip.static {
		cursor: default;
	}
	.p {
		font-size: 13.5px;
		color: #1f2937;
		line-height: 1.5;
	}
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 16px;
		font-size: 12.5px;
		color: #64748b;
	}
	.row strong {
		color: #1f2937;
		font-weight: 700;
	}
	.breakdown {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}
	.breakdown .b {
		background: #f8fafc;
		border: 1px solid #eef1f6;
		border-radius: 10px;
		padding: 8px 10px;
	}
	.b-key {
		font-size: 11px;
		color: #64748b;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.b-val {
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
		margin-top: 2px;
	}
	.timeline {
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 60px;
		padding: 8px 6px;
		background: #f8fafc;
		border: 1px solid #eef1f6;
		border-radius: 10px;
	}
	.timeline .bar {
		width: 12px;
		background: rgba(3, 105, 161, 1);
		border-radius: 3px 3px 0 0;
	}
`

const breakdownEntries = (b: EmergingScoreBreakdown): [string, number][] => {
	const arr: [string, number][] = [
		['Sargas fit', b.sargasFit],
		['Demand growth', b.demandGrowth],
		['Post quality', b.postQuality],
		['Novelty', b.novelty],
		['Confidence', b.confidence],
	]
	if (b.budgetQuality != null) arr.push(['Budget quality', b.budgetQuality])
	if (b.clientQuality != null) arr.push(['Client quality', b.clientQuality])
	if (b.competition != null) arr.push(['Competition', b.competition])
	return arr
}

const useCandidateVersion = () =>
	useSyncExternalStore(
		subscribeMockState,
		() => getMockState().version,
		() => 0
	)

const EmergingSignalDetails = () => {
	const [openId, setOpenId] = useState<string | null>(null)
	useEffect(() => subscribeEmergingDetail(setOpenId), [])
	useEffect(() => {
		const key = (e: KeyboardEvent) => {
			if (e.key === 'Escape') emitEmergingDetail(null)
		}
		if (openId) {
			window.addEventListener('keydown', key)
			return () => window.removeEventListener('keydown', key)
		}
		return
	}, [openId])

	const version = useCandidateVersion()
	const { filters } = useSalesFilters()
	const { data, isLoading, refetch } = useGetEmergingDetailQuery(openId ?? '', { skip: !openId })
	const { data: allRows } = useGetEmergingListQuery(filters, { skip: !openId })
	const candidate = useMemo(
		() => Array.from(getMockState().candidates.values()).find((c) => c.id === openId) ?? null,
		[openId, version]
	)
	useEffect(() => {
		if (openId) refetch()
	}, [version, openId, refetch])

	if (!openId) return null

	const rowFromList = allRows?.find((r) => r.id === openId)

	const timelineMax = data ? Math.max(1, ...data.timeline.map((t) => t.count)) : 1

	return (
		<>
			<Backdrop onClick={() => emitEmergingDetail(null)} />
			<Panel role='dialog' aria-modal='true' aria-label='Emerging signal details'>
				<div className='hd'>
					<div style={{ minWidth: 0 }}>
						<div className='hd-title'>{data?.name ?? 'Loading…'}</div>
						{data && (
							<div className='hd-sub'>
								<StatusPill $status={data.status}>{data.status}</StatusPill>{' '}
								<span style={{ marginLeft: 6 }}>{data.proposedType}</span>
							</div>
						)}
					</div>
					<button
						className='close'
						onClick={() => emitEmergingDetail(null)}
						aria-label='Close details'
					>
						<CloseOutlined />
					</button>
				</div>
				<div className='body'>
					{isLoading || !data ? (
						<SkeletonBlock height={400} />
					) : (
						<>
							<div>
								<div className='section-title'>Definition</div>
								<div className='p' style={{ marginTop: 6 }}>
									{data.definition}
								</div>
							</div>
							<div>
								<div className='section-title'>
									Why it is considered emerging / separate
								</div>
								<div className='p' style={{ marginTop: 6 }}>
									{data.whyEmerging}
								</div>
							</div>
							<div>
								<div className='section-title'>Mentions timeline (by week)</div>
								<div className='timeline' style={{ marginTop: 6 }} aria-hidden='true'>
									{data.timeline.length === 0 ? (
										<span style={{ color: '#94a3b8', fontSize: 12 }}>Sparse data</span>
									) : (
										data.timeline.map((t) => (
											<div
												key={t.weekLabel}
												className='bar'
												style={{ height: `${(t.count / timelineMax) * 100}%` }}
												title={`${t.weekLabel}: ${t.count} mentions`}
											/>
										))
									)}
								</div>
								<div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 6 }}>
									Current: {data.previousPeriodComparison.currentCount} · Previous:{' '}
									{data.previousPeriodComparison.previousCount} · Growth:{' '}
									{data.previousPeriodComparison.growthPct == null
										? 'n/a'
										: `${data.previousPeriodComparison.growthPct}%`}
									. Sample confidence: {data.sampleConfidence}.
								</div>
							</div>
							<div>
								<div className='section-title'>Score breakdown</div>
								<div className='breakdown' style={{ marginTop: 6 }}>
									{breakdownEntries(data.scoreBreakdown).map(([k, v]) => (
										<div key={k} className='b'>
											<div className='b-key'>{k}</div>
											<div className='b-val'>{Math.round(v)}</div>
										</div>
									))}
								</div>
							</div>
							{data.recurringRequirements.length > 0 && (
								<div>
									<div className='section-title'>Recurring requirements</div>
									<div className='chips' style={{ marginTop: 6 }}>
										{data.recurringRequirements.map((r) => (
											<span className='chip static' key={r}>
												{r}
											</span>
										))}
									</div>
								</div>
							)}
							{data.relatedTechnologies.length > 0 && (
								<div>
									<div className='section-title'>Related technologies</div>
									<div className='chips' style={{ marginTop: 6 }}>
										{data.relatedTechnologies.map((r) => (
											<span className='chip static' key={r}>
												{r}
											</span>
										))}
									</div>
								</div>
							)}
							<div className='row'>
								<span>
									<strong>Top client countries:</strong>{' '}
									{data.clientProfile.topCountries.join(', ') || '—'}
								</span>
								<span>
									<strong>Avg client rating:</strong>{' '}
									{data.clientProfile.averageRating ?? '—'}
								</span>
								<span>
									<strong>Avg budget:</strong>{' '}
									{data.budgetProfile.averageBudget
										? `$${data.budgetProfile.averageBudget.toLocaleString()}`
										: '—'}
								</span>
								<span>
									<strong>Median budget:</strong>{' '}
									{data.budgetProfile.medianBudget
										? `$${data.budgetProfile.medianBudget.toLocaleString()}`
										: '—'}
								</span>
							</div>
							{data.overlapWithTaxonomy.length > 0 && (
								<div>
									<div className='section-title'>
										Possible overlap with existing taxonomy
									</div>
									<div className='chips' style={{ marginTop: 6 }}>
										{data.overlapWithTaxonomy.map((r) => (
											<span className='chip static' key={r}>
												{r}
											</span>
										))}
									</div>
								</div>
							)}
							{data.representativePostIds.length > 0 && (
								<div>
									<div className='section-title'>Representative posts</div>
									<div className='chips' style={{ marginTop: 6 }}>
										{data.representativePostIds.map((id) => (
											<button
												key={id}
												type='button'
												className='chip'
												onClick={() => emitPostDetail(id)}
											>
												{id}
											</button>
										))}
									</div>
								</div>
							)}
							{rowFromList?.newToDataset && (
								<div
									style={{
										fontSize: 12.5,
										color: '#065f46',
										background: '#dcfce7',
										borderRadius: 10,
										padding: '8px 10px',
									}}
								>
									New to <strong>our dataset</strong> – not necessarily a new global market
									trend.
								</div>
							)}
							{candidate && (
								<div>
									<div className='section-title'>Actions</div>
									<div style={{ marginTop: 8 }}>
										<TaxonomyCandidateActions candidate={candidate} />
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</Panel>
		</>
	)
}

export default EmergingSignalDetails
