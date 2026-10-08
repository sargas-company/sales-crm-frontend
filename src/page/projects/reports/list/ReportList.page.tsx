import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	AssessmentOutlined,
	AddRounded,
	ArrowOutwardOutlined,
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
import PermissionGate from '../../../../components/auth/PermissionGate'
import ConfirmModal from '../../../../components/_shared/ConfirmModal'
import { useToast } from '../../../../context/toast/ToastContext'
import type {
	ProjectReportItem,
	ProjectReportSortBy,
} from '../../../../store/project-reports/projectReportsApi'
import {
	useGetProjectReportsQuery,
	useDeleteProjectReportMutation,
	useBulkDeleteProjectReportsMutation,
} from '../../../../store/project-reports/projectReportsApi'
import { formatDate } from '../../../../utils/format'
import useDebouncedValue from '../../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

const ReportList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchParams] = useSearchParams()
	const projectFilter = searchParams.get('projectId') ?? undefined
	const fromFilter = searchParams.get('from') ?? undefined
	const toFilter = searchParams.get('to') ?? undefined

	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkOpen, setBulkOpen] = useState(false)

	const { data, isLoading, isError, refetch } = useGetProjectReportsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as ProjectReportSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
		projectId: projectFilter,
		from: fromFilter,
		to: toFilter,
	})
	const [deleteReport, { isLoading: deleting }] = useDeleteProjectReportMutation()
	const [bulkDeleteReports, { isLoading: bulkDeleting }] =
		useBulkDeleteProjectReportsMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

	// Mount/exit presence for the bulk bar — unmounts after the exit
	// transition finishes so the leaving element finishes animating out
	// before being removed from the DOM.
	const [barMounted, setBarMounted] = useState(selected.size > 0)
	const [barExiting, setBarExiting] = useState(false)
	useEffect(() => {
		if (selected.size > 0) {
			setBarMounted(true)
			setBarExiting(false)
			return
		}
		if (barMounted) {
			setBarExiting(true)
			const t = window.setTimeout(() => {
				setBarMounted(false)
				setBarExiting(false)
			}, 260)
			return () => window.clearTimeout(t)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected.size])

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}
	useEffect(() => {
		setPage(1)
	}, [search, projectFilter, fromFilter, toFilter])

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
			label: 'Date',
			minWidth: 130,
			sortable: true,
			sortValue: (r) => new Date(r.reportDate),
			render: (r) => <DateCell>{formatDate(r.reportDate, 'short')}</DateCell>,
			skeleton: () => <TableSkeleton $w='80px' $h='14px' />,
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
			// Source badge replaces the old Author column — the report
			// is a project-day record, not an authored one. The badge
			// surfaces where the row was filed (CRM UI vs. /report).
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
			key: 'content',
			label: 'Summary',
			minWidth: 260,
			render: (r) => <Preview>{r.content}</Preview>,
			skeleton: () => <TableSkeleton $w='240px' $h='13px' />,
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
						{barMounted && (
							<PermissionGate permission='project_reports:delete'>
								<BulkBar
									$exiting={barExiting}
									aria-live='polite'
									aria-hidden={barExiting}
								>
									<BulkCount>
										<BulkCountNumber key={selected.size || 'leaving'}>
											{selected.size}
										</BulkCountNumber>
										<BulkCountLabel>selected</BulkCountLabel>
									</BulkCount>
									<BulkGhost
										type='button'
										onClick={() => setSelected(new Set())}
									>
										<ClearGlyph aria-hidden='true'>×</ClearGlyph>
										Clear
									</BulkGhost>
									<BulkDangerBtn
										type='button'
										onClick={() => setBulkOpen(true)}
										disabled={bulkDeleting}
									>
										<TrashIcon aria-hidden='true'>
											<DeleteOutline />
										</TrashIcon>
										{bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
									</BulkDangerBtn>
								</BulkBar>
							</PermissionGate>
						)}
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
				searchPlaceholder='Search summary'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
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

/* ─── Bulk bar — enter / exit transitions ───────────────────────── */

const bulkEnter = keyframes`
	0%   { opacity: 0; transform: translateY(-6px) scale(0.94); }
	60%  { opacity: 1; transform: translateY(1px) scale(1.015); }
	100% { opacity: 1; transform: translateY(0)  scale(1); }
`

const bulkExit = keyframes`
	0%   { opacity: 1; transform: translateY(0) scale(1); }
	100% { opacity: 0; transform: translateY(-6px) scale(0.94); }
`

const BulkBar = styled.div<{ $exiting: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 6px 10px 6px 14px;
	border-radius: 10px;
	background: rgba(220, 38, 38, 0.08);
	border: 1px solid rgba(220, 38, 38, 0.22);
	transform-origin: top right;
	will-change: transform, opacity;
	animation: ${({ $exiting }) => ($exiting ? bulkExit : bulkEnter)}
		${({ $exiting }) => ($exiting ? '220ms' : '260ms')}
		cubic-bezier(0.22, 1.3, 0.36, 1) both;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* ─── Counter badge — the number pops on change ─────────────────── */

const BulkCount = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;
	color: #b91c1c;
`

const countPop = keyframes`
	0%   { transform: scale(0.6); opacity: 0; }
	60%  { transform: scale(1.18); opacity: 1; }
	100% { transform: scale(1); }
`

const BulkCountNumber = styled.span`
	display: inline-block;
	min-width: 1ch;
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.2px;
	font-variant-numeric: tabular-nums;
	transform-origin: center;
	animation: ${countPop} 300ms cubic-bezier(0.22, 1.4, 0.36, 1) both;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const BulkCountLabel = styled.span`
	font-size: 12.5px;
	font-weight: 500;
	color: #b91c1c;
	opacity: 0.85;
`

/* ─── Clear ghost — the × spins on hover ────────────────────────── */

const BulkGhost = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border: none;
	background: transparent;
	color: ${T.textSecondary};
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	padding: 6px 10px;
	border-radius: 8px;
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease;
	&:hover {
		background: rgba(15, 23, 42, 0.05);
		color: ${T.textStrong};
	}
`

const ClearGlyph = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	line-height: 1;
	font-size: 18px;
	font-weight: 700;
	transition: transform 260ms cubic-bezier(0.22, 1.3, 0.36, 1);
	${BulkGhost}:hover & {
		transform: rotate(180deg) scale(1.15);
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

/* ─── Delete button — the trash wiggles on hover ────────────────── */

const trashWiggle = keyframes`
	0%   { transform: rotate(0deg) translateY(0); }
	20%  { transform: rotate(-14deg) translateY(-1px); }
	40%  { transform: rotate(12deg) translateY(-1px); }
	60%  { transform: rotate(-10deg) translateY(0); }
	80%  { transform: rotate(6deg)  translateY(0); }
	100% { transform: rotate(0deg) translateY(0); }
`

const trashPressed = keyframes`
	0%   { transform: translateY(0); }
	50%  { transform: translateY(2px) scale(0.92); }
	100% { transform: translateY(0); }
`

const BulkDangerBtn = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 7px;
	border: 1px solid rgba(220, 38, 38, 0.5);
	background: #dc2626;
	color: #ffffff;
	font-family: inherit;
	font-size: 13px;
	font-weight: 600;
	padding: 8px 14px;
	border-radius: 10px;
	cursor: pointer;
	transition: background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
	&:hover:not(:disabled) {
		background: #b91c1c;
		box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);
	}
	&:active:not(:disabled) {
		transform: translateY(1px);
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

const TrashIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: 50% 20%;
	svg {
		font-size: 18px;
	}
	${BulkDangerBtn}:hover:not(:disabled) & {
		animation: ${trashWiggle} 520ms cubic-bezier(0.36, 0, 0.66, -0.56) both;
	}
	${BulkDangerBtn}:active:not(:disabled) & {
		animation: ${trashPressed} 220ms ease-out both;
	}
	@media (prefers-reduced-motion: reduce) {
		${BulkDangerBtn}:hover:not(:disabled) &,
		${BulkDangerBtn}:active:not(:disabled) & {
			animation: none;
		}
	}
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

const Preview = styled.span`
	font-size: 13px;
	color: ${T.textSecondary};
	line-height: 1.4;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
`
