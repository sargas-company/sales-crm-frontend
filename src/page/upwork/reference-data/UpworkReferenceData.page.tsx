import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	ArchiveOutlined,
	ArticleOutlined,
	ClearRounded,
	DeleteOutline,
	EditOutlined,
	FilterListOutlined,
	MenuBookOutlined,
	PlaylistAddOutlined,
	SearchOutlined,
} from '@mui/icons-material'

import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
	type DataTableColumn,
	type DataTableSelection,
	type SortState,
} from '../../../components/_shared/DataTable'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import BulkActionBar from '../../../components/_shared/BulkActionBar'
import PermissionGate from '../../../components/auth/PermissionGate'
import {
	BottomSlot,
	ClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import { GhostIconButton } from '../_shared/GhostIconButton'
import {
	CategoryPill,
	Clip,
	DateTimeCell,
	EmptyBadge,
	FreqChip,
	StatusPill,
} from '../_shared/cells'
import { ProfileLink } from '../_shared/ProfileLink'
import { FilterTapes } from '../_shared/FilterTapes'

import {
	UPWORK_REFERENCE_CATEGORIES,
	upworkProfileName,
	useArchiveUpworkReferenceMutation,
	useBulkDeleteUpworkReferencesMutation,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
	type UpworkReferenceCategory,
	type UpworkReferenceData,
} from '../../../store/upwork/upworkApi'

const PAGE_SIZE = 25

type ActivePreset = 'all' | 'active' | 'archived'
const PRESETS: { value: ActivePreset; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'archived', label: 'Archived' },
]

const ValueButton = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: transparent;
	border: none;
	padding: 0;
	cursor: pointer;
	color: inherit;
	font: inherit;
	text-align: left;
	max-width: 100%;
	> span {
		border-bottom: 1px dotted transparent;
		transition:
			color 160ms ease,
			border-color 160ms ease;
	}
	&:hover > span {
		color: #0369a1;
		border-bottom-color: rgba(3, 105, 161, 0.5);
	}
`

const PopupBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 4px 2px 2px;
`
const PopupMeta = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: #64748b;
`
const PopupValue = styled.div`
	padding: 14px 16px;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	background: #f8fafc;
	font-size: 15px;
	line-height: 1.5;
	color: #0f172a;
	white-space: pre-wrap;
	word-break: break-word;
`
const PopupNote = styled.div`
	padding: 10px 14px;
	border-left: 3px solid #cbd5e1;
	background: #f1f5f9;
	border-radius: 0 8px 8px 0;
	font-size: 13.5px;
	color: #475569;
	line-height: 1.5;
	white-space: pre-wrap;
`

const UpworkReferenceDataPage = () => {
	const nav = useNavigate()
	const [sp, setSp] = useSearchParams()

	const profileParam = sp.get('profile') ?? ''
	const categoryParam = (sp.get('category') ?? '') as UpworkReferenceCategory | ''
	const sortFreq = sp.get('sort') === 'freq'
	const searchParam = sp.get('q') ?? ''
	const activeParam = (sp.get('active') ?? 'all') as ActivePreset

	const [searchInput, setSearchInput] = useState(searchParam)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(
		sortFreq
			? { key: 'frequency', direction: 'desc' }
			: { key: 'collectedDate', direction: 'desc' },
	)
	const [selected, setSelected] = useState<Set<string>>(new Set())
	const [toArchive, setToArchive] = useState<UpworkReferenceData | null>(null)
	const [bulkOpen, setBulkOpen] = useState(false)
	const [valuePopup, setValuePopup] = useState<UpworkReferenceData | null>(null)

	const search = searchInput.trim().toLowerCase()

	useEffect(() => {
		setPage(1)
	}, [search, profileParam, categoryParam, sortFreq])

	useEffect(() => {
		const next = new URLSearchParams(sp)
		if (search) next.set('q', search)
		else next.delete('q')
		setSp(next, { replace: true })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search])

	const updateParam = (key: string, value: string) => {
		const next = new URLSearchParams(sp)
		if (value) next.set(key, value)
		else next.delete(key)
		setSp(next, { replace: true })
	}

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const {
		data: rowsAll = [],
		isLoading,
		isError,
		refetch,
	} = useListUpworkReferencesQuery({
		profileId: profileParam || undefined,
		category: categoryParam || undefined,
		sortByFrequency: sortFreq,
		active:
			activeParam === 'active' ? true : activeParam === 'archived' ? false : undefined,
	})
	const [archive] = useArchiveUpworkReferenceMutation()
	const [bulkDelete, { isLoading: bulkDeleting }] =
		useBulkDeleteUpworkReferencesMutation()

	const filtered = useMemo(() => {
		if (!search) return rowsAll
		return rowsAll.filter(
			(r) =>
				r.value.toLowerCase().includes(search) ||
				(r.note ?? '').toLowerCase().includes(search) ||
				r.category.toLowerCase().includes(search),
		)
	}, [rowsAll, search])

	useEffect(() => {
		if (!selected.size) return
		const live = new Set(filtered.map((r) => r.id))
		const next = new Set<string>()
		for (const id of selected) if (live.has(id)) next.add(id)
		if (next.size !== selected.size) setSelected(next)
	}, [filtered])

	const total = filtered.length
	const paged = useMemo(
		() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		[filtered, page],
	)

	const selection = useMemo<DataTableSelection<UpworkReferenceData>>(
		() => ({
			selected,
			onToggleRow: (id, on) =>
				setSelected((prev) => {
					const n = new Set(prev)
					if (on) n.add(id)
					else n.delete(id)
					return n
				}),
			onToggleAllOnPage: (rows, on) =>
				setSelected((prev) => {
					const n = new Set(prev)
					for (const r of rows) {
						if (on) n.add(r.id)
						else n.delete(r.id)
					}
					return n
				}),
			headerLabel: 'Select every entry on this page',
			rowLabel: (r) => `Select ${r.value}`,
		}),
		[selected],
	)

	const columns: DataTableColumn<UpworkReferenceData>[] = [
		{
			key: 'value',
			label: 'Value',
			sortable: true,
			sortValue: (r) => r.value,
			render: (r) => (
				<ValueButton type='button' onClick={() => setValuePopup(r)}>
					<Clip $max={340}>{r.value}</Clip>
				</ValueButton>
			),
			skeleton: () => <TableSkeleton $w='180px' $h='13px' />,
		},
		{
			key: 'category',
			label: 'Category',
			sortable: true,
			sortValue: (r) => r.category,
			render: (r) => <CategoryPill>{r.category.replace(/_/g, ' ')}</CategoryPill>,
			skeleton: () => <TableSkeleton $w='90px' $h='18px' />,
		},
		{
			key: 'profile',
			label: 'Profile',
			render: (r) =>
				r.profile ? (
					<ProfileLink profile={r.profile} max={180} />
				) : (
					<EmptyBadge>shared</EmptyBadge>
				),
			skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
		},
		{
			key: 'frequency',
			label: 'Freq.',
			sortable: true,
			sortValue: (r) => r.frequency ?? -1,
			render: (r) =>
				r.frequency == null ? (
					<EmptyBadge>n/a</EmptyBadge>
				) : (
					<FreqChip $warm={r.frequency >= 100}>{r.frequency}</FreqChip>
				),
		},
		{
			key: 'collectedDate',
			label: 'Collected',
			sortable: true,
			sortValue: (r) => r.collectedDate,
			render: (r) => <DateTimeCell iso={r.collectedDate} />,
		},
		{
			key: 'active',
			label: 'Status',
			render: (r) => (
				<StatusPill $tone={r.active ? 'success' : 'muted'}>
					{r.active ? 'Active' : 'Archived'}
				</StatusPill>
			),
		},
		{
			key: 'actions',
			label: '',
			render: (r) => (
				<Actions>
					<PermissionGate permission='upwork:update'>
						<IconAction
							onClick={() => nav(`/upwork/reference-data/${r.id}/edit`)}
							title='Edit'
						>
							<EditOutlined fontSize='small' />
						</IconAction>
						{r.active && (
							<IconAction onClick={() => setToArchive(r)} title='Archive'>
								<ArchiveOutlined fontSize='small' />
							</IconAction>
						)}
					</PermissionGate>
				</Actions>
			),
		},
	]

	const activeFilterCount =
		(search ? 1 : 0) + (profileParam ? 1 : 0) + (categoryParam ? 1 : 0) + (sortFreq ? 1 : 0)
	const clearFilters = () => {
		setSearchInput('')
		setSort({ key: 'collectedDate', direction: 'desc' })
		setSp(new URLSearchParams(), { replace: true })
	}

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'Upwork', href: '/upwork/reminders' },
					{ label: 'Reference Data', current: true },
				]}
				icon={<MenuBookOutlined />}
				title='Reference Data'
				subtitle='Words, phrases and skills used in change-log entries.'
				action={
					<div style={{ display: 'inline-flex', gap: 10 }}>
						<PermissionGate permission='upwork:create'>
							<GhostIconButton
								onClick={() => nav('/upwork/reference-data/bulk-add')}
							>
								<PlaylistAddOutlined fontSize='small' />
								Bulk add
							</GhostIconButton>
							<PrimarySolidButton
								onClick={() => nav('/upwork/reference-data/new')}
							>
								<AddRounded fontSize='small' />
								New entry
							</PrimarySolidButton>
						</PermissionGate>
					</div>
				}
				filters={
					<FreshFiltersWrap role='region' aria-label='Reference-data filters'>
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
							ariaLabel='Reference-data status preset'
						/>

						<SearchPill>
							<SearchOutlined className='ico' />
							<input
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder='Search value, category, note…'
								aria-label='Search reference entries'
							/>
						</SearchPill>

						<PermissionGate permission='upwork:delete'>
							<div style={{ marginLeft: 'auto' }}>
								<BulkActionBar
									count={selected.size}
									onClear={() => setSelected(new Set())}
									onConfirm={() => setBulkOpen(true)}
									isLoading={bulkDeleting}
								/>
							</div>
						</PermissionGate>

						<RowBreak />

						<BottomSlot>
							<InlineField>
								<span className='l'>Profile</span>
								<InlineSelect
									value={profileParam}
									onChange={(e) => updateParam('profile', e.target.value)}
								>
									<option value=''>All (incl. shared)</option>
									{profiles.map((p) => (
										<option key={p.id} value={p.id}>
											{upworkProfileName(p)}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Category</span>
								<InlineSelect
									value={categoryParam}
									onChange={(e) => updateParam('category', e.target.value)}
								>
									<option value=''>All</option>
									{UPWORK_REFERENCE_CATEGORIES.map((c) => (
										<option key={c} value={c}>
											{c}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Sort</span>
								<InlineSelect
									value={sortFreq ? 'freq' : 'date'}
									onChange={(e) => updateParam('sort', e.target.value === 'freq' ? 'freq' : '')}
								>
									<option value='date'>Newest first</option>
									<option value='freq'>By frequency</option>
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<div className='filter-spacer' style={{ flex: 1 }} />

						<ClearBtn
							type='button'
							onClick={clearFilters}
							disabled={activeFilterCount === 0}
						>
							<ClearRounded style={{ fontSize: 15 }} />
							Clear
						</ClearBtn>
					</FreshFiltersWrap>
				}
			>
				<DataTable<UpworkReferenceData>
					columns={columns}
					rows={paged}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					emptyTitle='No reference entries yet.'
					emptyTitleSearch='Nothing matches the current filter.'
					sort={sort}
					onSortChange={(next) => {
						setSort(next)
						setPage(1)
					}}
					selection={selection}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{toArchive && (
				<ConfirmModal
					icon={<ArchiveOutlined />}
					iconTone='warning'
					confirmColor='warning'
					title='Archive entry?'
					description={
						<>
							Archive <strong>{toArchive.value}</strong>? It stops appearing in
							filters and reference pickers but is kept for historical change-log
							references.
						</>
					}
					confirmLabel='Archive'
					confirmLoadingLabel='Archiving…'
					onConfirm={async () => {
						await archive(toArchive.id).unwrap()
						setToArchive(null)
					}}
					onClose={() => setToArchive(null)}
				/>
			)}

			{bulkOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					confirmColor='error'
					title={`Delete ${selected.size} entries?`}
					description='Removes the selected reference entries permanently. Entries referenced by existing change-log rows cannot be deleted — those rows must be edited or removed first.'
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					isLoading={bulkDeleting}
					onConfirm={async () => {
						await bulkDelete({ ids: Array.from(selected) }).unwrap()
						setSelected(new Set())
						setBulkOpen(false)
					}}
					onClose={() => setBulkOpen(false)}
				/>
			)}

			{valuePopup && (
				<ConfirmModal
					icon={<ArticleOutlined />}
					iconTone='info'
					title='Reference entry'
					description={
						<PopupBody>
							<PopupMeta>
								<CategoryPill>{valuePopup.category.replace(/_/g, ' ')}</CategoryPill>
								{valuePopup.profile ? (
									<ProfileLink profile={valuePopup.profile} max={200} />
								) : (
									<EmptyBadge>shared</EmptyBadge>
								)}
								<span>collected {valuePopup.collectedDate.slice(0, 10)}</span>
								{valuePopup.frequency != null && (
									<FreqChip $warm={valuePopup.frequency >= 100}>
										freq {valuePopup.frequency}
									</FreqChip>
								)}
								<StatusPill $tone={valuePopup.active ? 'success' : 'muted'}>
									{valuePopup.active ? 'Active' : 'Archived'}
								</StatusPill>
							</PopupMeta>
							<PopupValue>{valuePopup.value}</PopupValue>
							{valuePopup.note && <PopupNote>{valuePopup.note}</PopupNote>}
						</PopupBody>
					}
					confirmLabel='Edit'
					confirmColor='primary'
					cancelLabel='Close'
					onConfirm={() => {
						const target = valuePopup
						setValuePopup(null)
						nav(`/upwork/reference-data/${target.id}/edit`)
					}}
					onClose={() => setValuePopup(null)}
				/>
			)}
		</>
	)
}

export default UpworkReferenceDataPage
