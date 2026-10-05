import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { AnimatedSegmented } from '../../components/_shared/AnimatedSegmented'
import {
	LightbulbOutlined,
	AddRounded,
	DeleteOutline,
	EditOutlined,
	VisibilityOutlined,
	ArrowForwardRounded,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../components/_shared/DataTable'
import type { DataTableColumn, SortState } from '../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import {
	useGetLinkedInIdeasQuery,
	useDeleteLinkedInIdeaMutation,
	type LinkedInIdea,
	type LinkedInIdeaStatus,
	type LinkedInIdeaPriority,
} from '../../store/linkedin-ideas/linkedInIdeasApi'

const PAGE_SIZE = 25

const STATUS_META: Record<
	LinkedInIdeaStatus,
	{ label: string; bg: string; color: string }
> = {
	NEW: { label: 'New', bg: 'rgba(3, 105, 161, 0.14)', color: '#0369a1' },
	IN_PROGRESS: {
		label: 'In progress',
		bg: 'rgba(217, 119, 6, 0.14)',
		color: '#b45309',
	},
	CONVERTED: {
		label: 'Converted',
		bg: 'rgba(16, 185, 129, 0.15)',
		color: '#059669',
	},
	ARCHIVED: {
		label: 'Archived',
		bg: 'rgba(15, 23, 42, 0.06)',
		color: '#64748b',
	},
}

const PRIORITY_META: Record<
	LinkedInIdeaPriority,
	{ label: string; color: string }
> = {
	LOW: { label: 'Low', color: '#64748b' },
	MEDIUM: { label: 'Medium', color: '#0369a1' },
	HIGH: { label: 'High', color: '#d97706' },
}


const fmtDate = (iso: string | null): string => {
	if (!iso) return '—'
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return '—'
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

const LinkedInIdeasList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [status, setStatus] = useState<LinkedInIdeaStatus | ''>('')
	const [priority, setPriority] = useState<LinkedInIdeaPriority | ''>('')
	const [sort, setSort] = useState<SortState | null>({
		key: 'updatedAt',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<LinkedInIdea | null>(null)

	const { data, isLoading, isError, refetch } = useGetLinkedInIdeasQuery({
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: status || undefined,
		priority: priority || undefined,
		sortBy: (sort?.key as
			| 'title'
			| 'status'
			| 'priority'
			| 'plannedDate'
			| 'createdAt'
			| 'updatedAt') ?? 'updatedAt',
		sortDir: sort?.direction ?? 'desc',
	})
	const [deleteIdea, { isLoading: deleting }] = useDeleteLinkedInIdeaMutation()

	const columns: DataTableColumn<LinkedInIdea>[] = [
		{
			key: 'title',
			label: 'Idea',
			sortable: true,
			render: (r) => (
				<TitleCell onClick={() => navigate(`/linkedin/ideas/${r.id}`)}>
					<div>
						<TitleText>{r.title}</TitleText>
						{r.hook && <HookText>{r.hook}</HookText>}
					</div>
				</TitleCell>
			),
			skeleton: () => <TableSkeleton $w='260px' $h='16px' />,
		},
		{
			key: 'tags',
			label: 'Tags',
			render: (r) =>
				r.tags.length > 0 ? (
					<TagsRow>
						{r.tags.slice(0, 4).map((t) => (
							<TagChip key={t}>#{t}</TagChip>
						))}
						{r.tags.length > 4 && <TagsMore>+{r.tags.length - 4}</TagsMore>}
					</TagsRow>
				) : (
					<SubText>—</SubText>
				),
			skeleton: () => <TableSkeleton $w='120px' $h='16px' />,
		},
		{
			key: 'status',
			label: 'Status',
			sortable: true,
			render: (r) => (
				<StatusPill $bg={STATUS_META[r.status].bg} $color={STATUS_META[r.status].color}>
					{STATUS_META[r.status].label}
				</StatusPill>
			),
			skeleton: () => (
				<TableSkeleton $w='80px' $h='22px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'priority',
			label: 'Priority',
			sortable: true,
			render: (r) => (
				<PriorityCell>
					<PriorityDot $color={PRIORITY_META[r.priority].color} />
					{PRIORITY_META[r.priority].label}
				</PriorityCell>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='14px' />,
		},
		{
			key: 'plannedDate',
			label: 'Planned',
			sortable: true,
			render: (r) => <SubText>{fmtDate(r.plannedDate)}</SubText>,
			skeleton: () => <TableSkeleton $w='80px' $h='14px' />,
		},
		{
			key: 'posts',
			label: 'Posts',
			render: (r) => <CountText>{r._count?.posts ?? r.posts?.length ?? 0}</CountText>,
			skeleton: () => <TableSkeleton $w='30px' $h='14px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (r) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/linkedin/ideas/${r.id}`)}
						aria-label='View idea'
					>
						<VisibilityOutlined />
					</IconAction>
					<PermissionGate permission='linkedin_posts:create'>
						<IconAction
							type='button'
							onClick={() =>
								navigate(`/linkedin/posts/add?ideaId=${r.id}`)
							}
							aria-label='Create post from idea'
						>
							<ArrowForwardRounded />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='linkedin_ideas:update'>
						<IconAction
							type='button'
							onClick={() => navigate(`/linkedin/ideas/edit/${r.id}`)}
							aria-label='Edit idea'
						>
							<EditOutlined />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='linkedin_ideas:delete'>
						<IconAction
							type='button'
							$danger
							onClick={() => setToDelete(r)}
							aria-label='Delete idea'
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
				crumbs={[
					{ label: 'LinkedIn' },
					{ label: 'Ideas', current: true },
				]}
				icon={<LightbulbOutlined />}
				title='LinkedIn ideas'
				subtitle='Idea bank — draft raw thoughts, convert them into posts later.'
				action={
					<PermissionGate permission='linkedin_ideas:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/linkedin/ideas/add')}
						>
							<AddRounded />
							New idea
						</PrimarySolidButton>
					</PermissionGate>
				}
				searchPlaceholder='Search by title, content, hook or tag'
				search={search}
				onSearchChange={(v) => {
					setSearch(v)
					setPage(1)
				}}
			>
				<FiltersRow>
					<AnimatedSegmented
						items={[
							{ value: '', label: 'All' },
							...(Object.keys(STATUS_META) as LinkedInIdeaStatus[]).map((s) => ({
								value: s,
								label: STATUS_META[s].label,
								color: STATUS_META[s].color,
							})),
						]}
						active={status}
						onSelect={(v) => {
							setStatus(v as LinkedInIdeaStatus | '')
							setPage(1)
						}}
					/>
					<div style={{ marginLeft: 'auto' }}>
						<AnimatedSegmented
							items={[
								{ value: '', label: 'Any' },
								...(Object.keys(PRIORITY_META) as LinkedInIdeaPriority[]).map((p) => ({
									value: p,
									label: PRIORITY_META[p].label,
									color: PRIORITY_META[p].color,
								})),
							]}
							active={priority}
							onSelect={(v) => {
								setPriority(v as LinkedInIdeaPriority | '')
								setPage(1)
							}}
						/>
					</div>
				</FiltersRow>

				<DataTable
					columns={columns}
					rows={data?.data ?? []}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search || !!status || !!priority}
					sort={sort}
					onSortChange={setSort}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total: data?.total ?? 0,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title='Delete LinkedIn idea?'
					description={
						<>
							Delete <strong>&quot;{toDelete.title}&quot;</strong>? Any linked
							posts will keep working — the relation is unlinked.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					onConfirm={async () => {
						try {
							await deleteIdea(toDelete.id).unwrap()
							showToast('Idea deleted', 'success')
							setToDelete(null)
						} catch (err) {
							showToast(parseServerError(err), 'error')
						}
					}}
					onClose={() => setToDelete(null)}
					isLoading={deleting}
				/>
			)}
		</>
	)
}

export default LinkedInIdeasList

const TitleCell = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 10px;
	cursor: pointer;
`

const TitleText = styled.div`
	font-size: 14.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.35;
	white-space: nowrap;
`

const HookText = styled.div`
	font-size: 12px;
	color: ${T.textSecondary};
	margin-top: 3px;
	line-height: 1.35;
	white-space: nowrap;
`

const TagsRow = styled.div`
	display: inline-flex;
	flex-wrap: nowrap;
	gap: 4px;
	white-space: nowrap;
`

const TagChip = styled.span`
	display: inline-block;
	padding: 1px 8px;
	border-radius: 999px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-size: 10.5px;
	font-weight: 600;
`

const TagsMore = styled.span`
	font-size: 10.5px;
	color: ${T.textMuted};
	font-weight: 600;
`

const StatusPill = styled.span<{ $bg: string; $color: string }>`
	display: inline-block;
	padding: 3px 10px;
	border-radius: 999px;
	background: ${({ $bg }) => $bg};
	color: ${({ $color }) => $color};
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	white-space: nowrap;
`

const PriorityCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-size: 12.5px;
	color: ${T.textStrong};
	font-weight: 600;
`

const PriorityDot = styled.span<{ $color: string }>`
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: ${({ $color }) => $color};
`

const SubText = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
`

const CountText = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
`

const FiltersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-bottom: 18px;
`

