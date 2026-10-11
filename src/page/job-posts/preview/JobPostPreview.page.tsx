import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	AutoAwesomeOutlined,
	CheckCircleOutlined,
	AccessTimeRounded,
	BoltRounded,
	CalendarMonthRounded,
	DiamondRounded,
	ExpandMoreRounded,
	NotesOutlined,
	OpenInNewRounded,
	PaidOutlined,
	PlaceOutlined,
	SellOutlined,
	SettingsRounded,
	StarRounded,
	TrendingUpOutlined,
	TrendingUpRounded,
	VerifiedRounded,
	VisibilityOutlined,
	WarningAmberOutlined,
	WorkOutlineOutlined,
	WorkspacePremiumRounded,
} from '@mui/icons-material'
import { Icon as IconifyIcon } from '@iconify/react'
import { Tooltip } from '@mui/material'
import Loading from '../../../ui/state/Loading'
import ErrorState from '../../../ui/state/ErrorState'
import JobPostToProposalModal from '../../../components/job-posts/JobPostToProposalModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
	useBulkAnalyzeJobPostsMutation,
	useGetJobPostByIdQuery,
	useLazyGetJobPostNeighborQuery,
	useMarkJobPostViewedMutation,
} from '../../../store/job-posts/jobPostsApi'
import { formatDate, formatDateTimeSec } from '../../../utils/formatDate'
import { countryDisplayName } from '../../../utils/location'
import type {
	JobPostDecision,
	JobPostItem,
	JobPostPriority,
	JobPostSortBy,
	JobPostSortDirection,
	JobPostStatus,
} from '../../../store/job-posts/types/definition'
import { useToast } from '../../../context/toast/ToastContext'
import { JOB_POST_FIXTURES } from '../../../dev/jobPostFixtures'

/* ── Tokens ─────────────────────────────────────────────────────── */

const INK = '#0f172a'
const INK_80 = 'rgba(15, 23, 42, 0.82)'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const INK_06 = 'rgba(15, 23, 42, 0.06)'
const INK_04 = 'rgba(15, 23, 42, 0.04)'

const ACCENT = '#e85d2f'
const ACCENT_SOFT = 'rgba(232, 93, 47, 0.12)'
const SURFACE = '#ffffff'
const SURFACE_SOFT = '#fafafb'

const EMERALD = '#15803d'
const EMERALD_SOFT = 'rgba(21, 128, 61, 0.12)'
const AMBER = '#a26608'
const AMBER_SOFT = 'rgba(245, 158, 11, 0.14)'
const DANGER = '#b91c1c'
const DANGER_SOFT = 'rgba(239, 68, 68, 0.12)'
const SLATE = '#475569'
const SLATE_SOFT = 'rgba(148, 163, 184, 0.22)'

const PRIMARY = 'rgb(3, 105, 161)'
const PRIMARY_TINT = '#f0f9ff'
const PRIMARY_TINT_STRONG = '#e0f2fe'

/* ── Pre-redesign status/priority/decision palettes (restored
 * verbatim for the top information block). */
const statusPalette: Record<JobPostStatus, { bg: string; fg: string; border: string }> = {
	NEW: { bg: PRIMARY_TINT_STRONG, fg: PRIMARY, border: 'rgba(3, 105, 161, 0.32)' },
	PROCESSING: { bg: AMBER_SOFT, fg: AMBER, border: 'rgba(245, 158, 11, 0.32)' },
	PROCESSED: { bg: EMERALD_SOFT, fg: EMERALD, border: 'rgba(34, 197, 94, 0.32)' },
	FAILED: { bg: DANGER_SOFT, fg: DANGER, border: 'rgba(239, 68, 68, 0.32)' },
	SKIPPED: { bg: SLATE_SOFT, fg: SLATE, border: 'rgba(148, 163, 184, 0.38)' },
}

const decisionPalette: Record<JobPostDecision, { bg: string; fg: string; border: string }> = {
	approve: { bg: EMERALD_SOFT, fg: EMERALD, border: 'rgba(34, 197, 94, 0.32)' },
	maybe: { bg: AMBER_SOFT, fg: AMBER, border: 'rgba(245, 158, 11, 0.32)' },
	decline: { bg: DANGER_SOFT, fg: DANGER, border: 'rgba(239, 68, 68, 0.32)' },
}

const priorityPalette: Record<JobPostPriority, { bg: string; fg: string; border: string }> = {
	high: { bg: DANGER_SOFT, fg: DANGER, border: 'rgba(239, 68, 68, 0.32)' },
	medium: { bg: AMBER_SOFT, fg: AMBER, border: 'rgba(245, 158, 11, 0.32)' },
	low: { bg: PRIMARY_TINT_STRONG, fg: PRIMARY, border: 'rgba(3, 105, 161, 0.32)' },
}

function statusBannerTitle(s: JobPostStatus): string {
	switch (s) {
		case 'NEW':
			return 'Waiting for AI'
		case 'PROCESSING':
			return 'Analysis in progress'
		case 'FAILED':
			return 'Analysis failed'
		case 'SKIPPED':
			return 'Analysis skipped'
		default:
			return ''
	}
}

function statusBannerBody(s: JobPostStatus): string {
	switch (s) {
		case 'NEW':
			return 'This post is in the backlog. AI will pick it up on the next worker tick, or when you resume AI from the Sales Analytics panel.'
		case 'PROCESSING':
			return 'A worker is currently analysing this post. The result will appear once the pipeline completes.'
		case 'FAILED':
			return 'The AI pipeline could not finish. Retry re-queues the post; if AI is paused it waits until you resume it.'
		case 'SKIPPED':
			return 'This post was skipped when AI was last resumed. It will not be analysed unless you include it in a future backlog strategy.'
		default:
			return ''
	}
}

function statusBannerTag(s: JobPostStatus): string {
	switch (s) {
		case 'NEW':
			return 'QUEUED'
		case 'PROCESSING':
			return 'RUNNING'
		case 'FAILED':
			return 'ERROR'
		case 'SKIPPED':
			return 'SKIPPED'
		default:
			return ''
	}
}

/* ── Static maps ────────────────────────────────────────────────── */

const statusLabel: Record<JobPostStatus, string> = {
	NEW: 'New',
	PROCESSING: 'Processing',
	PROCESSED: 'Processed',
	FAILED: 'Failed',
	SKIPPED: 'Skipped',
}

const decisionLabel: Record<JobPostDecision, string> = {
	approve: 'Approve',
	maybe: 'Maybe',
	decline: 'Decline',
}

const decisionAccent: Record<JobPostDecision, { fg: string; soft: string }> = {
	approve: { fg: EMERALD, soft: EMERALD_SOFT },
	maybe: { fg: AMBER, soft: AMBER_SOFT },
	decline: { fg: DANGER, soft: DANGER_SOFT },
}

const priorityLabel: Record<JobPostPriority, string> = {
	high: 'High priority',
	medium: 'Medium priority',
	low: 'Low priority',
}

/* Hardcoded AI output so Description / AI analysis styles can be
 * worked on independently of the real pipeline. Replace with live
 * `post.aiResponse` once styling is finalised. */
const HARDCODED_AI = {
	short_summary: `**Strong fit — recommend applying.** The client profile is clean (**Top Rated Plus · 92**, 4.92 rating across 48 reviews) and the asked-for stack lines up head-on with our Stripe + queue specialisation.

### Why it matches

- Stripe + ERP integration is one of our highest-performing niches.
- EU client, payment verified, 54 past hires at **4.92★** — low delivery risk.
- Sane engagement shape: **25–30 hrs/week**, 3-month minimum, long-term intent.

### Watch-outs

- The *"SAP B1 nice-to-have"* wording could expand into a hard requirement mid-engagement. Pin scope in the proposal.
- Legacy ERP integrations are harder to estimate — buffer the first sprint.

### Positioning

Lead with a concrete **Stripe webhook replay** quick-win inside sprint 1, and defer SAP B1 to a separately scoped follow-up SOW.`,
	hard_stop: false,
	hard_stop_reason: '',
	subscores: {
		scope_clarity: 85,
		tech_fit: 92,
		client_quality: 90,
		budget_fit: 70,
	},
	reasons: [
		'Stripe + ERP integration work matches our top-performing specialisation.',
		'EU client with payment verified and 54 past hires at 4.92★ — low delivery risk.',
		'Long-term engagement with a sane weekly cap (25–30 hrs/week).',
	],
	red_flags: [
		'“SAP B1 nice-to-have” wording may expand into a required scope mid-engagement.',
	],
}

const scoreTone = (score: number): { fg: string; soft: string } => {
	if (score >= 80) return { fg: EMERALD, soft: EMERALD_SOFT }
	if (score >= 50) return { fg: AMBER, soft: AMBER_SOFT }
	return { fg: DANGER, soft: DANGER_SOFT }
}

/* ── Component helpers (pure, no hooks) ─────────────────────────── */

const PAGE_SIZE_FOR_NAV = 20 // kept for parity with earlier code paths
void PAGE_SIZE_FOR_NAV
const NAV_STACK_SESSION_KEY = 'job-posts-nav-stack-v1'

/* Session-scoped Prev-history for the detail page — unchanged
 * behaviour. Lets Prev return to a post the user just opened via
 * Next even when that post is now hidden by a filter change. */
function navStackRead(sig: string): string[] {
	try {
		const raw = sessionStorage.getItem(`${NAV_STACK_SESSION_KEY}:${sig}`)
		if (!raw) return []
		const parsed = JSON.parse(raw)
		return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
	} catch {
		return []
	}
}
function navStackWrite(sig: string, stack: string[]): void {
	try {
		sessionStorage.setItem(
			`${NAV_STACK_SESSION_KEY}:${sig}`,
			JSON.stringify(stack.slice(-50)),
		)
	} catch {
		/* quota or private window — Prev falls back to backend keyset */
	}
}
function navStackPush(sig: string, id: string): void {
	const s = navStackRead(sig)
	if (s[s.length - 1] === id) return
	s.push(id)
	navStackWrite(sig, s)
}
function navStackPop(sig: string): string | undefined {
	const s = navStackRead(sig)
	const id = s.pop()
	navStackWrite(sig, s)
	return id
}
function navStackPeek(sig: string): string | undefined {
	const s = navStackRead(sig)
	return s[s.length - 1]
}
function navStackSignature(sp: URLSearchParams): string {
	const keys = [
		'q',
		'decision',
		'priority',
		'status',
		'minScore',
		'maxScore',
		'from',
		'to',
		'viewed',
		'sortBy',
		'sortDir',
	]
	return keys.map((k) => `${k}=${sp.get(k) ?? ''}`).join('|')
}

/* Convert a 2-letter country code to a regional-indicator flag
 * emoji. Returns an empty string if the input isn't a plausible
 * ISO-2 code; callers should still render the country name next
 * to it as the authoritative identifier. */
function flagEmoji(country: string | null | undefined): string {
	if (!country || country.length !== 2) return ''
	const code = country.toUpperCase()
	if (!/^[A-Z]{2}$/.test(code)) return ''
	return String.fromCodePoint(
		0x1f1e6 + code.charCodeAt(0) - 65,
		0x1f1e6 + code.charCodeAt(1) - 65,
	)
}

/* Build a budget string for the sidebar from the normalised Phase A
 * fields when available, with a graceful fall-back to the legacy
 * flat `budget` display string that older ingests still carry. */
function formatBudgetDetail(post: JobPostItem): string | null {
	const { budgetType, budgetMin, budgetMax, budgetCurrency, budget } = post
	const cur = budgetCurrency || 'USD'
	const sym = cur === 'USD' ? '$' : `${cur} `
	const type = (budgetType ?? '').toLowerCase()
	const suffix = type === 'hourly' ? '/hr' : ''
	if (budgetMin != null && budgetMax != null && budgetMin !== budgetMax) {
		return `${sym}${budgetMin}–${sym}${budgetMax}${suffix}`
	}
	const single = budgetMin ?? budgetMax
	if (single != null) return `${sym}${single}${suffix}`
	return budget || null
}

/* Hire rate is a 0–1 fraction coming from VibeWorker's client
 * profile — never heuristic-multiply, always ×100 for display.
 * Verified in-session against the local DB (89/89 rows ≤ 1). */
function formatHireRate(fraction: number | null | undefined): string {
	if (fraction == null) return '—'
	return `${Math.round(fraction * 100)}%`
}

/* Pretty-print a vibe-worker subscore key — `scope_clarity` →
 * "Scope clarity". Keeps underscores out of the UI. */
function prettyKey(k: string): string {
	const s = k.replace(/_/g, ' ').trim()
	return s.charAt(0).toUpperCase() + s.slice(1)
}

/* Split a budget string like `$40–$60/hr` into the headline amount
 * and its unit suffix, so the sidebar can render the amount large
 * and the `/hr` quieter. Fixed-price strings have no suffix. */
function splitBudgetDisplay(
	formatted: string | null,
): { main: string; suffix: string | null } {
	if (!formatted) return { main: '—', suffix: null }
	const m = formatted.match(/^(.*?)(\s*\/\s*hr)\s*$/i)
	if (!m) return { main: formatted, suffix: null }
	return { main: m[1].trim(), suffix: m[2].replace(/\s+/g, '') }
}

/* Map the raw contract-type / budget-type field to a human
 * Hourly / Fixed-price label — only when the source field says so
 * explicitly. Returns null for anything else so we don't invent a
 * label from a `null` or unexpected value. */
function contractModeLabel(
	contractType?: string | null,
	budgetType?: string | null,
): string | null {
	const src = (contractType || budgetType || '').toLowerCase()
	if (src.includes('hourly')) return 'Hourly'
	if (src.includes('fixed')) return 'Fixed-price'
	return null
}

/* Split a free-form "amount + unit" string such as `3-6 months`
 * or `25-30 hrs/week` into its numeric head and textual unit,
 * so the sidebar can render the head large and the unit smaller.
 * Falls back to {amount: full, unit: null} when the shape is not
 * recognised (e.g. "More than 6 months"). */
/* Shared count-up tween: starts from the previously-rendered value
 * and tweens toward the latest `target` on each change via
 * easeOutCubic over `duration` ms. First mount tweens from 0. Honors
 * prefers-reduced-motion. */
function useCountUp(target: number, duration = 650): number {
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

/* Integer count-up with locale formatting (e.g. "1,234"). */
const CountInt = ({ value }: { value: number }) => {
	const n = useCountUp(value)
	return <>{Math.round(n).toLocaleString()}</>
}

/* Fixed-decimal count-up (e.g. 4.92). */
const CountFloat = ({ value, decimals = 2 }: { value: number; decimals?: number }) => {
	const n = useCountUp(value)
	return <>{n.toFixed(decimals)}</>
}

/* Range count-up for strings shaped like "3-6", "$40–$60", "25–30".
 * Tweens both numbers independently, keeps the currency prefix and
 * dash intact. Falls back to the raw text if the shape is not a
 * clean numeric range (e.g. "More than 6 months"). */
const CountRange = ({ text }: { text: string }) => {
	const m = text.trim().match(/^(\$|)(\d+(?:\.\d+)?)\s*[-–—]\s*(\$|)(\d+(?:\.\d+)?)$/)
	const nums = m ? [Number(m[2]), Number(m[4])] : [0, 0]
	const a = useCountUp(nums[0])
	const b = useCountUp(nums[1])
	if (!m) return <>{text}</>
	const [, p1, , p2] = m
	return (
		<>
			{p1}
			{Math.round(a).toLocaleString()}–{p2}
			{Math.round(b).toLocaleString()}
		</>
	)
}

function splitAmountUnit(
	s: string | null | undefined,
): { amount: string; unit: string | null } {
	if (!s) return { amount: '—', unit: null }
	const trimmed = s.trim()
	const m = trimmed.match(/^([0-9][0-9\s–\-+]*)\s+(.+)$/)
	if (!m) return { amount: trimmed, unit: null }
	return { amount: m[1].trim(), unit: m[2].trim() }
}

/* Split a money amount into currency sign + body so the sign can
 * be rendered a notch smaller than the number itself. */
function splitMoney(
	amount: number | null | undefined,
	symbol = '$',
): { sign: string; num: string } | null {
	if (amount == null) return null
	return { sign: symbol, num: amount.toLocaleString() }
}

/* Split a percentage like "82%" into "82" + "%" so the % sign can
 * sit a notch smaller than the figure. */
function splitPercent(
	fraction: number | null | undefined,
): { num: string; sign: string } | null {
	if (fraction == null) return null
	return { num: String(Math.round(fraction * 100)), sign: '%' }
}

/* Split an ISO datetime into display time + short date so the
 * Processing timeline can render time prominently and date in a
 * quieter secondary row. Returns null on empty / unparseable. */
function splitDateTimeParts(
	iso: string | null | undefined,
	withSeconds = false,
): { time: string; date: string } | null {
	if (!iso) return null
	const d = new Date(iso)
	if (!Number.isFinite(d.getTime())) return null
	const time = d.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
		...(withSeconds ? { second: '2-digit' } : {}),
	})
	const date = d.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
	})
	return { time, date }
}

/* Pick the Upwork-aligned icon + colour for a client rank label.
 * Approximates the Upwork badge visuals with MUI icons:
 *   • Top Rated Plus → filled diamond, pink / magenta
 *   • Top Rated      → hexagonal check (Verified), brand blue
 *   • Rising Talent  → trending-up arrow, emerald
 *   • unknown label  → generic medal, muted ink
 */
type RankIcon = typeof DiamondRounded
function clientRankVisual(label: string | null | undefined): {
	Icon: RankIcon
	color: string
} {
	const l = (label || '').toLowerCase()
	if (l.includes('plus')) return { Icon: DiamondRounded, color: '#db2777' }
	if (l.includes('top rated')) return { Icon: VerifiedRounded, color: PRIMARY }
	if (l.includes('rising')) return { Icon: TrendingUpRounded, color: EMERALD }
	return { Icon: WorkspacePremiumRounded, color: INK_60 }
}

/* ── Component ──────────────────────────────────────────────────── */

const JobPostPreview = () => {
	const { id } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const [searchParams] = useSearchParams()
	const { showToast } = useToast()
	const [showProposalModal, setShowProposalModal] = useState(false)
	const [leftTab, setLeftTab] = useState<'description' | 'ai'>('description')

	/* Dev-only fixtures short-circuit for the demo-states route.
	 * When id starts with `demo-` and we're in dev mode, bypass the
	 * API entirely so visual verification doesn't need the backend. */
	const isFixture =
		import.meta.env.DEV && typeof id === 'string' && id.startsWith('demo-')
	const fixturePost = isFixture ? JOB_POST_FIXTURES[id!] ?? null : null
	const queryResult = useGetJobPostByIdQuery(id!, {
		skip: !id || isFixture,
		/* Always re-read when the component mounts or the id changes.
		 * Without this, a stale cache from a prior visit can land
		 * briefly with `isFetching=true` under the hood and the
		 * `isError || !post` check below never flashes an error. We
		 * ALSO treat `isFetching` + no data as loading (see below)
		 * so the UI never collapses to the "not found" state during
		 * a cache-cold arg transition. */
		refetchOnMountOrArgChange: true,
	})
	const post = isFixture ? fixturePost : queryResult.data
	/* "Still loading" covers three cases that must NOT render the
	 *  Error state:
	 *   1. first fetch for this id (RTK's own isLoading);
	 *   2. refetch triggered by an invalidation while we have no
	 *      cached post yet (isFetching=true, data=undefined);
	 *   3. the brief render between an id change and RTK's status
	 *      transitioning to `pending` — data is undefined but
	 *      isLoading hasn't flipped to true yet. */
	const isLoading = isFixture
		? false
		: queryResult.isLoading ||
			(!queryResult.data && !queryResult.isError)
	const isError = isFixture ? !fixturePost : queryResult.isError
	const [markViewed] = useMarkJobPostViewedMutation()

	const navFilterParams = useMemo(
		() => ({
			search: searchParams.get('q') ?? undefined,
			decision: (searchParams.get('decision') as JobPostDecision) || undefined,
			priority: (searchParams.get('priority') as JobPostPriority) || undefined,
			status: (searchParams.get('status') as JobPostStatus) || 'PROCESSED',
			minScore: searchParams.get('minScore')
				? Number(searchParams.get('minScore'))
				: undefined,
			maxScore: searchParams.get('maxScore')
				? Number(searchParams.get('maxScore'))
				: undefined,
			createdFrom: searchParams.get('from')
				? new Date(searchParams.get('from')!).toISOString()
				: undefined,
			createdTo: searchParams.get('to')
				? new Date(`${searchParams.get('to')}T23:59:59`).toISOString()
				: undefined,
			sortBy: (searchParams.get('sortBy') as JobPostSortBy) || undefined,
			sortDirection:
				(searchParams.get('sortDir') as JobPostSortDirection) || undefined,
			viewed:
				(searchParams.get('viewed') as 'viewed' | 'unviewed' | null) ??
				undefined,
		}),
		[searchParams],
	)
	const [fetchNeighbor] = useLazyGetJobPostNeighborQuery()
	const [prevState, setPrevState] = useState<{
		known: boolean
		id: string | null
	}>({ known: false, id: null })
	const [nextState, setNextState] = useState<{
		known: boolean
		id: string | null
	}>({ known: false, id: null })

	const navSig = useMemo(() => navStackSignature(searchParams), [searchParams])
	const [stackTop, setStackTop] = useState<string | undefined>(() =>
		navStackPeek(navSig),
	)
	useEffect(() => {
		setStackTop(navStackPeek(navSig))
	}, [navSig, id])

	useEffect(() => {
		if (!id) return
		let cancelled = false
		setPrevState({ known: false, id: null })
		setNextState({ known: false, id: null })
		;(async () => {
			const [pRes, nRes] = await Promise.allSettled([
				fetchNeighbor(
					{ id, direction: 'prev', params: navFilterParams },
					true,
				).unwrap(),
				fetchNeighbor(
					{ id, direction: 'next', params: navFilterParams },
					true,
				).unwrap(),
			])
			if (cancelled) return
			if (pRes.status === 'fulfilled') {
				setPrevState({ known: true, id: pRes.value.id })
			} else {
				setPrevState({ known: true, id: null })
			}
			if (nRes.status === 'fulfilled') {
				setNextState({ known: true, id: nRes.value.id })
			} else {
				setNextState({ known: true, id: null })
			}
		})()
		return () => {
			cancelled = true
		}
	}, [id, navFilterParams, fetchNeighbor])

	const prevAvailable = !!stackTop || (prevState.known && !!prevState.id)
	const nextAvailable = nextState.known && !!nextState.id

	const goNeighbour = async (direction: 'prev' | 'next') => {
		if (!id) return
		if (direction === 'prev') {
			const popped = navStackPop(navSig)
			if (popped && popped !== id) {
				setStackTop(navStackPeek(navSig))
				navigate({
					pathname: `/job-posts/preview/${popped}`,
					search: searchParams.toString(),
				})
				return
			}
			let targetId: string | null | undefined = prevState.id
			if (targetId === undefined) {
				const res = await fetchNeighbor(
					{ id, direction: 'prev', params: navFilterParams },
					false,
				).unwrap()
				targetId = res.id
			}
			if (!targetId) return
			navigate({
				pathname: `/job-posts/preview/${targetId}`,
				search: searchParams.toString(),
			})
			return
		}
		let targetId: string | null | undefined = nextState.id
		if (targetId === undefined) {
			const res = await fetchNeighbor(
				{ id, direction: 'next', params: navFilterParams },
				false,
			).unwrap()
			targetId = res.id
		}
		if (!targetId) return
		navStackPush(navSig, id)
		navigate({
			pathname: `/job-posts/preview/${targetId}`,
			search: searchParams.toString(),
		})
	}

	const [bulkAnalyze, { isLoading: retrying }] = useBulkAnalyzeJobPostsMutation()
	const retryAnalysis = async () => {
		if (!id) return
		const res = await bulkAnalyze([id])
			.unwrap()
			.catch(() => ({ requeued: 0 }))
		showToast(
			res.requeued > 0 ? 'Re-queued for AI analysis' : 'Only Failed posts can be retried',
			res.requeued > 0 ? 'success' : 'info',
		)
	}

	/* Snapshot the server's `viewedAt` on first render so the badge
	 * keeps showing the pre-visit timestamp after mark-on-mount. */
	const [previouslyViewedAt, setPreviouslyViewedAt] = useState<string | null>(null)
	useEffect(() => {
		if (post && previouslyViewedAt === null) {
			setPreviouslyViewedAt(post.viewedAt ?? null)
		}
	}, [post, previouslyViewedAt])

	useEffect(() => {
		if (id && !isFixture) markViewed(id)
	}, [id, markViewed, isFixture])

	if (isLoading) {
		return (
			<Page>
				<Shell>
					<Center>
						<Loading label='Loading job post…' />
					</Center>
				</Shell>
			</Page>
		)
	}

	if (isError || !post) {
		return (
			<Page>
				<Shell>
					<Center>
						<ErrorState title='Job post not found' description='Could not load job post.' />
					</Center>
				</Shell>
			</Page>
		)
	}

	/* Temporarily use hardcoded AI content while we iterate on styles.
	 * Swap back to `post.aiResponse` once the layout is settled. */
	const ai = HARDCODED_AI
	void post.aiResponse

	const description = (() => {
		if (typeof post.rawPayload === 'object' && post.rawPayload !== null) {
			const job = (post.rawPayload as Record<string, unknown>).job
			if (typeof job === 'object' && job !== null) {
				const d = (job as Record<string, unknown>).description
				if (typeof d === 'string' && d.trim()) return d.trim()
			}
		}
		return post.rawText?.trim() || null
	})()

	const screeningQuestions = (() => {
		const q = post.questions
		if (!Array.isArray(q)) return [] as string[]
		return q.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
	})()

	const countryName = post.country
		? post.country.length === 2
			? countryDisplayName(post.country) ?? post.country
			: post.country
		: null
	const flag = flagEmoji(post.country)

	const proposalUrl = post.proposal?.id
		? `${import.meta.env.VITE_APP_URL}/proposal/preview/${post.proposal.id}`
		: null

	const badge = statusPalette[post.status] ?? statusPalette.NEW
	const badgeLabel = statusLabel[post.status] ?? post.status ?? '—'

	return (
		<Page>
			<Shell>
				{/* ── Pre-redesign top information block (restored) ── */}
				<TopRow>
					<BackChip
						type='button'
						onClick={() => navigate('/job-posts/list?status=any')}
					>
						<span className='arrow'>
							<ArrowBackRounded sx={{ fontSize: 16 }} />
						</span>
						<span>Back to job posts</span>
					</BackChip>

					<TopActions>
						{post.jobUrl ? (
							<GhostButton
								href={post.jobUrl}
								target='_blank'
								rel='noopener noreferrer'
							>
								<OpenInNewRounded sx={{ fontSize: 18 }} />
								<span>Open source</span>
							</GhostButton>
						) : null}
					</TopActions>
				</TopRow>

				<Header>
					<HeaderLeft>
						<HeaderIcon>
							<WorkOutlineOutlined />
						</HeaderIcon>
						<HeaderText>
							<HeaderName>{post.title || 'Untitled job post'}</HeaderName>
						</HeaderText>
					</HeaderLeft>

					<StatusBadge $bg={badge.bg} $fg={badge.fg} $border={badge.border}>
						<Dot $color={badge.fg} />
						{badgeLabel}
					</StatusBadge>
				</Header>

				{post.status !== 'PROCESSED' ? (
					<StatusBanner $status={post.status}>
						<div className='line1'>
							<span className='ts'>
								[{formatDateTimeSec(post.processedAt ?? post.createdAt)}]
							</span>
							<span className='tag'>{statusBannerTag(post.status)}</span>
							<span className='ttl'>{statusBannerTitle(post.status)}</span>
						</div>
						<div className='body'>{statusBannerBody(post.status)}</div>
						{post.status === 'FAILED' ? (
							<PermissionGate permission='settings_scanner:update'>
								<div className='actions'>
									<BannerAction
										type='button'
										onClick={retryAnalysis}
										disabled={retrying}
									>
										Retry analysis
									</BannerAction>
								</div>
							</PermissionGate>
						) : null}
					</StatusBanner>
				) : null}

				<ChipRow>
					{post.decision ? (
						<Pill
							$bg={decisionPalette[post.decision].bg}
							$fg={decisionPalette[post.decision].fg}
							$border='transparent'
						>
							<CheckCircleOutlined sx={{ fontSize: 14 }} />
							{decisionLabel[post.decision]}
						</Pill>
					) : null}
					{post.priority ? (
						<Pill
							$bg={priorityPalette[post.priority].bg}
							$fg={priorityPalette[post.priority].fg}
							$border='transparent'
						>
							<TrendingUpOutlined sx={{ fontSize: 14 }} />
							{priorityLabel[post.priority]}
						</Pill>
					) : null}
					<Tooltip
						title={`Received at ${formatDateTimeSec(post.createdAt)}`}
						placement='top'
					>
						<span>
							<InfoPill $bg={INK_06} $fg={INK_80} $border='transparent'>
								<CalendarMonthRounded sx={{ fontSize: 14 }} />
								Created {formatDate(post.createdAt)}
							</InfoPill>
						</span>
					</Tooltip>
					{post.processedAt ? (
						<Tooltip
							title={`Processed at ${formatDateTimeSec(post.processedAt)}`}
							placement='top'
						>
							<span>
								<InfoPill $bg={INK_06} $fg={INK_80} $border='transparent'>
									<AutoAwesomeOutlined sx={{ fontSize: 14 }} />
									Processed {formatDate(post.processedAt)}
								</InfoPill>
							</span>
						</Tooltip>
					) : null}
					{previouslyViewedAt ? (
						<Tooltip
							title={`Last opened ${formatDate(previouslyViewedAt)}`}
							placement='top'
						>
							<span>
								<InfoPill $bg={INK_06} $fg={INK_80} $border='transparent'>
									<VisibilityOutlined sx={{ fontSize: 14 }} />
									Viewed on {formatDate(previouslyViewedAt)}
								</InfoPill>
							</span>
						</Tooltip>
					) : null}
				</ChipRow>

				<MetricsBand>
					<MetricsTopRow>
						<MetricCell>
							<MetricCaption>Match score</MetricCaption>
							<ScoreBigRow>
								<ScoreBigNum>
								{post.matchScore != null ? (
									<CountInt value={post.matchScore} />
								) : (
									'—'
								)}
							</ScoreBigNum>
								{post.matchScore != null ? (
									<ScoreSlash>/100</ScoreSlash>
								) : null}
							</ScoreBigRow>
						</MetricCell>

						<MetricDivider />

						<MetricCell>
							<MetricCaption>
								Budget
								{contractModeLabel(post.contractType, post.budgetType) ? (
									<CaptionTag>
										{contractModeLabel(post.contractType, post.budgetType)}
									</CaptionTag>
								) : null}
							</MetricCaption>
							{(() => {
								const { main, suffix } = splitBudgetDisplay(
									formatBudgetDetail(post),
								)
								return (
									<BudgetBigRow>
										<BudgetBigNum><CountRange text={main} /></BudgetBigNum>
										{suffix ? <BudgetUnit>{suffix}</BudgetUnit> : null}
									</BudgetBigRow>
								)
							})()}
						</MetricCell>

						<MetricDivider />

						<MetricCell>
							<MetricCaption>Location</MetricCaption>
							<LocationBigRow>
								{flag ? <LocationFlag>{flag}</LocationFlag> : null}
								<LocationName>
									{countryName ?? post.location ?? '—'}
									{post.city ? (
										<LocationCity>, {post.city}</LocationCity>
									) : null}
								</LocationName>
							</LocationBigRow>
						</MetricCell>
					</MetricsTopRow>

					<MetricsBottomRow>
						<BottomStat>
							<BottomLabel>Total spent</BottomLabel>
							<BottomValue>
								{post.totalSpent != null ? (
									<>
										<BottomUnit>$</BottomUnit>
										<CountInt value={post.totalSpent} />
									</>
								) : (
									'—'
								)}
							</BottomValue>
						</BottomStat>

						<BottomStat>
							<BottomLabel>Hire rate</BottomLabel>
							<BottomValue>
								{post.hireRate != null ? (
									<>
										<CountInt value={Math.round(post.hireRate * 100)} />
										<BottomUnit>%</BottomUnit>
									</>
								) : (
									'—'
								)}
							</BottomValue>
						</BottomStat>

						<BottomStat>
							<BottomLabel>Avg rate paid</BottomLabel>
							<BottomValue>
								{post.avgRatePaid != null ? (
									<>
										<BottomUnit>$</BottomUnit>
										<CountInt value={post.avgRatePaid} />
										<BottomUnit>/hr</BottomUnit>
									</>
								) : (
									'—'
								)}
							</BottomValue>
						</BottomStat>
					</MetricsBottomRow>
				</MetricsBand>

				<MainGrid>
					<LeftCol>
						{(post.hSkillsKeywords?.length ?? 0) > 0 ? (
							<Section>
								<SectionHead>
									<SectionTitle>Skills</SectionTitle>
									<SectionRule />
								</SectionHead>
								<SkillsRow>
									{(post.hSkillsKeywords ?? []).map((kw) => (
										<Skill key={kw}>
											<SellOutlined sx={{ fontSize: 12 }} />
											{kw}
										</Skill>
									))}
								</SkillsRow>
							</Section>
						) : null}

						<OrangeTabs role='tablist'>
							<OrangeIndicator $pos={leftTab === 'ai' ? 1 : 0} />
							<OrangeTab
								type='button'
								role='tab'
								aria-selected={leftTab === 'description'}
								data-active={leftTab === 'description' || undefined}
								onClick={() => setLeftTab('description')}
							>
								Description
							</OrangeTab>
							<OrangeTab
								type='button'
								role='tab'
								aria-selected={leftTab === 'ai'}
								data-active={leftTab === 'ai' || undefined}
								onClick={() => setLeftTab('ai')}
							>
								AI summary
							</OrangeTab>
						</OrangeTabs>

						<ContentFade key={leftTab}>
							{leftTab === 'description' ? (
								description ? (
									<RawCard>
										<RawIcon>
											<NotesOutlined />
										</RawIcon>
										<RawBody>{description}</RawBody>
									</RawCard>
								) : (
									<EmptyNote>No description from Upwork.</EmptyNote>
								)
							) : (
								<>
									<AiMarkdown>
										<ReactMarkdown remarkPlugins={[remarkGfm]}>
											{ai.short_summary}
										</ReactMarkdown>
									</AiMarkdown>
									{ai.hard_stop ? (
										<HardStop>
											<WarningAmberOutlined sx={{ fontSize: 16 }} />
											<span>
												Hard stop{ai.hard_stop_reason ? ` — ${ai.hard_stop_reason}` : ''}
											</span>
										</HardStop>
									) : null}
								</>
							)}
						</ContentFade>
					</LeftCol>

					<RightCol>
						{/* ── Job details card — blue top + white body ──── */}
						<JobCard>
							<JobCardTop>
								<JobCardLabel>Budget</JobCardLabel>
								<JobBudgetBig>
									{(() => {
										const { main, suffix } = splitBudgetDisplay(
											formatBudgetDetail(post),
										)
										return (
											<>
												<span className='amount'><CountRange text={main} /></span>
												{suffix ? <span className='unit'>{suffix}</span> : null}
											</>
										)
									})()}
								</JobBudgetBig>
								{contractModeLabel(post.contractType, post.budgetType) ? (
									<ContractChip>
										{contractModeLabel(post.contractType, post.budgetType)}
									</ContractChip>
								) : null}
							</JobCardTop>

							<JobCardBody>
								<FactGrid>
									{post.duration ? (
										<Fact>
											<FactHead>
												<FactIcon>
													<CalendarMonthRounded sx={{ fontSize: 15 }} />
												</FactIcon>
												<FactLabel>Duration</FactLabel>
											</FactHead>
											<FactMain>
												{(() => {
													const { amount, unit } = splitAmountUnit(post.duration)
													return (
														<>
															<span className='num'><CountRange text={amount} /></span>
															{unit ? (
																<span className='unit'>{unit}</span>
															) : null}
														</>
													)
												})()}
											</FactMain>
										</Fact>
									) : null}
									{post.hoursPerWeek ? (
										<Fact>
											<FactHead>
												<FactIcon>
													<AccessTimeRounded sx={{ fontSize: 15 }} />
												</FactIcon>
												<FactLabel>Hours / week</FactLabel>
											</FactHead>
											<FactMain>
												{(() => {
													const { amount, unit } = splitAmountUnit(post.hoursPerWeek)
													return (
														<>
															<span className='num'><CountRange text={amount} /></span>
															{unit ? (
																<span className='unit'>{unit}</span>
															) : null}
														</>
													)
												})()}
											</FactMain>
										</Fact>
									) : null}
									{post.experienceLevel ? (
										<Fact>
											<FactHead>
												<FactIcon $accent>
													<WorkspacePremiumRounded sx={{ fontSize: 15 }} />
												</FactIcon>
												<FactLabel>Experience</FactLabel>
											</FactHead>
											<FactMain>
												<span className='word'>{(post.experienceLevel ?? '').charAt(0).toUpperCase() + (post.experienceLevel ?? '').slice(1)}</span>
											</FactMain>
										</Fact>
									) : null}
									{post.connectsRequired != null ? (
										<Fact>
											<FactHead>
												<FactIcon $accent>
													<BoltRounded sx={{ fontSize: 15 }} />
												</FactIcon>
												<FactLabel>Connects</FactLabel>
											</FactHead>
											<FactMain>
												<span className='num'><CountInt value={post.connectsRequired} /></span>
												<span className='unit'>required</span>
											</FactMain>
										</Fact>
									) : null}
								</FactGrid>
								{post.categories && post.categories.length > 0 ? (
									<CategoriesWrap>
										<CategoriesLabel>Categories</CategoriesLabel>
										<CategoryTags>
											{post.categories.map((c) => (
												<CategoryTag key={c}>{c}</CategoryTag>
											))}
										</CategoryTags>
									</CategoriesWrap>
								) : null}
							</JobCardBody>
						</JobCard>

						{/* ── Client card — light top + dark middle + light foot */}
						<ClientCard>
							<ClientLight>
								<ClientPlaceRow>
									<ClientPlaceInner>
										{flag ? <ClientFlag>{flag}</ClientFlag> : null}
										<ClientPlaceText>
											<ClientCountry>
												{countryName ?? post.location ?? 'Unknown'}
											</ClientCountry>
											{post.city ? (
												<ClientCity>{post.city}</ClientCity>
											) : null}
										</ClientPlaceText>
									</ClientPlaceInner>
									{post.clientPaymentVerified === true ? (
										<VerifiedPill title='Payment verified'>
											<VerifiedRounded sx={{ fontSize: 13 }} />
											Verified
										</VerifiedPill>
									) : null}
								</ClientPlaceRow>

								{post.clientRating != null ? (
									<ClientRatingBlock>
										<StarRounded sx={{ fontSize: 18, color: '#f5b100' }} />
										<RatingValue><CountFloat value={post.clientRating} decimals={2} /></RatingValue>
										{post.clientReviewCount != null ? (
											<RatingMeta>
												<CountInt value={post.clientReviewCount} />{' '}
												{post.clientReviewCount === 1 ? 'review' : 'reviews'}
											</RatingMeta>
										) : null}
									</ClientRatingBlock>
								) : null}
							</ClientLight>

							<ClientDark>
								<DarkStat>
									<DarkStatLabel>Total spent</DarkStatLabel>
									{(() => {
										const m = splitMoney(post.totalSpent)
										return m ? (
											<DarkStatValue>
												<span className='sign'>{m.sign}</span>
												<span><CountInt value={post.totalSpent ?? 0} /></span>
											</DarkStatValue>
										) : (
											<DarkStatValue>—</DarkStatValue>
										)
									})()}
								</DarkStat>

								<DarkStat>
									<DarkStatLabel>Hire rate</DarkStatLabel>
									{(() => {
										const p = splitPercent(post.hireRate)
										return (
											<DarkStatValue className='mid'>
												{p ? (
													<>
														<span><CountInt value={Math.round((post.hireRate ?? 0) * 100)} /></span>
														<span className='sign'>{p.sign}</span>
													</>
												) : (
													'—'
												)}
											</DarkStatValue>
										)
									})()}
									{post.hireRate != null ? (
										<HireRateBar aria-hidden='true'>
											<HireRateFill
												style={{
													width: `${Math.max(
														0,
														Math.min(100, post.hireRate * 100),
													)}%`,
												}}
											/>
										</HireRateBar>
									) : null}
								</DarkStat>

								{(post.clientHires != null || post.clientJobsPosted != null) ? (
									<MiniStatPair>
										{post.clientHires != null ? (
											<MiniStat>
												<MiniNum>
													<CountInt value={post.clientHires} />
												</MiniNum>
												<MiniLabel>hires</MiniLabel>
											</MiniStat>
										) : null}
										{post.clientJobsPosted != null ? (
											<MiniStat>
												<MiniNum>
													<CountInt value={post.clientJobsPosted} />
												</MiniNum>
												<MiniLabel>jobs posted</MiniLabel>
											</MiniStat>
										) : null}
									</MiniStatPair>
								) : null}
							</ClientDark>

							{(post.avgRatePaid != null ||
								post.clientRankLabel ||
								post.clientRankScore != null ||
								post.clientLocationRestriction) ? (
								<ClientFoot>
									<FootGrid>
										{post.avgRatePaid != null ? (
											<FootGroup>
												<FootGroupLabel>Average rate paid</FootGroupLabel>
												<FootGroupValue>
													<span className='sign'>$</span>
													<span className='num'><CountInt value={post.avgRatePaid} /></span>
													<span className='unit'>/hr</span>
												</FootGroupValue>
											</FootGroup>
										) : null}
										{post.clientRankLabel || post.clientRankScore != null ? (
											<FootGroup>
												<FootGroupLabel>Client rank</FootGroupLabel>
												{(() => {
													const r = clientRankVisual(post.clientRankLabel)
													return (
														<FootRankValue style={{ color: r.color }}>
															<r.Icon sx={{ fontSize: 18 }} />
															<span className='name'>
																{post.clientRankLabel ?? '—'}
															</span>
														</FootRankValue>
													)
												})()}
												{post.clientRankScore != null ? (
													<FootRankMeta>
														Rank score <CountInt value={post.clientRankScore} />
													</FootRankMeta>
												) : null}
											</FootGroup>
										) : null}
									</FootGrid>
									{post.clientLocationRestriction ? (
										<FootCaption>
											Location restriction · {post.clientLocationRestriction}
										</FootCaption>
									) : null}
								</ClientFoot>
							) : null}
						</ClientCard>

						{/* ── Processing ───────────────────────────────── */}
						<ProcessingCard>
							<ProcessingHead>
								<ProcessingHeadLeft>
									<ProcessingIcon>
										<SettingsRounded sx={{ fontSize: 15 }} />
									</ProcessingIcon>
									<ProcessingTitle>Processing</ProcessingTitle>
								</ProcessingHeadLeft>
							</ProcessingHead>

							<ProcessingBody>
									<StatusLine>
										<ProcStatusChip
											$bg={statusPalette[post.status]?.bg ?? badge.bg}
											$fg={statusPalette[post.status]?.fg ?? badge.fg}
										>
											<ProcStatusDot
												$color={statusPalette[post.status]?.fg ?? badge.fg}
											/>
											{statusLabel[post.status]}
										</ProcStatusChip>
										{/* Pipeline state is a *current* fact — only
										 * meaningful before the post reaches a terminal
										 * state. For PROCESSED / FAILED / SKIPPED the
										 * ENQUEUED marker is historical, so hide it. */}
										{(post.status === 'NEW' || post.status === 'PROCESSING') &&
										post.enqueueState ? (
											<PipelineState>
												{enqueueStateLabel(post.enqueueState)}
											</PipelineState>
										) : null}
									</StatusLine>

									{post.status === 'FAILED' ? (
										<ErrorNote>
											<WarningAmberOutlined sx={{ fontSize: 14 }} />
											AI pipeline could not finish
										</ErrorNote>
									) : null}

									<ProcessingDivider />

									<ProcFact>
										<ProcFactHead>
											<ProcFactIcon>
												<IconifyIcon
													icon='simple-icons:upwork'
													width='16'
													height='16'
												/>
											</ProcFactIcon>
											<ProcFactLabel>Source</ProcFactLabel>
										</ProcFactHead>
										<ModelChain>
											<ModelChip>{post.scanner ?? '—'}</ModelChip>
										</ModelChain>
									</ProcFact>

									<ProcFact>
										<ProcFactHead>
											<ProcFactIcon>
												<AutoAwesomeOutlined sx={{ fontSize: 16 }} />
											</ProcFactIcon>
											<ProcFactLabel>Pipeline (configured)</ProcFactLabel>
										</ProcFactHead>
										<ModelChain>
											<ModelChip>Haiku 4.5</ModelChip>
											<ChainArrow aria-hidden='true'>→</ChainArrow>
											<ModelChip>Sonnet 5.5</ModelChip>
										</ModelChain>
									</ProcFact>

									<ProcessingDivider />

									<Timeline>
										{(() => {
											const r = splitDateTimeParts(post.createdAt)
											return (
												<TimelineRow $terminal={!post.processedAt}>
													<TimelineDotWrap>
														<TimelineDot $filled />
														{post.processedAt ? (
															<TimelineConnector />
														) : null}
													</TimelineDotWrap>
													<TimelineBody>
														<TimelineLabel>Received</TimelineLabel>
														<TimelineTime>
															{r ? r.time : '—'}
															{r ? (
																<TimelineDate>· {r.date}</TimelineDate>
															) : null}
														</TimelineTime>
													</TimelineBody>
												</TimelineRow>
											)
										})()}
										{post.processedAt ? (
											(() => {
												const p = splitDateTimeParts(post.processedAt, true)
												return (
													<TimelineRow $terminal>
														<TimelineDotWrap>
															<TimelineDot
																$filled
																$color={statusPalette[post.status]?.fg ?? badge.fg}
															/>
														</TimelineDotWrap>
														<TimelineBody>
															<TimelineLabel>Processed</TimelineLabel>
															<TimelineTime>
																{p ? p.time : '—'}
																{p ? (
																	<TimelineDate>· {p.date}</TimelineDate>
																) : null}
															</TimelineTime>
														</TimelineBody>
													</TimelineRow>
												)
											})()
										) : null}
									</Timeline>
								</ProcessingBody>
						</ProcessingCard>
					</RightCol>
				</MainGrid>
			</Shell>

			{showProposalModal && (
				<JobPostToProposalModal
					id={id!}
					onClose={() => setShowProposalModal(false)}
					onSuccess={() => navigate('/proposals')}
				/>
			)}
		</Page>
	)
}

export default JobPostPreview

/* ── Sub-components ─────────────────────────────────────────────── */

/* Sidebar key/value row — hides itself when the value is null,
 * undefined or an empty string. Zero is a valid value. */
function KvRow({
	label,
	value,
}: {
	label: string
	value: string | number | null | undefined | React.ReactNode
}) {
	if (value === null || value === undefined || value === '') return null
	return (
		<li>
			<span className='k'>{label}</span>
			<span className='v'>{value}</span>
		</li>
	)
}

function enqueueStateLabel(s: string | null | undefined): string | null {
	switch (s) {
		case 'BACKLOG':
			return 'Awaiting decision'
		case 'PENDING':
			return 'Pending — will enqueue on next tick'
		case 'ENQUEUED':
			return 'In queue'
		default:
			return s ?? null
	}
}

/* ── Styled ─────────────────────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0) rotate(0deg); }
	50%      { transform: translateY(-3px) rotate(-2deg); }
`

const dotPulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
	50%      { transform: scale(1.25); box-shadow: 0 0 0 6px transparent; }
`

const heroIn = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Page = styled.div`
	width: 100%;
	padding: 0;
`

const Shell = styled.div`
	background: #fff;
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	padding: 34px 40px 36px;
	display: flex;
	flex-direction: column;
	gap: 28px;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 22px;
		border-radius: 12px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const Center = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

/* ── Top row ────────────────────────────────────────────────── */

const TopRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	flex-wrap: wrap;
`

const BackChip = styled.button`
	appearance: none;
	background: transparent;
	border: none;
	padding: 8px 14px 8px 10px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: ${INK};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	border-radius: 999px;

	.arrow {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: ${PRIMARY};
		color: #fff;
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover .arrow {
		transform: translateX(-3px);
	}

	@media (prefers-reduced-motion: reduce) {
		.arrow { transition: none; }
	}
`

const TopActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const NeighbourBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 7px 11px;
	border: 1px solid ${INK_10};
	border-radius: 8px;
	background: ${SURFACE};
	color: ${INK_80};
	font-size: 12.5px;
	font-weight: 500;
	cursor: pointer;
	transition: 160ms ease;

	&:hover:not(:disabled) {
		border-color: ${INK};
		color: ${INK};
	}
	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

const PrimaryOpenBtn = styled.a`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	margin-left: 6px;
	border-radius: 8px;
	background: ${INK};
	color: #fff;
	font-size: 12.5px;
	font-weight: 600;
	text-decoration: none;
	transition: background 160ms ease, transform 160ms ease;

	&:hover {
		background: #000;
	}
	&:active {
		transform: translateY(1px);
	}
`

/* ── Hero ────────────────────────────────────────────────── */

const Hero = styled.header`
	display: grid;
	grid-template-columns: auto 1fr;
	grid-template-rows: auto auto;
	grid-template-areas:
		'badge title'
		'badge meta';
	column-gap: 16px;
	row-gap: 6px;
	padding-top: 4px;
`

const UpworkBadge = styled.span`
	grid-area: badge;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: ${INK_06};
	color: #108a00;
	margin-top: 4px;
`

const HeroTitle = styled.h1`
	grid-area: title;
	margin: 0;
	font-size: 28px;
	font-weight: 700;
	line-height: 1.25;
	letter-spacing: -0.4px;
	color: ${INK};
	overflow-wrap: anywhere;
	word-break: normal;

	@media (max-width: 640px) {
		font-size: 23px;
	}
`

const HeroMeta = styled.div`
	grid-area: meta;
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px;
	color: ${INK_60};
	font-size: 13px;
`

const Dim = styled.span`
	color: ${INK_45};
`

const ViewedTag = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 2px 10px;
	border-radius: 999px;
	background: ${INK_06};
	color: ${INK_60};
	font-size: 12px;
	font-weight: 500;
`

/* ── AI summary ────────────────────────────────────────────── */

const AiSummary = styled.div`
	display: grid;
	grid-template-columns: auto 1fr;
	gap: 20px;
	align-items: center;
	padding: 14px 2px;
	border-top: 1px solid ${INK_10};
	border-bottom: 1px solid ${INK_10};

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
		gap: 10px;
	}
`

const AiSummaryLeft = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
`

const ScoreBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 128px;
`

const ScoreNum = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 32px;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -1px;
	font-variant-numeric: tabular-nums;

	.slash {
		font-size: 13px;
		font-weight: 500;
		color: ${INK_45};
		margin-left: 4px;
		font-variant-numeric: normal;
	}
`

const ScoreTrack = styled.div`
	height: 4px;
	border-radius: 999px;
	background: ${INK_06};
	overflow: hidden;
`

const ScoreFill = styled.div`
	height: 100%;
	border-radius: 999px;
	transition: width 900ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const DecisionChip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.2px;
	text-transform: uppercase;
`

const AiSummaryText = styled.p`
	margin: 0;
	font-size: 15px;
	line-height: 1.5;
	color: ${INK_80};
`

/* ── Analysis state banner ─────────────────────────────── */

const toneBg: Record<'info' | 'neutral' | 'warn' | 'danger', string> = {
	info: 'rgba(3, 105, 161, 0.08)',
	neutral: INK_06,
	warn: AMBER_SOFT,
	danger: DANGER_SOFT,
}
const toneFg: Record<'info' | 'neutral' | 'warn' | 'danger', string> = {
	info: '#0369a1',
	neutral: SLATE,
	warn: AMBER,
	danger: DANGER,
}

const StateBanner = styled.div<{ $tone: 'info' | 'neutral' | 'warn' | 'danger' }>`
	display: grid;
	grid-template-columns: auto 1fr auto;
	gap: 12px;
	align-items: center;
	padding: 12px 16px;
	border-radius: 10px;
	background: ${(p) => toneBg[p.$tone]};
	color: ${INK_80};

	@media (max-width: 720px) {
		grid-template-columns: auto 1fr;
		grid-auto-rows: auto;
		& > :nth-child(3) {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}
`

const StateIcon = styled.span<{ $tone: 'info' | 'neutral' | 'warn' | 'danger' }>`
	display: inline-flex;
	color: ${(p) => toneFg[p.$tone]};
`

const StateBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const StateTitle = styled.span`
	font-size: 13.5px;
	font-weight: 700;
	color: ${INK};
`

const StateText = styled.span`
	font-size: 13px;
	color: ${INK_60};
	line-height: 1.45;
`

const StateAction = styled.button`
	appearance: none;
	border: 1px solid ${INK_10};
	background: ${SURFACE};
	color: ${INK};
	font-size: 12.5px;
	font-weight: 600;
	padding: 6px 12px;
	border-radius: 8px;
	cursor: pointer;
	transition: 160ms ease;
	&:hover:not(:disabled) {
		border-color: ${INK};
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

/* ── Main grid ────────────────────────────────────────── */

const MainGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 360px;
	gap: 48px;
	align-items: start;

	@media (max-width: 960px) {
		grid-template-columns: 1fr;
		gap: 28px;
	}
`

const LeftCol = styled.div`
	display: flex;
	flex-direction: column;
	gap: 32px;
	min-width: 0;
	max-width: 72ch;
`

const RightCol = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

/* ── Prose (description) ──────────────────────────────── */

const Prose = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const ProseHead = styled.h2`
	margin: 0;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 1.2px;
	text-transform: uppercase;
	color: ${INK_45};
`

const ProseBody = styled.div`
	font-size: 15.5px;
	line-height: 1.65;
	color: ${INK_80};
	white-space: pre-wrap;
	overflow-wrap: anywhere;
`

/* ── Sub-section (skills, questions, AI analysis) ─────── */

const SubSection = styled.section`
	display: flex;
	flex-direction: column;
	gap: 12px;
`

const SubSectionTitle = styled.h3`
	display: inline-flex;
	align-items: center;
	gap: 7px;
	margin: 0;
	font-size: 13px;
	font-weight: 700;
	color: ${INK};
	letter-spacing: -0.1px;

	svg {
		color: ${ACCENT};
	}
`

/* Skills */

const SkillsRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`

const Skill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 8px;
	background: ${PRIMARY_TINT};
	color: ${PRIMARY};
	border: 1px solid ${PRIMARY_TINT_STRONG};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.02em;
`

/* Pre-redesign Section wrappers (restored for Skills). */
const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const SectionHead = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
`

const SectionTitle = styled.h3`
	margin: 0;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};
	flex-shrink: 0;
`

const SectionRule = styled.div`
	flex: 1;
	height: 1px;
	background: ${INK_10};
`

/* ── Description (RawCard) — pre-redesign ────────────── */

/* Toggle bar above Description / AI summary — orange sliding
 * indicator, white label on active, no dots. Smooth spring-ease. */
const OrangeTabs = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	padding: 4px;
	gap: 2px;
	border-radius: 999px;
	background: ${INK_06};
	align-self: flex-start;
`

const OrangeIndicator = styled.span<{ $pos: number }>`
	position: absolute;
	top: 4px;
	bottom: 4px;
	left: 4px;
	width: calc(50% - 4px);
	border-radius: 999px;
	background: ${ACCENT};
	box-shadow:
		0 4px 12px -4px rgba(232, 93, 47, 0.45),
		0 1px 2px rgba(232, 93, 47, 0.25);
	transform: translateX(${(p) => (p.$pos === 1 ? '100%' : '0%')});
	transition: transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1);
	pointer-events: none;

	@media (prefers-reduced-motion: reduce) {
		transition: transform 0ms;
	}
`

const OrangeTab = styled.button`
	position: relative;
	z-index: 1;
	appearance: none;
	border: 0;
	background: transparent;
	padding: 8px 18px;
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	color: ${INK_60};
	cursor: pointer;
	border-radius: 999px;
	transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);
	min-width: 128px;
	text-align: center;

	&[data-active] {
		color: #ffffff;
	}
	&:hover:not([data-active]) {
		color: ${INK};
	}
`

/* Smooth fade+slide when the active tab's content swaps in.
 * Keyed by the parent on tab change so React remounts the block. */
const contentIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const ContentFade = styled.div`
	animation: ${contentIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	display: flex;
	flex-direction: column;
	gap: 12px;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const EmptyNote = styled.p`
	margin: 0;
	font-size: 13px;
	color: ${INK_45};
	font-style: italic;
`

/* Description renders as a plain reading surface — same visual
 * weight as the body of an Upwork post: no card, no border, no
 * icon chrome. Just a comfortable paragraph. */
const RawCard = styled.div`
	display: block;
	padding: 0;
	background: transparent;
	border: 0;
`

const RawIcon = styled.span`
	display: none;
`

const RawBody = styled.pre`
	margin: 0;
	font-family: inherit;
	font-size: 14px;
	line-height: 1.65;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
`

/* Plain bullet list — section title + list, no cards, no icons.
 * Lets the AI text breathe. */
const TextList = styled.ul`
	margin: 0;
	padding-left: 22px;
	display: flex;
	flex-direction: column;
	gap: 8px;
	font-size: 14.5px;
	line-height: 1.6;
	color: ${INK};

	li {
		padding-left: 2px;
	}
	li::marker {
		color: ${INK_45};
	}

	strong {
		font-weight: 700;
	}
	em {
		font-style: italic;
		color: ${INK_80};
	}
`

/* ── AI summary / Subscores / Bullets — pre-redesign ─── */

const barFill = keyframes`
	from { transform: scaleX(0); }
	to   { transform: scaleX(1); }
`

const AiCard = styled.div`
	display: flex;
	gap: 14px;
	padding: 18px 20px;
	border-radius: 14px;
	background: linear-gradient(
		135deg,
		rgba(139, 92, 246, 0.06) 0%,
		#ffffff 60%,
		rgba(139, 92, 246, 0.08) 130%
	);
	border: 1px solid rgba(139, 92, 246, 0.22);
`

const AiIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 40px;
	height: 40px;
	border-radius: 10px;
	background: rgba(139, 92, 246, 0.14);
	color: #6d28d9;
	flex-shrink: 0;
	box-shadow: 0 6px 16px -10px rgba(139, 92, 246, 0.55);
	animation: ${iconFloat} 4s ease-in-out infinite;

	svg {
		font-size: 22px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const AiBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	min-width: 0;
	flex: 1;
`

const AiText = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.55;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
`

/* ReactMarkdown wrapper — styles the HTML tree the parser emits
 * (p, h3, ul/ol, li, strong, em, code, blockquote, a). Keeps the
 * same text size as the Description so the two tabs read as
 * siblings. */
const AiMarkdown = styled.div`
	font-size: 14.5px;
	line-height: 1.65;
	color: ${INK};
	word-break: break-word;

	p {
		margin: 0 0 10px;
	}
	p:last-child {
		margin-bottom: 0;
	}

	h1, h2, h3, h4 {
		margin: 18px 0 8px;
		line-height: 1.3;
		letter-spacing: -0.2px;
		color: ${INK};
	}
	h1 { font-size: 18px; font-weight: 800; }
	h2 { font-size: 16px; font-weight: 800; }
	h3 { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.4px; color: ${INK_60}; }
	h4 { font-size: 13px; font-weight: 700; color: ${INK_80}; }

	ul, ol {
		margin: 0 0 10px;
		padding-left: 22px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	li::marker {
		color: ${INK_45};
	}
	li > ul, li > ol {
		margin: 6px 0 0;
	}

	strong {
		font-weight: 700;
		color: ${INK};
	}
	em {
		font-style: italic;
		color: ${INK_80};
	}

	code {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 0.9em;
		padding: 1px 6px;
		border-radius: 4px;
		background: ${INK_06};
		color: ${INK};
	}
	pre {
		margin: 10px 0;
		padding: 12px 14px;
		border-radius: 10px;
		background: ${INK_06};
		overflow-x: auto;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12.5px;
		line-height: 1.5;
	}
	pre code {
		padding: 0;
		background: transparent;
	}

	blockquote {
		margin: 10px 0;
		padding: 6px 12px;
		border-left: 3px solid ${INK_10};
		color: ${INK_80};
		font-style: italic;
	}

	a {
		color: ${PRIMARY};
		text-decoration: none;
		border-bottom: 1px solid rgba(3, 105, 161, 0.3);
		&:hover {
			border-bottom-color: ${PRIMARY};
		}
	}

	hr {
		margin: 14px 0;
		border: 0;
		border-top: 1px solid ${INK_10};
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 10px 0;
		font-size: 13px;
	}
	th, td {
		padding: 6px 10px;
		border-bottom: 1px solid ${INK_10};
		text-align: left;
	}
	th {
		font-weight: 700;
		color: ${INK};
	}

	> *:first-child {
		margin-top: 0;
	}
	> *:last-child {
		margin-bottom: 0;
	}
`

const SubscoresGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr;
	gap: 10px;
`

const SubscoreRowCard = styled.div`
	display: grid;
	grid-template-columns: 160px 1fr 60px;
	align-items: center;
	gap: 14px;
	padding: 10px 14px;
	border-radius: 10px;
	background: #fff;
	border: 1px solid ${INK_10};

	@media (max-width: 640px) {
		grid-template-columns: 120px 1fr 44px;
	}
`

const SubscoreLabelLg = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${INK};
	text-transform: capitalize;
	letter-spacing: -0.005em;
`

const SubscoreBarWrapLg = styled.div`
	position: relative;
	height: 8px;
	border-radius: 999px;
	background: ${INK_04};
	overflow: hidden;
`

const SubscoreBarLg = styled.div<{ $pct: number; $fg: string }>`
	position: absolute;
	inset: 0;
	background: ${(p) => p.$fg};
	transform-origin: left center;
	transform: scaleX(${(p) => p.$pct / 100});
	animation: ${barFill} 700ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const SubscoreValueLg = styled.span<{ $fg: string }>`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	font-weight: 800;
	color: ${(p) => p.$fg};
	text-align: right;
`

const bulletTonePalette: Record<'info' | 'danger', { fg: string; bg: string; border: string }> = {
	info: { fg: PRIMARY, bg: PRIMARY_TINT_STRONG, border: 'rgba(3, 105, 161, 0.28)' },
	danger: {
		fg: DANGER,
		bg: 'rgba(239, 68, 68, 0.10)',
		border: 'rgba(239, 68, 68, 0.28)',
	},
}

const Bullets = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const BulletRow = styled.div<{ $tone: 'info' | 'danger' }>`
	display: flex;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid ${({ $tone }) => bulletTonePalette[$tone].border};
`

const BulletMarker = styled.span<{ $tone: 'info' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: ${({ $tone }) => bulletTonePalette[$tone].bg};
	color: ${({ $tone }) => bulletTonePalette[$tone].fg};
	flex-shrink: 0;
`

const BulletText = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.55;
	color: ${INK};
	white-space: pre-wrap;
	word-break: break-word;
	flex: 1;
`

/* Screening questions */

const Questions = styled.ol`
	margin: 0;
	padding-left: 1.2em;
	display: flex;
	flex-direction: column;
	gap: 8px;
	font-size: 14.5px;
	line-height: 1.5;
	color: ${INK_80};
`

/* AI analysis */

const AnalysisProse = styled.p`
	margin: 0;
	font-size: 14.5px;
	line-height: 1.6;
	color: ${INK_80};
`

const AnalysisGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const GroupHead = styled.div<{ $tone: 'good' | 'bad' }>`
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 1.1px;
	text-transform: uppercase;
	color: ${(p) => (p.$tone === 'good' ? EMERALD : DANGER)};
`

const GroupList = styled.ul`
	margin: 0;
	padding-left: 1.1em;
	display: flex;
	flex-direction: column;
	gap: 4px;
	font-size: 14px;
	line-height: 1.5;
	color: ${INK_80};

	li::marker {
		color: ${INK_45};
	}
`

const DlInline = styled.dl`
	margin: 4px 0 0;
	display: grid;
	grid-template-columns: max-content 1fr;
	column-gap: 14px;
	row-gap: 4px;
	font-size: 13.5px;

	dt {
		color: ${INK_45};
		font-weight: 600;
	}
	dd {
		margin: 0;
		color: ${INK_80};
	}
`

const HardStop = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 10px 14px;
	border-radius: 8px;
	background: ${DANGER_SOFT};
	color: ${DANGER};
	font-size: 13px;
	font-weight: 600;
`

const Subscores = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	margin-top: 4px;
`

const SubscoreRow = styled.div`
	display: grid;
	grid-template-columns: 160px 1fr 36px;
	align-items: center;
	gap: 10px;
	font-size: 12.5px;

	@media (max-width: 600px) {
		grid-template-columns: 120px 1fr 32px;
	}
`

const SubscoreLabel = styled.span`
	color: ${INK_60};
	text-transform: capitalize;
`

const SubscoreBarWrap = styled.div`
	height: 6px;
	border-radius: 999px;
	background: ${INK_06};
	overflow: hidden;
`

const SubscoreBar = styled.div`
	height: 100%;
	border-radius: 999px;
	transition: width 700ms cubic-bezier(0.22, 1, 0.36, 1);
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const SubscoreValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-weight: 700;
	text-align: right;
	font-variant-numeric: tabular-nums;
`


/* Proposal link row */

const ProposalRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	color: ${INK_60};

	a {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		color: ${INK};
		font-weight: 600;
		text-decoration: none;
		&:hover {
			text-decoration: underline;
		}
	}
`

/* ── Sidebar ─────────────────────────────────────────── */

/* Shared Kv (still used by Processing collapsible). */
const Kv = styled.ul`
	margin: 0;
	padding: 0;
	list-style: none;
	display: flex;
	flex-direction: column;
	gap: 7px;

	li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 10px;
		align-items: baseline;
		font-size: 13px;
	}
	.k {
		color: ${INK_45};
	}
	.v {
		color: ${INK};
		font-weight: 500;
		text-align: right;
		min-width: 0;
		overflow-wrap: anywhere;
	}
`

/* ── Job details card ─────────────────────────────────── */

const CARD_SHADOW = '0 24px 48px -32px rgba(15, 23, 42, 0.28), 0 8px 20px -16px rgba(15, 23, 42, 0.14)'

const JobCard = styled.section`
	display: flex;
	flex-direction: column;
	border-radius: 24px;
	background: ${SURFACE};
	box-shadow: ${CARD_SHADOW};
	overflow: visible;
`

const JobCardTop = styled.div`
	position: relative;
	padding: 22px 24px 42px;
	border-radius: 24px 24px 0 0;
	background: linear-gradient(135deg, ${PRIMARY} 0%, #0a4e86 100%);
	color: #fff;
`

const JobCardLabel = styled.div`
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.2px;
	color: rgba(255, 255, 255, 0.75);
`

const JobBudgetBig = styled.div`
	display: flex;
	align-items: baseline;
	gap: 6px;
	margin-top: 6px;
	line-height: 1.05;
	letter-spacing: -1px;
	color: #fff;
	font-variant-numeric: tabular-nums;

	.amount {
		font-size: 36px;
		font-weight: 800;
	}
	.unit {
		font-size: 15px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.72);
	}

	@container (max-width: 300px) {
		.amount { font-size: 30px; }
	}
`

const ContractChip = styled.span`
	position: absolute;
	right: 20px;
	top: 20px;
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.18);
	color: #fff;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.4px;
	backdrop-filter: blur(6px);
`

const JobCardBody = styled.div`
	position: relative;
	margin: -22px 10px 10px;
	padding: 20px 22px;
	border-radius: 20px;
	background: ${SURFACE};
	box-shadow: 0 10px 24px -18px rgba(15, 23, 42, 0.25);
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const FactGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 20px;
	row-gap: 18px;

	@media (max-width: 480px) {
		grid-template-columns: 1fr;
	}
`

const Fact = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`

const FactHead = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
`

const FactIcon = styled.span<{ $accent?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	border-radius: 7px;
	background: ${(p) => (p.$accent ? 'rgba(3, 105, 161, 0.1)' : INK_06)};
	color: ${(p) => (p.$accent ? PRIMARY : INK_60)};
`

const FactLabel = styled.span`
	font-size: 11px;
	font-weight: 700;
	color: ${INK_60};
	letter-spacing: 0.3px;
	text-transform: uppercase;
`

const FactMain = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	min-width: 0;
	overflow-wrap: anywhere;
	line-height: 1.1;

	.num {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 24px;
		font-weight: 700;
		color: ${INK};
		letter-spacing: -0.6px;
		font-variant-numeric: tabular-nums;
	}
	.word {
		font-size: 17px;
		font-weight: 700;
		color: ${INK};
		letter-spacing: -0.2px;
	}
	.unit {
		font-size: 12px;
		font-weight: 500;
		color: ${INK_60};
	}
`

const CategoriesWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
	padding-top: 16px;
	border-top: 1px solid ${INK_06};
`

const CategoriesLabel = styled.span`
	font-size: 11px;
	font-weight: 700;
	color: ${INK_60};
	letter-spacing: 0.3px;
	text-transform: uppercase;
`

const CategoryTags = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const CategoryTag = styled.span`
	display: inline-flex;
	padding: 4px 11px;
	border-radius: 6px;
	background: rgba(3, 105, 161, 0.08);
	color: ${PRIMARY};
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.1px;
`

/* ── Client card ──────────────────────────────────────── */

const ClientCard = styled.section`
	display: flex;
	flex-direction: column;
	border-radius: 24px;
	background: ${SURFACE};
	box-shadow: ${CARD_SHADOW};
	overflow: hidden;
`

const ClientLight = styled.div`
	padding: 20px 22px 18px;
	display: flex;
	flex-direction: column;
	gap: 10px;
	background: ${SURFACE};
`

const ClientPlaceRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
`

const ClientPlaceInner = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 12px;
	min-width: 0;
`

const ClientFlag = styled.span`
	font-size: 28px;
	line-height: 1;
	flex-shrink: 0;
`

const ClientPlaceText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	min-width: 0;
`

const ClientCountry = styled.div`
	font-size: 20px;
	font-weight: 800;
	color: ${INK};
	letter-spacing: -0.4px;
	line-height: 1.15;
	overflow-wrap: anywhere;
`

const ClientCity = styled.div`
	font-size: 12.5px;
	color: ${INK_60};
	font-weight: 500;
`

const VerifiedPill = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 8px;
	border-radius: 6px;
	background: ${EMERALD_SOFT};
	color: ${EMERALD};
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	text-transform: uppercase;
	white-space: nowrap;
	flex-shrink: 0;
`

const ClientRatingBlock = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	padding-top: 2px;
`

const RatingValue = styled.span`
	font-size: 18px;
	font-weight: 800;
	color: ${INK};
	letter-spacing: -0.3px;
	font-variant-numeric: tabular-nums;
	line-height: 1;
`

const RatingMeta = styled.span`
	color: ${INK_60};
	font-weight: 500;
	font-size: 12.5px;
`

const ClientDark = styled.div`
	padding: 22px 24px 20px;
	background: ${INK};
	color: #fff;
	display: flex;
	flex-direction: column;
	gap: 18px;
`

const DarkStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 5px;
	min-width: 0;
`

const DarkStatLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	color: rgba(255, 255, 255, 0.72);
	letter-spacing: 0.5px;
	text-transform: uppercase;
`

const DarkStatValue = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	font-size: 34px;
	font-weight: 800;
	letter-spacing: -1px;
	line-height: 1.05;
	color: #fff;
	font-variant-numeric: tabular-nums;

	.sign {
		font-size: 20px;
		font-weight: 700;
		color: rgba(255, 255, 255, 0.6);
		letter-spacing: 0;
	}

	&.mid {
		font-size: 26px;
		letter-spacing: -0.6px;
	}
	&.mid .sign {
		font-size: 16px;
	}

	@media (max-width: 420px) {
		font-size: 28px;
		&.mid { font-size: 22px; }
	}
`

const HireRateBar = styled.div`
	margin-top: 6px;
	height: 6px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.14);
	overflow: hidden;
`

const HireRateFill = styled.div`
	height: 100%;
	border-radius: 999px;
	background: linear-gradient(90deg, #38bdf8 0%, #0ea5e9 100%);
	transition: width 800ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const MiniStatPair = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
	padding-top: 12px;
	border-top: 1px solid rgba(255, 255, 255, 0.1);
`

const MiniStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	min-width: 0;
`

const MiniNum = styled.div`
	font-size: 18px;
	font-weight: 700;
	color: #fff;
	letter-spacing: -0.3px;
	line-height: 1;
	font-variant-numeric: tabular-nums;
`

const MiniLabel = styled.div`
	font-size: 11px;
	font-weight: 500;
	color: rgba(255, 255, 255, 0.6);
	text-transform: lowercase;
`

const ClientFoot = styled.div`
	padding: 16px 22px 18px;
	background: ${SURFACE};
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const FootGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	column-gap: 16px;
	row-gap: 12px;

	@media (max-width: 420px) {
		grid-template-columns: 1fr;
	}
`

const FootGroup = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const FootGroupLabel = styled.div`
	font-size: 10.5px;
	font-weight: 700;
	color: ${INK_60};
	letter-spacing: 0.4px;
	text-transform: uppercase;
`

const FootGroupValue = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	line-height: 1.15;
	font-variant-numeric: tabular-nums;

	.sign {
		font-size: 13px;
		font-weight: 600;
		color: ${INK_60};
		margin-right: 1px;
	}
	.num {
		font-size: 20px;
		font-weight: 800;
		color: ${INK};
		letter-spacing: -0.3px;
	}
	.unit {
		font-size: 12px;
		font-weight: 500;
		color: ${INK_60};
		margin-left: 2px;
	}
`

const FootRankValue = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	margin-top: 2px;
	/* Colour is set inline via clientRankColor(label) so the icon
	 * (fill: currentColor) and label pick up the same hue —
	 * pink for Plus, blue for Top Rated. */

	svg {
		color: inherit;
	}
	.name {
		font-size: 15px;
		font-weight: 800;
		color: inherit;
		letter-spacing: -0.2px;
		overflow-wrap: anywhere;
	}
`

const FootRankMeta = styled.div`
	font-size: 11px;
	color: ${INK_45};
	font-weight: 500;
	margin-top: 2px;
`

const FootCaption = styled.div`
	font-size: 11.5px;
	color: ${INK_45};
	padding-top: 8px;
	border-top: 1px solid ${INK_06};
	overflow-wrap: anywhere;
`

/* Collapsible processing */

const Collapsible = styled.section`
	display: flex;
	flex-direction: column;
	border-radius: 12px;
	border: 1px solid ${INK_10};
	background: ${SURFACE};
	overflow: hidden;
`

const CollapsibleHead = styled.button`
	appearance: none;
	border: 0;
	background: transparent;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 16px;
	font-family: inherit;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 1px;
	text-transform: uppercase;
	color: ${INK_60};
	cursor: pointer;

	&:hover {
		color: ${INK};
	}
`

const CollapsibleHeadStatic = styled.div`
	display: flex;
	align-items: center;
	padding: 12px 16px;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 1px;
	text-transform: uppercase;
	color: ${INK_60};
`

const CollapsibleHeadLeft = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;

	svg {
		color: ${PRIMARY};
	}
`

const Chevron = styled.span<{ $open: boolean }>`
	display: inline-flex;
	color: ${INK_45};
	transition: transform 180ms ease;
	transform: rotate(${(p) => (p.$open ? '180deg' : '0deg')});

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const CollapsibleBody = styled.div`
	padding: 4px 18px 16px;
	border-top: 1px solid ${INK_10};
`

/* ── Processing card (compact composition) ─────────────── */

const ProcessingCard = styled.section`
	display: flex;
	flex-direction: column;
	background: ${SURFACE};
	border-radius: 18px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 6px 20px -14px rgba(15, 23, 42, 0.16);
	overflow: hidden;
`

const ProcessingHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 18px;
`

const ProcessingHeadLeft = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

const ProcessingIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: rgba(3, 105, 161, 0.1);
	color: ${PRIMARY};

	svg {
		font-size: 17px !important;
	}
`

const ProcessingTitle = styled.span`
	font-size: 12.5px;
	font-weight: 500;
	letter-spacing: 1.1px;
	text-transform: uppercase;
	color: ${INK_60};
`

const ProcessingToggle = styled.button`
	appearance: none;
	border: 0;
	background: transparent;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${INK_45};
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease;

	&:hover {
		background: ${INK_06};
		color: ${INK};
	}
`

const ProcessingBody = styled.div`
	padding: 4px 18px 18px;
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const StatusLine = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const ProcStatusChip = styled.span<{ $bg: string; $fg: string }>`
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 6px 14px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
`

const ProcStatusDot = styled.span<{ $color: string }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${(p) => p.$color};
`

const PipelineState = styled.span`
	font-size: 12.5px;
	color: ${INK_60};
	font-weight: 500;
`

const ErrorNote = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 12px;
	border-radius: 8px;
	background: ${DANGER_SOFT};
	color: ${DANGER};
	font-size: 13px;
	font-weight: 600;
`

const ProcessingDivider = styled.div`
	height: 1px;
	background: ${INK_06};
	margin: 2px 0;
`

const ProcFact = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const ProcFactHead = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
`

const ProcFactIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 26px;
	height: 26px;
	border-radius: 7px;
	background: ${INK_06};
	color: ${INK_60};

	svg {
		font-size: 16px !important;
	}
`

const ProcFactLabel = styled.span`
	font-size: 11.5px;
	font-weight: 700;
	color: ${INK_60};
	letter-spacing: 0.4px;
	text-transform: uppercase;
`

const ProcFactValue = styled.span`
	font-size: 14.5px;
	font-weight: 600;
	color: ${INK};
	padding-left: 32px;
	overflow-wrap: anywhere;
`

const ModelChain = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	flex-wrap: wrap;
	padding-left: 32px;
`

const ModelChip = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 11px;
	border-radius: 7px;
	background: rgba(3, 105, 161, 0.08);
	color: ${PRIMARY};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 500;
	letter-spacing: 0.2px;
`

const ChainArrow = styled.span`
	color: ${INK_45};
	font-weight: 700;
	font-size: 16px;
`

/* ── Timeline (Received → Processed) ─────────────────── */

const Timeline = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const TimelineRow = styled.div<{ $terminal?: boolean }>`
	display: grid;
	grid-template-columns: 14px 1fr;
	column-gap: 10px;
	align-items: start;
`

const TimelineDotWrap = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	padding-top: 4px;
	min-height: 100%;
`

const TimelineDot = styled.span<{ $filled?: boolean; $color?: string }>`
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: ${(p) => (p.$filled ? (p.$color ?? PRIMARY) : 'transparent')};
	border: 2px solid ${(p) => (p.$color ?? PRIMARY)};
	box-shadow: 0 0 0 3px ${(p) => `${(p.$color ?? PRIMARY)}1a`};
`

const TimelineConnector = styled.span`
	width: 2px;
	flex: 1;
	min-height: 16px;
	background: ${INK_10};
	border-radius: 999px;
`

const TimelineBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
	padding-bottom: 2px;
	min-width: 0;
`

const TimelineLabel = styled.span`
	font-size: 11.5px;
	font-weight: 700;
	color: ${INK_45};
	letter-spacing: 0.4px;
	text-transform: uppercase;
`

const TimelineTime = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	font-size: 20px;
	font-weight: 700;
	color: ${INK};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	line-height: 1.1;
`

const TimelineDate = styled.span`
	font-size: 13px;
	font-weight: 500;
	color: ${INK_60};
	letter-spacing: 0;
`

/* ── Restored pre-redesign styled components (top info block) ── */

const GhostButton = styled.a`
	appearance: none;
	background: #fff;
	border: 1px solid ${INK_10};
	border-radius: 12px;
	padding: 10px 16px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	color: ${INK};
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 500;
	text-decoration: none;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		transition: rotate 300ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover {
		transform: translateY(-1px);
	}
	&:hover svg {
		rotate: 45deg;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		svg { transition: none; }
	}
`

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;
	padding-bottom: 26px;
	border-bottom: 1px solid ${INK_10};

	@media (max-width: 767px) {
		flex-direction: column;
		align-items: flex-start;
	}
`

const HeaderLeft = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 18px;
	min-width: 0;
`

const HeaderIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${PRIMARY_TINT};
	color: ${PRIMARY};
	flex-shrink: 0;
	animation: ${iconFloat} 4s ease-in-out infinite;

	svg {
		font-size: 28px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HeaderText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const HeaderName = styled.p`
	margin: 0;
	font-size: 24px;
	font-weight: 800;
	letter-spacing: -0.015em;
	color: ${INK};
	line-height: 1.2;
	word-break: break-word;

	@media (max-width: 767px) {
		font-size: 20px;
	}
`

const HeaderSub = styled.p`
	margin: 4px 0 0;
	font-size: 13.5px;
	font-weight: 500;
	color: ${INK_60};
	letter-spacing: 0.01em;

	strong {
		font-weight: 700;
		color: ${INK};
	}
`

const Bullet = styled.span`
	color: ${INK_45};
	margin: 0 2px;
`

const StatusBadge = styled.div<{ $bg: string; $fg: string; $border: string }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 8px 14px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	border: 1px solid ${(p) => p.$border};
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	flex-shrink: 0;
`

const Dot = styled.span<{ $color: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${(p) => p.$color};
	color: ${(p) => p.$color};
	animation: ${dotPulse} 1.8s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* ── Dark terminal status banner (restored) ─────────────────── */

const STATUS_ACCENT: Record<JobPostStatus, string> = {
	NEW: '#38bdf8',
	PROCESSING: '#38bdf8',
	FAILED: '#fb7185',
	SKIPPED: '#a1a1aa',
	PROCESSED: '#a1a1aa',
}

const StatusBanner = styled.div<{ $status: JobPostStatus }>`
	--accent: ${({ $status }) => STATUS_ACCENT[$status]};
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 14px 18px;
	border-radius: 10px;
	background: #0f0d1a;
	color: #d9d7df;
	border: 1px solid #211c2e;
	font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono',
		Menlo, monospace;
	font-size: 12.5px;
	line-height: 1.55;

	.line1 {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}
	.ts {
		color: #6c6879;
		font-weight: 500;
	}
	.tag {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 18%, transparent);
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 700;
		font-size: 11.5px;
		letter-spacing: 0.4px;
	}
	.ttl {
		color: #ffffff;
		font-weight: 600;
	}
	.body {
		color: #a9a6b2;
	}
	.actions {
		margin-top: 4px;
		display: inline-flex;
		gap: 8px;
	}
`

const BannerAction = styled.button`
	padding: 7px 14px;
	border-radius: 6px;
	border: 1px solid rgba(255, 255, 255, 0.14);
	background: rgba(255, 255, 255, 0.04);
	color: #ffffff;
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	letter-spacing: 0.3px;
	cursor: pointer;
	transition: background 160ms ease, border-color 160ms ease;
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	&:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.28);
	}
`

/* ── Chip row + pills ──────────────────────────────────────── */

const ChipRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
	margin-top: -8px;
`

const Pill = styled.span<{ $bg: string; $fg: string; $border: string }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 5px 12px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	border: 1px solid ${(p) => p.$border};
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.04em;
	text-transform: uppercase;
`

/* Larger inset — used for the Created / Viewed informational
 * pills so they read a notch more comfortable than the terse
 * Decision / Priority markers. */
const InfoPill = styled(Pill)`
	padding: 8px 14px;
	gap: 8px;
	font-size: 11.5px;
`

/* ── Hero band (restored pre-redesign) ────────────────── */

/* ── Metrics band — minimal, typography-first ──────────────── */

const MetricsBand = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 20px 24px;
	background: ${SURFACE};
	border: 1px solid ${INK_10};
	border-radius: 18px;
`

const MetricsTopRow = styled.div`
	display: grid;
	grid-template-columns: auto 1px auto 1px minmax(0, 1fr);
	column-gap: 24px;
	align-items: center;

	@media (max-width: 760px) {
		grid-template-columns: 1fr;
		row-gap: 14px;
		& > :nth-child(2),
		& > :nth-child(4) {
			display: none;
		}
	}
`

const MetricDivider = styled.span`
	display: block;
	width: 1px;
	height: 48px;
	background: ${INK_10};
`

const MetricCell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`

const MetricCaption = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};
`

const CaptionTag = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 1px 7px;
	border-radius: 999px;
	background: ${INK_06};
	color: ${INK_60};
	font-size: 10px;
	letter-spacing: 0.1em;
`

const ScoreBigRow = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 4px;
	line-height: 1;
	color: ${PRIMARY};
	font-variant-numeric: tabular-nums;
`

const ScoreBigNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 44px;
	font-weight: 800;
	letter-spacing: -0.03em;
`

const ScoreSlash = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 15px;
	font-weight: 600;
	color: ${INK_45};
`

const BudgetBigRow = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 4px;
	line-height: 1;
	color: ${INK};
	font-variant-numeric: tabular-nums;
`

const BudgetBigNum = styled.span`
	font-size: 30px;
	font-weight: 800;
	letter-spacing: -0.025em;
`

const BudgetUnit = styled.span`
	font-size: 14px;
	font-weight: 500;
	color: ${INK_60};
`

const LocationBigRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	min-width: 0;
`

const LocationFlag = styled.span`
	font-size: 22px;
	line-height: 1;
	flex-shrink: 0;
`

const LocationName = styled.span`
	font-size: 18px;
	font-weight: 700;
	color: ${INK};
	letter-spacing: -0.015em;
	line-height: 1.2;
	min-width: 0;
	overflow-wrap: anywhere;
`

const LocationCity = styled.span`
	font-weight: 500;
	color: ${INK_60};
`

const MetricsBottomRow = styled.div`
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	column-gap: 24px;
	row-gap: 10px;
	padding-top: 12px;
	border-top: 1px dashed ${INK_10};

	@media (max-width: 540px) {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}
`

const BottomStat = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`

const BottomLabel = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.16em;
	text-transform: uppercase;
	color: ${INK_45};
`

const BottomValue = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 1px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 20px;
	font-weight: 700;
	color: ${INK};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.015em;
	overflow-wrap: anywhere;
`

const BottomUnit = styled.span`
	font-size: 12.5px;
	font-weight: 500;
	color: ${INK_60};
`
