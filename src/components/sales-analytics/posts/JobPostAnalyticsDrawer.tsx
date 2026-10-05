import { useEffect, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { CloseOutlined, OpenInNewOutlined } from '@mui/icons-material'
import { useGetSalesJobPostByIdQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { subscribePostDetail, emitPostDetail } from './JobPostDrawerBus'
import SkeletonBlock from '../_shared/SkeletonBlock'
import type { ScoreBreakdown } from '../../../store/sales-analytics/types/jobPost'

const CLOSE_DURATION_MS = 260

const fadeIn = keyframes`
	from { opacity: 0; }
	to   { opacity: 1; }
`

const fadeOut = keyframes`
	from { opacity: 1; }
	to   { opacity: 0; }
`

const slideIn = keyframes`
	from { transform: translateX(100%); }
	to   { transform: translateX(0); }
`

const slideOut = keyframes`
	from { transform: translateX(0); }
	to   { transform: translateX(100%); }
`

const Backdrop = styled('div')<{ $closing: boolean }>`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.4);
	z-index: 1100;
	animation: ${({ $closing }) => ($closing ? fadeOut : fadeIn)}
		${CLOSE_DURATION_MS}ms ease-out both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		opacity: ${({ $closing }) => ($closing ? 0 : 1)};
	}
`

const Panel = styled('aside')<{ $closing: boolean }>`
	position: fixed;
	top: 0;
	right: 0;
	height: 100vh;
	width: min(720px, 100%);
	background: #ffffff;
	z-index: 1101;
	display: flex;
	flex-direction: column;
	box-shadow: -10px 0 30px -12px rgba(15, 23, 42, 0.25);
	overflow: hidden;
	animation: ${({ $closing }) => ($closing ? slideOut : slideIn)}
		${CLOSE_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1) both;
	will-change: transform;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transform: ${({ $closing }) => ($closing ? 'translateX(100%)' : 'translateX(0)')};
	}

	.dp-head {
		position: relative;
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
		padding: 20px 22px 18px;
		border-bottom: 1px solid #eef1f6;
		background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
	}
	.dp-head::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: linear-gradient(
			90deg,
			#3b82f6 0%,
			#6366f1 45%,
			#8b5cf6 100%
		);
	}
	.dp-title {
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
		line-height: 1.35;
		letter-spacing: -0.2px;
	}
	.dp-meta {
		font-size: 12px;
		color: #94a3b8;
		margin-top: 4px;
	}
	.dp-close {
		background: transparent;
		border: none;
		color: #64748b;
		border-radius: 8px;
		width: 32px;
		height: 32px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	.dp-close:hover {
		background: #f1f5f9;
		color: #0f172a;
	}
	.dp-close:focus-visible {
		outline: 2px solid rgba(3, 105, 161, 1);
	}

	.dp-body {
		padding: 18px 22px 28px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 20px;
		background: linear-gradient(180deg, #fbfcfe 0%, #ffffff 120px);
	}
	.dp-section {
		animation: ${fadeIn} 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.dp-section:nth-child(1) { animation-delay: 40ms; }
	.dp-section:nth-child(2) { animation-delay: 90ms; }
	.dp-section:nth-child(3) { animation-delay: 140ms; }
	.dp-section:nth-child(4) { animation-delay: 190ms; }
	.dp-section:nth-child(5) { animation-delay: 240ms; }
	.dp-section:nth-child(6) { animation-delay: 290ms; }
	.dp-section:nth-child(7) { animation-delay: 340ms; }
	.dp-section:nth-child(8) { animation-delay: 390ms; }

	.dp-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px 14px;
		font-size: 12.5px;
		color: #64748b;
	}
	.dp-row strong {
		color: #1f2937;
		font-weight: 700;
	}

	.dp-score-wrap {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px 18px;
		background: linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%);
		border: 1px solid #e2e8f0;
		border-radius: 14px;
	}
	.dp-score-wrap.tone-high {
		background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
		border-color: #bbf7d0;
	}
	.dp-score-wrap.tone-mid {
		background: linear-gradient(135deg, #eff6ff 0%, #eef2ff 100%);
		border-color: #dbeafe;
	}
	.dp-score-wrap.tone-low {
		background: linear-gradient(135deg, #fff7ed 0%, #fef2f2 100%);
		border-color: #fed7aa;
	}
	.dp-score-badge {
		flex-shrink: 0;
		width: 56px;
		height: 56px;
		border-radius: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 22px;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.5px;
		box-shadow: 0 10px 20px -10px currentColor;
	}
	.dp-score-body {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		flex: 1 1 auto;
	}
	.dp-score-body > span {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dp-score-title {
		font-size: 11px;
		font-weight: 800;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}
	.dp-score-actions {
		flex-shrink: 0;
	}

	.dp-section-title {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 11.5px;
		font-weight: 800;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}
	.dp-section-title::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
	}

	.dp-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.dp-chip {
		padding: 4px 12px;
		border-radius: 999px;
		background: rgba(3, 105, 161, 0.08);
		color: rgba(3, 105, 161, 1);
		font-size: 12px;
		font-weight: 600;
		border: 1px solid rgba(3, 105, 161, 0.14);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}
	.dp-chip:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 10px -4px rgba(3, 105, 161, 0.25);
	}
	.dp-chip.dir {
		background: rgba(124, 58, 237, 0.08);
		color: #7c3aed;
		border-color: rgba(124, 58, 237, 0.18);
	}
	.dp-chip.dir:hover {
		box-shadow: 0 4px 10px -4px rgba(124, 58, 237, 0.3);
	}
	.dp-chip.unknown {
		background: #fef3c7;
		color: #92400e;
		border-color: #fde68a;
	}
	.dp-chip.unknown:hover {
		box-shadow: 0 4px 10px -4px rgba(217, 119, 6, 0.3);
	}

	.dp-desc {
		font-size: 13.5px;
		color: #1f2937;
		line-height: 1.65;
		white-space: pre-wrap;
		padding: 14px 16px;
		background: #f8fafc;
		border: 1px solid #eef1f6;
		border-radius: 10px;
	}

	.dp-reasons {
		margin: 8px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 13px;
		color: #1f2937;
	}
	.dp-reasons li {
		position: relative;
		padding: 8px 12px 8px 30px;
		background: #f8fafc;
		border-left: 3px solid #6366f1;
		border-radius: 6px;
		line-height: 1.5;
	}
	.dp-reasons li::before {
		content: '';
		position: absolute;
		left: 12px;
		top: 14px;
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
	}

	.dp-subscores {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 10px;
	}
	.dp-subscore {
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: #ffffff;
		padding: 12px 14px;
		border: 1px solid #eef1f6;
		border-radius: 10px;
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}
	.dp-subscore:hover {
		border-color: #dbeafe;
		box-shadow: 0 4px 12px -6px rgba(15, 23, 42, 0.08);
	}
	.dp-subscore-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.dp-subscore-key {
		font-size: 12px;
		font-weight: 600;
		color: #64748b;
	}
	.dp-subscore-val {
		font-size: 14px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.2px;
	}
	.dp-subscore-bar {
		height: 6px;
		border-radius: 999px;
		background: rgba(15, 23, 42, 0.06);
		overflow: hidden;
	}
	.dp-subscore-bar > span {
		display: block;
		height: 100%;
		border-radius: 999px;
		transition: width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.dp-details {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 10px;
		padding: 8px 12px;
	}
	.dp-details summary {
		cursor: pointer;
		font-size: 12px;
		font-weight: 700;
		color: #475569;
		list-style: none;
	}
	.dp-details summary::-webkit-details-marker {
		display: none;
	}
	.dp-details pre {
		font-size: 11.5px;
		background: #ffffff;
		padding: 10px;
		border-radius: 8px;
		margin: 10px 0 0;
		max-height: 220px;
		overflow: auto;
	}

	.dp-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: rgba(3, 105, 161, 1);
		font-size: 12.5px;
		font-weight: 600;
		text-decoration: none;
	}
	.dp-link:hover {
		text-decoration: underline;
	}
`

const scoreEntries = (b: ScoreBreakdown): [string, number][] => {
	const entries: [string, number][] = []
	if (b.technicalFit != null) entries.push(['Technical fit', b.technicalFit])
	if (b.serviceFit != null) entries.push(['Service fit', b.serviceFit])
	if (b.budgetFit != null) entries.push(['Budget fit', b.budgetFit])
	if (b.clientQuality != null) entries.push(['Client quality', b.clientQuality])
	if (b.clarity != null) entries.push(['Clarity', b.clarity])
	if (b.risk != null) entries.push(['Risk', b.risk])
	return entries
}

const scoreTone = (score: number): 'high' | 'mid' | 'low' => {
	if (score >= 90) return 'high'
	if (score >= 50) return 'mid'
	return 'low'
}

const scoreColor = (score: number): string => {
	if (score >= 90) return '#10b981'
	if (score >= 75) return '#0369a1'
	if (score >= 50) return '#0284c7'
	if (score >= 25) return '#f59e0b'
	return '#ef4444'
}

const formatDateTime = (iso: string | undefined | null): string =>
	iso ? new Date(iso).toLocaleString() : '—'

const JobPostAnalyticsDrawer = () => {
	const [openId, setOpenId] = useState<string | null>(null)
	const [closing, setClosing] = useState(false)
	const closeTimerRef = useRef<number | null>(null)

	useEffect(() => {
		return subscribePostDetail((id) => {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
			if (id) {
				setClosing(false)
				setOpenId(id)
			} else {
				setClosing(true)
				closeTimerRef.current = window.setTimeout(() => {
					setOpenId(null)
					setClosing(false)
				}, CLOSE_DURATION_MS)
			}
		})
	}, [])

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
		}
	}, [])

	useEffect(() => {
		const key = (e: KeyboardEvent) => {
			if (e.key === 'Escape') emitPostDetail(null)
		}
		if (openId && !closing) {
			window.addEventListener('keydown', key)
			return () => window.removeEventListener('keydown', key)
		}
		return
	}, [openId, closing])

	useEffect(() => {
		if (!openId) return
		const prevOverflow = document.body.style.overflow
		const prevPaddingRight = document.body.style.paddingRight
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
		document.body.style.overflow = 'hidden'
		if (scrollbarWidth > 0) {
			document.body.style.paddingRight = `${scrollbarWidth}px`
		}
		return () => {
			document.body.style.overflow = prevOverflow
			document.body.style.paddingRight = prevPaddingRight
		}
	}, [openId])

	const { data, isLoading } = useGetSalesJobPostByIdQuery(openId ?? '', { skip: !openId })

	if (!openId) return null

	return (
		<>
			<Backdrop $closing={closing} onClick={() => emitPostDetail(null)} />
			<Panel
				$closing={closing}
				role='dialog'
				aria-modal='true'
				aria-label='Job post details'
			>
				<div className='dp-head'>
					<div style={{ minWidth: 0 }}>
						<div className='dp-title'>{data?.title ?? 'Loading…'}</div>
						{data?.originalUrl && (
							<a
								className='dp-link'
								href={data.originalUrl}
								target='_blank'
								rel='noreferrer'
							>
								Open original <OpenInNewOutlined style={{ fontSize: 13 }} />
							</a>
						)}
					</div>
					<button
						type='button'
						className='dp-close'
						onClick={() => emitPostDetail(null)}
						aria-label='Close details'
					>
						<CloseOutlined />
					</button>
				</div>

				<div className='dp-body'>
					{isLoading || !data ? (
						<SkeletonBlock height={360} />
					) : (
						<>
							<div className={`dp-section dp-score-wrap tone-${scoreTone(data.score)}`}>
								<div
									className='dp-score-badge'
									style={{ background: scoreColor(data.score) }}
								>
									{data.score}
								</div>
								<div className='dp-score-body'>
									<span className='dp-score-title'>Score · 0–100</span>
									<span style={{ fontSize: 12, color: '#64748b' }}>
										{data.scoringVersion} · {data.modelVersion}
									</span>
								</div>
							</div>

							{data.scoreReasons.length > 0 && (
								<div className='dp-section'>
									<div className='dp-section-title'>Score reasons</div>
									<ul className='dp-reasons'>
										{data.scoreReasons.map((r, i) => (
											<li key={i}>{r}</li>
										))}
									</ul>
								</div>
							)}

							{scoreEntries(data.scoreBreakdown).length > 0 && (
								<div className='dp-section'>
									<div className='dp-section-title'>Score breakdown</div>
									<div className='dp-subscores' style={{ marginTop: 10 }}>
										{scoreEntries(data.scoreBreakdown).map(([k, v]) => (
											<div key={k} className='dp-subscore'>
												<div className='dp-subscore-top'>
													<span className='dp-subscore-key'>{k}</span>
													<span className='dp-subscore-val'>{v}</span>
												</div>
												<div className='dp-subscore-bar'>
													<span
														style={{
															width: `${Math.max(0, Math.min(100, v))}%`,
															background: scoreColor(v),
														}}
													/>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className='dp-section'>
								<div className='dp-section-title'>Directions &amp; technologies</div>
								<div className='dp-chips' style={{ marginTop: 10 }}>
									{data.directions.map((d) => (
										<span key={d} className='dp-chip dir'>
											{d}
										</span>
									))}
									{data.technologies.map((t) => (
										<span key={t} className='dp-chip'>
											{t}
										</span>
									))}
									{(data.unknownTerms ?? []).map((u) => (
										<span key={u} className='dp-chip unknown'>
											{u} · candidate
										</span>
									))}
								</div>
							</div>

							<div className='dp-section'>
								<div className='dp-section-title'>Budget &amp; contract</div>
								<div className='dp-row' style={{ marginTop: 8 }}>
									<span>
										<strong>Contract:</strong> {data.contractType}
									</span>
									{data.fixedBudget != null && (
										<span>
											<strong>Fixed:</strong> ${data.fixedBudget.toLocaleString()}
										</span>
									)}
									{data.hourlyRateMin != null && data.hourlyRateMax != null && (
										<span>
											<strong>Hourly:</strong> ${data.hourlyRateMin}–{data.hourlyRateMax}
											/h
										</span>
									)}
									{data.duration && (
										<span>
											<strong>Duration:</strong> {data.duration}
										</span>
									)}
									{data.workload && (
										<span>
											<strong>Workload:</strong> {data.workload}
										</span>
									)}
								</div>
							</div>

							<div className='dp-section'>
								<div className='dp-section-title'>Client</div>
								<div className='dp-row' style={{ marginTop: 8 }}>
									<span>
										<strong>Country:</strong> {data.clientCountry}
									</span>
									<span>
										<strong>Payment verified:</strong>{' '}
										{data.clientPaymentVerified ? 'Yes' : 'No'}
									</span>
									{data.clientTotalSpent != null && (
										<span>
											<strong>Total spent:</strong> $
											{data.clientTotalSpent.toLocaleString()}
										</span>
									)}
									{data.clientHireRate != null && (
										<span>
											<strong>Hire rate:</strong> {data.clientHireRate}%
										</span>
									)}
									{data.clientRating != null && (
										<span>
											<strong>Rating:</strong> {data.clientRating}
										</span>
									)}
									{data.clientJobsPosted != null && (
										<span>
											<strong>Jobs posted:</strong> {data.clientJobsPosted}
										</span>
									)}
									{data.clientProposalCountAtScan != null && (
										<span>
											<strong>Proposals at scan:</strong>{' '}
											{data.clientProposalCountAtScan}
										</span>
									)}
								</div>
							</div>

							<div className='dp-section'>
								<div className='dp-section-title'>Timestamps &amp; notification</div>
								<div className='dp-row' style={{ marginTop: 8 }}>
									<span>
										<strong>Received:</strong> {formatDateTime(data.receivedAt)}
									</span>
									<span>
										<strong>Analyzed:</strong> {formatDateTime(data.analyzedAt)}
									</span>
									{data.notifiedAt && (
										<span>
											<strong>Notified:</strong> {formatDateTime(data.notifiedAt)}
										</span>
									)}
								</div>
							</div>

							<div className='dp-section'>
								<div className='dp-section-title'>Description</div>
								<div className='dp-desc' style={{ marginTop: 8 }}>
									{data.description}
								</div>
							</div>

							{data.rawPayload && (
								<details className='dp-section dp-details'>
									<summary>Raw analyzer output</summary>
									<pre>{JSON.stringify(data.rawPayload, null, 2)}</pre>
								</details>
							)}
						</>
					)}
				</div>
			</Panel>
		</>
	)
}

export default JobPostAnalyticsDrawer
