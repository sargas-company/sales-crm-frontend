import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	AutoAwesomeOutlined,
	AddRounded,
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
import PromptDeleteModal from '../../../components/prompts/list/PromptDeleteModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { useGetPromptListQuery } from '../../../store/prompts/promptsApi'
import type {
	PromptType,
	PromptItem,
	PromptSortBy,
} from '../../../store/prompts/types/definition'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'

const PAGE_SIZE = 20

const TYPE_LABELS: Record<PromptType, string> = {
	JOB_GATEKEEPER: 'Job Gatekeeper',
	JOB_EVALUATION: 'Job Evaluation',
}

interface DeleteTarget {
	id: string
	title: string
}

const PromptList = () => {
	const navigate = useNavigate()
	const [page, setPage] = useState(1)
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, isError, refetch } = useGetPromptListQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		sortBy: (sort?.key as PromptSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})
	const allItems = data?.data ?? []
	const total = data?.total ?? 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [search])

	const columns: DataTableColumn<PromptItem>[] = [
		{
			key: 'title',
			label: 'Title',
			minWidth: 300,
			sortable: true,
			sortValue: (p) => p.title,
			render: (p) => (
				<TitleLink onClick={() => navigate(`/prompts/preview/${p.id}`)}>{p.title}</TitleLink>
			),
			skeleton: () => <TableSkeleton $w='220px' $h='14px' />,
		},
		{
			key: 'type',
			label: 'Type',
			minWidth: 170,
			sortable: true,
			sortValue: (p) => p.type,
			render: (p) => <TypePill $type={p.type}>{TYPE_LABELS[p.type]}</TypePill>,
			skeleton: () => <TableSkeleton $w='120px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'version',
			label: 'Version',
			minWidth: 100,
			sortable: true,
			sortValue: (p) => p.version,
			render: (p) => <Num>v{p.version}</Num>,
			skeleton: () => <TableSkeleton $w='40px' $h='13px' />,
		},
		{
			key: 'isActive',
			label: 'Active',
			minWidth: 100,
			sortable: true,
			sortValue: (p) => (p.isActive ? 1 : 0),
			render: (p) => (p.isActive ? <ActiveDot>● active</ActiveDot> : <Muted>inactive</Muted>),
			skeleton: () => <TableSkeleton $w='60px' $h='13px' />,
		},
		{
			key: 'createdBy',
			label: 'Created by',
			minWidth: 180,
			sortable: true,
			sortValue: (p) => p.createdBy,
			render: (p) => <Muted>{p.createdBy}</Muted>,
			skeleton: () => <TableSkeleton $w='130px' $h='13px' />,
		},
		{
			key: 'updated',
			label: 'Updated',
			minWidth: 140,
			sortable: true,
			sortValue: (p) => new Date(p.updatedAt),
			render: (p) => <Muted>{formatDate(p.updatedAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'created',
			label: 'Created',
			minWidth: 140,
			sortable: true,
			sortValue: (p) => new Date(p.createdAt),
			render: (p) => <Muted>{formatDate(p.createdAt, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='90px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (p) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/prompts/preview/${p.id}`)}
						aria-label='View prompt'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='prompts:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setDeleteTarget({ id: p.id, title: p.title })}
							aria-label='Delete prompt'
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
			<ListPageShell
				crumbs={[{ label: 'Configuration' }, { label: 'Prompts', current: true }]}
				icon={<AutoAwesomeOutlined />}
				title='Prompts'
				subtitle='LLM prompt templates powering job gatekeeping, evaluation and chat.'
				action={
					<PermissionGate permission='prompts:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/prompts/add')}>
							<AddRounded />
							New prompt
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by title'
				search={searchInput}
				onSearchChange={setSearchInput}
			>
				<DataTable
					columns={columns}
					rows={allItems}
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
				<PromptDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (allItems.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}
		</>
	)
}

export default PromptList

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

	&:hover {
		color: ${T.primary};
	}
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const Num = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const ActiveDot = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12.5px;
	font-weight: 700;
	color: #15803d;
	letter-spacing: 0.2px;
`

const TypePill = styled.span<{ $type: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $type }) =>
		$type.startsWith('CHAT') ? 'rgba(3, 105, 161, 0.12)' : 'rgba(245, 158, 11, 0.16)'};
	color: ${({ $type }) => ($type.startsWith('CHAT') ? T.primary : '#a26608')};
`
