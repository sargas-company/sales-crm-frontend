import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	BuildOutlined,
	CheckCircleOutlined,
	ClearRounded,
	CheckRounded,
	ContentCopyRounded,
	DeleteOutline,
	EditOutlined,
	PhoneAndroidOutlined,
	PowerSettingsNewRounded,
	ScheduleRounded,
	SearchOutlined,
	SignalCellularAltRounded,
	SimCardOutlined,
	VisibilityOutlined,
	WarningAmberOutlined,
} from '@mui/icons-material'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import parseServerError from '../../utils/parseServerError'
import { useToast } from '../../context/toast/ToastContext'
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
import {
	OPERATOR_LABEL,
	STATUS_LABEL,
	maskNumber,
	useDisablePhoneNumberMutation,
	useGetPhoneSummaryQuery,
	useListPhoneNumbersQuery,
	type PhoneNumber,
	type PhoneOperator,
	type PhoneStatus,
} from '../../store/phone-numbers/phoneNumbersApi'

const STATUS_OPTIONS: { value: PhoneStatus | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'HOLD', label: 'Hold' },
	{ value: 'DISABLED', label: 'Disabled' },
]

/* +380991234567 → "+380 99 123 45 67"; other shapes are lightly
 * normalised: digits grouped as 3-2-3-2-2 after a leading "+". */
const formatPhoneMask = (raw: string): string => {
	const digits = raw.replace(/\D/g, '')
	if (!digits) return raw
	const withPlus = raw.trim().startsWith('+') || digits.length >= 10
	if (digits.length === 12) {
		// e.g. 380991234567 → +380 99 123 45 67
		return `${withPlus ? '+' : ''}${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
	}
	if (digits.length === 11) {
		// e.g. 10001234567 → +1 000 123 4567 (minimal fallback)
		return `${withPlus ? '+' : ''}${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`
	}
	if (digits.length === 10) {
		// e.g. 0991234567 → 099 123 45 67
		return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`
	}
	return raw
}

const PAGE_SIZE = 25

const PhoneNumbersList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [copiedId, setCopiedId] = useState<string | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<PhoneNumber | null>(null)
	const [disableMut, { isLoading: isDisabling }] =
		useDisablePhoneNumberMutation()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [operator, setOperator] = useState<PhoneOperator | ''>('')
	const [status, setStatus] = useState<PhoneStatus | ''>('')
	const [overdueOnly, setOverdueOnly] = useState(false)

	const { data, isLoading, isError, refetch } = useListPhoneNumbersQuery({
		q: search || undefined,
		operator: operator || undefined,
		status: status || undefined,
		maintenanceOverdue: overdueOnly || undefined,
		page,
		limit: PAGE_SIZE,
	})
	const { data: summary } = useGetPhoneSummaryQuery()

	const rows = data?.data ?? []
	const total = data?.total ?? 0

	/* Tape-pill indicator for the Status filter. */
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
		(search ? 1 : 0) +
		(status ? 1 : 0) +
		(operator ? 1 : 0) +
		(overdueOnly ? 1 : 0)

	const clearAll = () => {
		setSearchInput('')
		setStatus('')
		setOperator('')
		setOverdueOnly(false)
		setPage(1)
	}

	const columns = useMemo<DataTableColumn<PhoneNumber>[]>(
		() => [
			{
				key: 'number',
				label: 'Number',
				sortable: true,
				sortValue: (r) => r.number.replace(/\D/g, ''),
				render: (r) => (
					<NumberCell>
						<NumIcon $status={r.status}>
							<SignalCellularAltRounded />
						</NumIcon>
						<Mono>{formatPhoneMask(r.number)}</Mono>
						<CopyBtn
							type='button'
							aria-label={`Copy ${r.number}`}
							$copied={copiedId === r.id}
							onClick={async (e) => {
								e.stopPropagation()
								try {
									await navigator.clipboard.writeText(r.number)
									setCopiedId(r.id)
									window.setTimeout(() => {
										setCopiedId((v) => (v === r.id ? null : v))
									}, 1200)
								} catch {
									showToast('Could not copy', 'error')
								}
							}}
						>
							{copiedId === r.id ? (
								<CheckRounded style={{ fontSize: 14 }} />
							) : (
								<ContentCopyRounded style={{ fontSize: 14 }} />
							)}
						</CopyBtn>
					</NumberCell>
				),
				skeleton: () => <TableSkeleton $w='140px' $h='18px' />,
			},
			{
				key: 'operator',
				label: 'Operator',
				sortable: true,
				sortValue: (r) => OPERATOR_LABEL[r.operator].toLowerCase(),
				render: (r) => (
					<OperatorPill>{OPERATOR_LABEL[r.operator]}</OperatorPill>
				),
				skeleton: () => (
					<TableSkeleton $w='70px' $h='20px' style={{ borderRadius: 999 }} />
				),
			},
			{
				key: 'holder',
				label: 'Holder',
				sortable: true,
				sortValue: (r) => {
					const name =
						r.holderName?.trim() ||
						(r.holder
							? `${r.holder.lastName} ${r.holder.firstName}`
							: '')
					return name ? name.toLowerCase() : '￿'
				},
				render: (r) => {
					const name =
						r.holderName?.trim() ||
						(r.holder
							? `${r.holder.firstName} ${r.holder.lastName}`
							: '')
					return name ? (
						<HolderName>{name}</HolderName>
					) : (
						<Muted>—</Muted>
					)
				},
				skeleton: () => <TableSkeleton $w='120px' $h='14px' />,
			},
			{
				key: 'status',
				label: 'Status',
				sortable: true,
				sortValue: (r) => STATUS_LABEL[r.status],
				render: (r) => (
					<StatusPill $status={r.status}>
						{STATUS_LABEL[r.status]}
					</StatusPill>
				),
				skeleton: () => (
					<TableSkeleton
						$w='64px'
						$h='20px'
						style={{ borderRadius: 999 }}
					/>
				),
			},
			{
				key: 'nextMaintenance',
				label: 'Next maintenance',
				sortable: true,
				sortValue: (r) =>
					r.nextMaintenanceAt
						? new Date(r.nextMaintenanceAt).getTime()
						: Number.MAX_SAFE_INTEGER,
				render: (r) => {
					if (!r.maintenanceRequired)
						return <Muted>No maintenance</Muted>
					if (!r.nextMaintenanceAt) return <Muted>—</Muted>
					const date = new Date(r.nextMaintenanceAt)
					const overdue = date.getTime() < Date.now()
					return (
						<DateCell $overdue={overdue}>
							{date.toLocaleDateString()}
						</DateCell>
					)
				},
				skeleton: () => <TableSkeleton $w='84px' $h='14px' />,
			},
			{
				key: 'actions',
				label: 'Actions',
				render: (r) => (
					<Actions>
						<IconAction
							type='button'
							aria-label='View'
							onClick={() => navigate(`/phone-numbers/view/${r.id}`)}
						>
							<VisibilityOutlined />
						</IconAction>
						<PermissionGate permission='phone_numbers:update'>
							<IconAction
								type='button'
								aria-label='Edit'
								onClick={() => navigate(`/phone-numbers/edit/${r.id}`)}
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
						<PermissionGate permission='phone_numbers:delete'>
							<IconAction
								type='button'
								aria-label='Disable number'
								$danger
								disabled={r.status === 'DISABLED'}
								onClick={() => setDeleteTarget(r)}
							>
								<DeleteOutline />
							</IconAction>
						</PermissionGate>
					</Actions>
				),
			},
		],
		[navigate, copiedId, showToast],
	)

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Operations' },
				{ label: 'Phone Numbers' },
				{ label: 'Numbers', current: true },
			]}
			icon={<PhoneAndroidOutlined />}
			title='Phone numbers'
			subtitle='SIM inventory with holder, status and the services they power.'
			action={
				<HeroActions>
					<PermissionGate permission='phone_numbers:view'>
						<GhostLink
							type='button'
							onClick={() => navigate('/phone-numbers/maintenance')}
						>
							<BuildOutlined style={{ fontSize: 16 }} />
							Maintenance
							{summary && (summary.due + summary.overdue) > 0 && (
								<HintPill>{summary.due + summary.overdue}</HintPill>
							)}
						</GhostLink>
					</PermissionGate>
					<PermissionGate permission='phone_numbers:create'>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate('/phone-numbers/new')}
						>
							<AddRounded />
							New number
						</PrimarySolidButton>
					</PermissionGate>
				</HeroActions>
			}
			filters={
				<FreshFiltersWrap
					role='region'
					aria-label='Phone numbers filters'
				>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<SimCardOutlined />
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
							placeholder='Search'
							aria-label='Search number, holder, service or profile'
						/>
					</SearchPill>

					<div className='filter-spacer' />

					<div className='upwork-hint' aria-hidden='true'>
						<span className='row'>
							<span className='w'>every</span>
							<span className='amber-wrap'>
								<span className='a'>SIM</span>
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
							<span className='w'>covered</span>
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
						<span className='l'>Operator</span>
						<InlineSelect
							value={operator}
							onChange={(e) =>
								setOperator(e.target.value as PhoneOperator | '')
							}
						>
							<option value=''>Any</option>
							<option value='VODAFONE'>Vodafone</option>
							<option value='KYIVSTAR'>Kyivstar</option>
							<option value='LIFECELL'>Lifecell</option>
							<option value='OTHER'>Other</option>
						</InlineSelect>
					</InlineField>

					<OverdueToggle>
						<input
							type='checkbox'
							checked={overdueOnly}
							onChange={(e) => setOverdueOnly(e.target.checked)}
						/>
						Overdue maintenance only
					</OverdueToggle>

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
			{summary && (
				<HeroCards>
					<HeroCard>
						<HeroIcon>
							<PhoneAndroidOutlined />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Total</HeroLabel>
							<HeroValue>{summary.total}</HeroValue>
						</HeroBody>
					</HeroCard>
					<HeroCard>
						<HeroIcon>
							<CheckCircleOutlined />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Active</HeroLabel>
							<HeroValue>{summary.active}</HeroValue>
						</HeroBody>
					</HeroCard>
					<HeroCard>
						<HeroIcon>
							<WarningAmberOutlined />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Due · overdue</HeroLabel>
							<HeroValue>
								{summary.due + summary.overdue}
							</HeroValue>
						</HeroBody>
					</HeroCard>
					<HeroCard>
						<HeroIcon>
							<ScheduleRounded />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Next maintenance</HeroLabel>
							<HeroValue>
								{summary.nextMaintenanceDate
									? new Date(
											summary.nextMaintenanceDate,
										).toLocaleDateString()
									: '—'}
							</HeroValue>
						</HeroBody>
					</HeroCard>
				</HeroCards>
			)}
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				emptyTitle='No phone numbers yet'
				emptyTitleSearch='No numbers match your filters'
				searchActive={!!search || !!operator || !!status || overdueOnly}
				pagination={{
					page,
					pageSize: PAGE_SIZE,
					total,
					onPageChange: setPage,
				}}
			/>
			{void maskNumber}
			{deleteTarget && (
				<ConfirmModal
					icon={<PowerSettingsNewRounded />}
					iconTone='danger'
					confirmColor='error'
					title='Disable phone number?'
					description={
						<>
							This marks <strong>{deleteTarget.number}</strong> as{' '}
							<strong>DISABLED</strong> and turns maintenance off. The
							number stays in history and can be re-activated later from
							the edit page.
						</>
					}
					confirmLabel='Disable'
					confirmLoadingLabel='Disabling…'
					cancelLabel='Cancel'
					isLoading={isDisabling}
					onConfirm={async () => {
						if (!deleteTarget) return
						try {
							await disableMut(deleteTarget.id).unwrap()
							showToast('Phone number disabled', 'warning')
							setDeleteTarget(null)
						} catch (err) {
							showToast(parseServerError(err), 'error')
						}
					}}
					onClose={() => {
						if (!isDisabling) setDeleteTarget(null)
					}}
				/>
			)}
		</ListPageShell>
	)
}

export default PhoneNumbersList

/* ─── Styles ───────────────────────────────────────── */

const HeroActions = styled.div`
	display: inline-flex;
	gap: 10px;
	align-items: center;
`
const GhostLink = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: ${T.textStrong};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	&:hover {
		border-color: ${T.primary};
		color: ${T.primary};
	}
`
const HintPill = styled.span`
	min-width: 18px;
	padding: 1px 7px;
	border-radius: 999px;
	background: ${T.warning};
	color: #ffffff;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10px;
	font-weight: 700;
`
/* Time-off style hero cards — icon chip 46×46 + label + big mono value. */
const HeroCards = styled.div`
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
const HeroCard = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`
const HeroIcon = styled.span`
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
const HeroBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`
const HeroLabel = styled.span`
	font-size: 12px;
	font-weight: 700;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.55px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`
const HeroValue = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 24px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.05;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.5px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

/* Overdue checkbox styled to fit next to InlineSelect in the filter row. */
const OverdueToggle = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	align-self: flex-end;
	box-sizing: border-box;
	min-height: 42px;
	padding: 0 16px;
	border-radius: 999px;
	border: 1.5px solid rgba(36, 30, 22, 0.14);
	background: #ffffff;
	color: #241e16;
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;

	input {
		accent-color: #e85d2f;
		cursor: pointer;
	}
`
const NumberCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	white-space: nowrap;
`

const CopyBtn = styled.button<{ $copied?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border: 0;
	padding: 0;
	margin-left: -19px;
	background: transparent;
	color: ${(p) => (p.$copied ? '#16a34a' : T.textMuted)};
	cursor: pointer;
	transition: color 160ms ease, transform 160ms ease;

	&:hover {
		color: ${(p) => (p.$copied ? '#16a34a' : T.primary)};
	}
	&:active {
		transform: scale(0.9);
	}
`

const OperatorPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 12px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	color: ${T.textStrong};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: lowercase;
	white-space: nowrap;
`
const NumIcon = styled.span<{ $status: PhoneStatus }>`
	width: 34px;
	height: 34px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${T.primaryTint};
	color: ${T.primary};

	/* $status kept for API continuity but the chip stays brand-blue
	 * across all statuses — status is already shown in its own column. */
	${(p) => void p.$status && ''}
`
const Mono = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	font-weight: 500;
	color: ${T.textStrong};
`
const Muted = styled.div`
	font-size: 11px;
	color: ${T.textMuted};
`
const HolderName = styled.span`
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
`

const StatusPill = styled.span<{ $status: PhoneStatus }>`
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
		p.$status === 'ACTIVE'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$status === 'HOLD'
				? 'rgba(217, 119, 6, 0.12)'
				: 'rgba(100, 116, 139, 0.1)'};
	color: ${(p) =>
		p.$status === 'ACTIVE'
			? '#047857'
			: p.$status === 'HOLD'
				? '#b45309'
				: '#475569'};
`
const DateCell = styled.span<{ $overdue: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13.5px;
	color: ${(p) => (p.$overdue ? '#b91c1c' : T.textStrong)};
	font-weight: ${(p) => (p.$overdue ? 700 : 600)};
	letter-spacing: 0.3px;
	white-space: nowrap;
`
