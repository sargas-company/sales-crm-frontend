import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	AddRounded,
	DeleteOutline,
	EditOutlined,
	WorkspacePremiumOutlined,
} from '@mui/icons-material'

import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
	type DataTableColumn,
	type SortState,
} from '../../../components/_shared/DataTable'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import {
	Clip,
	DateTimeCell,
	EmptyBadge,
	StatusPill,
} from '../_shared/cells'
import { ProfileLink } from '../_shared/ProfileLink'

import {
	upworkProfileName,
	useDeleteUpworkProfileMutation,
	useListUpworkProfilesQuery,
	type UpworkProfile,
} from '../../../store/upwork/upworkApi'

const PAGE_SIZE = 20

const UpworkProfilesPage = () => {
	const nav = useNavigate()
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({
		key: 'updatedAt',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<UpworkProfile | null>(null)

	const { data: all = [], isLoading, isError, refetch } = useListUpworkProfilesQuery()
	const [del, { isLoading: deleting }] = useDeleteUpworkProfileMutation()

	const total = all.length
	const paged = useMemo(
		() => all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		[all, page],
	)

	const columns: DataTableColumn<UpworkProfile>[] = [
		{
			key: 'name',
			label: 'Name',
			sortable: true,
			sortValue: (r) => upworkProfileName(r),
			render: (r) => <ProfileLink profile={r} max={240} />,
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'title',
			label: 'Title',
			sortable: true,
			sortValue: (r) => r.title ?? '',
			render: (r) =>
				r.title ? <Clip $max={320}>{r.title}</Clip> : <EmptyBadge>no title</EmptyBadge>,
			skeleton: () => <TableSkeleton $w='200px' $h='13px' />,
		},
		{
			key: 'active',
			label: 'Status',
			sortable: true,
			sortValue: (r) => (r.active ? 1 : 0),
			render: (r) => (
				<StatusPill $tone={r.active ? 'success' : 'muted'}>
					{r.active ? 'Active' : 'Archived'}
				</StatusPill>
			),
			skeleton: () => <TableSkeleton $w='70px' $h='18px' />,
		},
		{
			key: 'createdAt',
			label: 'Created',
			sortable: true,
			sortValue: (r) => r.createdAt,
			render: (r) => <DateTimeCell iso={r.createdAt} />,
			skeleton: () => <TableSkeleton $w='110px' $h='13px' />,
		},
		{
			key: 'updatedAt',
			label: 'Updated',
			sortable: true,
			sortValue: (r) => r.updatedAt,
			render: (r) => <DateTimeCell iso={r.updatedAt} />,
			skeleton: () => <TableSkeleton $w='110px' $h='13px' />,
		},
		{
			key: 'actions',
			label: '',
			render: (r) => (
				<Actions>
					<PermissionGate permission='upwork:update'>
						<IconAction
							onClick={() => nav(`/upwork/profiles/${r.id}/edit`)}
							title='Edit'
						>
							<EditOutlined fontSize='small' />
						</IconAction>
					</PermissionGate>
					<PermissionGate permission='upwork:delete'>
						<IconAction $danger onClick={() => setToDelete(r)} title='Delete'>
							<DeleteOutline fontSize='small' />
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
					{ label: 'Upwork', href: '/upwork/reminders' },
					{ label: 'Profiles', current: true },
				]}
				icon={<WorkspacePremiumOutlined />}
				title='Upwork Profiles'
				subtitle='Managed Upwork accounts.'
				action={
					<PermissionGate permission='upwork:create'>
						<PrimarySolidButton onClick={() => nav('/upwork/profiles/new')}>
							<AddRounded fontSize='small' />
							New profile
						</PrimarySolidButton>
					</PermissionGate>
				}
			>
				<DataTable<UpworkProfile>
					columns={columns}
					rows={paged}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					emptyTitle='No profiles yet.'
					sort={sort}
					onSortChange={(next) => {
						setSort(next)
						setPage(1)
					}}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					confirmColor='error'
					title='Delete profile?'
					description={
						<>
							Delete <strong>{upworkProfileName(toDelete)}</strong>? All
							change-log entries and snapshots for this profile will be removed
							too. This cannot be undone.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					isLoading={deleting}
					onConfirm={async () => {
						await del(toDelete.id).unwrap()
						setToDelete(null)
					}}
					onClose={() => setToDelete(null)}
				/>
			)}
		</>
	)
}

export default UpworkProfilesPage
