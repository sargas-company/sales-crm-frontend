import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
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
import type { DataTableColumn, SortState } from '../../../../components/_shared/DataTable'
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

	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}
	useEffect(() => {
		setPage(1)
	}, [search, projectFilter, fromFilter, toFilter])

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
					<PermissionGate permission='project_reports:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/projects/reports/add')}
						>
							<AddRounded />
							New report
						</PrimarySolidButton>
					</PermissionGate>
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
		</>
	)
}

export default ReportList

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
