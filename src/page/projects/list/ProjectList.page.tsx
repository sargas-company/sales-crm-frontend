import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	FolderOutlined,
	AddRounded,
	ArrowOutwardOutlined,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import PermissionGate from '../../../components/auth/PermissionGate'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import { useToast } from '../../../context/toast/ToastContext'
import type { ProjectItem, ProjectSortBy } from '../../../store/projects/projectsApi'
import {
	useGetProjectsQuery,
	useDeleteProjectMutation,
} from '../../../store/projects/projectsApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

/* Which client is "the" client of a project. New Project create /
 * edit flow writes `crmClientId → Client`; legacy rows that pre-date
 * the Clients module may still carry only the old `clientId →
 * Counterparty`. Prefer the new link; fall back to the legacy one. */
const resolveClient = (p: ProjectItem) => {
	if (p.crmClient) {
		const name = [p.crmClient.firstName, p.crmClient.lastName]
			.filter(Boolean)
			.join(' ')
			.trim()
		return {
			kind: 'crm' as const,
			id: p.crmClient.id,
			label: name || p.crmClient.company || '—',
		}
	}
	if (p.client) {
		const name = `${p.client.firstName} ${p.client.lastName}`.trim()
		return { kind: 'counterparty' as const, id: p.client.id, label: name || '—' }
	}
	return null
}

const ProjectList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

	const { data, isLoading, isError, refetch } = useGetProjectsQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as ProjectSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const [deleteProject, { isLoading: deleting }] = useDeleteProjectMutation()

	const items = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}
	useEffect(() => {
		setPage(1)
	}, [search])

	const columns: DataTableColumn<ProjectItem>[] = [
		{
			// Project column shrinks to content — no minWidth.
			key: 'name',
			label: 'Project',
			sortable: true,
			sortValue: (p) => p.name,
			render: (p) => (
				<TitleLink onClick={() => navigate(`/projects/${p.id}`)}>
					<span>{p.name}</span>
					<LinkIcon aria-hidden='true'>
						<ArrowOutwardOutlined />
					</LinkIcon>
				</TitleLink>
			),
			skeleton: () => <TableSkeleton $w='200px' $h='14px' />,
		},
		{
			// Shows the CRM Client when the project is wired through the
			// new `crmClientId → Client` relation, with a legacy fallback
			// to the old `clientId → Counterparty` link. Clicking opens
			// the appropriate detail page.
			key: 'client',
			label: 'Client',
			render: (p) => {
				const c = resolveClient(p)
				if (!c) return <Muted>—</Muted>
				const href =
					c.kind === 'crm' ? `/clients/${c.id}` : `/counterparties/${c.id}`
				return (
					<ClientLink
						onClick={(e) => {
							e.stopPropagation()
							navigate(href)
						}}
					>
						<span>{c.label}</span>
						<LinkIcon aria-hidden='true'>
							<ArrowOutwardOutlined />
						</LinkIcon>
					</ClientLink>
				)
			},
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 120,
			sortable: true,
			sortValue: (p) => p.status,
			render: (p) => <StatusPill $status={p.status}>{p.status}</StatusPill>,
			skeleton: () => <TableSkeleton $w='70px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'team',
			label: 'Team',
			minWidth: 90,
			render: (p) => <Muted>{p.members.length}</Muted>,
			skeleton: () => <TableSkeleton $w='30px' $h='13px' />,
		},
		{
			key: 'startDate',
			label: 'Start',
			minWidth: 130,
			sortable: true,
			sortValue: (p) => (p.startDate ? new Date(p.startDate) : new Date(0)),
			render: (p) => <Muted>{p.startDate ? formatDate(p.startDate, 'short') : '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (p) => (
				<Actions>
					<PermissionGate permission='projects:view'>
						<IconAction
							type='button'
							onClick={() => navigate(`/projects/${p.id}`)}
							aria-label='View project'
						>
							<VisibilityOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='projects:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/projects/edit/${p.id}`)}
							aria-label='Edit project'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='projects:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: p.id, title: p.name })}
							aria-label='Delete project'
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
			await deleteProject(deleteTarget.id).unwrap()
			showToast('Project deleted', 'success')
			setDeleteTarget(null)
			refetch()
		} catch {
			showToast('Failed to delete project', 'error')
		}
	}

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Delivery' }, { label: 'Projects', current: true }]}
				icon={<FolderOutlined />}
				title='Projects'
				subtitle='Client engagements — status, team and timeline.'
				action={
					<PermissionGate permission='projects:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/projects/add')}>
							<AddRounded />
							New project
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by name'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
				<DataTable
					columns={columns}
					rows={items}
					rowKey={(p) => p.id}
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
					title='Delete project?'
					description={
						<>
							Are you sure you want to delete <strong>&quot;{deleteTarget.title}&quot;</strong>? This will remove all its team memberships and reports.
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

export default ProjectList

const TitleLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	line-height: 1.4;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	&:hover {
		color: ${T.primary};
	}
`

const ClientLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	font-family: inherit;
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	text-align: left;
	line-height: 1.4;
	white-space: nowrap;
	display: inline-flex;
	align-items: center;
	gap: 6px;

	&:hover {
		color: ${T.primary};
		text-decoration: underline;
	}
`

const LinkIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.textMuted};
	opacity: 0.55;
	transition: opacity 160ms ease, color 160ms ease;

	svg {
		font-size: 14px;
	}

	${TitleLink}:hover &,
	${ClientLink}:hover & {
		opacity: 1;
		color: ${T.primary};
	}
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $status }) => {
		if ($status === 'active') return 'rgba(21, 128, 61, 0.14)'
		if ($status === 'planned') return 'rgba(3, 105, 161, 0.14)'
		if ($status === 'paused') return 'rgba(245, 158, 11, 0.16)'
		if ($status === 'completed') return 'rgba(139, 92, 246, 0.14)'
		return 'rgba(100, 116, 139, 0.14)'
	}};
	color: ${({ $status }) => {
		if ($status === 'active') return '#15803d'
		if ($status === 'planned') return '#0369a1'
		if ($status === 'paused') return '#a26608'
		if ($status === 'completed') return '#6d28d9'
		return '#475569'
	}};
`
