import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Icon as IconifyIcon } from '@iconify/react'
import styled, { keyframes } from 'styled-components'
import {
	CheckRounded,
	ExpandMoreRounded,
	PauseCircleFilled,
	PlayArrowOutlined,
	PlayCircleFilled,
	RocketLaunchRounded,
} from '@mui/icons-material'

import PermissionGate from '../../auth/PermissionGate'
import ConfirmModal from '../../_shared/ConfirmModal'
import usePermissions from '../../../hooks/usePermissions'
import { useToast } from '../../../context/toast/ToastContext'
import {
	useEnableJobPostAnalysisMutation,
	useGetJobPostAnalysisPreviewQuery,
	useGetJobPostQueueStatsQuery,
} from '../../../store/job-posts/jobPostsApi'
import { T } from '../_shared/tokens'

type EnableStrategy = 'all' | 'recent' | 'new_posts_only' | 'cancel'
type CounterTone = 'default' | 'muted' | 'danger'

const EMERALD = '#15803d'
const EMERALD_SOFT = 'rgba(21, 128, 61, 0.14)'
const AMBER = '#d97706'
const AMBER_SOFT = 'rgba(217, 119, 6, 0.14)'
const ROSE = '#b91c1c'
const INK_MUTED = '#85838d'

/**
 * AI pipeline status + resume control for Job Posts, rendered
 * between the blue hero and the orange hero-tiles inside the
 * Scanner health block on Sales Analytics' Overview tab.
 *
 * Visual: KPI-style — status block on the left, 5 big-number
 * counters with thin dividers, Resume CTA on the right. Mirrors
 * the typography of KpiCell (uppercase eyebrow + large tabular
 * numeral) so the block reads as part of the dashboard.
 */
const AiPipelinePanel = () => {
	const { showToast } = useToast()
	const { hasAll } = usePermissions()
	const canManage = hasAll(['settings_scanner:update'])
	const [enableModalOpen, setEnableModalOpen] = useState(false)
	const location = useLocation()
	const navigate = useNavigate()
	// Settings page redirects here with `?resumeAi=1` when the
	// operator tries to enable the kill-switch directly; the backend
	// contract requires the operator to make a Process/Skip
	// decision via this modal, so we open it immediately and strip
	// the query so a reload doesn't re-open it.
	useEffect(() => {
		if (!canManage) return
		const params = new URLSearchParams(location.search)
		if (params.get('resumeAi') === '1') {
			setEnableModalOpen(true)
			params.delete('resumeAi')
			navigate(
				{ pathname: location.pathname, search: params.toString() },
				{ replace: true },
			)
		}
	}, [canManage, location.pathname, location.search, navigate])
	const [enableJobPostAnalysis, { isLoading: enabling }] =
		useEnableJobPostAnalysisMutation()
	// The parent Overview tab mounts `useAnalyticsStream`, which
	// patches this cache on every tick via `updateQueryData`. We
	// still refetch on focus as a safety net — if the SSE
	// connection has been down and the browser just regained
	// visibility, the hook's fallback polling kicks in too, but
	// `refetchOnFocus` guarantees a fresh read on return.
	const { data: queueStats, isLoading, isError } = useGetJobPostQueueStatsQuery(
		undefined,
		{ refetchOnFocus: true },
	)

	const handleEnableStrategy = useCallback(
		async (strategy: EnableStrategy, recentHours?: number) => {
			try {
				const res = await enableJobPostAnalysis({
					strategy,
					...(strategy === 'recent' && recentHours != null
						? { recent: { hours: recentHours } }
						: {}),
				}).unwrap()
				if (strategy === 'cancel') {
					showToast('No change', 'info')
				} else {
					showToast(
						`AI resumed · enqueued ${res.enqueued}, skipped ${res.skipped}`,
						'success',
					)
				}
				setEnableModalOpen(false)
			} catch {
				showToast('Enable analysis failed', 'error')
			}
		},
		[enableJobPostAnalysis, showToast],
	)

	if (isLoading || !queueStats) {
		return (
			<Panel $tone={isError ? 'danger' : 'muted'} aria-busy={!isError}>
				<StateBlock>
					<StateEyebrow>Status</StateEyebrow>
					<StateChip $tone={isError ? 'danger' : 'muted'}>
						{isError ? 'Status unavailable' : 'Loading…'}
					</StateChip>
				</StateBlock>
			</Panel>
		)
	}

	const active = queueStats.analysisEnabled
	const redisOk = queueStats.redisAvailable !== false
	// Postgres-side durable counters are always shown. Redis-side
	// ones (In queue, Running) show "—" when Redis is unavailable
	// instead of 0, so the operator can tell the two apart.
	// Backlog = every post still waiting for analysis to start. The
	// Pending and In queue tiles below describe PARTS of this same
	// backlog, not independent new work — they must not be summed.
	const counters: Array<{
		label: string
		value: number | null
		tone: CounterTone
		title?: string
	}> = [
		{
			label: 'Backlog',
			value: queueStats.totalNew,
			tone: queueStats.totalNew > 0 ? 'default' : 'muted',
			title: 'All posts still waiting for analysis to start.',
		},
		{
			label: 'Pending',
			value: queueStats.pending,
			tone: queueStats.pending > 0 ? 'default' : 'muted',
			title:
				'Part of the backlog whose place in the queue hasn’t been confirmed yet. ' +
				'Does not add to Backlog — it is a subset of it.',
		},
		{
			label: 'In queue',
			value: redisOk ? queueStats.inQueue : null,
			tone: (queueStats.inQueue ?? 0) > 0 ? 'default' : 'muted',
			title: redisOk
				? 'Part of the backlog that is confirmed to be waiting in the queue (including paused / scheduled retries). Does not add to Backlog — it is a subset of it.'
				: 'Redis unavailable — queue counters cannot be read right now. Backlog and Pending are still accurate.',
		},
		{
			label: 'Running',
			value: redisOk ? queueStats.running : null,
			tone: (queueStats.running ?? 0) > 0 ? 'default' : 'muted',
			title: redisOk
				? 'Posts a worker is analysing right now. These have already left the backlog.'
				: 'Redis unavailable — cannot tell what is running right now.',
		},
		{
			label: 'Failed',
			value: queueStats.failed,
			tone: queueStats.failed > 0 ? 'danger' : 'muted',
			title: 'Posts whose analysis ended with a final error. Retry them from the Job Posts list.',
		},
	]

	return (
		<>
			<Panel $tone={active ? 'active' : 'paused'}>
				<StateBlock>
					<StateEyebrow>Status</StateEyebrow>
					<StateChip $tone={active ? 'active' : 'paused'}>
						{active ? (
							<>
								<StateIconActive aria-hidden='true'>
									<PlayCircleFilled />
								</StateIconActive>
								AI active
							</>
						) : (
							<>
								<StateIconPaused aria-hidden='true'>
									<PauseCircleFilled />
								</StateIconPaused>
								AI paused
							</>
						)}
					</StateChip>
				</StateBlock>

				<CounterGrid>
					{counters.map((c) => {
						const withRedis = c.label === 'In queue'
						return (
							<CounterCell key={c.label} title={c.title}>
								<CounterLabel>{c.label}</CounterLabel>
								<CounterRow>
									{c.value === null ? (
										<CounterUnavailable aria-label='Unavailable (Redis down)'>—</CounterUnavailable>
									) : (
										<CounterNumber value={c.value} tone={c.tone} />
									)}
									{withRedis ? (
										<RedisMark title='Source: Redis' aria-label='Redis'>
											<IconifyIcon icon='logos:redis' width='40' height='40' />
											<RedisCaption>Redis</RedisCaption>
										</RedisMark>
									) : null}
								</CounterRow>
							</CounterCell>
						)
					})}
				</CounterGrid>

				{!active && canManage ? (
					<ResumeBtn type='button' onClick={() => setEnableModalOpen(true)}>
						<ResumePlay aria-hidden='true'>
							<PlayArrowOutlined />
						</ResumePlay>
						Resume AI
					</ResumeBtn>
				) : (
					<ResumeSpacer aria-hidden='true' />
				)}
			</Panel>

			{enableModalOpen ? (
				<PermissionGate permission='settings_scanner:update'>
					<EnableAnalysisModal
						backlog={queueStats.totalNew}
						onClose={() => setEnableModalOpen(false)}
						onConfirm={handleEnableStrategy}
						isLoading={enabling}
					/>
				</PermissionGate>
			) : null}
		</>
	)
}

export default AiPipelinePanel

/* ─── animated counter ──────────────────────────────────────────── */

/**
 * Count-up tween shared with the finance / compensation analytics
 * pages — see `page/analytics/compensation/CompensationAnalytics.page.tsx`
 * (`useCountUp`). Starts at 0 on mount so the first paint "counts
 * up" to the target, then tweens between successive targets with
 * easeOutCubic. Respects prefers-reduced-motion.
 */
function useCountUp(target: number, duration = 900): number {
	const [display, setDisplay] = useState(0)
	const prev = useRef(0)
	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			prev.current = target
			setDisplay(target)
			return
		}
		const from = prev.current
		const to = target
		if (from === to) return
		let raf = 0
		const start = performance.now()
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			const cur = from + (to - from) * eased
			setDisplay(cur)
			if (t < 1) raf = requestAnimationFrame(step)
			else prev.current = to
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [target, duration])
	return display
}

interface CounterNumberProps {
	value: number
	tone: CounterTone
}

const CounterNumber = ({ value, tone }: CounterNumberProps) => {
	const display = useCountUp(value)
	return <CounterValue $tone={tone}>{Math.round(display)}</CounterValue>
}

/* ─── modal ─────────────────────────────────────────────────────── */

interface EnableAnalysisModalProps {
	backlog: number
	isLoading?: boolean
	onClose: () => void
	onConfirm: (strategy: EnableStrategy, recentHours?: number) => void
}

const formatUsd = (n: number): string => {
	if (!Number.isFinite(n)) return '—'
	if (n === 0) return '$0'
	if (n < 0.01) return '< $0.01'
	if (n < 1) return `$${n.toFixed(2)}`
	return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
}

const pluralPosts = (n: number): string =>
	`${n.toLocaleString()} post${n === 1 ? '' : 's'}`

const CountedPosts = ({ value }: { value: number }) => {
	const n = useCountUp(value, 480)
	// Pluralise against the TARGET value, not the in-flight tween —
	// otherwise the trailing "s" flickers as the counter sweeps
	// through 1 on its way to 2+.
	return (
		<>
			{Math.round(n).toLocaleString()} post{value === 1 ? '' : 's'}
		</>
	)
}

const EnableAnalysisModal = ({
	backlog,
	isLoading,
	onClose,
	onConfirm,
}: EnableAnalysisModalProps) => {
	type Strategy = 'all' | 'new_posts_only'
	const [strategy, setStrategy] = useState<Strategy>('all')
	const [howOpen, setHowOpen] = useState(false)

	const previewQuery = useGetJobPostAnalysisPreviewQuery(
		{ strategy },
		{ refetchOnMountOrArgChange: true },
	)

	const preview = previewQuery.data
	const previewFetching = previewQuery.isFetching
	const previewLoading = previewQuery.isLoading
	const previewError = previewQuery.isError
	/* Any data we got back is "fresh enough" to render — RTK Query
	 * cancels superseded subscriptions, so by the time React re-reads
	 * `data` the shape matches the current (strategy, hours). We
	 * intentionally do NOT compare `preview.strategy === strategy`
	 * because that would blink the panel to dashes between an old
	 * cached entry and the new in-flight request. */
	const previewHasData = preview != null && !previewError

	const options: Array<{
		value: Strategy
		title: string
		body: string
	}> = [
		{
			value: 'all',
			title: 'Process accumulated posts',
			body: 'Analyse every post that piled up while AI was paused — including anything that was still waiting in the queue.',
		},
		{
			value: 'new_posts_only',
			title: 'Skip accumulated posts',
			body: 'Mark the whole backlog as Skipped and resume analysis for new incoming posts only.',
		},
	]

	return (
		<ConfirmModal
			icon={<RocketLaunchRounded />}
			iconTone='info'
			title='Resume AI analysis'
			description={
				<>
					Choose which accumulated posts to process. New incoming posts
					will be analysed after resuming.
				</>
			}
			confirmLabel='Resume AI'
			confirmLoadingLabel='Applying…'
			confirmColor='primary'
			cancelLabel='Close'
			onClose={onClose}
			onConfirm={() => onConfirm(strategy)}
			isLoading={isLoading}
			maxWidth={560}
		>
			<BacklogHero>
				<BacklogNumber>
					{(preview?.totalBacklog ?? backlog).toLocaleString()}
				</BacklogNumber>
				<BacklogCaption>
					Post{(preview?.totalBacklog ?? backlog) === 1 ? '' : 's'} awaiting
					analysis
				</BacklogCaption>
			</BacklogHero>

			<Options role='radiogroup'>
				{options.map((opt) => (
					<Option
						key={opt.value}
						type='button'
						role='radio'
						aria-checked={strategy === opt.value}
						$active={strategy === opt.value}
						onClick={() => setStrategy(opt.value)}
					>
						<OptionBody>
							<OptionHead>
								<OptionTitle>{opt.title}</OptionTitle>
								<OptionMark aria-hidden='true' $active={strategy === opt.value}>
									{strategy === opt.value ? (
										<CheckRounded sx={{ fontSize: 14 }} />
									) : null}
								</OptionMark>
							</OptionHead>
							<OptionText>{opt.body}</OptionText>
						</OptionBody>
					</Option>
				))}
			</Options>

			<DarkSummary aria-busy={previewFetching}>
				<DarkSummaryHead>After resuming</DarkSummaryHead>
				<DarkSummaryBody>
					{previewError ? (
						<DarkSummaryError>
							<span>Couldn’t calculate preview.</span>
							<DarkRetryBtn
								type='button'
								onClick={() => previewQuery.refetch()}
							>
								Retry
							</DarkRetryBtn>
						</DarkSummaryError>
					) : previewLoading && !previewHasData ? (
						<DarkSummaryGrid>
							<DarkStat>
								<Skeleton $w={64} />
								<DarkSubLabel>To analyse</DarkSubLabel>
							</DarkStat>
							<DarkSummaryDivider />
							<DarkStat>
								<Skeleton $w={64} />
								<DarkSubLabel>To skip</DarkSubLabel>
							</DarkStat>
							<DarkSummaryDivider />
							<DarkStat>
								<Skeleton $w={100} />
								<DarkSubLabel>Estimated cost</DarkSubLabel>
							</DarkStat>
						</DarkSummaryGrid>
					) : (
						<DarkSummaryGrid>
							<DarkStat>
								<DarkStatValue>
									<CountedPosts value={preview?.toAnalyse ?? 0} />
								</DarkStatValue>
								<DarkSubLabel>To analyse</DarkSubLabel>
							</DarkStat>
							<DarkSummaryDivider />
							<DarkStat>
								<DarkStatValue>
									<CountedPosts value={preview?.toSkip ?? 0} />
								</DarkStatValue>
								<DarkSubLabel>To skip</DarkSubLabel>
							</DarkStat>
							<DarkSummaryDivider />
							<DarkStat>
								<DarkStatCost
									key={
										preview
											? `${preview.costUsd.min}-${preview.costUsd.max}`
											: 'empty'
									}
								>
									<FadeSwap>
										{preview
											? preview.costUsd.min === preview.costUsd.max
												? formatUsd(preview.costUsd.min)
												: `${formatUsd(preview.costUsd.min)} – ${formatUsd(preview.costUsd.max)}`
											: 'Unavailable'}
									</FadeSwap>
								</DarkStatCost>
								<DarkSubLabel>Estimated cost</DarkSubLabel>
							</DarkStat>
						</DarkSummaryGrid>
					)}
				</DarkSummaryBody>
			</DarkSummary>

			<HowEstimated>
				<HowEstimatedCaption>
					Estimated cost for selected posts.{' '}
					<HowEstimatedToggle
						type='button'
						onClick={() => setHowOpen((v) => !v)}
						aria-expanded={howOpen}
					>
						How estimated
						<Chevron $open={howOpen}>
							<ExpandMoreRounded sx={{ fontSize: 14 }} />
						</Chevron>
					</HowEstimatedToggle>
				</HowEstimatedCaption>
				<HowCollapse data-open={howOpen || undefined}>
					<HowCollapseInner>
						<HowBody>
							Range brackets a Haiku-only pass (min) and a full Haiku +
							Sonnet pass for every selected post (max). Based on current
							pricing and conservative average token counts; no production
							usage log yet. Batch is not implemented and no cache savings
							are promised. For <strong>New posts only</strong> the
							backlog is marked Skipped (not deleted) and analysing future
							incoming posts is billed separately.
						</HowBody>
					</HowCollapseInner>
				</HowCollapse>
			</HowEstimated>
		</ConfirmModal>
	)
}

/* ─── styled: panel #2 "Big numerals" ──────────────────────────── */

/*
 * Panel accent — the border itself is a state-coloured gradient
 * that fades into the neutral card border on the opposite side.
 * The 1.5px rim is produced with the mask-composite trick: a
 * padded gradient background clipped by two overlapping masks so
 * only the ring between content-box and border-box survives.
 * No shadow, no corner marks — just a quiet edge treatment that
 * reads as "important but calm" against the pale page.
 */
const Panel = styled.section<{ $tone: 'active' | 'paused' | 'muted' | 'danger' }>`
	position: relative;
	background: ${T.cardBg} padding-box;
	border: 0;
	border-radius: 18px;
	padding: 20px 24px 22px;
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 28px;
	align-items: center;
	isolation: isolate;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		padding: 1.5px;
		border-radius: inherit;
		background: linear-gradient(
			135deg,
			${({ $tone }) => {
				if ($tone === 'active') return EMERALD
				if ($tone === 'paused') return AMBER
				if ($tone === 'danger') return ROSE
				return '#cbcbd5'
			}}
				0%,
			${({ $tone }) => {
				if ($tone === 'active') return 'rgba(21, 128, 61, 0.18)'
				if ($tone === 'paused') return 'rgba(217, 119, 6, 0.18)'
				if ($tone === 'danger') return 'rgba(185, 28, 28, 0.18)'
				return 'rgba(133, 131, 141, 0.18)'
			}}
				40%,
			${T.border} 70%,
			${T.border} 100%
		);
		-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
		mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
	}

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
		gap: 18px;
	}
`

const StateBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 120px;
`

const StateEyebrow = styled.span`
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 1.6px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

/*
 * Pause-chip animation — the pause glyph "ticks" with a subtle
 * wobble so the paused state is actively noticeable without any
 * expanding halo ring. Respects prefers-reduced-motion.
 */
const barTick = keyframes`
	0%, 100% { transform: scale(1) rotate(0deg); }
	20%      { transform: scale(1.1) rotate(-6deg); }
	40%      { transform: scale(1.05) rotate(5deg); }
	60%      { transform: scale(1.08) rotate(-3deg); }
	80%      { transform: scale(1.02) rotate(2deg); }
`
const playNudge = keyframes`
	0%, 100% { transform: translateX(0) scale(1); }
	50%      { transform: translateX(2px) scale(1.08); }
`

const StateChip = styled.span<{ $tone: 'active' | 'paused' | 'muted' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 8px 14px 8px 10px;
	border-radius: 999px;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.2px;
	color: #ffffff;
	background: ${({ $tone }) => {
		if ($tone === 'active') return EMERALD
		if ($tone === 'paused') return AMBER
		if ($tone === 'danger') return ROSE
		return '#9ca3af'
	}};
`

const StateIconPaused = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;

	svg {
		font-size: 26px;
		color: #ffffff;
		animation: ${barTick} 1.6s ease-in-out infinite;
		transform-origin: center;
	}

	@media (prefers-reduced-motion: reduce) {
		svg {
			animation: none;
		}
	}
`

const StateIconActive = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;

	svg {
		font-size: 26px;
		color: #ffffff;
		animation: ${playNudge} 1.6s ease-in-out infinite;
		transform-origin: center;
	}

	@media (prefers-reduced-motion: reduce) {
		svg {
			animation: none;
		}
	}
`

const CounterGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 2px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(5, 1fr);
	}
	@media (max-width: 560px) {
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
	}
`

const CounterCell = styled.div`
	padding: 0 14px;
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;

	& + & {
		border-left: 1px solid ${T.divider};
	}

	@media (max-width: 560px) {
		& + & {
			border-left: 0;
			border-top: 1px solid ${T.divider};
			padding-top: 10px;
		}
	}
`

const CounterLabel = styled.span`
	font-size: 10px;
	font-weight: 800;
	letter-spacing: 1.3px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const CounterValue = styled.span<{ $tone: CounterTone }>`
	display: inline-block;
	/* Reserve width for up to 3 digits so a tween going 0 → 71 does
	 * not widen the cell every frame and shove the Redis mark to
	 * the right. tabular-nums already fixes DIGIT widths; we also
	 * need to pin the OVERALL slot width. */
	min-width: 3ch;
	text-align: left;
	font-size: 38px;
	font-weight: 700;
	letter-spacing: -1.4px;
	line-height: 1;
	font-variant-numeric: tabular-nums;
	font-feature-settings: 'ss01' on, 'ss02' on;
	color: ${({ $tone }) =>
		$tone === 'danger' ? ROSE : $tone === 'muted' ? INK_MUTED : T.textStrong};
`

const CounterUnavailable = styled.span`
	display: inline-block;
	min-width: 3ch;
	text-align: left;
	font-size: 38px;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -1.4px;
	color: ${INK_MUTED};
	opacity: 0.5;
`

/*
 * Resume CTA — the play triangle plays a two-stage bounce on
 * hover: snaps back briefly (loading up the "spring"), then
 * launches forward with a small overshoot. Reads as "press to
 * start". Reduced-motion viewers get a static nudge instead.
 */
const playLaunch = keyframes`
	0%   { transform: translateX(0) scale(1); }
	22%  { transform: translateX(-2px) scale(0.9); }
	55%  { transform: translateX(4px) scale(1.18); }
	80%  { transform: translateX(2px) scale(1.04); }
	100% { transform: translateX(0) scale(1); }
`

const ResumePlay = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: center;
	svg { font-size: 16px; display: block; }
`

const ResumeBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 7px;
	background: ${T.primary};
	color: #fff;
	padding: 11px 18px;
	border-radius: 12px;
	border: 0;
	font-family: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: filter 160ms ease, box-shadow 160ms ease;
	&:hover {
		filter: brightness(0.95);
		box-shadow: 0 2px 6px rgba(3, 105, 161, 0.25);
	}
	&:hover ${ResumePlay} {
		animation: ${playLaunch} 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	&:active ${ResumePlay} {
		animation: none;
		transform: translateX(1px) scale(0.95);
	}
	@media (prefers-reduced-motion: reduce) {
		&:hover ${ResumePlay} {
			animation: none;
			transform: translateX(2px);
		}
	}
`

const ResumeSpacer = styled.div`
	/* Reserve the slot so the counters don't jump between the
	 * active (no button) and paused (button) states. */
	width: 136px;
	@media (max-width: 900px) {
		display: none;
	}
`

/* Row that keeps the counter number and the Redis logo on one
 * baseline for the "In queue" cell. For every other cell the row
 * holds just the number — no extra width. */
const CounterRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 32px;
`

/* Redis logo + "Redis" caption rendered next to the "In queue"
 * NUMBER so the operator sees at a glance that this counter is read
 * from Redis (and the "—" state visually belongs to Redis-unavailable).
 * Purely informational, no interaction. */
const RedisMark = styled.span`
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	svg {
		display: block;
	}
`

const RedisCaption = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 9.5px;
	font-weight: 700;
	letter-spacing: 1.1px;
	text-transform: uppercase;
	color: #dc382d;
	line-height: 1;
`

/* ─── styled: Resume AI modal content (lives inside the shared
 * ConfirmModal, which supplies the surface, animations, header,
 * accent and action buttons). ─────────────────────────────── */

const PRIMARY_BLUE = 'rgb(3, 105, 161)'

const Options = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const Option = styled.button<{ $active: boolean }>`
	appearance: none;
	display: block;
	padding: 12px 16px;
	border-radius: 12px;
	border: 1.5px solid
		${({ $active }) => ($active ? PRIMARY_BLUE : 'rgba(15, 23, 42, 0.08)')};
	background: ${({ $active }) =>
		$active ? 'rgba(3, 105, 161, 0.08)' : 'rgba(15, 23, 42, 0.03)'};
	cursor: pointer;
	text-align: left;
	font-family: inherit;
	transition:
		background 180ms ease,
		border-color 180ms ease,
		transform 180ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		background: ${({ $active }) =>
			$active ? 'rgba(3, 105, 161, 0.1)' : 'rgba(15, 23, 42, 0.05)'};
		border-color: ${({ $active }) =>
			$active ? PRIMARY_BLUE : 'rgba(15, 23, 42, 0.2)'};
	}
	&:active {
		transform: translateY(1px);
	}
	&:focus-visible {
		outline: 2px solid ${PRIMARY_BLUE};
		outline-offset: 2px;
	}
`

const OptionBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`

const OptionHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
`

const OptionTitle = styled.span`
	font-size: 14px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.1px;
`

const OptionMark = styled.span<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border-radius: 50%;
	background: ${({ $active }) => ($active ? PRIMARY_BLUE : 'transparent')};
	color: #ffffff;
	flex-shrink: 0;
	transition: background 180ms ease;

	svg {
		animation: ${keyframes`
			from { transform: scale(0); }
			to   { transform: scale(1); }
		`} 180ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
`

const OptionText = styled.span`
	font-size: 13px;
	line-height: 1.5;
	color: ${T.textSecondary};
	text-transform: none;
	letter-spacing: 0;
`

/* ── Backlog hero: big count + caption ─────────────── */

const BacklogHero = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 10px;
	padding: 4px 0 2px;
`

const BacklogNumber = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 36px;
	font-weight: 800;
	letter-spacing: -0.025em;
	line-height: 1;
	color: ${PRIMARY_BLUE};
	font-variant-numeric: tabular-nums;
`

const BacklogCaption = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textSecondary};
`

/* ── Period picker (under Process recent option) ────── */

/* Grid-row-based collapse animation. The wrapper animates
 * `grid-template-rows` from `0fr` to `1fr`; the inner child uses
 * `min-height: 0 + overflow: hidden` so content clips cleanly
 * during the transition. Avoids the "jump" when a sibling is
 * selected / deselected (the sibling-option switch). */
const PeriodCollapse = styled.div`
	display: grid;
	grid-template-rows: 0fr;
	opacity: 0;
	transition:
		grid-template-rows 300ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 220ms ease,
		margin-top 300ms cubic-bezier(0.22, 1, 0.36, 1);
	margin-top: 0;

	&[data-open] {
		grid-template-rows: 1fr;
		opacity: 1;
		margin-top: 10px;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const PeriodCollapseInner = styled.div`
	min-height: 0;
	overflow: hidden;
`

const PeriodRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding: 10px 12px 10px 12px;
	border-radius: 10px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`

const PeriodLabel = styled.span`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: ${T.textMuted};
`

const PeriodChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const PeriodChip = styled.button<{ $active: boolean }>`
	appearance: none;
	border: 0;
	padding: 5px 12px;
	border-radius: 999px;
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 600;
	background: ${({ $active }) =>
		$active ? PRIMARY_BLUE : 'rgba(15, 23, 42, 0.06)'};
	color: ${({ $active }) => ($active ? '#ffffff' : T.textStrong)};
	cursor: pointer;
	transition: background 180ms ease, color 180ms ease;

	&:hover {
		background: ${({ $active }) =>
			$active ? PRIMARY_BLUE : 'rgba(15, 23, 42, 0.1)'};
	}
`

const fadeInSoft = keyframes`
	from { opacity: 0; transform: translateY(-3px); }
	to   { opacity: 1; transform: translateY(0); }
`

const CustomCollapse = styled.div`
	display: grid;
	grid-template-rows: 0fr;
	opacity: 0;
	transition:
		grid-template-rows 240ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 180ms ease,
		margin-top 240ms cubic-bezier(0.22, 1, 0.36, 1);
	margin-top: 0;

	&[data-open] {
		grid-template-rows: 1fr;
		opacity: 1;
		margin-top: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const CustomCollapseInner = styled.div`
	min-height: 0;
	overflow: hidden;
`

const CustomRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
`

const CustomInput = styled.input`
	width: 72px;
	padding: 5px 10px;
	border: 1px solid rgba(15, 23, 42, 0.14);
	border-radius: 8px;
	font: inherit;
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	text-align: center;
	font-variant-numeric: tabular-nums;

	&:focus {
		outline: 2px solid ${PRIMARY_BLUE};
		outline-offset: 1px;
		border-color: transparent;
	}
`

const CustomSuffix = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
`

/* ── Dark summary: "After resuming" ────────────────── */

const DEEP_NAVY = '#0f172a'

const DarkSummary = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	padding: 14px 20px 16px;
	border-radius: 14px;
	background: linear-gradient(135deg, ${DEEP_NAVY} 0%, #1e293b 100%);
	color: #ffffff;
	transition: opacity 200ms ease;

	&[aria-busy='true'] {
		opacity: 0.75;
	}
`

const DarkSummaryHead = styled.div`
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.6);
`

const DarkSummaryBody = styled.div``

const DarkSummaryGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1px 1fr 1px auto;
	align-items: center;
	gap: 18px;

	@media (max-width: 520px) {
		grid-template-columns: 1fr;
		gap: 10px;
		& > :nth-child(2),
		& > :nth-child(4) {
			display: none;
		}
	}
`

const DarkStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`

const DarkStatValue = styled.span`
	font-size: 24px;
	font-weight: 800;
	letter-spacing: -0.5px;
	line-height: 1;
	color: #ffffff;
	font-variant-numeric: tabular-nums;
`

const DarkStatCost = styled.span`
	font-size: 20px;
	font-weight: 800;
	letter-spacing: -0.3px;
	line-height: 1.1;
	color: #ffffff;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
`

const DarkSubLabel = styled.span`
	font-size: 11.5px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.6);
`

const DarkSummaryDivider = styled.span`
	display: block;
	width: 1px;
	height: 36px;
	background: rgba(255, 255, 255, 0.14);
`

const DarkSummaryError = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	font-size: 13px;
	color: rgba(255, 255, 255, 0.85);
`

const DarkRetryBtn = styled.button`
	appearance: none;
	background: rgba(255, 255, 255, 0.1);
	border: 1px solid rgba(255, 255, 255, 0.18);
	color: #ffffff;
	padding: 4px 12px;
	border-radius: 999px;
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: background 160ms ease;
	&:hover { background: rgba(255, 255, 255, 0.18); }
`

const Skeleton = styled.span<{ $w: number }>`
	display: inline-block;
	width: ${(p) => p.$w}px;
	height: 20px;
	border-radius: 6px;
	background: linear-gradient(
		90deg,
		rgba(255, 255, 255, 0.08) 0%,
		rgba(255, 255, 255, 0.18) 50%,
		rgba(255, 255, 255, 0.08) 100%
	);
	background-size: 200% 100%;
	animation: ${keyframes`
		0%   { background-position: 100% 0; }
		100% { background-position: -100% 0; }
	`} 1.2s linear infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const FadeSwap = styled.span`
	display: inline-block;
	animation: ${fadeInSoft} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* ── How estimated (collapsible explanation) ──────── */

const HowEstimated = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const HowEstimatedCaption = styled.div`
	font-size: 12px;
	color: ${T.textMuted};
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 4px;
`

const HowEstimatedToggle = styled.button`
	appearance: none;
	border: 0;
	background: transparent;
	padding: 0;
	display: inline-flex;
	align-items: center;
	gap: 2px;
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	color: ${PRIMARY_BLUE};
	cursor: pointer;
	&:hover { text-decoration: underline; }
`

const Chevron = styled.span<{ $open: boolean }>`
	display: inline-flex;
	transform: rotate(${(p) => (p.$open ? '180deg' : '0deg')});
	transition: transform 180ms ease;

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const HowCollapse = styled.div`
	display: grid;
	grid-template-rows: 0fr;
	opacity: 0;
	transition:
		grid-template-rows 260ms cubic-bezier(0.22, 1, 0.36, 1),
		opacity 220ms ease,
		margin-top 260ms cubic-bezier(0.22, 1, 0.36, 1);
	margin-top: 0;

	&[data-open] {
		grid-template-rows: 1fr;
		opacity: 1;
		margin-top: 4px;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const HowCollapseInner = styled.div`
	min-height: 0;
	overflow: hidden;
`

const HowBody = styled.p`
	margin: 0;
	font-size: 12px;
	line-height: 1.55;
	color: ${T.textMuted};

	strong {
		font-weight: 700;
		color: ${T.textSecondary};
	}
`
