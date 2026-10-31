import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	AddRounded,
	ClearRounded,
	DeleteOutline,
	EditNoteOutlined,
	EditOutlined,
	SearchOutlined,
	VisibilityOutlined,
} from '@mui/icons-material'

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
	InlineField,
	InlineSelect,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import { Clip, DateTimeCell, SectionPill } from '../_shared/cells'
import { ProfileLink } from '../_shared/ProfileLink'
import DatePickerPill from '../../finance-weekly/DatePickerPill'
import { T } from '../../../components/sales-analytics/_shared/tokens'
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


const UpworkChangeLogPage = () => {
	const nav = useNavigate()
	const [sp, setSp] = useSearchParams()

	const profileParam = sp.get('profile') ?? ''
	const sectionParam = (sp.get('section') ?? '') as UpworkChangeLogSection | ''
	const fromParam = sp.get('from') ?? ''
	const toParam = sp.get('to') ?? ''
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
	}, [search, profileParam, sectionParam, fromParam, toParam])

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
		from: fromParam || undefined,
		to: toParam || undefined,
	})
	const [del, { isLoading: deleting }] = useDeleteUpworkChangeLogMutation()

	const filtered = useMemo(() => {
		if (!search) return rowsAll
		return rowsAll.filter((r) => r.note.toLowerCase().includes(search))
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
			key: 'note',
			label: 'Note',
			render: (r) => (
				<Clip
					$max={420}
					style={{ color: '#475569', fontSize: 13, fontWeight: 400 }}
					title={r.note}
				>
					{r.note}
				</Clip>
			),
			skeleton: () => <TableSkeleton $w='320px' $h='13px' />,
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
		(fromParam ? 1 : 0) +
		(toParam ? 1 : 0)
	const clearFilters = () => {
		setSearchInput('')
		setSort({ key: 'date', direction: 'desc' })
		setSp(new URLSearchParams(), { replace: true })
	}

	return (
		<>
			<ViewFade>
				<ShellCard>
					<ShellInner>
						<Crumbs>
							<span className='crumb-dot' aria-hidden='true' />
							<span className='crumb-parent'>Upwork</span>
							<span className='crumb-sep' aria-hidden='true'>
								/
							</span>
							<span className='current'>Change log</span>
						</Crumbs>

						<PageHead>
							<div className='title'>
								<HeadIcon>
									<EditNoteOutlined />
								</HeadIcon>
								<div className='title-text'>
									<h1>Change log</h1>
									<p>
										Record of profile edits — a date, a section and a short
										note.
									</p>
								</div>
							</div>
							<div className='title-right' aria-hidden='true'>
								<span className='hand-line'>touch it, log it</span>
								<span className='hand-flourish'>
									<svg viewBox='0 0 120 20' width='120' height='20'>
										<path
											d='M2 12 C 28 2, 60 22, 96 6'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
										<path
											d='M88 4 L 98 6 L 92 14'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
											strokeLinejoin='round'
										/>
									</svg>
								</span>
							</div>
							<div className='title-action'>
								<PermissionGate permission='upwork:create'>
									<PrimarySolidButton
										onClick={() => nav('/upwork/change-log/new')}
									>
										<AddRounded fontSize='small' />
										New entry
									</PrimarySolidButton>
								</PermissionGate>
							</div>
						</PageHead>

						<FiltersBlock role='region' aria-label='Change log filters'>
							<TopFilterRow>
								<DecisionGroup>
									<div className='filter-lead'>
										<span className='lead-icon'>
											<EditNoteOutlined />
										</span>
										<div className='lead-text'>
											<span className='top'>Filters</span>
											<span className='bot'>
												{activeFilterCount
													? `${activeFilterCount} active`
													: 'Date, profile, section'}
											</span>
										</div>
									</div>

									<RangeGroup aria-label='Date range'>
										<BottomSlot>
											<DatePickerPill
												label='From'
												value={fromParam}
												onChange={(v) => updateParam('from', v)}
												accent='orange'
												size='lg'
												placeholder='Any'
											/>
										</BottomSlot>

										<RangeDash aria-hidden='true'>—</RangeDash>

										<BottomSlot>
											<DatePickerPill
												label='To'
												value={toParam}
												onChange={(v) => updateParam('to', v)}
												accent='orange'
												size='lg'
												placeholder='Any'
											/>
										</BottomSlot>
									</RangeGroup>
								</DecisionGroup>
							</TopFilterRow>

							<BottomFilterRow>
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

								<SearchPill className='search'>
									<SearchOutlined className='ico' />
									<input
										type='text'
										name='search-change-log'
										placeholder='Search by note'
										value={searchInput}
										onChange={(e) => setSearchInput(e.target.value)}
										aria-label='Search change log'
									/>
								</SearchPill>

								<ClearBtn
									className='clear'
									type='button'
									onClick={clearFilters}
									disabled={activeFilterCount === 0}
								>
									<ClearRounded style={{ fontSize: 15 }} />
									Clear
								</ClearBtn>
							</BottomFilterRow>
						</FiltersBlock>

						<TableWrap>
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
						</TableWrap>
					</ShellInner>
				</ShellCard>
			</ViewFade>

			{toDelete && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					confirmColor='error'
					title='Delete entry?'
					description={
						<>
							Delete the <strong>{UPWORK_SECTION_LABEL[toDelete.section]}</strong>
							{' '}entry from {new Date(toDelete.date).toLocaleDateString('en-GB')}?
							This cannot be undone.
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

/* ─── Styled shell — mirrored from job-posts list ──────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const handDraw = keyframes`
	from { opacity: 0; transform: translate(-6px, 4px) rotate(-6deg); }
	to   { opacity: 1; transform: translate(0, 0)     rotate(-6deg); }
`

const flourishDraw = keyframes`
	from { stroke-dashoffset: 240; opacity: 0; }
	to   { stroke-dashoffset: 0;   opacity: 1; }
`

const ViewFade = styled.div`
	animation: ${fadeUp} 240ms ${T.ease};
`

const ShellCard = styled.div`
	position: relative;
	background: ${T.cardBg};
	border-radius: ${T.radiusLg};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	overflow: hidden;
`

const ShellInner = styled.div`
	padding: 30px 32px 32px;
	display: flex;
	flex-direction: column;
	gap: 22px;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 18px;
	}
`

const Crumbs = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12.5px;
	color: ${T.textMuted};

	.crumb-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.primary};
	}
	.crumb-sep {
		opacity: 0.4;
	}
	.current {
		color: ${T.textSecondary};
		font-weight: 600;
	}
`

const PageHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
	padding-bottom: 22px;
	border-bottom: 1px solid ${T.divider};

	.title {
		display: inline-flex;
		align-items: center;
		gap: 18px;
		min-width: 0;
	}
	.title-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.title-text h1 {
		margin: 0;
		font-size: 34px;
		font-weight: 700;
		letter-spacing: -0.8px;
		line-height: 1.05;
		color: ${T.textStrong};
	}
	.title-text p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: ${T.textSecondary};
		max-width: 62ch;
	}

	.title-right {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		flex: 1 1 auto;
		min-width: 0;
	}
	.hand-line {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 42px;
		font-weight: 700;
		line-height: 1;
		color: #0369a1;
		transform: rotate(-6deg);
		transform-origin: right center;
		text-shadow: 0 6px 22px rgba(2, 132, 199, 0.22);
		animation: ${handDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
		white-space: nowrap;
	}
	.hand-flourish {
		display: inline-flex;
		color: #0284c7;
		opacity: 0.75;
		margin-right: -4px;
		transform: rotate(-4deg);
	}
	.hand-flourish svg path {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: ${flourishDraw} 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
	}

	.title-action {
		display: inline-flex;
		align-items: center;
		flex-shrink: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		.hand-line {
			animation: none;
			transform: rotate(-6deg);
		}
		.hand-flourish svg path {
			animation: none;
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}

	@media (max-width: 720px) {
		.title-text h1 {
			font-size: 28px;
			letter-spacing: -0.5px;
		}
		.title-right {
			display: none;
		}
	}
`

const HeadIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 28px;
	}
`

const FiltersBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

const TopFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px 16px;
	min-height: 56px;
`

const DecisionGroup = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 10px 14px;
	flex: 1 1 auto;
	min-width: 0;

	.filter-lead {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding-right: 22px;
		border-right: 1px solid rgba(36, 30, 22, 0.08);
	}
	.filter-lead .lead-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 11px;
		background: #241e16;
		color: #fdfaf2;
		transition:
			transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
			background 220ms ease;
	}
	.filter-lead .lead-icon svg {
		font-size: 20px;
		transition: transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.filter-lead:hover .lead-icon {
		transform: rotate(-6deg) scale(1.08);
		background: #e85d2f;
	}
	.filter-lead .lead-text {
		display: flex;
		flex-direction: column;
		line-height: 1.15;
		min-width: 78px;
	}
	.filter-lead .lead-text .top {
		font-family: 'Fraunces', 'Georgia', serif;
		font-variation-settings: 'opsz' 36;
		font-size: 17px;
		font-weight: 600;
		color: #241e16;
		letter-spacing: -0.2px;
	}
	.filter-lead .lead-text .bot {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 10.5px;
		color: #7d6e5d;
		letter-spacing: 0.7px;
		text-transform: uppercase;
		margin-top: 3px;
		white-space: nowrap;
		transition: color 200ms ease;
	}
	.filter-lead:hover .lead-text .bot {
		color: #e85d2f;
	}
`

const BottomFilterRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	align-items: flex-end;
	gap: 10px 12px;

	.search {
		flex: 0 0 auto;
		min-width: 180px;
	}
	.search input {
		width: 180px;
	}

	.clear {
		margin-left: auto;
	}
`

const RangeGroup = styled.div`
	display: inline-flex;
	align-items: flex-end;
	gap: 10px;
	align-self: flex-end;
	padding: 4px 10px;
	border: 1px dashed rgba(36, 30, 22, 0.14);
	border-radius: 14px;
`

const RangeDash = styled.span`
	align-self: flex-end;
	display: inline-flex;
	align-items: center;
	min-height: 42px;
	padding: 0 2px;
	color: #7d6e5d;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 16px;
	font-weight: 700;
	line-height: 1;
	user-select: none;
`

const TableWrap = styled.div``
