import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
	AddRounded,
	ArrowDownwardRounded,
	ArrowUpwardRounded,
	CameraAltOutlined,
	ClearRounded,
	DeleteOutline,
	EditOutlined,
	FilterListOutlined,
	TrendingFlatRounded,
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

/* Visual separation ONLY between the four metric columns in the
 * body — header is untouched. A dashed divider appears to the left
 * of every metric cell except the first one. */
const TableScope = styled.div`
	table tbody td.cell--metric + td.cell--metric {
		border-left: 1px dashed #e2e8f0;
	}
`

/* ─── Trend cell (same visual language as the Position column
 *   on the profiles list — arrow + delta, then the raw value). */
const TREND_TONE = {
	gain: '#166534',
	loss: '#991b1b',
	flat: '#475569',
	none: '#94a3b8',
}
const TrendWrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
`
const TrendArrow = styled.div<{ $t: 'gain' | 'loss' | 'flat' | 'none' }>`
	display: inline-flex;
	align-items: center;
	gap: 2px;
	min-width: 52px;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 14px;
	font-weight: 700;
	line-height: 1;
	letter-spacing: -0.3px;
	font-variant-numeric: tabular-nums;
	color: ${({ $t }) => TREND_TONE[$t]};
	svg {
		font-size: 15px;
	}
`
const TrendValue = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 17px;
	font-weight: 900;
	letter-spacing: -0.5px;
	color: #0f172a;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	line-height: 1;
`
const TrendCell = ({
	value,
	previous,
	format = (n: number) => n.toLocaleString(),
}: {
	value: number
	previous: number | null | undefined
	format?: (n: number) => string
}) => {
	const delta = previous == null ? null : value - previous
	const t: 'gain' | 'loss' | 'flat' | 'none' =
		delta == null ? 'none' : delta > 0 ? 'gain' : delta < 0 ? 'loss' : 'flat'
	return (
		<TrendWrap>
			<TrendArrow $t={t}>
				{delta == null ? (
					'·'
				) : t === 'gain' ? (
					<>
						<ArrowUpwardRounded />+{format(delta)}
					</>
				) : t === 'loss' ? (
					<>
						<ArrowDownwardRounded />−{format(Math.abs(delta))}
					</>
				) : (
					<>
						<TrendingFlatRounded />0
					</>
				)}
			</TrendArrow>
			<TrendValue>{format(value)}</TrendValue>
		</TrendWrap>
	)
}
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import { DateTimeCell } from '../_shared/cells'
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

	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({
		key: 'date',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<UpworkSnapshot | null>(null)

	/* "All profiles" is the default — profileParam = '' triggers a
	 * global list (no profile filter). Only when the owner picks a
	 * specific profile do we send profileId. */
	const { data: snapshots = [], isLoading, isError, refetch } =
		useListUpworkSnapshotsQuery(
			profileParam ? { profileId: profileParam } : {},
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

	/* For every row, the "previous" (older) snapshot is the next
	 * snapshot of THE SAME PROFILE in date-desc order. In single-
	 * profile view this reduces to "next row"; in All view each
	 * profile's snapshots form their own stream. */
	const prevById = useMemo(() => {
		const byProfile = new Map<string, UpworkSnapshot[]>()
		for (const s of snapshots) {
			const arr = byProfile.get(s.profileId) ?? []
			arr.push(s)
			byProfile.set(s.profileId, arr)
		}
		const map = new Map<string, UpworkSnapshot>()
		for (const arr of byProfile.values()) {
			arr.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
			for (let i = 0; i < arr.length - 1; i++) map.set(arr[i].id, arr[i + 1])
		}
		return map
	}, [snapshots])

	const profilesById = useMemo(
		() => new Map(profiles.map((p) => [p.id, p])),
		[profiles],
	)

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
			sortable: true,
			sortValue: (r) => {
				const p = profilesById.get(r.profileId)
				return p ? upworkProfileName(p) : ''
			},
			render: (r) => {
				const p = profilesById.get(r.profileId)
				return p ? <ProfileLink profile={p} max={200} /> : null
			},
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'views',
			label: 'Views',
			className: 'cell--metric',
			sortable: true,
			sortValue: (r) => r.views,
			render: (r) => (
				<TrendCell value={r.views} previous={prevById.get(r.id)?.views} />
			),
			skeleton: () => <TableSkeleton $w='130px' $h='24px' />,
		},
		{
			key: 'invites',
			label: 'Invites',
			className: 'cell--metric',
			sortable: true,
			sortValue: (r) => r.invites,
			render: (r) => (
				<TrendCell value={r.invites} previous={prevById.get(r.id)?.invites} />
			),
			skeleton: () => <TableSkeleton $w='130px' $h='24px' />,
		},
		{
			key: 'directMessages',
			label: 'Direct msgs',
			className: 'cell--metric',
			sortable: true,
			sortValue: (r) => r.directMessages,
			render: (r) => (
				<TrendCell
					value={r.directMessages}
					previous={prevById.get(r.id)?.directMessages}
				/>
			),
			skeleton: () => <TableSkeleton $w='130px' $h='24px' />,
		},
		{
			key: 'positions',
			label: 'Positions',
			className: 'cell--metric',
			sortable: true,
			sortValue: (r) => r.positions.length,
			render: (r) => (
				<TrendCell
					value={r.positions.length}
					previous={prevById.get(r.id)?.positions.length}
				/>
			),
			skeleton: () => <TableSkeleton $w='130px' $h='24px' />,
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
		updateParam('profile', '')
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
									<option value=''>All profiles</option>
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
				<TableScope>
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
				</TableScope>
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
