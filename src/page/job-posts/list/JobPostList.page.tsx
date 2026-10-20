import type { ReactNode } from 'react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	DeleteOutline,
	Visibility,
	VisibilityOutlined,
	SearchOutlined,
	WorkOutlineOutlined,
	AutoAwesomeOutlined,
	ClearRounded,
	ReplayRounded,
	StarRounded,
	VerifiedRounded,
	LocationOnOutlined,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import {
	COUNTRIES,
	countryDisplayName,
	flagEmoji,
	formatLocation,
	locationFlag,
} from '../../../utils/location'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type {
	DataTableColumn,
	DataTableSelection,
	SortState,
} from '../../../components/_shared/DataTable'
import BulkActionBar from '../../../components/_shared/BulkActionBar'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import { useToast } from '../../../context/toast/ToastContext'
import JobPostDeleteModal from '../../../components/job-posts/list/JobPostDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import usePermissions from '../../../hooks/usePermissions'
import type {
	JobPostDecision,
	JobPostItem,
	JobPostPriority,
	JobPostSortBy,
	JobPostStatus,
} from '../../../store/job-posts/types/definition'
import {
	useBulkAnalyzeJobPostsMutation,
	useBulkDeleteJobPostsMutation,
	useGetJobPostCitySuggestionsQuery,
	useGetJobPostListQuery,
	useMarkJobPostViewedMutation,
} from '../../../store/job-posts/jobPostsApi'
import {
	formatDate,
	formatDateTime,
	formatDateTimeSec,
} from '../../../utils/formatDate'
import { TapeIndicator, TapePill, TapePills } from '../../analytics/filters/filters.styled'
import {
	BottomSlot,
	ClearBtn,
	InlineField,
	InlineSelect,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import DatePickerPill from '../../finance-weekly/DatePickerPill'
import { Icon as IconifyIcon } from '@iconify/react'

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 300

interface DeleteTarget {
	id: string
	title: string
}

const DECISION_OPTIONS: { value: JobPostDecision | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'approve', label: 'Approve' },
	{ value: 'maybe', label: 'Maybe' },
	{ value: 'decline', label: 'Decline' },
]

const PRIORITY_OPTIONS: { value: JobPostPriority | ''; label: string }[] = [
	{ value: '', label: 'Any' },
	{ value: 'high', label: 'High' },
	{ value: 'medium', label: 'Medium' },
	{ value: 'low', label: 'Low' },
]

type StatusFilterValue = JobPostStatus | ''

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
	{ value: '', label: 'Any' },
	{ value: 'PROCESSED', label: 'Processed' },
	{ value: 'NEW', label: 'New' },
	{ value: 'PROCESSING', label: 'Processing' },
	{ value: 'FAILED', label: 'Failed' },
	{ value: 'SKIPPED', label: 'Skipped' },
]

const DEFAULT_STATUS: StatusFilterValue = 'PROCESSED'

const clampScore = (raw: string): number | null => {
	if (!raw.trim()) return null
	const n = Number(raw)
	if (!Number.isFinite(n)) return null
	return Math.min(100, Math.max(0, Math.round(n)))
}

/* Verdict colour tokens for Score · Verdict cell — declared ABOVE
 * the component so there is no TDZ risk when the columns array is
 * built inside the render body. */
type VerdictValue = 'approve' | 'maybe' | 'decline' | null | undefined

const VERDICT_COLOR: Record<'approve' | 'maybe' | 'decline', string> = {
	approve: '#15803d',
	maybe: '#a26608',
	decline: '#b91c1c',
}

const verdictLabel = (v: 'approve' | 'maybe' | 'decline'): string =>
	v === 'approve' ? 'Approve' : v === 'maybe' ? 'Maybe' : 'Decline'

/* Short-form relative time ("just now", "7m ago", "2d ago"…).
 * Returns '—' for missing input. Kept local — nothing else on the
 * page needs this exact form yet. */
/* Budget strings may end in "/hr" (hourly rate) — render that suffix
 * in regular weight via the `.unit` style on `BudgetPill`. For a
 * plain fixed-price string the function just returns it verbatim. */
const renderBudget = (budget: string): ReactNode => {
	const match = budget.match(/^(.*?)(\s*\/\s*hr)\s*$/i)
	if (!match) return budget
	return (
		<>
			{match[1]}
			<span className='unit'>{match[2]}</span>
		</>
	)
}

const relativeTimeShort = (iso: string | null | undefined): string => {
	if (!iso) return '—'
	const t = new Date(iso).getTime()
	if (!Number.isFinite(t)) return '—'
	const diff = Date.now() - t
	if (diff < 0) return 'just now'
	const sec = Math.floor(diff / 1000)
	if (sec < 60) return 'just now'
	const min = Math.floor(sec / 60)
	if (min < 60) return `${min}m ago`
	const hr = Math.floor(min / 60)
	if (hr < 24) return `${hr}h ago`
	const d = Math.floor(hr / 24)
	if (d < 30) return `${d}d ago`
	const mo = Math.floor(d / 30)
	if (mo < 12) return `${mo}mo ago`
	return `${Math.floor(mo / 12)}y ago`
}

/* Country autocomplete — text input + dropdown with two sections:
 *   • Countries (from the static ISO-3166 map in utils/location).
 *   • Cities    (from the backend `city-suggestions` endpoint,
 *                debounced and keyed by current query).
 *
 * The field stays a free-text substring (same contract as before:
 * whatever text is in state is sent to the backend's `country`
 * substring filter), so a user can still type a city name or any
 * custom fragment that no suggestion covers. Picking a country →
 * fills the full country name. Picking a city → fills the city
 * name alone (backend's `contains` matches it against both the
 * normalised `country` field and the legacy `location` string). */
type Suggestion =
	| { kind: 'country'; iso2: string; name: string; flag: string; label: string; sendValue: string }
	| { kind: 'city'; city: string; country: string | null; flag: string; label: string; sendValue: string }

interface CountryAutocompleteProps {
	value: string
	onChange: (v: string) => void
	placeholder?: string
}
const CountryAutocomplete = ({
	value,
	onChange,
	placeholder,
}: CountryAutocompleteProps) => {
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(0)
	const [debouncedQuery, setDebouncedQuery] = useState(value.trim())
	const wrapRef = useRef<HTMLDivElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	/* Debounce the query sent to the city-suggestions endpoint. */
	useEffect(() => {
		const h = setTimeout(() => setDebouncedQuery(value.trim()), 220)
		return () => clearTimeout(h)
	}, [value])

	const citiesQuery = useGetJobPostCitySuggestionsQuery(
		{ q: debouncedQuery || undefined, limit: 8 },
		{ skip: !open },
	)
	const cityRows = citiesQuery.data ?? []

	const matches: Suggestion[] = useMemo(() => {
		const q = value.trim().toLowerCase()
		const countryHits = (q === ''
			? COUNTRIES
			: COUNTRIES.filter(
					(c) =>
						c.name.toLowerCase().includes(q) || c.iso2.toLowerCase() === q,
				)
		)
			.slice(0, 8)
			.map<Suggestion>((c) => ({
				kind: 'country',
				iso2: c.iso2,
				name: c.name,
				flag: c.flag,
				label: c.name,
				sendValue: c.name,
			}))

		const cityHits = cityRows.map<Suggestion>((r) => {
			const countryName = countryDisplayName(r.country)
			const iso2 =
				r.country && r.country.length === 2
					? r.country.toUpperCase()
					: countryName
						? COUNTRY_NAMES_REVERSE[countryName.toLowerCase()] ?? ''
						: ''
			return {
				kind: 'city',
				city: r.city,
				country: countryName,
				flag: flagEmoji(iso2),
				label: countryName ? `${r.city}, ${countryName}` : r.city,
				sendValue: r.city,
			}
		})

		return [...cityHits, ...countryHits].slice(0, 12)
	}, [value, cityRows])

	useEffect(() => {
		if (!open) return
		const onDocClick = (e: MouseEvent) => {
			const target = e.target as Node
			const insideWrap = !!wrapRef.current?.contains(target)
			const insideMenu = !!menuRef.current?.contains(target)
			if (!insideWrap && !insideMenu) setOpen(false)
		}
		document.addEventListener('mousedown', onDocClick)
		return () => document.removeEventListener('mousedown', onDocClick)
	}, [open])

	useEffect(() => {
		setActive(0)
	}, [value, open])

	const pick = (s: Suggestion) => {
		onChange(s.sendValue)
		setOpen(false)
		inputRef.current?.blur()
	}

	const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setOpen(true)
			setActive((i) => Math.min(i + 1, matches.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActive((i) => Math.max(i - 1, 0))
		} else if (e.key === 'Enter' && open && matches[active]) {
			e.preventDefault()
			pick(matches[active])
		} else if (e.key === 'Escape') {
			setOpen(false)
		}
	}

	/* Portal + fixed-position avoids every stacking-context trap on
	 * the Job Posts list (sticky table headers, score hero, table
	 * z-indices). Position is tracked via getBoundingClientRect on
	 * mount, scroll and resize. */
	const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(
		null,
	)
	useLayoutEffect(() => {
		if (!open) return
		const update = () => {
			const el = wrapRef.current
			if (!el) return
			const r = el.getBoundingClientRect()
			setRect({ top: r.bottom + 6, left: r.left, width: r.width })
		}
		update()
		window.addEventListener('resize', update)
		window.addEventListener('scroll', update, true)
		return () => {
			window.removeEventListener('resize', update)
			window.removeEventListener('scroll', update, true)
		}
	}, [open])

	return (
		<CountryAutoWrap ref={wrapRef}>
			<CountryInput
				ref={inputRef}
				type='text'
				placeholder={placeholder ?? 'Any'}
				value={value}
				maxLength={60}
				onChange={(e) => {
					onChange(e.target.value)
					setOpen(true)
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={onKey}
				aria-label='Filter by country or city'
				autoComplete='off'
				role='combobox'
				aria-expanded={open}
				aria-autocomplete='list'
			/>
			{open && matches.length > 0 && rect
				? createPortal(
						<CountryMenu
							ref={menuRef}
							role='listbox'
							style={{
								top: rect.top,
								left: rect.left,
								minWidth: rect.width,
							}}
						>
							{matches.map((s, i) => (
								<CountryOption
									key={`${s.kind}:${s.kind === 'country' ? s.iso2 : s.city + '|' + (s.country ?? '')}`}
									role='option'
									aria-selected={i === active}
									$active={i === active}
									onMouseDown={(e) => {
										e.preventDefault()
										pick(s)
									}}
									onMouseEnter={() => setActive(i)}
								>
									<span className='flag'>{s.flag || '🏳️'}</span>
									<span className='name'>{s.label}</span>
									<span className='code'>
										{s.kind === 'country' ? s.iso2 : 'city'}
									</span>
								</CountryOption>
							))}
						</CountryMenu>,
						document.body,
					)
				: null}
		</CountryAutoWrap>
	)
}

/* Name (lowercased) → ISO2 map, computed once from the static
 * COUNTRIES list. Used to resolve a flag emoji for city rows that
 * store their country as a full name instead of a 2-letter code. */
const COUNTRY_NAMES_REVERSE: Record<string, string> = Object.fromEntries(
	COUNTRIES.map((c) => [c.name.toLowerCase(), c.iso2]),
)

const JobPostList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchParams, setSearchParams] = useSearchParams()

	// URL-synced filter state. The URL is the source of truth so a
	// deep link reproduces the exact filter configuration (also the
	// prev/next flow on the detail page relies on it).
	const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')
	const [search, setSearch] = useState(searchParams.get('q') ?? '')
	const [page, setPage] = useState(() => {
		const raw = Number(searchParams.get('p'))
		return Number.isFinite(raw) && raw > 0 ? raw : 1
	})
	const [sort, setSort] = useState<SortState | null>(() => {
		const key = searchParams.get('sortBy')
		const dir = searchParams.get('sortDir')
		if (!key) return null
		return {
			key,
			direction: dir === 'asc' ? 'asc' : 'desc',
		} as SortState
	})
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)
	const [bulkRetryOpen, setBulkRetryOpen] = useState(false)
	const [filterDecision, setFilterDecision] = useState<JobPostDecision | ''>(
		(searchParams.get('decision') as JobPostDecision) ?? '',
	)
	const [filterPriority, setFilterPriority] = useState<JobPostPriority | ''>(
		(searchParams.get('priority') as JobPostPriority) ?? '',
	)
	const [filterStatus, setFilterStatus] = useState<StatusFilterValue>(() => {
		const raw = searchParams.get('status')
		if (raw === 'any') return ''
		return (raw as JobPostStatus) || DEFAULT_STATUS
	})
	const [filterMinScore, setFilterMinScore] = useState<string>(
		searchParams.get('minScore') ?? '',
	)
	const [filterMaxScore, setFilterMaxScore] = useState<string>(
		searchParams.get('maxScore') ?? '',
	)
	const [filterFrom, setFilterFrom] = useState<string>(
		searchParams.get('from') ?? '',
	)
	const [filterTo, setFilterTo] = useState<string>(searchParams.get('to') ?? '')
	const [filterViewed, setFilterViewed] = useState<'' | 'viewed' | 'unviewed'>(
		(searchParams.get('viewed') as 'viewed' | 'unviewed') ?? '',
	)
	const [filterCountry, setFilterCountry] = useState<string>(
		searchParams.get('country') ?? '',
	)
	const [countryInput, setCountryInput] = useState<string>(
		searchParams.get('country') ?? '',
	)

	// Debounce search input → server request; also snap back to page 1 whenever
	// the effective query (search or sort) changes.
	useEffect(() => {
		const h = setTimeout(() => {
			setSearch(searchInput.trim())
			setPage(1)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(h)
	}, [searchInput])

	// Country input shares the same debounce timing as Search.
	useEffect(() => {
		const h = setTimeout(() => {
			setFilterCountry(countryInput.trim())
			setPage(1)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(h)
	}, [countryInput])

	// Reset to page 1 whenever any filter changes.
	useEffect(() => {
		setPage(1)
	}, [
		filterDecision,
		filterPriority,
		filterStatus,
		filterMinScore,
		filterMaxScore,
		filterFrom,
		filterTo,
		filterViewed,
		filterCountry,
	])

	// Push the filter state back to the URL so a deep link / refresh
	// reproduces the exact view. Also feeds prev/next on the detail
	// page which reads these same params.
	useEffect(() => {
		const next = new URLSearchParams()
		if (search) next.set('q', search)
		if (filterDecision) next.set('decision', filterDecision)
		if (filterPriority) next.set('priority', filterPriority)
		if (filterStatus !== DEFAULT_STATUS) {
			next.set('status', filterStatus === '' ? 'any' : filterStatus)
		}
		if (filterMinScore) next.set('minScore', filterMinScore)
		if (filterMaxScore) next.set('maxScore', filterMaxScore)
		if (filterFrom) next.set('from', filterFrom)
		if (filterTo) next.set('to', filterTo)
		if (filterViewed) next.set('viewed', filterViewed)
		if (filterCountry) next.set('country', filterCountry)
		if (sort?.key) {
			next.set('sortBy', sort.key)
			if (sort.direction) next.set('sortDir', sort.direction)
		}
		if (page > 1) next.set('p', String(page))
		setSearchParams(next, { replace: true })
	}, [
		search,
		filterDecision,
		filterPriority,
		filterStatus,
		filterMinScore,
		filterMaxScore,
		filterFrom,
		filterTo,
		filterViewed,
		filterCountry,
		sort,
		page,
		setSearchParams,
	])

	/* Sliding orange tape indicator for the primary (decision) filter. */
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{
		left: number
		width: number
		opacity: number
	}>({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		if (!pillsRef.current) return
		const el = pillsRef.current.querySelector<HTMLButtonElement>('[data-active="true"]')
		if (el) {
			setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
		}
	}, [filterDecision])

	const activeDecisionLabel =
		DECISION_OPTIONS.find((o) => o.value === filterDecision)?.label ?? '—'

	const minScoreNum = useMemo(() => clampScore(filterMinScore), [filterMinScore])
	const maxScoreNum = useMemo(() => clampScore(filterMaxScore), [filterMaxScore])

	const activeFilterCount = useMemo(() => {
		return [
			searchInput.trim() ? 1 : 0,
			filterDecision ? 1 : 0,
			filterPriority ? 1 : 0,
			filterStatus !== DEFAULT_STATUS ? 1 : 0,
			minScoreNum != null ? 1 : 0,
			maxScoreNum != null ? 1 : 0,
			filterFrom ? 1 : 0,
			filterTo ? 1 : 0,
			filterViewed ? 1 : 0,
			countryInput.trim() ? 1 : 0,
		].reduce((a, b) => a + b, 0)
	}, [
		searchInput,
		filterDecision,
		filterPriority,
		filterStatus,
		minScoreNum,
		maxScoreNum,
		filterFrom,
		filterTo,
		filterViewed,
		countryInput,
	])

	const clearAll = () => {
		setSearchInput('')
		setFilterDecision('')
		setFilterPriority('')
		setFilterStatus(DEFAULT_STATUS)
		setFilterMinScore('')
		setFilterMaxScore('')
		setFilterFrom('')
		setFilterTo('')
		setFilterViewed('')
		setCountryInput('')
		setFilterCountry('')
	}

	const offset = (page - 1) * PAGE_SIZE

	const { data, isLoading, isError, refetch } = useGetJobPostListQuery({
		limit: PAGE_SIZE,
		offset,
		search: search || undefined,
		decision: filterDecision || undefined,
		priority: filterPriority || undefined,
		status: filterStatus || undefined,
		country: filterCountry || undefined,
		minScore: minScoreNum ?? undefined,
		maxScore: maxScoreNum ?? undefined,
		createdFrom: filterFrom ? new Date(filterFrom).toISOString() : undefined,
		createdTo: filterTo ? new Date(`${filterTo}T23:59:59`).toISOString() : undefined,
		sortBy: (sort?.key as JobPostSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
		viewed: filterViewed || undefined,
	})

	const { hasAll } = usePermissions()
	const canDelete = hasAll(['job_posts:delete'])
	const canScannerManage = hasAll(['settings_scanner:update'])

	const [markViewed] = useMarkJobPostViewedMutation()
	const [bulkDeleteJobPosts, { isLoading: bulkDeleting }] =
		useBulkDeleteJobPostsMutation()
	const [bulkAnalyzeJobPosts, { isLoading: bulkRetrying }] =
		useBulkAnalyzeJobPostsMutation()
	const openJobPost = (id: string) => {
		markViewed(id)
		navigate(`/job-posts/preview/${id}`)
	}
	const items = data?.data ?? []
	const total = data?.meta.total ?? 0

	// Prune stale ids after each refetch.
	useEffect(() => {
		if (selected.size === 0) return
		const live = new Set(items.map((r) => r.id))
		let changed = false
		const next = new Set<string>()
		for (const id of selected) {
			if (live.has(id)) next.add(id)
			else changed = true
		}
		if (changed) setSelected(next)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [items])

	// Count of FAILED posts in the current selection — drives the
	// "Retry analysis" button visibility and label. The backend
	// also narrows to FAILED (defence in depth); pre-filtering here
	// avoids sending inert ids and produces an honest confirmation
	// count.
	const failedSelectedIds = useMemo(
		() =>
			items
				.filter((r) => selected.has(r.id) && r.status === 'FAILED')
				.map((r) => r.id),
		[items, selected],
	)
	const failedSelectedCount = failedSelectedIds.length

	const selection = useMemo<DataTableSelection<JobPostItem>>(
		() => ({
			selected,
			onToggleRow: (id, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					if (next) n.add(id)
					else n.delete(id)
					return n
				}),
			onToggleAllOnPage: (rows, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					for (const r of rows) {
						if (next) n.add(r.id)
						else n.delete(r.id)
					}
					return n
				}),
			headerLabel: 'Select every job post on this page',
			rowLabel: (r) => `Select job post ${r.title ?? r.id}`,
		}),
		[selected],
	)

	const handleBulkDelete = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		try {
			const res = await bulkDeleteJobPosts(ids).unwrap()
			showToast(
				`Deleted ${res.deleted} job post${res.deleted === 1 ? '' : 's'}`,
				'success',
			)
			setSelected(new Set())
			setBulkOpen(false)
			refetch()
		} catch {
			showToast('Bulk delete failed', 'error')
		}
	}

	const handleBulkRetry = async () => {
		if (failedSelectedIds.length === 0) return
		try {
			const res = await bulkAnalyzeJobPosts(failedSelectedIds).unwrap()
			showToast(
				`Retrying ${res.requeued} failed post${res.requeued === 1 ? '' : 's'}`,
				'success',
			)
			setSelected(new Set())
			setBulkRetryOpen(false)
			refetch()
		} catch {
			showToast('Retry failed', 'error')
		}
	}


	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	const columns: DataTableColumn<JobPostItem>[] = [
		{
			key: 'title',
			label: 'Title',
			minWidth: 440,
			sortable: true,
			sortValue: (r) => r.title ?? '',
			render: (r) => {
				const viewedAt = r.viewedAt ?? null
				return (
					<TitleRow>
						{viewedAt ? (
							<Tooltip
								title={
									<ViewedTooltipBody>
										<span className='k'>Last viewed</span>
										<span className='v'>
											<span className='rel'>{relativeTimeShort(viewedAt)}</span>
											<span className='abs'>· {formatDateTime(viewedAt)}</span>
										</span>
									</ViewedTooltipBody>
								}
								placement='top'
								arrow
								enterDelay={120}
								leaveDelay={0}
								slotProps={{
									tooltip: {
										sx: {
											background: 'rgba(15, 13, 26, 0.92)',
											color: '#fff',
											padding: '8px 12px',
											borderRadius: '10px',
											minWidth: 180,
											boxShadow:
												'0 10px 28px -10px rgba(15, 13, 26, 0.45)',
											backdropFilter: 'saturate(140%)',
											fontFamily: 'inherit',
											'& .MuiTooltip-arrow': {
												color: 'rgba(15, 13, 26, 0.92)',
											},
										},
									},
								}}
							>
								<ViewedDot aria-label='Viewed'>
									<Visibility style={{ fontSize: 20 }} />
								</ViewedDot>
							</Tooltip>
						) : (
							<ViewedSpacer aria-hidden />
						)}
						<TitleLink onClick={() => openJobPost(r.id)}>{r.title ?? '—'}</TitleLink>
					</TitleRow>
				)
			},
			skeleton: (i) => <TableSkeleton $w={`${260 + ((i * 41) % 160)}px`} $h='14px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => r.status,
			render: (r) => <StatusPill $status={r.status}>{r.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			// Platform marker — reuses the same `@iconify/react`
			// `simple-icons:upwork` glyph already used in
			// `ProfileDropdown.tsx` for the "Upwork profile" link, so
			// the icon is visually consistent across the app. Painted
			// in the theme's muted purple on a transparent background;
			// no fill, no border. Content-sized column; header + icon
			// centred; no sort, no filter; tooltip 'Upwork' kept.
			key: 'platform',
			label: 'Platform',
			sortable: false,
			className: 'col-center',
			render: () => (
				<PlatformCell>
					<Tooltip title='Upwork' placement='top'>
						<PlatformMark role='img' aria-label='Upwork'>
							<IconifyIcon
								icon='simple-icons:upwork'
								width='24'
								height='24'
							/>
						</PlatformMark>
					</Tooltip>
				</PlatformCell>
			),
			skeleton: () => (
				<PlatformCell>
					<TableSkeleton $w='24px' $h='24px' style={{ borderRadius: 6 }} />
				</PlatformCell>
			),
		},
		{
			/* Gatekeeper (Haiku, Stage 1) score + verdict in the same
			 * two-tier cell as Score · Verdict EV. Score is Haiku's
			 * self-reported confidence × 100 (so it reads on the same
			 * /100 scale as the evaluator). Verdict label is Pass /
			 * Reject with the same colour palette the evaluator uses
			 * (approve-green for pass, decline-red for reject). */
			key: 'verdictGK',
			label: 'Score · Verdict GK',
			minWidth: 150,
			render: (r) => <VerdictGKCell row={r} />,
			skeleton: () => (
				<ScoreVerdictCell $v={null}>
					<span className='num'>
						<TableSkeleton $w='28px' $h='18px' />
					</span>
					<span className='meta'>
						<TableSkeleton $w='48px' $h='10px' />
					</span>
				</ScoreVerdictCell>
			),
		},
		{
			/* Binary gate-pass pill: did the row survive the gate and
			 * reach Sonnet? Derived from `evaluation` presence (which
			 * is set only when Sonnet actually ran). Overlaps with the
			 * previous column but is faster to scan in bulk. */
			key: 'gatePassed',
			label: 'Gate',
			minWidth: 90,
			render: (r) => <GatePassedCell row={r} />,
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			// colour per row instead of two separate pills — kills the
			// "zoo" of competing colour chips. Sorts by score; verdict
			// is the visual accent. Shows `—` when the row was killed
			// at the gate (never reached Sonnet).
			key: 'matchScore',
			label: 'Score · Verdict EV',
			minWidth: 150,
			sortable: true,
			sortValue: (r) => r.matchScore,
			render: (r) => {
				const gateKilled =
					r.aiResponse?.gatekeeper && !r.aiResponse?.evaluation
				if (gateKilled) return <Muted>—</Muted>
				if (r.matchScore == null && !r.decision) return <Muted>—</Muted>
				const showVerdict =
					r.decision && r.status === 'PROCESSED' ? r.decision : null
				return (
					<ScoreVerdictCell $v={showVerdict}>
						<span className='num'>
							{r.matchScore != null ? r.matchScore : '—'}
							{r.matchScore != null ? (
								<span className='scale' aria-hidden='true'>/100</span>
							) : null}
						</span>
						<span className='meta'>
							{showVerdict ? verdictLabel(showVerdict) : '—'}
						</span>
					</ScoreVerdictCell>
				)
			},
			skeleton: () => (
				<ScoreVerdictCell $v={null}>
					<span className='num'>
						<TableSkeleton $w='28px' $h='18px' />
					</span>
					<span className='meta'>
						<TableSkeleton $w='48px' $h='10px' />
					</span>
				</ScoreVerdictCell>
			),
		},
		{
			key: 'hireRate',
			label: 'Hire rate',
			minWidth: 100,
			sortable: true,
			sortValue: (r) => r.hireRate,
			render: (r) => <Num>{r.hireRate != null ? `${Math.round(r.hireRate * 100)}%` : '—'}</Num>,
			skeleton: () => <TableSkeleton $w='44px' $h='13px' />,
		},
		{
			key: 'clientRating',
			label: 'Rating',
			sortable: false,
			render: (r) =>
				r.clientRating != null ? (
					<RatingCell>
						<StarRounded sx={{ fontSize: 18, color: '#F5B100' }} />
						{r.clientRating.toFixed(2)}
					</RatingCell>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='55px' $h='13px' />,
		},
		{
			key: 'budget',
			label: 'Budget',
			minWidth: 150,
			// `budget` is a legacy display string; `budgetMin` is the
			// normalised numeric. Keep sort off until the next pass:
			// mixing hourly + fixed into one numeric is misleading.
			sortable: false,
			render: (r) => (r.budget ? <BudgetPill>{renderBudget(r.budget)}</BudgetPill> : <Muted>—</Muted>),
			skeleton: () => <TableSkeleton $w='110px' $h='24px' style={{ borderRadius: 8 }} />,
		},
		{
			key: 'totalSpent',
			label: 'Total spent',
			minWidth: 120,
			sortable: true,
			sortValue: (r) => r.totalSpent,
			render: (r) => (
				<MoneyNum>{r.totalSpent != null ? `$${r.totalSpent.toLocaleString()}` : '—'}</MoneyNum>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'avgRatePaid',
			label: 'Avg rate',
			sortable: true,
			sortValue: (r) => r.avgRatePaid,
			render: (r) =>
				r.avgRatePaid != null ? (
					<MoneyNum>
						${r.avgRatePaid.toLocaleString()}
						<span className='unit'>/hr</span>
					</MoneyNum>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='70px' $h='13px' />,
		},
		{
			key: 'clientHires',
			label: 'Hires',
			sortable: false,
			render: (r) =>
				r.clientHires != null ? (
					<PlainNum>{r.clientHires.toLocaleString()}</PlainNum>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='40px' $h='13px' />,
		},
		{
			key: 'clientPaymentVerified',
			label: 'Payment',
			sortable: false,
			render: (r) =>
				r.clientPaymentVerified === true ? (
					<PaymentChip $verified>
						<VerifiedRounded sx={{ fontSize: 14 }} />
						Verified
					</PaymentChip>
				) : r.clientPaymentVerified === false ? (
					<PaymentChip>Unverified</PaymentChip>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='75px' $h='18px' style={{ borderRadius: 8 }} />,
		},
		{
			key: 'location',
			label: 'Location',
			minWidth: 160,
			sortable: true,
			sortValue: (r) => r.country ?? r.location ?? '',
			render: (r) => {
				const label = formatLocation({
					city: r.city,
					country: r.country,
					location: r.location,
				})
				if (!label) return <Muted>—</Muted>
				/* Resolve flag from the normalised country field first,
				 * then fall back to parsing the free-text location — same
				 * precedence Leads / Clients tables use. `locationFlag`
				 * handles ISO-2 codes AND common informal aliases
				 * (UK → GB, USA → US, etc.) so we route everything
				 * through it instead of calling `flagEmoji` directly. */
				const flag = locationFlag(r.country) || locationFlag(r.location)
				/* Split on the first comma so City renders in strong
				 * ink and Country stays muted — two-tier hierarchy
				 * makes the cell scannable without inflating font-size. */
				const comma = label.indexOf(',')
				const head = comma >= 0 ? label.slice(0, comma) : label
				const tail = comma >= 0 ? label.slice(comma + 1).trim() : null
				return (
					<LocationCell>
						<span className='pin'>
							{flag ? (
								<span className='flag'>{flag}</span>
							) : (
								<LocationOnOutlined />
							)}
						</span>
						<span className='head'>{head}</span>
						{tail ? <span className='tail'>, {tail}</span> : null}
					</LocationCell>
				)
			},
			skeleton: () => <TableSkeleton $w='100px' $h='13px' />,
		},
		{
			key: 'created',
			label: 'Created',
			sortable: true,
			sortValue: (r) => new Date(r.createdAt),
			render: (r) => <DateCell>{formatDateTimeSec(r.createdAt)}</DateCell>,
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => openJobPost(r.id)}
						aria-label='View job post'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='job_posts:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() =>
								setDeleteTarget({ id: r.id, title: r.title ?? 'this job post' })
							}
							aria-label='Delete job post'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	return (
		<>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='crumb-parent'>Pipeline</span>
							<span className='crumb-sep' aria-hidden='true'>
								/
							</span>
							<span className='current'>Job posts</span>
						</Crumbs>

	
						<PageHead>
							<div className='title'>
								<HeadIcon>
									<WorkOutlineOutlined />
								</HeadIcon>
								<div className='title-text'>
									<h1>Job posts</h1>
									<p>Incoming job feeds with AI-assisted decisions and priorities.</p>
								</div>
							</div>
							<div className='title-right' aria-hidden='true'>
								<span className='hand-line'>chase the good ones</span>
								<span className='hand-flourish'>
									<svg viewBox='0 0 120 20' width='120' height='20'>
										<path
											d='M2 12 C 28 2, 60 22, 96 6'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
										<path
											d='M88 4 L 98 6 L 92 14'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</span>
							</div>
						</PageHead>

						<FiltersBlock role='region' aria-label='Job post filters'>
							<TopFilterRow>
								<DecisionGroup>
									<div className='filter-lead'>
										<span className='lead-icon'>
											<AutoAwesomeOutlined />
										</span>
										<div className='lead-text'>
											<span className='top'>Decision</span>
											<span className='bot'>{activeDecisionLabel}</span>
										</div>
									</div>

									<TapePills ref={pillsRef} role='tablist' aria-label='Decision'>
										<TapeIndicator
											style={{
												transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
												width: `${ind.width}px`,
												opacity: ind.opacity,
											}}
										/>
										{DECISION_OPTIONS.map((opt) => (
											<TapePill
												key={opt.value || 'all'}
												type='button'
												role='tab'
												data-active={filterDecision === opt.value || undefined}
												aria-selected={filterDecision === opt.value}
												$active={filterDecision === opt.value}
												onClick={() => setFilterDecision(opt.value)}
											>
												{opt.label}
											</TapePill>
										))}
									</TapePills>
								</DecisionGroup>

								<BulkBarSlot aria-live='polite'>
									<BulkActionBar
										persistent
										count={selected.size}
										onClear={() => setSelected(new Set())}
										onConfirm={() => setBulkOpen(true)}
										isLoading={bulkDeleting}
										hideDelete={!canDelete}
										secondaryActions={
											canScannerManage
												? [
													{
														key: 'retry',
														label: 'Retry analysis',
														count: failedSelectedCount,
														icon: <ReplayRounded />,
														tone: 'default',
														onClick: () => setBulkRetryOpen(true),
														isLoading: bulkRetrying,
														disabled: failedSelectedCount === 0,
													},
												]
												: undefined
										}
									/>
								</BulkBarSlot>
							</TopFilterRow>

							<BottomFilterRow>
								<InlineField>
									<span className='l'>Priority</span>
									<InlineSelect
										value={filterPriority}
										onChange={(e) =>
											setFilterPriority(e.target.value as JobPostPriority | '')
										}
									>
										{PRIORITY_OPTIONS.map((opt) => (
											<option key={opt.value || 'any'} value={opt.value}>
												{opt.label}
											</option>
										))}
									</InlineSelect>
								</InlineField>

								<InlineField>
									<span className='l'>Status</span>
									<InlineSelect
										value={filterStatus}
										onChange={(e) =>
											setFilterStatus(e.target.value as StatusFilterValue)
										}
									>
										{STATUS_OPTIONS.map((opt) => (
											<option key={opt.value} value={opt.value}>
												{opt.label}
											</option>
										))}
									</InlineSelect>
								</InlineField>

								<InlineField>
									<span className='l'>Viewed</span>
									<InlineSelect
										value={filterViewed}
										onChange={(e) =>
											setFilterViewed(
												e.target.value as '' | 'viewed' | 'unviewed',
											)
										}
									>
										<option value=''>Any</option>
										<option value='unviewed'>Unviewed</option>
										<option value='viewed'>Viewed</option>
									</InlineSelect>
								</InlineField>

								<InlineField>
									<span className='l'>Country</span>
									<CountryAutocomplete
										value={countryInput}
										onChange={setCountryInput}
										placeholder='Any'
									/>
								</InlineField>

								<RangeGroup aria-label='Score range'>
									<InlineField>
										<span className='l'>Score min</span>
										<ScoreInput
											type='number'
											inputMode='numeric'
											min={0}
											max={100}
											step={1}
											placeholder='0'
											value={filterMinScore}
											onChange={(e) => setFilterMinScore(e.target.value)}
											aria-label='Minimum match score'
										/>
									</InlineField>

									<RangeDash aria-hidden='true'>—</RangeDash>

									<InlineField>
										<span className='l'>Score max</span>
										<ScoreInput
											type='number'
											inputMode='numeric'
											min={0}
											max={100}
											step={1}
											placeholder='100'
											value={filterMaxScore}
											onChange={(e) => setFilterMaxScore(e.target.value)}
											aria-label='Maximum match score'
										/>
									</InlineField>
								</RangeGroup>

								<RangeGroup aria-label='Date range'>
									<BottomSlot>
										<DatePickerPill
											label='From'
											value={filterFrom}
											onChange={setFilterFrom}
											accent='orange'
											size='lg'
											placeholder='Any'
										/>
									</BottomSlot>

									<RangeDash aria-hidden='true'>—</RangeDash>

									<BottomSlot>
										<DatePickerPill
											label='To'
											value={filterTo}
											onChange={setFilterTo}
											accent='orange'
											size='lg'
											placeholder='Any'
										/>
									</BottomSlot>
								</RangeGroup>

								<SearchPill className='search'>
									<SearchOutlined className='ico' />
									<input
										type='text'
										name='search-job-post'
										placeholder='Search'
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										aria-label='Search job posts by title'
									/>
								</SearchPill>

								<ClearBtn
									className='clear'
									type='button'
									onClick={clearAll}
									disabled={activeFilterCount === 0}
								>
									<ClearRounded style={{ fontSize: 15 }} />
									Clear
								</ClearBtn>
							</BottomFilterRow>
						</FiltersBlock>

						<TableWrap>
							<DataTable
								columns={columns}
								rows={items}
								rowKey={(r) => r.id}
								isLoading={isLoading}
								isError={isError}
								onRetry={refetch}
								searchActive={activeFilterCount > 0}
								sort={sort}
								onSortChange={handleSortChange}
								pagination={{
									page,
									pageSize: PAGE_SIZE,
									total,
									onPageChange: setPage,
								}}
								selection={selection}
							/>
						</TableWrap>
					</ShellInner>
				</ShellCard>
			</ViewFade>

			{deleteTarget && (
				<JobPostDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (items.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}

			{bulkOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Delete ${selected.size} job post${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> job post{selected.size === 1 ? '' : 's'}. This cannot be undone.
						</>
					}
					confirmLabel={`Delete ${selected.size}`}
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setBulkOpen(false)}
					onConfirm={handleBulkDelete}
					isLoading={bulkDeleting}
				/>
			)}

			{bulkRetryOpen && (
				<ConfirmModal
					icon={<ReplayRounded />}
					iconTone='info'
					title={`Retry analysis for ${failedSelectedCount} failed post${failedSelectedCount === 1 ? '' : 's'}?`}
					description={
						<>
							Only posts with status <strong>Failed</strong> will be re-queued. Other selected rows are left untouched. If AI is currently paused, the posts wait until you resume it.
						</>
					}
					confirmLabel={`Retry ${failedSelectedCount}`}
					confirmLoadingLabel='Queuing…'
					onClose={() => setBulkRetryOpen(false)}
					onConfirm={handleBulkRetry}
					isLoading={bulkRetrying}
				/>
			)}

		</>
	)
}

export default JobPostList

/**
 * Height-collapsing row for the bulk-action bar. When no rows are
 * selected we want the surrounding filters to NOT jump into the
 * vacated space abruptly — the row animates its own grid-row-size
 * between 0fr and 1fr in sync with the bar's own fade/scale, so
 * everything downstream slides into place smoothly. Modern browsers
 * (Chrome 117+, Firefox 123+, Safari 17.4+) animate the fr-unit
 * change natively; older ones fall back to an instant collapse,
 * which is the pre-fix behaviour.
 */
/**
 * Inline slot in the filters row that holds the BulkActionBar. It
 * ALWAYS takes the same space in the layout (reserved min-width),
 * so appearing / disappearing bulk-selection never shifts the
 * search pill, the filters below it or the table.
 *
 * The old below-filters `BulkBarRow` was a full-width grid-row that
 * expanded with grid-template-rows 0fr→1fr. That worked, but it
 * added a dedicated row to the page vertical rhythm and pushed the
 * filters/table down by its own height. Here we instead reserve
 * horizontal space in the filters row — the row's `.filter-spacer`
 * already absorbs the leftover width, so making the slot a fixed
 * right-aligned block costs no additional vertical pixels.
 *
 * Visibility toggle uses `visibility + opacity + transform` instead
 * of `display:none`, so the slot keeps its reserved width even when
 * empty. Pointer-events + aria-hidden + inert interaction come from
 * the attributes set on the slot — see below.
 */
/* ─── Filter block layout — predictable, no-jump composition ─────
 *
 * Two rows, both reserved regardless of selection state:
 *   • Top row:    Decision group (left) + BulkBarSlot (right).
 *   • Bottom row: Search, Priority, Status, Viewed, Country,
 *                 Score range, Date range, Clear filters.
 *
 * Stability is enforced by:
 *   - BulkBarSlot reserves a fixed `min-width` (fits the full set
 *     with Retry + Delete + Clear) and `min-height` (one 42-px
 *     control row), so the top row's height and the slot's column
 *     width do NOT depend on `selected.size` or whether Retry is
 *     visible.
 *   - Toggling visibility uses `visibility + opacity + transform`,
 *     never `display:none`, so the slot keeps its reserved space.
 *   - At narrow widths, the slot wraps to its own row below the
 *     decision group — the wrap happens the SAME WAY whether
 *     selection is empty or not, so no shift when toggling.
 *   - Bottom row is flex-wrap but Score min/max and Date From/To
 *     are inside `RangeGroup` (flex-nowrap internally), so a pair
 *     never splits across lines.
 *   - Clear filters is the LAST child with `margin-left:auto` on
 *     wide rows, so it sits at the end of its line without a
 *     dedicated row.
 */
const FiltersBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const TopFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px 16px;
	/* Row height is pinned so the appearance / disappearance of the
	 * BulkActionBar inside the slot cannot grow the row. Must be at
	 * least as tall as the tallest child — DecisionGroup's dark chip
	 * (≈ 50 px) and the mounted BulkActionBar (≈ 48 px). */
	min-height: 56px;
`

const DecisionGroup = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 14px;
	flex: 1 1 auto;
	min-width: 0;

	/* Dark "Decision / <value>" chip + icon — ported from the shared
	 * FiltersBarWrap descendant styles, since this component lives
	 * outside that wrap now. */
	.filter-lead {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding-right: 22px;
		border-right: 1px solid rgba(36, 30, 22, 0.08);
	}
	.filter-lead .lead-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		background: #241e16;
		color: #fdfaf2;
		transition:
			transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
			background 220ms ease;
	}
	.filter-lead .lead-icon svg {
		font-size: 20px;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.filter-lead:hover .lead-icon {
		transform: rotate(-6deg) scale(1.08);
		background: #e85d2f;
	}
	.filter-lead .lead-text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 78px;
	}
	.filter-lead .lead-text .top {
		font-family: 'Fraunces', 'Georgia', serif;
		font-variation-settings: 'opsz' 36;
		font-size: 17px;
		font-weight: 600;
		color: #241e16;
		letter-spacing: -0.2px;
	}
	.filter-lead .lead-text .bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 10.5px;
		color: #7d6e5d;
		letter-spacing: 0.7px;
		text-transform: uppercase;
		margin-top: 3px;
		white-space: nowrap;
		transition: color 200ms ease;
	}
	.filter-lead:hover .lead-text .bot {
		color: #e85d2f;
	}
`

const BottomFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 10px 12px;

	/* Search sits AFTER the filter/status/range group, trailing on
	 * the same line. No flex-grow — otherwise it would push Clear
	 * off to the right by stealing the remaining width. */
	.search {
		flex: 0 0 auto;
		min-width: 180px;
	}
	.search input {
		width: 180px;
	}

	/* Clear filters: anchored to the right of its line (wide screen
	 * = same row as the rest; wrapped screen = right edge of the
	 * last line it lands on). */
	.clear {
		margin-left: auto;
	}
`

/* Pure spacer. The slot's job is to reserve **the exact amount of
 * space the fullest BulkActionBar needs** so appearing / disappearing
 * never shifts siblings. The enter/exit animation is owned by
 * BulkActionBar itself (barEnter / barExit keyframes inside the
 * shared component). We deliberately do NOT animate the slot too —
 * two competing wrapper + content animations would fight each other
 * and keep the exit visibly cropped.
 *
 * `min-width` + `min-height` are the reservation; `justify-content:
 * flex-end` right-aligns the content inside its reserved box.
 * When BulkActionBar is unmounted (`count === 0` inside its own
 * state machine), the slot is literally empty in the DOM but still
 * occupies the reserved box, so the row doesn't jump.
 *
 * At narrow widths (≤ 1180 px) the slot grows to full width and
 * wraps to its own line below the Decision group. Crucially, the
 * wrap happens the SAME WAY whether selection is empty or not —
 * the slot ALWAYS occupies the same space, so toggling selection
 * never changes the top-row line count. */
const BulkBarSlot = styled.div`
	/* Fixed-size box: flex-grow:0, flex-shrink:0, flex-basis set to
	 * a width that comfortably holds the fullest BulkActionBar
	 * content ("NN selected · Retry analysis (NN) · Clear · Delete"
	 * with 2-digit counts). The width is BOTH a floor and a ceiling
	 * — the slot never shrinks when empty and never grows past this
	 * when the content lands. */
	flex: 0 0 640px;
	max-width: 640px;
	margin-left: auto;
	display: flex;
	align-items: center;
	justify-content: flex-end;
	min-height: 56px;
	/* If a future variation ever produces a wider bar, clip rather
	 * than shift the row's layout — a visual clip is easier to spot
	 * than a mystery jerk during the enter animation. */
	overflow: hidden;

	@media (max-width: 1180px) {
		flex: 0 0 100%;
		max-width: 100%;
		justify-content: flex-start;
	}
`

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const handDraw = keyframes`
	from { opacity: 0; transform: translate(-6px, 4px) rotate(-6deg); }
	to   { opacity: 1; transform: translate(0, 0)     rotate(-6deg); }
`

const flourishDraw = keyframes`
	from { stroke-dashoffset: 240; opacity: 0; }
	to   { stroke-dashoffset: 0;   opacity: 1; }
`

const ViewFade = styled.div`
	animation: ${fadeUp} 240ms ${T.ease};
`

const ShellCard = styled.div`
	position: relative;
	background: ${T.cardBg};
	border-radius: ${T.radiusLg};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	overflow: hidden;
`

const ShellInner = styled.div`
	padding: 30px 32px 32px;
	display: flex;
	flex-direction: column;
	gap: 22px;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 18px;
	}
`

const Crumbs = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12.5px;
	color: ${T.textMuted};

	.crumb-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.primary};
	}
	.crumb-sep {
		opacity: 0.4;
	}
	.current {
		color: ${T.textSecondary};
		font-weight: 600;
	}
`

const PageHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
	padding-bottom: 22px;
	border-bottom: 1px solid ${T.divider};

	.title {
		display: inline-flex;
		align-items: center;
		gap: 18px;
		min-width: 0;
	}
	.title-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.title-text h1 {
		margin: 0;
		font-size: 34px;
		font-weight: 700;
		letter-spacing: -0.8px;
		line-height: 1.05;
		color: ${T.textStrong};
	}
	.title-text p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: ${T.textSecondary};
		max-width: 62ch;
	}

	.title-right {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding-right: 6px;
		flex-shrink: 0;
	}
	.hand-line {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 42px;
		font-weight: 700;
		line-height: 1;
		color: #0369a1;
		transform: rotate(-6deg);
		transform-origin: right center;
		text-shadow: 0 6px 22px rgba(2, 132, 199, 0.22);
		animation: ${handDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
		white-space: nowrap;
	}
	.hand-flourish {
		display: inline-flex;
		color: #0284c7;
		opacity: 0.75;
		margin-right: -4px;
		transform: rotate(-4deg);
	}
	.hand-flourish svg path {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: ${flourishDraw} 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.hand-line {
			animation: none;
			transform: rotate(-6deg);
		}
		.hand-flourish svg path {
			animation: none;
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}

	@media (max-width: 720px) {
		.title-text h1 {
			font-size: 28px;
			letter-spacing: -0.5px;
		}
		.title-right {
			display: none;
		}
	}
`

const HeadIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 28px;
	}
`

const TitleRow = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	min-width: 0;
	width: 100%;
`

/*
 * The viewed glyph plays a soft pop when it mounts for a row —
 * which only happens when a row transitions from unviewed to
 * viewed (React mounts the span fresh). Subsequent re-renders of
 * an already-viewed row keep the span, so the animation does
 * NOT replay on list refetches. prefers-reduced-motion disables.
 */
const viewedPop = keyframes`
	0%   { opacity: 0; transform: scale(0.4); }
	55%  { opacity: 1; transform: scale(1.18); }
	80%  { transform: scale(0.96); }
	100% { opacity: 1; transform: scale(1); }
`

const ViewedDot = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 22px;
	height: 22px;
	color: rgb(3, 105, 161);
	flex-shrink: 0;
	line-height: 0;
	transform-origin: center;
	animation: ${viewedPop} 360ms cubic-bezier(0.22, 1.4, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const ViewedSpacer = styled.span`
	display: inline-block;
	width: 22px;
	height: 22px;
	flex-shrink: 0;
`

/*
 * Dark-glass tooltip body. Caption on top in uppercase, then one
 * line with the bold relative time + muted absolute datetime
 * inline. The outer shell is styled via `slotProps.tooltip.sx` on
 * the MUI Tooltip wrapping the eye.
 */
const ViewedTooltipBody = styled.span`
	display: flex;
	flex-direction: column;
	gap: 3px;

	.k {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 1.3px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.6);
	}
	.v {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		font-size: 13px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.v .abs {
		font-size: 11.5px;
		font-weight: 500;
		color: rgba(255, 255, 255, 0.6);
	}
`

/* Local DataTable wrapper — only responsibility is centring the
 * Platform column header + cells. Pager styling is inherited from
 * the shared PagerBtn (shadow + slight zoom on hover). */
const TableWrap = styled.div`
	th.col-platform,
	td.col-platform {
		text-align: center;
		padding-left: 8px;
		padding-right: 8px;
	}
`
/* Platform column — centred wrapper so the icon sits in the middle
 * of the cell at every row height, including the skeleton state. */
const PlatformCell = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
`
/* Platform marker wrapper — paints the iconify SVG via currentColor
 * in the theme's near-black text colour on a transparent background. */
const PlatformMark = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	color: ${T.textStrong};
	line-height: 0;
`

const TitleLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 14.5px;
	font-weight: 500;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
	flex: 1;
	min-width: 0;

	&:hover {
		color: ${T.primary};
	}
`

const Num = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 14px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;

	.unit {
		font-weight: 400;
		color: ${T.textSecondary};
		margin-left: 1px;
	}
`

/* Dollar-amount variant of `Num`: one notch larger so money
 * columns (Total spent, Avg rate) read as the headline numbers
 * of the row, while percent/count cells stay at the base size. */
const MoneyNum = styled(Num)`
	font-size: 14.5px;
`

/* Non-emphatic number — same mono/tabular alignment as `Num`,
 * but weight 400 so it reads as supporting metadata (Hires count,
 * etc.) rather than a headline numeric value. */
const PlainNum = styled(Num)`
	font-weight: 400;
	color: ${T.textSecondary};
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

/* Date/time cell — same muted colour as `Muted` but refuses to
 * wrap and uses tabular numerals, so the Created / Posted
 * columns size to their content and digit columns align. */
const DateCell = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
	white-space: nowrap;
	font-variant-numeric: tabular-nums;
`

const RatingCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 14.5px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
`

const PaymentChip = styled.span<{ $verified?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 8px;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	white-space: nowrap;
	background: ${({ $verified }) =>
		$verified ? 'rgba(21, 128, 61, 0.12)' : 'rgba(100, 116, 139, 0.1)'};
	color: ${({ $verified }) => ($verified ? '#15803d' : '#64748b')};
`

/* Soft outlined group hinting that the two controls inside form a
 * single range (min—max / From—To). Dashed border + feather-light
 * tint — enough to read as a block, not loud enough to compete with
 * the inline controls. */
const RangeGroup = styled.div`
	display: inline-flex;
	align-items: flex-end;
	gap: 10px;
	align-self: flex-end;
	padding: 4px 10px;
	border: 1px dashed rgba(36, 30, 22, 0.14);
	border-radius: 14px;
`

/* Dash separator between the two halves of a range control (score
 * min / max, date From / To). Pins to the pill baseline — same
 * align-self: flex-end as the inline controls on either side. */
const RangeDash = styled.span`
	align-self: flex-end;
	display: inline-flex;
	align-items: center;
	min-height: 42px;
	padding: 0 2px;
	color: #7d6e5d;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 16px;
	font-weight: 700;
	line-height: 1;
	user-select: none;
`

const ScoreInput = styled.input`
	appearance: none;
	-webkit-appearance: none;
	box-sizing: border-box;
	min-height: 42px;
	width: 92px;
	border: 1.5px solid rgba(36, 30, 22, 0.14);
	border-radius: 999px;
	background: #ffffff;
	padding: 10px 16px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: #241e16;
	line-height: 1.2;
	font-variant-numeric: tabular-nums;
	transition: border-color 180ms ease;

	&:hover,
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: #241e16;
	}
`

const CountryAutoWrap = styled.div`
	position: relative;
	display: inline-block;
`

const CountryMenu = styled.div`
	/* Rendered via a React Portal into document.body, so it isn't
	 * trapped inside any stacking context from the filters bar /
	 * table / hero. Position is set inline from the input's rect. */
	position: fixed;
	width: max-content;
	max-width: 360px;
	max-height: 300px;
	overflow-y: auto;
	background: #ffffff;
	border: 1.5px solid rgba(36, 30, 22, 0.14);
	border-radius: 14px;
	box-shadow: 0 12px 32px -16px rgba(36, 30, 22, 0.22);
	padding: 4px;
	z-index: 10000;
`

const CountryOption = styled.div<{ $active: boolean }>`
	display: grid;
	grid-template-columns: 24px 1fr auto;
	align-items: center;
	gap: 10px;
	padding: 7px 10px;
	border-radius: 10px;
	cursor: pointer;
	background: ${({ $active }) =>
		$active ? 'rgba(15, 23, 42, 0.06)' : 'transparent'};
	transition: background 120ms ease;

	.flag {
		font-size: 18px;
		line-height: 1;
	}
	.name {
		font-size: 13px;
		font-weight: 500;
		color: #241e16;
		white-space: nowrap;
	}
	.code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10.5px;
		font-weight: 600;
		color: #7d6e5d;
		letter-spacing: 0.5px;
		padding-left: 12px;
	}
`

const CountryInput = styled(ScoreInput).attrs({ type: 'text' })`
	width: 140px;
	font-variant-numeric: normal;
	&::placeholder {
		color: rgba(125, 110, 93, 0.9);
		font-weight: 500;
	}

	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	&[type='number'] {
		-moz-appearance: textfield;
	}

	&::placeholder {
		color: #7d6e5d;
	}
`

const BudgetPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 5px 12px;
	border-radius: 8px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 14.5px;
	font-weight: 700;
	letter-spacing: 0.1px;
	color: ${T.textStrong};
	background: transparent;
	border: 0;
	white-space: nowrap;

	.unit {
		font-weight: 400;
		color: ${T.textSecondary};
		margin-left: 1px;
	}
`

/* ─── Gatekeeper diagnostic cells ───────────────────────────── */

const VerdictGKCell = ({ row }: { row: JobPostItem }) => {
	const gk = row.aiResponse?.gatekeeper
	if (!gk) return <Muted>—</Muted>
	const score = Math.round((gk.confidence ?? 0) * 100)
	/* Reuse the EV cell's $v axis so the colour palette matches
	 * exactly: fit=true → approve (green), fit=false → decline
	 * (red). Label stays stage-specific (Pass / Reject). */
	const verdict: VerdictValue = gk.fit ? 'approve' : 'decline'
	const title = gk.reason ? `${gk.reason} (${score}/100)` : `${score}/100`
	return (
		<ScoreVerdictCell $v={verdict} title={title}>
			<span className='num'>
				{score}
				<span className='scale' aria-hidden='true'>/100</span>
			</span>
			<span className='meta'>{gk.fit ? 'Pass' : 'Reject'}</span>
		</ScoreVerdictCell>
	)
}

const GatePassedCell = ({ row }: { row: JobPostItem }) => {
	const gk = row.aiResponse?.gatekeeper
	const ev = row.aiResponse?.evaluation
	if (!gk && !ev) return <Muted>—</Muted>
	const passed = Boolean(ev)
	return (
		<GatePill
			$pass={passed}
			title={passed ? 'Passed to Sonnet evaluation' : 'Killed at gatekeeper — never reached Sonnet'}
		>
			{passed ? 'Pass' : 'Reject'}
		</GatePill>
	)
}

const GatePill = styled.span<{ $pass: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;
	/* Colours intentionally match the Status column palette so a
	 * row's gate-pass pill reads in the same visual tone as a
	 * Processed status chip (green) or a Failed chip (red). */
	background: ${(p) =>
		p.$pass ? 'rgba(34, 197, 94, 0.14)' : 'rgba(239, 68, 68, 0.14)'};
	color: ${(p) => (p.$pass ? '#15803d' : '#b91c1c')};
`

const ScoreVerdictCell = styled.span<{ $v: VerdictValue }>`
	display: inline-flex;
	align-items: stretch;
	gap: 10px;
	padding-left: 8px;
	position: relative;
	min-width: 0;

	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 2px;
		bottom: 2px;
		width: 2px;
		border-radius: 999px;
		background: ${({ $v }) =>
			$v ? VERDICT_COLOR[$v] : 'rgba(148, 163, 184, 0.5)'};
	}

	.num {
		display: inline-flex;
		align-items: baseline;
		gap: 2px;
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -0.4px;
		line-height: 1;
		color: ${T.textStrong};
		font-variant-numeric: tabular-nums;
		align-self: center;
	}
	.num .scale {
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0;
		color: ${T.textMuted};
		opacity: 0.75;
	}

	.meta {
		font-size: 11.5px;
		font-weight: 800;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		line-height: 1;
		align-self: center;
		color: ${({ $v }) =>
			$v ? VERDICT_COLOR[$v] : 'rgba(133, 131, 141, 0.9)'};
	}
`

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;
	background: ${({ $status }) => {
		const s = $status.toLowerCase()
		if (s === 'new') return 'rgba(3, 105, 161, 0.12)'
		if (s === 'processed') return 'rgba(34, 197, 94, 0.14)'
		if (s === 'processing') return 'rgba(245, 158, 11, 0.16)'
		if (s === 'failed') return 'rgba(239, 68, 68, 0.14)'
		if (s === 'skipped') return 'rgba(148, 163, 184, 0.22)'
		return 'rgba(148, 163, 184, 0.18)'
	}};
	color: ${({ $status }) => {
		const s = $status.toLowerCase()
		if (s === 'new') return T.primary
		if (s === 'processed') return '#15803d'
		if (s === 'processing') return '#a26608'
		if (s === 'failed') return '#b91c1c'
		if (s === 'skipped') return '#475569'
		return '#475569'
	}};
`

/* Two-tier location cell: a country-flag badge (same shape and
 * palette as Leads / Clients tables), then the city in strong ink,
 * then ", country" in secondary ink. When the country cannot be
 * resolved the badge falls back to a muted pin icon. */
const LocationCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 14.5px;
	line-height: 1.3;
	max-width: 100%;
	min-width: 0;

	.pin {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 5px;
		background: rgba(15, 23, 42, 0.04);
		color: rgba(15, 23, 42, 0.55);
		flex-shrink: 0;

		svg {
			font-size: 16px;
		}
	}
	.flag {
		font-size: 18px;
		line-height: 1;
		/* Reset color so emoji renders at its native, full-colour
		   palette — same look as the Leads / Clients flag badge. */
		color: initial;
	}
	.head {
		font-weight: 400;
		color: ${T.textStrong};
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}
	.tail {
		font-weight: 400;
		color: ${T.textSecondary};
		white-space: nowrap;
	}
`

