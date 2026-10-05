import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	ArchiveOutlined,
	ArrowOutwardOutlined,
	ClearRounded,
	DeleteOutline,
	EditOutlined,
	FolderSpecialOutlined,
	SearchOutlined,
	SellOutlined,
	VisibilityOutlined,
} from '@mui/icons-material'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../analytics/filters/filters.styled'
import {
	ClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../components/_shared/filters/freshPaperFilters'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
	type DataTableColumn,
} from '../../components/_shared/DataTable'
import { T } from '../../components/sales-analytics/_shared/tokens'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { useToast } from '../../context/toast/ToastContext'
import {
	useArchivePortfolioItemMutation,
	useGetPortfolioTagsQuery,
	useListPortfolioQuery,
	type PortfolioItem,
	type PortfolioStatus,
} from '../../store/portfolio/portfolioApi'
import { API_BASE_URL } from '../../api/baseApi'

const PAGE_SIZE = 20

const STATUS_OPTIONS: {
	value: PortfolioStatus | ''
	label: string
}[] = [
	{ value: '', label: 'All' },
	{ value: 'DRAFT', label: 'Draft' },
	{ value: 'READY', label: 'Ready' },
	{ value: 'ARCHIVED', label: 'Archived' },
]

const PortfolioList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [status, setStatus] = useState<PortfolioStatus | ''>('')
	const [tag, setTag] = useState<string>('')
	const [page, setPage] = useState(1)

	const { data, isLoading, isError, refetch } = useListPortfolioQuery({
		q: search || undefined,
		status: status || undefined,
		tag: tag || undefined,
		page,
		limit: PAGE_SIZE,
	})
	const { data: tags = [] } = useGetPortfolioTagsQuery()
	const [archive] = useArchivePortfolioItemMutation()
	const [archiveTarget, setArchiveTarget] = useState<{
		id: string
		title: string
	} | null>(null)
	const [isArchiving, setIsArchiving] = useState(false)

	const rows = data?.data ?? []
	const total = data?.total ?? 0

	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{
		left: number
		width: number
		opacity: number
	}>({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		if (!pillsRef.current) return
		const el = pillsRef.current.querySelector<HTMLButtonElement>(
			'[data-active="true"]',
		)
		if (el) {
			setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
		}
	}, [status])
	const activeStatusLabel =
		STATUS_OPTIONS.find((o) => o.value === status)?.label ?? '—'

	const activeFilterCount =
		(search ? 1 : 0) + (status ? 1 : 0) + (tag ? 1 : 0)

	const clearAll = () => {
		setSearchInput('')
		setStatus('')
		setTag('')
		setPage(1)
	}

	const columns = useMemo<DataTableColumn<PortfolioItem>[]>(
		() => [
			{
				key: 'title',
				label: 'Portfolio item',
				render: (r) => (
					<TitleCell onClick={() => navigate(`/portfolio/${r.slug}`)}>
						<TitleText>{r.title}</TitleText>
						<TitleArrow aria-hidden='true'>
							<ArrowOutwardOutlined />
						</TitleArrow>
					</TitleCell>
				),
				skeleton: () => <TableSkeleton $w='180px' $h='16px' />,
			},
			{
				key: 'status',
				label: 'Status',
				minWidth: 100,
				sortable: true,
				sortValue: (r) => r.status,
				render: (r) => (
					<StatusPill $status={r.status}>
						{r.status.toLowerCase()}
					</StatusPill>
				),
				skeleton: () => <TableSkeleton $w='60px' $h='20px' />,
			},
			{
				key: 'assets',
				label: 'Assets',
				minWidth: 80,
				sortable: true,
				sortValue: (r) => r._count?.assets ?? 0,
				render: (r) => <CountCell>{r._count?.assets ?? 0}</CountCell>,
				skeleton: () => <TableSkeleton $w='30px' $h='15px' />,
			},
			{
				key: 'updatedAt',
				label: 'Updated',
				minWidth: 120,
				sortable: true,
				sortValue: (r) => new Date(r.updatedAt).getTime(),
				render: (r) => (
					<DateCell>{new Date(r.updatedAt).toLocaleDateString()}</DateCell>
				),
				skeleton: () => <TableSkeleton $w='90px' $h='15px' />,
			},
			{
				key: 'actions',
				label: 'Actions',
				render: (r) => (
					<Actions>
						<IconAction
							type='button'
							aria-label='View'
							onClick={() => navigate(`/portfolio/${r.slug}`)}
						>
							<VisibilityOutlined />
						</IconAction>
						<PermissionGate permission='portfolio:update'>
							<IconAction
								type='button'
								aria-label='Edit'
								onClick={() => navigate(`/portfolio/${r.slug}/edit`)}
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
						{r.status !== 'ARCHIVED' && (
							<PermissionGate permission='portfolio:update'>
								<IconAction
									type='button'
									aria-label='Archive'
									$danger
									onClick={() =>
										setArchiveTarget({ id: r.id, title: r.title })
									}
								>
									<ArchiveOutlined />
								</IconAction>
							</PermissionGate>
						)}
					</Actions>
				),
			},
		],
		[navigate],
	)

	return (
		<>
		<ListPageShell
			crumbs={[
				{ label: 'Marketing' },
				{ label: 'Portfolio', current: true },
			]}
			icon={<FolderSpecialOutlined />}
			title='Portfolio'
			subtitle='Case studies and work samples. Markdown bodies, tagged + searchable.'
			action={
				<PermissionGate permission='portfolio:create'>
					<PrimarySolidButton
						type='button'
						onClick={() => navigate('/portfolio/new')}
					>
						<AddRounded />
						New portfolio
					</PrimarySolidButton>
				</PermissionGate>
			}
			filters={
				<FreshFiltersWrap
					role='region'
					aria-label='Portfolio filters'
				>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<SellOutlined />
						</span>
						<div className='lead-text'>
							<span className='top'>Status</span>
							<span className='bot'>{activeStatusLabel}</span>
						</div>
					</div>

					<TapePills ref={pillsRef} role='tablist' aria-label='Status'>
						<TapeIndicator
							style={{
								transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
								width: `${ind.width}px`,
								opacity: ind.opacity,
							}}
						/>
						{STATUS_OPTIONS.map((opt) => (
							<TapePill
								key={opt.value || 'all'}
								type='button'
								role='tab'
								data-active={status === opt.value || undefined}
								aria-selected={status === opt.value}
								$active={status === opt.value}
								onClick={() => setStatus(opt.value)}
							>
								{opt.label}
							</TapePill>
						))}
					</TapePills>

					<SearchPill>
						<SearchOutlined className='ico' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder='Search by title'
							aria-label='Search by portfolio item title'
						/>
					</SearchPill>

					<div className='filter-spacer' />

					<RowBreak />

					<InlineField>
						<span className='l'>Tag</span>
						<InlineSelect
							value={tag}
							onChange={(e) => setTag(e.target.value)}
						>
							<option value=''>Any</option>
							{tags.map((t) => (
								<option key={t.id} value={t.displayName}>
									{t.displayName}
								</option>
							))}
						</InlineSelect>
					</InlineField>

					<div className='filter-spacer' />

					<ClearBtn
						type='button'
						onClick={clearAll}
						disabled={activeFilterCount === 0}
					>
						<ClearRounded style={{ fontSize: 15 }} />
						Clear
					</ClearBtn>
				</FreshFiltersWrap>
			}
		>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				emptyTitle='No portfolio items yet'
				emptyTitleSearch='Nothing matches your filters'
				searchActive={!!search || !!status || !!tag}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total,
					onPageChange: setPage,
				}}
			/>
			{void DeleteOutline}
		</ListPageShell>
		{archiveTarget && (
			<ConfirmModal
				icon={<ArchiveOutlined />}
				iconTone='danger'
				confirmColor='error'
				title='Archive this portfolio item?'
				description={
					<>
						<strong>{archiveTarget.title}</strong> will be moved to
						the archive. It stays searchable with the Archived
						filter and can be restored later from edit.
					</>
				}
				confirmLabel='Archive'
				confirmLoadingLabel='Archiving…'
				cancelLabel='Cancel'
				isLoading={isArchiving}
				onConfirm={async () => {
					if (!archiveTarget) return
					setIsArchiving(true)
					try {
						await archive(archiveTarget.id).unwrap()
						showToast('Archived', 'success')
						setArchiveTarget(null)
					} catch (err) {
						showToast((err as Error).message, 'error')
					} finally {
						setIsArchiving(false)
					}
				}}
				onClose={() => {
					if (!isArchiving) setArchiveTarget(null)
				}}
			/>
		)}
		</>
	)
}

export default PortfolioList

const TitleCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	cursor: pointer;
`
const TitleText = styled.span`
	display: block;
	font-size: 14px;
	color: ${T.textStrong};
	font-weight: 400;
	letter-spacing: -0.1px;
	white-space: nowrap;
	transition: color 160ms ease;

	${TitleCell}:hover & {
		color: ${T.primary};
	}
`
const TitleArrow = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${T.textMuted};
	opacity: 0.55;
	transition: opacity 160ms ease, color 160ms ease;

	svg {
		font-size: 16px;
	}

	${TitleCell}:hover & {
		opacity: 1;
		color: ${T.primary};
	}
`
const StatusPill = styled.span<{ $status: PortfolioStatus }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	white-space: nowrap;
	background: ${(p) =>
		p.$status === 'READY'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$status === 'ARCHIVED'
				? 'rgba(100, 116, 139, 0.1)'
				: 'rgba(217, 119, 6, 0.12)'};
	color: ${(p) =>
		p.$status === 'READY'
			? '#047857'
			: p.$status === 'ARCHIVED'
				? '#475569'
				: '#b45309'};
`
const CountCell = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`
const DateCell = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13.5px;
	color: ${T.textStrong};
	font-weight: 600;
	letter-spacing: 0.3px;
	white-space: nowrap;
`
const Muted = styled.span`
	color: ${T.textMuted};
	font-size: 11.5px;
`
