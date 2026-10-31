import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
	AddRounded,
	ClearRounded,
	DeleteOutline,
	EditOutlined,
	FilterListOutlined,
	OpenInNewRounded,
	SearchOutlined,
	SensorsOffRounded,
	SensorsRounded,
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
import styled, { keyframes } from 'styled-components'
import {
	ClearBtn,
	FreshFiltersWrap as BaseFreshFiltersWrap,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'

const FreshFiltersWrap = styled(BaseFreshFiltersWrap)`
	width: 100%;
	box-sizing: border-box;
	margin-bottom: 20px;
`

/* Forces a flex-wrap line break and splits search / clear to the
 * two edges. flex-basis: 100% is the standard line-break trick
 * inside a flex-wrap container. */
const SecondRow = styled.div`
	flex-basis: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	margin-top: 10px;
`

const StatusLabel = styled.span<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	color: ${({ $active }) => ($active ? '#15803d' : '#64748b')};
`

/* External link to the Upwork freelancer page — rendered in its own
 * column. Opens in a new tab; just a plain blue icon, no background. */
const UpworkExternalLink = styled.a`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #0369a1;
	text-decoration: none;
	transition: transform 160ms ease;
	&:hover {
		transform: translateY(-1px);
	}
	svg {
		font-size: 22px;
	}
`

/* Active-status icon wrapper — soft scale pulse. No glow, no halo. */
const sensorsPulse = keyframes`
	0%   { transform: scale(1); }
	50%  { transform: scale(1.14); }
	100% { transform: scale(1); }
`

const LiveSensor = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	svg {
		animation: ${sensorsPulse} 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
		transform-origin: center;
	}
	@media (prefers-reduced-motion: reduce) {
		svg {
			animation: none;
		}
	}
`


import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import {
	DateTimeCell,
	StatusPill,
} from '../_shared/cells'
import { ProfileLink } from '../_shared/ProfileLink'
import { FilterTapes } from '../_shared/FilterTapes'

import {
	UPWORK_PROFILE_TIER_LABEL,
	upworkProfileName,
	useDeleteUpworkProfileMutation,
	useListUpworkProfilesQuery,
	type UpworkProfile,
	type UpworkProfileTier,
} from '../../../store/upwork/upworkApi'

const PAGE_SIZE = 20

type ActivePreset = 'all' | 'active' | 'archived'
const PRESETS: { value: ActivePreset; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'archived', label: 'Archived' },
]

type TierPreset = 'all' | UpworkProfileTier
const TIER_PRESETS: { value: TierPreset; label: string }[] = [
	{ value: 'all', label: 'All tiers' },
	{ value: 'primary', label: 'Primary' },
	{ value: 'secondary', label: 'Secondary' },
]

const UpworkProfilesPage = () => {
	const nav = useNavigate()
	const [sp, setSp] = useSearchParams()

	const activeParam = (sp.get('active') ?? 'all') as ActivePreset
	const tierParam = (sp.get('tier') ?? 'all') as TierPreset
	const searchParam = sp.get('q') ?? ''

	const [searchInput, setSearchInput] = useState(searchParam)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({
		key: 'updatedAt',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<UpworkProfile | null>(null)

	const search = searchInput.trim().toLowerCase()

	useEffect(() => {
		setPage(1)
	}, [search, activeParam, tierParam])

	useEffect(() => {
		const next = new URLSearchParams(sp)
		if (search) next.set('q', search)
		else next.delete('q')
		setSp(next, { replace: true })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search])

	const updateParam = (k: string, v: string) => {
		const next = new URLSearchParams(sp)
		if (v) next.set(k, v)
		else next.delete(k)
		setSp(next, { replace: true })
	}

	const { data: all = [], isLoading, isError, refetch } = useListUpworkProfilesQuery()
	const [del, { isLoading: deleting }] = useDeleteUpworkProfileMutation()

	const filtered = useMemo(() => {
		return all.filter((p) => {
			if (activeParam === 'active' && !p.active) return false
			if (activeParam === 'archived' && p.active) return false
			if (tierParam !== 'all' && p.tier !== tierParam) return false
			if (!search) return true
			const haystack = [p.firstName, p.lastName ?? '']
				.join(' ')
				.toLowerCase()
			return haystack.includes(search)
		})
	}, [all, activeParam, tierParam, search])

	const total = filtered.length
	const paged = useMemo(
		() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		[filtered, page],
	)

	const columns: DataTableColumn<UpworkProfile>[] = [
		{
			key: 'name',
			label: 'Name',
			sortable: true,
			sortValue: (r) => upworkProfileName(r),
			render: (r) => <ProfileLink profile={r} max={220} />,
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'upwork',
			label: 'Profile URL',
			render: (r) =>
				r.url ? (
					<UpworkExternalLink
						href={r.url}
						target='_blank'
						rel='noreferrer'
						onClick={(e) => e.stopPropagation()}
						title='Open on Upwork'
						aria-label='Open on Upwork'
					>
						<OpenInNewRounded />
					</UpworkExternalLink>
				) : (
					<span style={{ color: '#cbd5e1' }}>—</span>
				),
			skeleton: () => <TableSkeleton $w='80px' $h='15px' />,
		},
		{
			key: 'tier',
			label: 'Tier',
			sortable: true,
			sortValue: (r) => (r.tier === 'primary' ? 0 : 1),
			render: (r) => (
				<StatusPill $tone={r.tier === 'primary' ? 'danger' : 'info'}>
					{UPWORK_PROFILE_TIER_LABEL[r.tier]}
				</StatusPill>
			),
			skeleton: () => <TableSkeleton $w='80px' $h='22px' />,
		},
		{
			key: 'active',
			label: 'Status',
			sortable: true,
			sortValue: (r) => (r.active ? 1 : 0),
			render: (r) => (
				<StatusLabel $active={r.active}>
					{r.active ? 'Active' : 'Archived'}
					{r.active ? (
						<LiveSensor>
							<SensorsRounded style={{ fontSize: 24 }} />
						</LiveSensor>
					) : (
						<SensorsOffRounded style={{ fontSize: 24 }} />
					)}
				</StatusLabel>
			),
			skeleton: () => <TableSkeleton $w='100px' $h='24px' />,
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

	const activeFilterCount =
		(search ? 1 : 0) +
		(activeParam !== 'all' ? 1 : 0) +
		(tierParam !== 'all' ? 1 : 0)
	const clearFilters = () => {
		setSearchInput('')
		setSp(new URLSearchParams(), { replace: true })
		setSort({ key: 'updatedAt', direction: 'desc' })
	}

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
				filters={
					<FreshFiltersWrap role='region' aria-label='Profile filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Status</span>
								<span className='bot'>
									{PRESETS.find((p) => p.value === activeParam)?.label ?? 'All'}
								</span>
							</div>
						</div>

						<FilterTapes
							presets={PRESETS}
							value={activeParam}
							onChange={(v) => updateParam('active', v === 'all' ? '' : v)}
							ariaLabel='Profile status preset'
						/>

						<FilterTapes
							presets={TIER_PRESETS}
							value={tierParam}
							onChange={(v) => updateParam('tier', v === 'all' ? '' : v)}
							ariaLabel='Profile tier preset'
						/>

						<SecondRow>
							<SearchPill>
								<SearchOutlined className='ico' />
								<input
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder='Search by name'
									aria-label='Search profiles'
								/>
							</SearchPill>

							<ClearBtn
								type='button'
								onClick={clearFilters}
								disabled={activeFilterCount === 0}
							>
								<ClearRounded style={{ fontSize: 15 }} />
								Clear
							</ClearBtn>
						</SecondRow>
					</FreshFiltersWrap>
				}
			>
				<DataTable<UpworkProfile>
					columns={columns}
					rows={paged}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					emptyTitle='No profiles yet.'
					emptyTitleSearch='No profiles match the current filter.'
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
