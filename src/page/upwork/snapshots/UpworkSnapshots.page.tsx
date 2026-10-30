import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
	AddRounded,
	CameraAltOutlined,
	ClearRounded,
	DeleteOutline,
	EditOutlined,
	FilterListOutlined,
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
import styled from 'styled-components'
import {
	BottomSlot,
	ClearBtn,
	FreshFiltersWrap as BaseFreshFiltersWrap,
	InlineField,
	InlineSelect,
} from '../../../components/_shared/filters/freshPaperFilters'

const FreshFiltersWrap = styled(BaseFreshFiltersWrap)`
	width: 100%;
	box-sizing: border-box;
`
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import { DateTimeCell, NumCell } from '../_shared/cells'
import { ProfileLink } from '../_shared/ProfileLink'

import {
	upworkProfileName,
	useDeleteUpworkSnapshotMutation,
	useListUpworkProfilesQuery,
	useListUpworkSnapshotsQuery,
	type UpworkSnapshot,
} from '../../../store/upwork/upworkApi'

const PAGE_SIZE = 20

const UpworkSnapshotsPage = () => {
	const nav = useNavigate()
	const [sp, setSp] = useSearchParams()

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = useMemo(() => profiles.filter((p) => p.active), [profiles])

	const profileParam = sp.get('profile') ?? ''

	useEffect(() => {
		if (!profileParam && activeProfiles.length) {
			const next = new URLSearchParams(sp)
			next.set('profile', activeProfiles[0].id)
			setSp(next, { replace: true })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeProfiles])

	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({
		key: 'date',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<UpworkSnapshot | null>(null)

	const { data: snapshots = [], isLoading, isError, refetch } =
		useListUpworkSnapshotsQuery(
			{ profileId: profileParam },
			{ skip: !profileParam },
		)
	const [del, { isLoading: deleting }] = useDeleteUpworkSnapshotMutation()

	useEffect(() => {
		setPage(1)
	}, [profileParam])

	const total = snapshots.length
	const paged = useMemo(
		() => snapshots.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		[snapshots, page],
	)

	const activeProfile = activeProfiles.find((p) => p.id === profileParam)

	const columns: DataTableColumn<UpworkSnapshot>[] = [
		{
			key: 'date',
			label: 'Date',
			sortable: true,
			sortValue: (r) => r.date,
			render: (r) => <DateTimeCell iso={r.date} />,
			skeleton: () => <TableSkeleton $w='110px' $h='13px' />,
		},
		{
			key: 'profile',
			label: 'Profile',
			render: () =>
				activeProfile ? (
					<ProfileLink
						profile={activeProfile}
						max={200}
					/>
				) : null,
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'views',
			label: 'Views',
			sortable: true,
			sortValue: (r) => r.views,
			render: (r) => <NumCell>{r.views.toLocaleString()}</NumCell>,
		},
		{
			key: 'invites',
			label: 'Invites',
			sortable: true,
			sortValue: (r) => r.invites,
			render: (r) => <NumCell>{r.invites.toLocaleString()}</NumCell>,
		},
		{
			key: 'directMessages',
			label: 'Direct msgs',
			sortable: true,
			sortValue: (r) => r.directMessages,
			render: (r) => <NumCell>{r.directMessages.toLocaleString()}</NumCell>,
		},
		{
			key: 'positions',
			label: 'Positions',
			render: (r) => <NumCell>{r.positions.length}</NumCell>,
		},
		{
			key: 'actions',
			label: '',
			render: (r) => (
				<Actions>
					<PermissionGate permission='upwork:update'>
						<IconAction
							onClick={() => nav(`/upwork/snapshots/${r.id}/edit`)}
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

	const updateParam = (k: string, v: string) => {
		const next = new URLSearchParams(sp)
		if (v) next.set(k, v)
		else next.delete(k)
		setSp(next, { replace: true })
	}

	const clearFilters = () => {
		if (activeProfiles[0]) updateParam('profile', activeProfiles[0].id)
		setSort({ key: 'date', direction: 'desc' })
	}

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'Upwork', href: '/upwork/reminders' },
					{ label: 'Snapshots', current: true },
				]}
				icon={<CameraAltOutlined />}
				title='Snapshots'
				subtitle='Daily metrics capture — views, invites, direct messages, positions.'
				action={
					<PermissionGate permission='upwork:create'>
						<PrimarySolidButton
							onClick={() => nav('/upwork/snapshots/new')}
							disabled={activeProfiles.length === 0}
						>
							<AddRounded fontSize='small' />
							New snapshot
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={
					<FreshFiltersWrap role='region' aria-label='Snapshots filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Entries</span>
								<span className='bot'>{total} rows</span>
							</div>
						</div>

						<BottomSlot>
							<InlineField>
								<span className='l'>Profile</span>
								<InlineSelect
									value={profileParam}
									onChange={(e) => updateParam('profile', e.target.value)}
									disabled={activeProfiles.length === 0}
								>
									{activeProfiles.length === 0 && (
										<option value=''>No active profiles</option>
									)}
									{activeProfiles.map((p) => (
										<option key={p.id} value={p.id}>
											{upworkProfileName(p)}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<div className='filter-spacer' style={{ flex: 1 }} />

						<ClearBtn type='button' onClick={clearFilters}>
							<ClearRounded style={{ fontSize: 15 }} />
							Clear
						</ClearBtn>
					</FreshFiltersWrap>
				}
			>
				<DataTable<UpworkSnapshot>
					columns={columns}
					rows={paged}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					emptyTitle='No snapshots yet.'
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
					title='Delete snapshot?'
					description={
						<>
							Delete the snapshot for{' '}
							<strong>{toDelete.date.slice(0, 10)}</strong>? This cannot be undone.
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

export default UpworkSnapshotsPage
