import {
	ReactNode,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import styled, { keyframes } from 'styled-components'
import {
	CheckCircleOutlined,
	HighlightOffOutlined,
	ReportProblemOutlined,
	TimerOutlined,
	ClearRounded,
	VisibilityOutlined,
	ShieldOutlined,
	AccountBalanceOutlined,
	ErrorOutlineOutlined,
	AdminPanelSettingsOutlined,
	FactCheckOutlined,
	SearchOutlined,
} from '@mui/icons-material'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../../analytics/filters/filters.styled'
import DatePickerPill from '../../finance-weekly/DatePickerPill'
import {
	BottomSlot,
	ClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import {
	ListPageShell,
	type Crumb,
} from '../../../components/_shared/ListPageShell'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
	type DataTableColumn,
} from '../../../components/_shared/DataTable'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import {
	AuditCategory,
	AuditResult,
	AuditSeverity,
	type AuditEvent,
	useGetAuditActorsQuery,
	useGetAuditSummaryQuery,
	useListAuditLogQuery,
} from '../../../store/audit-log/auditLogApi'
import { DOMAIN_LABEL, describeEvent } from './auditVocab'
import { useNavigate } from 'react-router-dom'

export interface KpiBlock {
	key: string
	label: string
	value: number | string
	tone?: 'blue' | 'violet' | 'amber' | 'rose' | 'teal' | 'slate'
	icon?: ReactNode
}

interface Props {
	crumbs: Crumb[]
	icon: ReactNode
	title: string
	subtitle: string
	category: AuditCategory
	showSummary?: boolean
	headerAction?: ReactNode
}

const PAGE_SIZE = 25

const RESULT_OPTIONS: { value: AuditResult | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'SUCCESS', label: 'Success' },
	{ value: 'DENIED', label: 'Denied' },
	{ value: 'FAILED', label: 'Failed' },
]

const AuditActivityView = ({
	crumbs,
	icon,
	title,
	subtitle,
	category,
	showSummary,
	headerAction,
}: Props) => {
	const [page, setPage] = useState(1)
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [filterDomain, setFilterDomain] = useState<string>('')
	const [filterResult, setFilterResult] = useState<AuditResult | ''>('')
	const [filterSeverity, setFilterSeverity] = useState<AuditSeverity | ''>('')
	const [filterActor, setFilterActor] = useState<string>('')
	const [filterFrom, setFilterFrom] = useState<string>('')
	const [filterTo, setFilterTo] = useState<string>('')
	const navigate = useNavigate()

	/* Sliding orange tape indicator for the primary (result) filter. */
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
	}, [filterResult])

	const activeResultLabel =
		RESULT_OPTIONS.find((o) => o.value === filterResult)?.label ?? '—'

	useEffect(() => {
		setPage(1)
	}, [
		category,
		search,
		filterDomain,
		filterResult,
		filterSeverity,
		filterActor,
		filterFrom,
		filterTo,
	])

	const { data, isLoading, isError, refetch } = useListAuditLogQuery({
		category,
		page,
		limit: PAGE_SIZE,
		q: search || undefined,
		domain: filterDomain || undefined,
		result: filterResult || undefined,
		severity: filterSeverity || undefined,
		actorUserId: filterActor || undefined,
		from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
		to: filterTo
			? new Date(`${filterTo}T23:59:59`).toISOString()
			: undefined,
	})

	const { data: summary } = useGetAuditSummaryQuery(
		{
			from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
			to: filterTo
				? new Date(`${filterTo}T23:59:59`).toISOString()
				: undefined,
		},
		{ skip: !showSummary },
	)
	const { data: actorsResp } = useGetAuditActorsQuery()

	const activeFilterCount = useMemo(() => {
		return [
			search ? 1 : 0,
			filterDomain ? 1 : 0,
			filterResult ? 1 : 0,
			filterSeverity ? 1 : 0,
			filterActor ? 1 : 0,
			filterFrom ? 1 : 0,
			filterTo ? 1 : 0,
		].reduce((a, b) => a + b, 0)
	}, [
		search,
		filterDomain,
		filterResult,
		filterSeverity,
		filterActor,
		filterFrom,
		filterTo,
	])

	const clearAll = () => {
		setSearchInput('')
		setFilterDomain('')
		setFilterResult('')
		setFilterSeverity('')
		setFilterActor('')
		setFilterFrom('')
		setFilterTo('')
	}

	const rows = data?.data ?? []
	const total = data?.total ?? 0

	const columns: DataTableColumn<AuditEvent>[] = [
		{
			key: 'result',
			label: '',
			minWidth: 44,
			render: (e) => (
				<ResultIcon $result={e.result}>
					{e.result === 'SUCCESS' ? (
						<CheckCircleOutlined />
					) : e.result === 'DENIED' ? (
						<HighlightOffOutlined />
					) : (
						<ReportProblemOutlined />
					)}
				</ResultIcon>
			),
			skeleton: () => (
				<TableSkeleton $w='34px' $h='34px' style={{ borderRadius: 10 }} />
			),
		},
		{
			key: 'actor',
			label: 'Actor',
			minWidth: 220,
			render: (e) => (
				<ActorText>
					<ActorName>
						{e.actorName ||
							e.actorEmail ||
							(e.actorType === 'SYSTEM' ? 'System' : 'Someone')}
					</ActorName>
					{e.actorEmail && e.actorName && (
						<ActorEmail>{e.actorEmail}</ActorEmail>
					)}
				</ActorText>
			),
			skeleton: () => <TableSkeleton $w='140px' $h='13px' />,
		},
		{
			key: 'event',
			label: 'Event',
			minWidth: 320,
			render: (e) => {
				const { verbText, targetText } = describeEvent(e)
				return (
					<EventCell>
						<Verb>{verbText}</Verb>
						{targetText && <Target>{targetText}</Target>}
					</EventCell>
				)
			},
			skeleton: () => <TableSkeleton $w='240px' $h='13px' />,
		},
		{
			key: 'domain',
			label: 'Domain',
			minWidth: 120,
			render: (e) => (
				<DomainBadge>
					{DOMAIN_LABEL[e.domain] ?? e.domain}
				</DomainBadge>
			),
			skeleton: () => (
				<TableSkeleton $w='72px' $h='20px' style={{ borderRadius: 999 }} />
			),
		},
		{
			key: 'severity',
			label: 'Severity',
			minWidth: 100,
			render: (e) => (
				<SeverityPill $severity={e.severity}>
					{e.severity.toLowerCase()}
				</SeverityPill>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='18px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'result-badge',
			label: 'Result',
			minWidth: 100,
			sortable: true,
			sortValue: (e) => e.result,
			render: (e) => (
				<ResultBadge $result={e.result}>{e.result}</ResultBadge>
			),
			skeleton: () => <TableSkeleton $w='70px' $h='18px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'time',
			label: 'When',
			minWidth: 140,
			sortable: true,
			sortValue: (e) => new Date(e.occurredAt),
			render: (e) => (
				<TimeCell title={new Date(e.occurredAt).toLocaleString()}>
					<TimerOutlined style={{ fontSize: 12 }} />
					{relativeTime(e.occurredAt)}
				</TimeCell>
			),
			skeleton: () => <TableSkeleton $w='84px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (e) => (
				<Actions>
					<IconAction
						type='button'
						aria-label='View event'
						onClick={() => navigate(`/audit-log/event/${e.id}`)}
					>
						<VisibilityOutlined />
					</IconAction>
				</Actions>
			),
		},
	]

	const kpis: KpiBlock[] = showSummary
		? [
				{
					key: 'sensitive',
					label: 'Sensitive access',
					value: summary?.sensitive ?? '—',
					icon: <ShieldOutlined />,
				},
				{
					key: 'financial',
					label: 'Financial changes',
					value: summary?.financial ?? '—',
					icon: <AccountBalanceOutlined />,
				},
				{
					key: 'failed',
					label: 'Failed / Denied',
					value: summary?.failedOrDenied ?? '—',
					icon: <ErrorOutlineOutlined />,
				},
				{
					key: 'roles',
					label: 'Role & permission',
					value: summary?.roleChanges ?? '—',
					icon: <AdminPanelSettingsOutlined />,
				},
			]
		: []

	return (
		<ListPageShell
			crumbs={crumbs}
			icon={icon}
			title={title}
			subtitle={subtitle}
			action={headerAction}
			filters={
				<FreshFiltersWrap
					role='region'
					aria-label='Audit log filters'
				>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<FactCheckOutlined />
						</span>
						<div className='lead-text'>
							<span className='top'>Result</span>
							<span className='bot'>{activeResultLabel}</span>
						</div>
					</div>

					<TapePills ref={pillsRef} role='tablist' aria-label='Result'>
						<TapeIndicator
							style={{
								transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
								width: `${ind.width}px`,
								opacity: ind.opacity,
							}}
						/>
						{RESULT_OPTIONS.map((opt) => (
							<TapePill
								key={opt.value || 'all'}
								type='button'
								role='tab'
								data-active={filterResult === opt.value || undefined}
								aria-selected={filterResult === opt.value}
								$active={filterResult === opt.value}
								onClick={() => setFilterResult(opt.value)}
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
							placeholder='Search'
							aria-label='Search by actor, email, target or action'
						/>
					</SearchPill>

					<div className='filter-spacer' />

					<div className='upwork-hint' aria-hidden='true'>
						<span className='row'>
							<span className='w'>tracking</span>
							<span className='amber-wrap'>
								<span className='a'>every</span>
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
							<span className='w'>move</span>
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

					<BottomSlot>
						<DatePickerPill
							label='From'
							value={filterFrom}
							onChange={setFilterFrom}
							accent='orange'
							size='lg'
							placeholder='Any'
						/>
					</BottomSlot>

					<BottomSlot>
						<DatePickerPill
							label='To'
							value={filterTo}
							onChange={setFilterTo}
							accent='orange'
							size='lg'
							placeholder='Any'
						/>
					</BottomSlot>

					<div className='filter-spacer' />

					<InlineField>
						<span className='l'>Domain</span>
						<InlineSelect
							value={filterDomain}
							onChange={(e) => setFilterDomain(e.target.value)}
						>
							<option value=''>All</option>
							{Object.entries(DOMAIN_LABEL).map(([k, v]) => (
								<option key={k} value={k}>
									{v}
								</option>
							))}
						</InlineSelect>
					</InlineField>

					<InlineField>
						<span className='l'>Severity</span>
						<InlineSelect
							value={filterSeverity}
							onChange={(e) =>
								setFilterSeverity(e.target.value as AuditSeverity | '')
							}
						>
							<option value=''>Any</option>
							<option value='INFO'>Info</option>
							<option value='WARNING'>Warning</option>
							<option value='CRITICAL'>Critical</option>
						</InlineSelect>
					</InlineField>

					<InlineField>
						<span className='l'>Actor</span>
						<InlineSelect
							value={filterActor}
							onChange={(e) => setFilterActor(e.target.value)}
						>
							<option value=''>Anyone</option>
							{(actorsResp?.data ?? []).map((a) => (
								<option key={a.actorUserId} value={a.actorUserId}>
									{a.actorName ||
										a.actorEmail ||
										a.actorUserId.slice(0, 8)}
								</option>
							))}
						</InlineSelect>
					</InlineField>

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
			{showSummary && (
				<KpiRow>
					{kpis.map((k) => (
						<KpiCard key={k.key}>
							<KpiIcon>{k.icon}</KpiIcon>
							<KpiBody>
								<KpiLabel>{k.label}</KpiLabel>
								<KpiValue>{k.value}</KpiValue>
							</KpiBody>
						</KpiCard>
					))}
				</KpiRow>
			)}

			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(e) => e.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				emptyTitle='No audit events yet'
				emptyTitleSearch='Nothing matches these filters'
				searchActive={activeFilterCount > 0}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total,
					onPageChange: setPage,
				}}
			/>

		</ListPageShell>
	)
}

export default AuditActivityView

/* ─── Helpers ─────────────────────────────────────────────────────── */

const relativeTime = (iso: string): string => {
	const diff = Date.now() - new Date(iso).getTime()
	const s = Math.floor(diff / 1000)
	if (s < 60) return 'just now'
	const m = Math.floor(s / 60)
	if (m < 60) return `${m}m ago`
	const h = Math.floor(m / 60)
	if (h < 24) return `${h}h ago`
	const d = Math.floor(h / 24)
	if (d < 7) return `${d}d ago`
	return new Date(iso).toLocaleDateString()
}

/* ─── Styles ──────────────────────────────────────────────────────── */

const KpiRow = styled.div`
	display: grid;
	grid-template-columns: repeat(4, 1fr);
	gap: 12px;
	margin-bottom: 20px;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}
	@media (max-width: 520px) {
		grid-template-columns: 1fr;
	}
`

const kpiEnter = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to { opacity: 1; transform: translateY(0); }
`

/* KPI card — Time-off style: icon chip on the left, label + big number
 * on the right. Neutral tint, no left rail. */
const KpiCard = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	animation: ${kpiEnter} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-child(2) {
		animation-delay: 60ms;
	}
	&:nth-child(3) {
		animation-delay: 120ms;
	}
	&:nth-child(4) {
		animation-delay: 180ms;
	}
`

const KpiIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 46px;
	height: 46px;
	border-radius: 12px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 26px;
	}
`

const KpiBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const KpiLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.55px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const KpiValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 30px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.05;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.7px;
`

/* ─── Row cell styles ────────────────────────────────────────────── */

/* Result icon — neutral chip, no colored border for severity (the
 * SeverityPill carries that signal in its own column). */
const ResultIcon = styled.div<{ $result: AuditResult }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 10px;
	background: ${(p) =>
		p.$result === 'SUCCESS'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$result === 'DENIED'
				? 'rgba(220, 38, 38, 0.1)'
				: 'rgba(217, 119, 6, 0.12)'};
	color: ${(p) =>
		p.$result === 'SUCCESS'
			? '#047857'
			: p.$result === 'DENIED'
				? '#c2410c'
				: '#b45309'};

	svg {
		font-size: 18px;
	}
`

const ActorText = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	line-height: 1.25;
`

const ActorName = styled.span`
	font-size: 12.5px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const ActorEmail = styled.span`
	font-size: 10.5px;
	color: ${T.textMuted};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const EventCell = styled.span`
	display: inline-flex;
	gap: 5px;
	align-items: center;
	flex-wrap: wrap;
	font-size: 12.5px;
	color: ${T.textPrimary};
	min-width: 0;
`

const Verb = styled.span`
	color: ${T.textPrimary};
`

const Target = styled.span`
	font-weight: 600;
	color: ${T.textStrong};
`

/* Domain tag — neutral mono pill matching the backup Type column:
 * subtle grey tint, lowercase mono, 11.5px. Metadata, not severity. */
const DomainBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	color: ${T.textStrong};
	text-transform: lowercase;
	white-space: nowrap;
`

/* Severity — same red/orange/blue palette and dimensions as the
 * notifications table SevTag, no border, tinted pill. */
const SeverityPill = styled.span<{ $severity: AuditSeverity }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	white-space: nowrap;
	color: ${(p) =>
		p.$severity === 'CRITICAL'
			? '#c2410c'
			: p.$severity === 'WARNING'
				? '#e85d2f'
				: '#0369a1'};
	background: ${(p) =>
		p.$severity === 'CRITICAL'
			? 'rgba(220, 38, 38, 0.1)'
			: p.$severity === 'WARNING'
				? 'rgba(232, 93, 47, 0.12)'
				: 'rgba(3, 105, 161, 0.1)'};
`

/* Result — semantic colors: green ok, red denied, amber failed. No
 * border, tinted pill. Dimensions match the notifications SevTag. */
const ResultBadge = styled.span<{ $result: AuditResult }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	white-space: nowrap;
	color: ${(p) =>
		p.$result === 'SUCCESS'
			? '#047857'
			: p.$result === 'DENIED'
				? '#c2410c'
				: '#b45309'};
	background: ${(p) =>
		p.$result === 'SUCCESS'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$result === 'DENIED'
				? 'rgba(220, 38, 38, 0.1)'
				: 'rgba(217, 119, 6, 0.12)'};
`

const TimeCell = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13.5px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;

	svg {
		color: ${T.textMuted};
	}
`

