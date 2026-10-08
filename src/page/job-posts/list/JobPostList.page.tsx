import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	SearchOutlined,
	WorkOutlineOutlined,
	AutoAwesomeOutlined,
	ClearRounded,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
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
import type {
	JobPostDecision,
	JobPostItem,
	JobPostPriority,
	JobPostSortBy,
	JobPostStatus,
} from '../../../store/job-posts/types/definition'
import {
	useBulkDeleteJobPostsMutation,
	useGetJobPostListQuery,
	useMarkJobPostViewedMutation,
} from '../../../store/job-posts/jobPostsApi'
import { formatDate } from '../../../utils/formatDate'
import { TapeIndicator, TapePill, TapePills } from '../../analytics/filters/filters.styled'
import {
	BottomSlot,
	ClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import DatePickerPill from '../../finance-weekly/DatePickerPill'

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

const STATUS_OPTIONS: { value: JobPostStatus; label: string }[] = [
	{ value: 'PROCESSED', label: 'Processed' },
	{ value: 'NEW', label: 'New' },
	{ value: 'PROCESSING', label: 'Processing' },
	{ value: 'FAILED', label: 'Failed' },
]

const DEFAULT_STATUS: JobPostStatus = 'PROCESSED'

const clampScore = (raw: string): number | null => {
	if (!raw.trim()) return null
	const n = Number(raw)
	if (!Number.isFinite(n)) return null
	return Math.min(100, Math.max(0, Math.round(n)))
}

const JobPostList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const [search, setSearch] = useState('')
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)
	const [filterDecision, setFilterDecision] = useState<JobPostDecision | ''>('')
	const [filterPriority, setFilterPriority] = useState<JobPostPriority | ''>('')
	const [filterStatus, setFilterStatus] = useState<JobPostStatus>(DEFAULT_STATUS)
	const [filterMinScore, setFilterMinScore] = useState<string>('')
	const [filterMaxScore, setFilterMaxScore] = useState<string>('')
	const [filterFrom, setFilterFrom] = useState<string>('')
	const [filterTo, setFilterTo] = useState<string>('')

	// Debounce search input → server request; also snap back to page 1 whenever
	// the effective query (search or sort) changes.
	useEffect(() => {
		const h = setTimeout(() => {
			setSearch(searchInput.trim())
			setPage(1)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(h)
	}, [searchInput])

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
	}

	const offset = (page - 1) * PAGE_SIZE

	const { data, isLoading, isError, refetch } = useGetJobPostListQuery({
		limit: PAGE_SIZE,
		offset,
		search: search || undefined,
		decision: filterDecision || undefined,
		priority: filterPriority || undefined,
		status: filterStatus,
		minScore: minScoreNum ?? undefined,
		maxScore: maxScoreNum ?? undefined,
		createdFrom: filterFrom ? new Date(filterFrom).toISOString() : undefined,
		createdTo: filterTo ? new Date(`${filterTo}T23:59:59`).toISOString() : undefined,
		sortBy: (sort?.key as JobPostSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})

	const [markViewed] = useMarkJobPostViewedMutation()
	const [bulkDeleteJobPosts, { isLoading: bulkDeleting }] =
		useBulkDeleteJobPostsMutation()
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

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	const columns: DataTableColumn<JobPostItem>[] = [
		{
			key: 'title',
			label: 'Title',
			minWidth: 480,
			sortable: true,
			sortValue: (r) => r.title ?? '',
			render: (r) => {
				const viewedAt = r.viewedAt ?? null
				return (
					<TitleRow>
						{viewedAt ? (
							<Tooltip title={`Viewed on ${formatDate(viewedAt)}`} placement='top'>
								<ViewedDot aria-label='Viewed'>
									<VisibilityOutlined style={{ fontSize: 12 }} />
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
			key: 'matchScore',
			label: 'Score',
			minWidth: 90,
			sortable: true,
			sortValue: (r) => r.matchScore,
			render: (r) =>
				r.matchScore != null ? (
					<ScorePill $v={r.matchScore}>{r.matchScore}</ScorePill>
				) : (
					<Muted>—</Muted>
				),
			skeleton: () => <TableSkeleton $w='48px' $h='24px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'budget',
			label: 'Budget',
			minWidth: 160,
			sortable: true,
			sortValue: (r) => r.budget ?? '',
			render: (r) => (r.budget ? <BudgetPill>{r.budget}</BudgetPill> : <Muted>—</Muted>),
			skeleton: () => <TableSkeleton $w='110px' $h='24px' style={{ borderRadius: 8 }} />,
		},
		{
			key: 'location',
			label: 'Location',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => r.location ?? '',
			render: (r) => <Muted>{r.location ?? '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'totalSpent',
			label: 'Total spent',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => r.totalSpent,
			render: (r) => (
				<Num>{r.totalSpent != null ? `$${r.totalSpent.toLocaleString()}` : '—'}</Num>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'avgRate',
			label: 'Avg rate',
			minWidth: 110,
			sortable: true,
			sortValue: (r) => r.avgRatePaid,
			render: (r) => <Num>{r.avgRatePaid != null ? `$${r.avgRatePaid}/hr` : '—'}</Num>,
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'hireRate',
			label: 'Hire rate',
			minWidth: 100,
			sortable: true,
			sortValue: (r) => r.hireRate,
			render: (r) => <Num>{r.hireRate != null ? `${r.hireRate.toFixed(2)}%` : '—'}</Num>,
			skeleton: () => <TableSkeleton $w='44px' $h='13px' />,
		},
		{
			key: 'scanner',
			label: 'Scanner',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => r.scanner ?? '',
			render: (r) => <Muted>{r.scanner ?? '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'processed',
			label: 'Processed',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => (r.processedAt ? new Date(r.processedAt) : null),
			render: (r) => <Muted>{r.processedAt ? formatDate(r.processedAt) : '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 140,
			sortable: true,
			sortValue: (r) => new Date(r.createdAt),
			render: (r) => <Muted>{formatDate(r.createdAt)}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
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

						<PermissionGate permission='job_posts:delete'>
							<BulkBarRow $open={selected.size > 0}>
								<BulkBarInner>
									<BulkActionBar
										count={selected.size}
										onClear={() => setSelected(new Set())}
										onConfirm={() => setBulkOpen(true)}
										isLoading={bulkDeleting}
									/>
								</BulkBarInner>
							</BulkBarRow>
						</PermissionGate>

						<FreshFiltersWrap role='region' aria-label='Job post filters'>
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

							<SearchPill>
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

							<div className='filter-spacer' />

							<div className='upwork-hint' aria-hidden='true'>
								<span className='row'>
									<span className='w'>signal</span>
									<span className='amber-wrap'>
										<span className='a'>not</span>
										<svg
											className='squiggle'
											viewBox='0 0 120 12'
											width='120'
											height='12'
											preserveAspectRatio='none'
										>
											<path
												d='M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 8'
												fill='none'
												stroke='currentColor'
												strokeWidth='2.2'
												strokeLinecap='round'
											/>
										</svg>
									</span>
									<span className='w'>noise</span>
								</span>
								<span className='stars'>
									<svg
										className='s'
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='currentColor'
									>
										<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
									</svg>
								</span>
							</div>

							<RowBreak />

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
									onChange={(e) => setFilterStatus(e.target.value as JobPostStatus)}
								>
									{STATUS_OPTIONS.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</InlineSelect>
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

							<div className='filter-spacer' />

							<ClearBtn type='button' onClick={clearAll} disabled={activeFilterCount === 0}>
								<ClearRounded style={{ fontSize: 15 }} />
								Clear
							</ClearBtn>
						</FreshFiltersWrap>

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
const BulkBarRow = styled.div<{ $open: boolean }>`
	display: grid;
	grid-template-rows: ${({ $open }) => ($open ? '1fr' : '0fr')};
	transition: grid-template-rows 260ms cubic-bezier(0.22, 1, 0.36, 1);
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const BulkBarInner = styled.div`
	min-height: 0;
	overflow: hidden;
	display: flex;
	justify-content: flex-end;
	padding: 0 4px 4px;
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

const ViewedDot = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: rgba(3, 105, 161, 0.12);
	color: rgb(3, 105, 161);
	border: 1px solid rgba(3, 105, 161, 0.28);
	flex-shrink: 0;
	line-height: 0;
`

const ViewedSpacer = styled.span`
	display: inline-block;
	width: 20px;
	height: 20px;
	flex-shrink: 0;
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
	font-size: 13px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
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
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.1px;
	color: ${T.textStrong};
	background: transparent;
	border: 0;
	white-space: nowrap;
`

const ScorePill = styled.span<{ $v: number }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 44px;
	padding: 4px 10px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	font-variant-numeric: tabular-nums;
	background: ${({ $v }) =>
		$v >= 75
			? 'rgba(34, 197, 94, 0.14)'
			: $v >= 50
				? 'rgba(245, 158, 11, 0.16)'
				: 'rgba(239, 68, 68, 0.12)'};
	color: ${({ $v }) => ($v >= 75 ? '#15803d' : $v >= 50 ? '#a26608' : '#b91c1c')};
	border: 0;
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
		return 'rgba(148, 163, 184, 0.18)'
	}};
	color: ${({ $status }) => {
		const s = $status.toLowerCase()
		if (s === 'new') return T.primary
		if (s === 'processed') return '#15803d'
		if (s === 'processing') return '#a26608'
		if (s === 'failed') return '#b91c1c'
		return '#475569'
	}};
`
