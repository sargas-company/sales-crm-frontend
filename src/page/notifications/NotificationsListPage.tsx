import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	NotificationsNoneOutlined,
	NorthEastRounded,
	SearchOutlined,
	VisibilityOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	Actions,
	DataTable,
	IconAction,
	type DataTableColumn,
} from '../../components/_shared/DataTable'
import {
	useGetAttentionQuery,
	type AttentionItem,
	type AttentionSeverity,
} from '../../store/attention/attentionApi'
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
import { ClearRounded } from '@mui/icons-material'

const PAGE_SIZE = 25

const severityLabel = (s: AttentionSeverity): string =>
	s === 'critical' ? 'CRIT' : s === 'warn' ? 'WARN' : 'INFO'

const formatDate = (iso: string): string => {
	const d = new Date(iso)
	return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`
}

const SEVERITY_RANK: Record<AttentionSeverity, number> = {
	critical: 0,
	warn: 1,
	info: 2,
}

const SEVERITY_OPTIONS: { value: AttentionSeverity | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'critical', label: 'Critical' },
	{ value: 'warn', label: 'Warn' },
	{ value: 'info', label: 'Info' },
]

const NotificationsListPage = () => {
	const navigate = useNavigate()
	const [page, setPage] = useState(1)
	const [search, setSearch] = useState('')
	const [severity, setSeverity] = useState<AttentionSeverity | ''>('')
	const [category, setCategory] = useState<string>('')
	const { data, isLoading, isError, refetch } = useGetAttentionQuery(
		undefined,
		{ pollingInterval: 120_000 },
	)

	const allItems = data?.items ?? []
	const filtered = useMemo(() => {
		let rows = allItems
		if (severity) rows = rows.filter((r) => r.severity === severity)
		if (category) rows = rows.filter((r) => r.category === category)
		if (search.trim()) {
			const q = search.trim().toLowerCase()
			rows = rows.filter(
				(it) =>
					it.title.toLowerCase().includes(q) ||
					(it.description ?? '').toLowerCase().includes(q) ||
					it.category.toLowerCase().includes(q) ||
					it.severity.toLowerCase().includes(q),
			)
		}
		return rows
	}, [allItems, search, severity, category])

	const paged = useMemo(() => {
		const start = (page - 1) * PAGE_SIZE
		return filtered.slice(start, start + PAGE_SIZE)
	}, [filtered, page])

	const activeFilterCount =
		(search ? 1 : 0) + (severity ? 1 : 0) + (category ? 1 : 0)

	const clearAll = () => {
		setSearch('')
		setSeverity('')
		setCategory('')
		setPage(1)
	}

	/* Sliding orange tape indicator for the primary (severity) filter. */
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
	}, [severity])

	const activeSeverityLabel =
		SEVERITY_OPTIONS.find((o) => o.value === severity)?.label ?? '—'

	const columns = useMemo<DataTableColumn<AttentionItem>[]>(
		() => [
			{
				key: 'severity',
				label: 'Severity',
				sortable: true,
				sortValue: (r) => SEVERITY_RANK[r.severity],
				render: (r) => (
					<SevTag $sev={r.severity}>{severityLabel(r.severity)}</SevTag>
				),
			},
			{
				key: 'category',
				label: 'Category',
				sortable: true,
				sortValue: (r) => r.category,
				render: (r) => <Mono>{r.category}</Mono>,
			},
			{
				key: 'item',
				label: 'Item',
				minWidth: 460,
				sortable: true,
				sortValue: (r) => r.title.toLowerCase(),
				render: (r) => (
					<ItemCell>
						<TitleLink
							type='button'
							onClick={() => navigate(`/notifications/${r.id}`)}
						>
							{r.title}
						</TitleLink>
						{r.description && <Desc>{r.description}</Desc>}
					</ItemCell>
				),
			},
			{
				key: 'createdAt',
				label: 'Last signal',
				sortable: true,
				sortValue: (r) => new Date(r.createdAt),
				render: (r) => <Mono>{formatDate(r.createdAt)}</Mono>,
			},
			{
				key: 'go',
				label: '',
				render: (r) =>
					r.action ? (
						<ActionBtn
							type='button'
							onClick={() => navigate(r.action!.route)}
						>
							{r.action.label}
							<NorthEastRounded style={{ fontSize: 14 }} />
						</ActionBtn>
					) : null,
			},
			{
				key: 'actions',
				label: 'Actions',
				render: (r) => (
					<Actions>
						<IconAction
							type='button'
							aria-label='View notification'
							onClick={() => navigate(`/notifications/${r.id}`)}
						>
							<VisibilityOutlined />
						</IconAction>
					</Actions>
				),
			},
		],
		[navigate],
	)

	const resetPage = <V,>(cb: (v: V) => void) => (v: V) => {
		cb(v)
		setPage(1)
	}

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Workspace' },
				{ label: 'Notifications', current: true },
			]}
			icon={<NotificationsNoneOutlined />}
			title='Notifications'
			subtitle='Items that need your attention — system health, business signals, admin events. Updates every two minutes.'
			filters={
				<FreshFiltersWrap
					role='region'
					aria-label='Notification filters'
				>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<NotificationsNoneOutlined />
						</span>
						<div className='lead-text'>
							<span className='top'>Severity</span>
							<span className='bot'>{activeSeverityLabel}</span>
						</div>
					</div>

					<TapePills
						ref={pillsRef}
						role='tablist'
						aria-label='Severity'
					>
						<TapeIndicator
							style={{
								transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
								width: `${ind.width}px`,
								opacity: ind.opacity,
							}}
						/>
						{SEVERITY_OPTIONS.map((opt) => (
							<TapePill
								key={opt.value || 'all'}
								type='button'
								role='tab'
								data-active={severity === opt.value || undefined}
								aria-selected={severity === opt.value}
								$active={severity === opt.value}
								onClick={() => resetPage(setSeverity)(opt.value)}
							>
								{opt.label}
							</TapePill>
						))}
					</TapePills>

					<SearchPill>
						<SearchOutlined className='ico' />
						<input
							type='text'
							value={search}
							onChange={(e) => resetPage(setSearch)(e.target.value)}
							placeholder='Search'
							aria-label='Search title, description or category'
						/>
					</SearchPill>

					<div className='filter-spacer' />

					<div className='upwork-hint' aria-hidden='true'>
						<span className='row'>
							<span className='w'>nothing</span>
							<span className='amber-wrap'>
								<span className='a'>escapes</span>
								<svg
									className='squiggle'
									viewBox='0 0 120 12'
									width='120'
									height='12'
									preserveAspectRatio='none'
								>
									<path
										d='M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 8'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
									/>
								</svg>
							</span>
							<span className='w'>us</span>
						</span>
						<span className='stars'>
							<svg
								className='s'
								width='14'
								height='14'
								viewBox='0 0 24 24'
								fill='currentColor'
							>
								<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
							</svg>
						</span>
					</div>

					<RowBreak />

					<InlineField>
						<span className='l'>Category</span>
						<InlineSelect
							value={category}
							onChange={(e) =>
								resetPage(setCategory)(e.target.value)
							}
						>
							<option value=''>Any</option>
							<option value='system'>System</option>
							<option value='business'>Business</option>
							<option value='admin'>Admin</option>
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
				rows={paged}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				searchActive={!!search || !!severity || !!category}
				emptyTitle='Nothing needs your attention'
				emptyTitleSearch='Nothing matches your filters'
				defaultSort={{ key: 'severity', direction: 'asc' }}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total: filtered.length,
					onPageChange: setPage,
				}}
			/>
		</ListPageShell>
	)
}

export default NotificationsListPage

/* ─── Cell styles ────────────────────────────────── */

const SevTag = styled.span<{ $sev: AttentionSeverity }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	white-space: nowrap;
	color: ${(p) =>
		p.$sev === 'critical'
			? '#c2410c'
			: p.$sev === 'warn'
				? '#e85d2f'
				: '#0369a1'};
	background: ${(p) =>
		p.$sev === 'critical'
			? 'rgba(220, 38, 38, 0.1)'
			: p.$sev === 'warn'
				? 'rgba(232, 93, 47, 0.12)'
				: 'rgba(3, 105, 161, 0.1)'};
`

const Mono = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	color: ${T.textSecondary};
	letter-spacing: 0.3px;
	text-transform: lowercase;
	white-space: nowrap;
`

const ItemCell = styled.div`
	min-width: 0;
`

const TitleLink = styled.button`
	background: transparent;
	border: 0;
	padding: 0;
	font: inherit;
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	line-height: 1.35;
	text-align: left;
	cursor: pointer;
	transition: color 160ms ease;

	&:hover {
		color: ${T.primary};
		text-decoration: underline;
	}
`

const Desc = styled.div`
	margin-top: 3px;
	font-size: 12.5px;
	color: ${T.textSecondary};
	line-height: 1.45;
`

const ActionBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border: 1px solid ${T.border};
	background: transparent;
	color: ${T.primary};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	padding: 6px 12px;
	border-radius: 8px;
	cursor: pointer;
	white-space: nowrap;
	transition: border-color 160ms, background 160ms;

	svg {
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover {
		border-color: ${T.primary};
	}
	&:hover svg {
		transform: translate(2px, -2px);
	}
`
