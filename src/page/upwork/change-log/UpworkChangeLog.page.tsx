import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
	AddRounded,
	ClearRounded,
	DeleteOutline,
	EditNoteOutlined,
	EditOutlined,
	FilterListOutlined,
	SearchOutlined,
	VisibilityOutlined,
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
import styled from 'styled-components'
import { Clip, DateTimeCell } from '../_shared/cells'
import { ProfileLink } from '../_shared/ProfileLink'
import { FilterTapes } from '../_shared/FilterTapes'

import {
	UPWORK_CHANGELOG_SECTIONS,
	UPWORK_SECTION_LABEL,
	upworkProfileName,
	useDeleteUpworkChangeLogMutation,
	useListUpworkChangeLogQuery,
	useListUpworkProfilesQuery,
	type UpworkChangeLog,
	type UpworkChangeLogSection,
} from '../../../store/upwork/upworkApi'

const PAGE_SIZE = 25

/* 9 colour tokens — same geometry and transparency model as
 * `StatusPill` in `_shared/cells.tsx` (project canonical pill):
 *   4px/10px padding · 11px / weight 700 · 0.3 letter-spacing ·
 *   rgba(colour, ~0.12) background · fg = colour anchor.
 * Reuses existing tone anchors (success / danger / warn / muted /
 * info / category purple) and adds 3 compatible siblings
 * (cyan / indigo / rose). */
const SECTION_PALETTE: Record<
	UpworkChangeLogSection,
	{ bg: string; fg: string }
> = {
	title: { bg: 'rgba(3, 105, 161, 0.12)', fg: '#0369a1' },
	overview: { bg: 'rgba(124, 58, 237, 0.10)', fg: '#6d28d9' },
	skills: { bg: 'rgba(34, 197, 94, 0.14)', fg: '#15803d' },
	portfolio: { bg: 'rgba(245, 158, 11, 0.16)', fg: '#a26608' },
	project_catalog: { bg: 'rgba(239, 68, 68, 0.12)', fg: '#b91c1c' },
	consultation: { bg: 'rgba(6, 182, 212, 0.14)', fg: '#0e7490' },
	certificate: { bg: 'rgba(99, 102, 241, 0.14)', fg: '#4338ca' },
	employment_history: { bg: 'rgba(244, 63, 94, 0.12)', fg: '#be123c' },
	other_experience: { bg: 'rgba(100, 116, 139, 0.12)', fg: '#64748b' },
	job_analysis: { bg: 'rgba(217, 119, 6, 0.14)', fg: '#92400e' },
}

const SectionPill = styled.span<{ $section: UpworkChangeLogSection }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: ${({ $section }) => SECTION_PALETTE[$section].bg};
	color: ${({ $section }) => SECTION_PALETTE[$section].fg};
`

type RangePreset = 'all' | '7d' | '30d' | '90d'
const RANGE_PRESETS: { value: RangePreset; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: '7d', label: '7 days' },
	{ value: '30d', label: '30 days' },
	{ value: '90d', label: '90 days' },
]

const presetToFrom = (p: RangePreset): string | undefined => {
	if (p === 'all') return undefined
	const d = new Date()
	d.setDate(d.getDate() - (p === '7d' ? 7 : p === '30d' ? 30 : 90))
	return d.toISOString().slice(0, 10)
}

const UpworkChangeLogPage = () => {
	const nav = useNavigate()
	const [sp, setSp] = useSearchParams()

	const profileParam = sp.get('profile') ?? ''
	const sectionParam = (sp.get('section') ?? '') as UpworkChangeLogSection | ''
	const rangeParam = (sp.get('range') ?? 'all') as RangePreset
	const searchParam = sp.get('q') ?? ''

	const [searchInput, setSearchInput] = useState(searchParam)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>({
		key: 'date',
		direction: 'desc',
	})
	const [toDelete, setToDelete] = useState<UpworkChangeLog | null>(null)

	const search = searchInput.trim().toLowerCase()

	useEffect(() => {
		setPage(1)
	}, [search, profileParam, sectionParam, rangeParam])

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

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const {
		data: rowsAll = [],
		isLoading,
		isError,
		refetch,
	} = useListUpworkChangeLogQuery({
		profileId: profileParam || undefined,
		section: sectionParam || undefined,
		from: presetToFrom(rangeParam),
	})
	const [del, { isLoading: deleting }] = useDeleteUpworkChangeLogMutation()

	const filtered = useMemo(() => {
		if (!search) return rowsAll
		return rowsAll.filter(
			(r) =>
				r.summary.toLowerCase().includes(search) ||
				(r.item ?? '').toLowerCase().includes(search) ||
				(r.reason ?? '').toLowerCase().includes(search),
		)
	}, [rowsAll, search])

	const total = filtered.length
	const paged = useMemo(
		() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
		[filtered, page],
	)

	const columns: DataTableColumn<UpworkChangeLog>[] = [
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
			render: (r) => <ProfileLink profile={r.profile} max={180} />,
			skeleton: () => <TableSkeleton $w='120px' $h='13px' />,
		},
		{
			key: 'section',
			label: 'Section',
			sortable: true,
			sortValue: (r) => r.section,
			render: (r) => (
				<SectionPill $section={r.section}>
					{UPWORK_SECTION_LABEL[r.section]}
				</SectionPill>
			),
			skeleton: () => <TableSkeleton $w='110px' $h='18px' />,
		},
		{
			key: 'change',
			label: 'What changed',
			render: (r) => (
				<Link
					to={`/upwork/change-log/${r.id}`}
					style={{ display: 'block', textDecoration: 'none' }}
				>
					{r.item && (
						<div
							style={{
								fontFamily: 'Bricolage Grotesque, Inter, system-ui, sans-serif',
								fontSize: 14,
								fontWeight: 700,
								color: '#0f172a',
								letterSpacing: '-0.3px',
								marginBottom: 2,
							}}
						>
							{r.item}
						</div>
					)}
					<Clip
						$max={420}
						style={{ color: '#475569', fontSize: 12.5, fontWeight: 400 }}
					>
						{r.summary}
					</Clip>
				</Link>
			),
			skeleton: () => <TableSkeleton $w='240px' $h='13px' />,
		},
		{
			key: 'actions',
			label: '',
			render: (r) => (
				<Actions>
					<IconAction
						onClick={() => nav(`/upwork/change-log/${r.id}`)}
						title='View'
					>
						<VisibilityOutlined fontSize='small' />
					</IconAction>
					<PermissionGate permission='upwork:update'>
						<IconAction
							onClick={() => nav(`/upwork/change-log/${r.id}/edit`)}
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
		(profileParam ? 1 : 0) +
		(sectionParam ? 1 : 0) +
		(rangeParam !== 'all' ? 1 : 0)
	const clearFilters = () => {
		setSearchInput('')
		setSort({ key: 'date', direction: 'desc' })
		setSp(new URLSearchParams(), { replace: true })
	}

	return (
		<>
			<ListPageShell
				crumbs={[
					{ label: 'Upwork', href: '/upwork/reminders' },
					{ label: 'Change Log', current: true },
				]}
				icon={<EditNoteOutlined />}
				title='Change Log'
				subtitle='Edits to a profile with before / after text.'
				action={
					<PermissionGate permission='upwork:create'>
						<PrimarySolidButton onClick={() => nav('/upwork/change-log/new')}>
							<AddRounded fontSize='small' />
							New entry
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={
					<FreshFiltersWrap role='region' aria-label='Change log filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Range</span>
								<span className='bot'>
									{RANGE_PRESETS.find((p) => p.value === rangeParam)?.label ?? 'All'}
								</span>
							</div>
						</div>

						<FilterTapes
							presets={RANGE_PRESETS}
							value={rangeParam}
							onChange={(v) => updateParam('range', v === 'all' ? '' : v)}
							ariaLabel='Change log date range'
						/>

						<SearchPill>
							<SearchOutlined className='ico' />
							<input
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								placeholder='Search summary, item, reason…'
								aria-label='Search change log'
							/>
						</SearchPill>

						<RowBreak />

						<BottomSlot>
							<InlineField>
								<span className='l'>Profile</span>
								<InlineSelect
									value={profileParam}
									onChange={(e) => updateParam('profile', e.target.value)}
								>
									<option value=''>All</option>
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
								<span className='l'>Section</span>
								<InlineSelect
									value={sectionParam}
									onChange={(e) => updateParam('section', e.target.value)}
								>
									<option value=''>All</option>
									{UPWORK_CHANGELOG_SECTIONS.map((s) => (
										<option key={s} value={s}>
											{UPWORK_SECTION_LABEL[s]}
										</option>
									))}
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
				<DataTable<UpworkChangeLog>
					columns={columns}
					rows={paged}
					rowKey={(r) => r.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					emptyTitle='No change-log entries yet.'
					emptyTitleSearch='Nothing matches the current filter.'
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
					title='Delete entry?'
					description={
						<>
							Delete <strong>{toDelete.summary}</strong>? Reference links are kept
							for history but the entry itself is removed. This cannot be undone.
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

export default UpworkChangeLogPage
