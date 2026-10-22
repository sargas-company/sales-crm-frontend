import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	AssessmentOutlined,
	AddRounded,
	ArrowOutwardOutlined,
	FilterListOutlined,
	SearchOutlined,
	ClearRounded,
	ArticleOutlined,
	AccessTimeOutlined,
	TrendingUpOutlined,
	CalendarMonthOutlined,
} from '@mui/icons-material'
import { T } from '../../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../../components/_shared/DataTable'
import type {
	DataTableColumn,
	DataTableSelection,
	SortState,
} from '../../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../../components/_shared/formShell.styled'
import {
	FreshFiltersWrap,
	SearchPill,
	InlineField,
	InlineSelect,
	BottomSlot,
	RowBreak,
	ClearBtn as FreshClearBtn,
} from '../../../../components/_shared/filters/freshPaperFilters'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../../../analytics/filters/filters.styled'
import PermissionGate from '../../../../components/auth/PermissionGate'
import BulkActionBar from '../../../../components/_shared/BulkActionBar'
import ConfirmModal from '../../../../components/_shared/ConfirmModal'
import { useToast } from '../../../../context/toast/ToastContext'
import type {
	ProjectReportItem,
	ProjectReportSortBy,
} from '../../../../store/project-reports/projectReportsApi'
import {
	useGetProjectReportsQuery,
	useGetProjectReportStatsQuery,
	useDeleteProjectReportMutation,
	useBulkDeleteProjectReportsMutation,
} from '../../../../store/project-reports/projectReportsApi'
import { useGetProjectsQuery } from '../../../../store/projects/projectsApi'
import { formatDate } from '../../../../utils/format'
import { formatDateTimeSec } from '../../../../utils/formatDate'
import useDebouncedValue from '../../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

/** Light-weight count-up: animates `target` from the previous value on
 *  each render; used for KPI card counters. Mirrors the inline copies
 *  on Invoices and other list pages — intentionally duplicated to
 *  avoid pulling an entire motion lib for 20 lines. */
function useCountUp(target: number, duration = 500): number {
	const [value, setValue] = useState(target)
	useEffect(() => {
		const from = value
		const to = target
		if (from === to) return
		const start = performance.now()
		let raf = 0
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			setValue(Math.round(from + (to - from) * eased))
			if (t < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target])
	return value
}

const KpiCounter = ({ value }: { value: number | undefined }) => {
	const v = useCountUp(value ?? 0)
	if (value === undefined) return <>—</>
	return <>{v}</>
}

/** Hours counter — animates in tenths, renders with one decimal. */
const KpiHoursCounter = ({ value }: { value: number | undefined }) => {
	const tenths = Math.round((value ?? 0) * 10)
	const animated = useCountUp(tenths)
	if (value === undefined) return <>—</>
	return <>{(animated / 10).toFixed(1)}</>
}

type SourcePreset = '' | 'MANUAL' | 'DISCORD'
const SOURCE_PRESETS: { value: SourcePreset; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'MANUAL', label: 'CRM' },
	{ value: 'DISCORD', label: 'Discord' },
]

const ReportList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchParams, setSearchParams] = useSearchParams()
	const projectParam = searchParams.get('projectId') ?? ''
	const fromParam = searchParams.get('from') ?? ''
	const toParam = searchParams.get('to') ?? ''
	const sourceParam = (searchParams.get('source') ?? '') as SourcePreset

	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)

	// Project list for the dropdown. 500 covers any realistic org
	// today; if we outgrow it, swap for a typeahead.
	const { data: projectsData } = useGetProjectsQuery({
		page: 1,
		limit: 500,
		sortBy: 'name',
		sortDirection: 'asc',
	})
	const projects = projectsData?.data ?? []

	const filterParams = {
		search: search || undefined,
		projectId: projectParam || undefined,
		from: fromParam || undefined,
		to: toParam || undefined,
		source: sourceParam || undefined,
	}

	const { data: stats } = useGetProjectReportStatsQuery(filterParams)

	const { data, isLoading, isError, refetch } = useGetProjectReportsQuery({
		page,
		limit: PAGE_SIZE,
		...filterParams,
		sortBy: (sort?.key as ProjectReportSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [deleteReport, { isLoading: deleting }] = useDeleteProjectReportMutation()
	const [bulkDeleteReports, { isLoading: bulkDeleting }] =
		useBulkDeleteProjectReportsMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

	const updateParam = (key: string, value: string) => {
		const next = new URLSearchParams(searchParams)
		if (value) next.set(key, value)
		else next.delete(key)
		setSearchParams(next, { replace: true })
		setPage(1)
	}

	const clearFilters = () => {
		const next = new URLSearchParams(searchParams)
		next.delete('projectId')
		next.delete('from')
		next.delete('to')
		next.delete('source')
		setSearchParams(next, { replace: true })
		setSearchInput('')
		setPage(1)
	}

	const activeFilterCount =
		(projectParam ? 1 : 0) +
		(fromParam ? 1 : 0) +
		(toParam ? 1 : 0) +
		(sourceParam ? 1 : 0) +
		(searchInput ? 1 : 0)

	// TapePills sliding indicator — same pattern as Invoices / Clients.
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		const root = pillsRef.current
		if (!root) return
		const el = root.querySelector<HTMLButtonElement>(
			'[role="tab"][data-active="true"]',
		)
		if (!el) {
			setInd((p) => ({ ...p, opacity: 0 }))
			return
		}
		const rootRect = root.getBoundingClientRect()
		const r = el.getBoundingClientRect()
		setInd({
			left: r.left - rootRect.left - 2,
			width: r.width + 4,
			opacity: 1,
		})
	}, [sourceParam])

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}
	useEffect(() => {
		setPage(1)
	}, [search, projectParam, fromParam, toParam, sourceParam])

	// Drop stale selections every time the server returns a new page —
	// a row that just scrolled off the page should not count toward
	// the bulk-delete batch any more. Prunes the Set by current ids.
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

	const selection = useMemo<DataTableSelection<ProjectReportItem>>(
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
			headerLabel: 'Select every report on this page',
			rowLabel: (r) =>
				`Select ${r.project.name} report on ${formatDate(r.reportDate, 'short')}`,
		}),
		[selected],
	)

	const handleBulkDelete = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		try {
			const res = await bulkDeleteReports(ids).unwrap()
			showToast(
				`Deleted ${res.deleted} report${res.deleted === 1 ? '' : 's'}`,
				'success',
			)
			setSelected(new Set())
			setBulkOpen(false)
			refetch()
		} catch {
			showToast('Bulk delete failed', 'error')
		}
	}

	const columns: DataTableColumn<ProjectReportItem>[] = [
		{
			key: 'reportDate',
			label: 'Report date',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => new Date(r.reportDate),
			render: (r) => <DateCell>{formatDate(r.reportDate, 'short')}</DateCell>,
			skeleton: () => <TableSkeleton $w='80px' $h='14px' />,
		},
		{
			/* When the row was actually inserted into the DB — distinct
			 * from `reportDate`, which is the business day the report
			 * covers. Shows date + time so backdated / late submissions
			 * are visible at a glance. */
			key: 'createdAt',
			label: 'Created',
			minWidth: 170,
			sortable: true,
			sortValue: (r) => new Date(r.createdAt),
			render: (r) => <DateCell>{formatDateTimeSec(r.createdAt)}</DateCell>,
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			// Project column links to /projects/:id and shrinks to content.
			key: 'project',
			label: 'Project',
			render: (r) => (
				<ProjectLink
					onClick={(e) => {
						e.stopPropagation()
						navigate(`/projects/${r.projectId}`)
					}}
				>
					<span>{r.project.name}</span>
					<LinkIcon aria-hidden='true'>
						<ArrowOutwardOutlined />
					</LinkIcon>
				</ProjectLink>
			),
			skeleton: () => <TableSkeleton $w='150px' $h='13px' />,
		},
		{
			// Source badge — surfaces where the row was filed
			// (CRM UI vs. Discord `/report`). Orthogonal to the Discord
			// column (which shows delivery outcome, not origin).
			key: 'source',
			label: 'Source',
			sortable: true,
			sortValue: (r) => r.source,
			render: (r) =>
				r.source === 'DISCORD' ? (
					<DiscordAuthor title='Posted via Discord'>
						<DiscordBadge>Discord</DiscordBadge>
					</DiscordAuthor>
				) : (
					<CRMSource>CRM</CRMSource>
				),
			skeleton: () => <TableSkeleton $w='70px' $h='18px' />,
		},
		{
			/* Backend-computed Discord-delivery status. Covers two paths:
			 * `late` — per-report ping (LATE_REPORT:<id>); `digest` —
			 * included in the 19:00 daily digest. The pill colour maps
			 * strictly to `deliveryStatus`; the tooltip adds the `via`
			 * context so a hover tells you WHICH path. */
			key: 'delivery',
			label: 'Discord',
			minWidth: 110,
			render: (r) => <DeliveryPillCell row={r} />,
			skeleton: () => <TableSkeleton $w='78px' $h='22px' />,
		},
		{
			key: 'hours',
			label: 'Hours',
			minWidth: 80,
			sortable: true,
			sortValue: (r) => r.hours,
			render: (r) => (
				<HoursPill>
					<HoursNum>{r.hours}</HoursNum>
					<HoursUnit>h</HoursUnit>
				</HoursPill>
			),
			skeleton: () => <TableSkeleton $w='48px' $h='22px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<PermissionGate permission='project_reports:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/projects/reports/${r.id}`)}
							aria-label='View report'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='project_reports:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/projects/reports/edit/${r.id}`)}
							aria-label='Edit report'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='project_reports:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() =>
								setDeleteTarget({
									id: r.id,
									title: `${r.project.name} · ${formatDate(r.reportDate, 'short')}`,
								})
							}
							aria-label='Delete report'
						>
							<DeleteOutline />
						</IconAction>
					</PermissionGate>
				</Actions>
			),
		},
	]

	const handleDelete = async () => {
		if (!deleteTarget) return
		try {
			await deleteReport(deleteTarget.id).unwrap()
			showToast('Report deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch {
			showToast('Failed to delete report', 'error')
		}
	}

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'Delivery' },
					{ label: 'Projects' },
					{ label: 'Reports', current: true },
				]}
				icon={<AssessmentOutlined />}
				title='Project reports'
				subtitle='Daily work logs — one report per project per day. Contributors are snapshotted at submission.'
				action={
					<HeaderActions>
						<PermissionGate permission='project_reports:delete'>
							<BulkActionBar
								count={selected.size}
								onClear={() => setSelected(new Set())}
								onConfirm={() => setBulkOpen(true)}
								isLoading={bulkDeleting}
							/>
						</PermissionGate>
						<PermissionGate permission='project_reports:create'>
							<PrimarySolidButton
								type='button'
								onClick={() => navigate('/projects/reports/add')}
							>
								<AddRounded />
								New report
							</PrimarySolidButton>
						</PermissionGate>
					</HeaderActions>
				}
				filters={
					<FreshFiltersWrap role='region' aria-label='Reports filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Filter</span>
								<span className='bot'>
									{SOURCE_PRESETS.find((p) => p.value === sourceParam)
										?.label ?? 'All'}
								</span>
							</div>
						</div>

						<TapePills
							ref={pillsRef}
							role='tablist'
							aria-label='Source preset'
						>
							<TapeIndicator
								style={{
									transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
									width: `${ind.width}px`,
									opacity: ind.opacity,
								}}
							/>
							{SOURCE_PRESETS.map((p) => (
								<TapePill
									key={p.value || 'all'}
									type='button'
									role='tab'
									data-active={sourceParam === p.value || undefined}
									aria-selected={sourceParam === p.value}
									$active={sourceParam === p.value}
									onClick={() => updateParam('source', p.value)}
								>
									{p.label}
								</TapePill>
							))}
						</TapePills>

						<div className='filter-spacer' />

						<div className='upwork-hint' aria-hidden='true'>
							<span className='row'>
								<span className='w'>every</span>
								<span className='amber-wrap'>
									<span className='a'>REPORT</span>
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
								<span className='w'>on the board</span>
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

						<BottomSlot>
							<SearchPill>
								<SearchOutlined className='ico' />
								<input
									type='text'
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder='Search summary'
									aria-label='Search reports'
								/>
							</SearchPill>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Project</span>
								<InlineSelect
									value={projectParam}
									onChange={(e) => updateParam('projectId', e.target.value)}
								>
									<option value=''>Any</option>
									{projects.map((p) => (
										<option key={p.id} value={p.id}>
											{p.name}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>From</span>
								<InlineDateInput
									type='date'
									value={fromParam}
									onChange={(e) => updateParam('from', e.target.value)}
								/>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>To</span>
								<InlineDateInput
									type='date'
									value={toParam}
									onChange={(e) => updateParam('to', e.target.value)}
								/>
							</InlineField>
						</BottomSlot>

						<div className='filter-spacer' />

						<FreshClearBtn
							type='button'
							onClick={clearFilters}
							disabled={activeFilterCount === 0}
						>
							<ClearRounded style={{ fontSize: 15 }} />
							Clear
						</FreshClearBtn>
					</FreshFiltersWrap>
				}
			>
				<KpiRow>
					<KpiCard>
						<KpiIcon>
							<ArticleOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Total reports</KpiLabel>
							<KpiNum>
								<KpiCounter value={stats?.totalReports} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<AccessTimeOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Total hours</KpiLabel>
							<KpiNum>
								<KpiHoursCounter value={stats?.totalHours} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<TrendingUpOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Avg h / report</KpiLabel>
							<KpiNum>
								<KpiHoursCounter value={stats?.avgHoursPerReport} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<CalendarMonthOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Days covered</KpiLabel>
							<KpiNum>
								<KpiCounter value={stats?.daysCovered} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
				</KpiRow>

				<DataTable
					columns={columns}
					rows={items}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
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
			</ListPageShell>

			{deleteTarget && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete report?'
					description={
						<>
							Are you sure you want to delete the report for{' '}
							<strong>&quot;{deleteTarget.title}&quot;</strong>? This action cannot be
							undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onClose={() => setDeleteTarget(null)}
					onConfirm={handleDelete}
					isLoading={deleting}
				/>
			)}

			{bulkOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Delete ${selected.size} report${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> project
							report{selected.size === 1 ? '' : 's'}. This cannot be undone.
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

export default ReportList

const HeaderActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

/* ─── Filter-bar date input (clone of Invoices) ─── */
const InlineDateInput = styled.input`
	appearance: none;
	-webkit-appearance: none;
	box-sizing: border-box;
	min-height: 42px;
	border: 1.5px solid rgba(36, 30, 22, 0.14);
	border-radius: 999px;
	background: #ffffff;
	padding: 10px 14px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: #241e16;
	line-height: 1.2;
	cursor: pointer;
	transition: border-color 180ms ease;

	&:hover,
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: #241e16;
	}
`

/* ─── KPI row + cards (mirrors Invoices) ─── */
const KpiRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 14px;
	margin-bottom: 18px;
`

const KpiCard = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid ${T.border};
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`

const KpiIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 12px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 22px;
	}
`

const KpiBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const KpiLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const KpiNum = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 26px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	line-height: 1.1;
`
const DateCell = styled.span`
	font-size: 13px;
	font-weight: 400;
	color: ${T.textStrong};
	white-space: nowrap;
`

const ProjectLink = styled.button`
	background: transparent;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	&:hover {
		color: ${T.primary};
		text-decoration: underline;
	}
`

const DiscordAuthor = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 13px;
	font-weight: 500;
	color: ${T.textSecondary};
	white-space: nowrap;
`

const DiscordBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	white-space: nowrap;
	color: #5865f2;
	background: rgba(88, 101, 242, 0.14);
`

const CRMSource = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	white-space: nowrap;
	color: #475569;
	background: rgba(100, 116, 139, 0.14);
`

const LinkIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.textMuted};
	opacity: 0.55;
	transition:
		opacity 160ms ease,
		color 160ms ease;

	svg {
		font-size: 14px;
	}

	${ProjectLink}:hover & {
		opacity: 1;
		color: ${T.primary};
	}
`

const Muted = styled.span`
	font-size: 13px;
	color: ${T.textSecondary};
`

const HoursPill = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 2px;
	color: ${T.primary};
	line-height: 1;
	white-space: nowrap;
`

const HoursNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 22px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.5px;
`

const HoursUnit = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12px;
	font-weight: 600;
	opacity: 0.6;
`

/* ─── Delivery status pill ──────────────────────────────────── */

const DELIVERY_LABELS: Record<
	NonNullable<ProjectReportItem['deliveryStatus']>,
	string
> = {
	sent: 'Sent',
	pending: 'Pending',
	failed: 'Failed',
	none: 'Not sent',
}

const DELIVERY_TONES: Record<
	NonNullable<ProjectReportItem['deliveryStatus']>,
	{ bg: string; fg: string }
> = {
	sent: { bg: 'rgba(16, 185, 129, 0.12)', fg: '#047857' },
	pending: { bg: 'rgba(234, 179, 8, 0.14)', fg: '#a16207' },
	failed: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#b91c1c' },
	none: { bg: 'rgba(15, 23, 42, 0.06)', fg: 'rgba(15, 23, 42, 0.55)' },
}

const deliveryTooltip = (
	via: ProjectReportItem['deliveryVia'],
	status: ProjectReportItem['deliveryStatus'],
): string => {
	if (!status || status === 'none') {
		return 'No Discord delivery for this report'
	}
	const route = via === 'late' ? 'Late report ping' : via === 'digest' ? 'Daily digest' : 'Unknown route'
	const outcome =
		status === 'sent'
			? 'delivered'
			: status === 'pending'
				? 'awaiting delivery'
				: 'failed to deliver'
	return `${route} — ${outcome}`
}

const DeliveryPillCell = ({ row }: { row: ProjectReportItem }) => {
	const status: ProjectReportItem['deliveryStatus'] =
		row.deliveryStatus ?? 'none'
	const tone = DELIVERY_TONES[status]
	return (
		<DeliveryPill
			title={deliveryTooltip(row.deliveryVia, status)}
			$bg={tone.bg}
			$fg={tone.fg}
		>
			{DELIVERY_LABELS[status]}
		</DeliveryPill>
	)
}

const DeliveryPill = styled.span<{ $bg: string; $fg: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;
`
