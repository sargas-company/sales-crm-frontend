import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import {
	AssignmentIndOutlined,
	CheckRounded,
	ClearRounded,
	ContentCopyRounded,
	SearchOutlined,
	SignalCellularAltRounded,
	TuneRounded,
} from '@mui/icons-material'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	DataTable,
	TableSkeleton,
	type DataTableColumn,
} from '../../components/_shared/DataTable'
import { T } from '../../components/sales-analytics/_shared/tokens'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { useToast } from '../../context/toast/ToastContext'
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
	SearchPill,
} from '../../components/_shared/filters/freshPaperFilters'
import {
	STATUS_LABEL,
	useListBindingsQuery,
	useListPhoneNumbersQuery,
	type PhoneBinding,
	type PhoneStatus,
} from '../../store/phone-numbers/phoneNumbersApi'
import { useListPhoneServicesQuery } from '../../store/phone-numbers/phoneServicesApi'
import { useListProfilesQuery } from '../../store/credentials/credentialsApi'

const STATUS_OPTIONS: { value: PhoneStatus | ''; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'HOLD', label: 'Hold' },
	{ value: 'DISABLED', label: 'Disabled' },
]

const PAGE_SIZE = 25

/* Reuses the exact phone-mask logic from the number list — keeps the
 * two tables visually in sync. */
const formatPhoneMask = (raw: string): string => {
	const digits = raw.replace(/\D/g, '')
	if (!digits) return raw
	const withPlus = raw.trim().startsWith('+') || digits.length >= 10
	if (digits.length === 12) {
		return `${withPlus ? '+' : ''}${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
	}
	if (digits.length === 11) {
		return `${withPlus ? '+' : ''}${digits.slice(0, 1)} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 11)}`
	}
	if (digits.length === 10) {
		return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`
	}
	return raw
}

const PhoneAssignments = () => {
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [copiedId, setCopiedId] = useState<string | null>(null)
	const [status, setStatus] = useState<PhoneStatus | ''>('')
	const [serviceId, setServiceId] = useState<string>('')
	const [profileId, setProfileId] = useState<string>('')
	const [phoneNumberId, setPhoneNumberId] = useState<string>('')
	const [page, setPage] = useState(1)

	const { data: services } = useListPhoneServicesQuery()
	const { data: profilesRes } = useListProfilesQuery(
		{ status: 'ACTIVE', limit: 100 } as any,
	)
	const profiles = (profilesRes as any)?.data ?? []
	const { data: numbersRes } = useListPhoneNumbersQuery({ limit: 500 } as any)
	const phoneNumbers = (numbersRes as any)?.data ?? []

	const { data, isLoading, isError, refetch } = useListBindingsQuery({
		q: search || undefined,
		status: status || undefined,
		serviceId: serviceId || undefined,
		profileId: profileId || undefined,
		phoneNumberId: phoneNumberId || undefined,
		page,
		limit: PAGE_SIZE,
	})
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
		(search ? 1 : 0) +
		(status ? 1 : 0) +
		(serviceId ? 1 : 0) +
		(profileId ? 1 : 0) +
		(phoneNumberId ? 1 : 0)

	const clearAll = () => {
		setSearchInput('')
		setStatus('')
		setServiceId('')
		setProfileId('')
		setPhoneNumberId('')
		setPage(1)
	}

	const columns = useMemo<DataTableColumn<PhoneBinding>[]>(
		() => [
			{
				key: 'number',
				label: 'Number',
				minWidth: 200,
				sortable: true,
				sortValue: (r) => r.phoneNumber.number.replace(/\D/g, ''),
				render: (r) => (
					<NumberCell>
						<NumIcon>
							<SignalCellularAltRounded />
						</NumIcon>
						<Mono>{formatPhoneMask(r.phoneNumber.number)}</Mono>
						<CopyBtn
							type='button'
							aria-label={`Copy ${r.phoneNumber.number}`}
							$copied={copiedId === r.id}
							onClick={async (e) => {
								e.stopPropagation()
								try {
									await navigator.clipboard.writeText(
										r.phoneNumber.number,
									)
									setCopiedId(r.id)
									window.setTimeout(() => {
										setCopiedId((v) =>
											v === r.id ? null : v,
										)
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
				key: 'service',
				label: 'Service',
				minWidth: 140,
				sortable: true,
				sortValue: (r) =>
					r.service?.name?.toLowerCase() ??
					((r as any).serviceName ?? '').toLowerCase(),
				render: (r) => (
					<Plain>
						{r.service?.name ?? (r as any).serviceName ?? '—'}
					</Plain>
				),
				skeleton: () => <TableSkeleton $w='90px' $h='14px' />,
			},
			{
				key: 'profile',
				label: 'Credential profile',
				minWidth: 160,
				sortable: true,
				sortValue: (r) =>
					r.credentialProfile?.name?.toLowerCase() ?? '~',
				render: (r) =>
					r.credentialProfile ? (
						<Plain>{r.credentialProfile.name}</Plain>
					) : (
						<Muted>—</Muted>
					),
				skeleton: () => <TableSkeleton $w='110px' $h='14px' />,
			},
			{
				key: 'status',
				label: 'Status',
				minWidth: 100,
				sortable: true,
				sortValue: (r) => r.status,
				render: (r) => (
					<StatusPill $status={r.status}>{STATUS_LABEL[r.status]}</StatusPill>
				),
				skeleton: () => <TableSkeleton $w='60px' $h='20px' />,
			},
			{
				key: 'updated',
				label: 'Updated',
				minWidth: 120,
				sortable: true,
				sortValue: (r) => new Date(r.updatedAt).getTime(),
				render: (r) => (
					<DateCell>{new Date(r.updatedAt).toLocaleDateString()}</DateCell>
				),
				skeleton: () => <TableSkeleton $w='90px' $h='15px' />,
			},
		],
		[copiedId, showToast],
	)

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Operations' },
				{ label: 'Phone Numbers' },
				{ label: 'Service Assignments', current: true },
			]}
			icon={<AssignmentIndOutlined />}
			title='Service assignments'
			subtitle='One row per phone+service binding. The same number may appear multiple times.'
			action={
				<HeaderStamp aria-hidden='true'>
					<span className='glyph'>↔</span>
					<span className='text'>sim · service matrix</span>
					<span className='count'>
						<em>{total}</em>&nbsp;on screen
					</span>
				</HeaderStamp>
			}
			filters={
				<FreshFiltersWrap
					role='region'
					aria-label='Assignments filters'
				>
					<div className='filter-lead'>
						<span className='lead-icon'>
							<TuneRounded />
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
							aria-label='Search number, service or profile'
						/>
					</SearchPill>

					<RowBreak />

					<InlineField>
						<span className='l'>Number</span>
						<InlineSelect
							value={phoneNumberId}
							onChange={(e) => {
								setPhoneNumberId(e.target.value)
								setPage(1)
							}}
							aria-label='Filter by phone number'
						>
							<option value=''>All numbers</option>
							{phoneNumbers.map((n: any) => (
								<option key={n.id} value={n.id}>
									{formatPhoneMask(n.number)}
								</option>
							))}
						</InlineSelect>
					</InlineField>

					<InlineField>
						<span className='l'>Service</span>
						<InlineSelect
							value={serviceId}
							onChange={(e) => {
								setServiceId(e.target.value)
								setPage(1)
							}}
							aria-label='Filter by service'
						>
							<option value=''>All services</option>
							{(services ?? []).map((s) => (
								<option key={s.id} value={s.id}>
									{s.name}
								</option>
							))}
						</InlineSelect>
					</InlineField>

					<InlineField>
						<span className='l'>Profile</span>
						<InlineSelect
							value={profileId}
							onChange={(e) => {
								setProfileId(e.target.value)
								setPage(1)
							}}
							aria-label='Filter by credential profile'
						>
							<option value=''>All profiles</option>
							{profiles.map((p: any) => (
								<option key={p.id} value={p.id}>
									{p.name}
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
				emptyTitle='No assignments yet'
				emptyTitleSearch='Nothing matches your filters'
				searchActive={!!search || !!status}
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

export default PhoneAssignments

const NumberCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	white-space: nowrap;
`
const NumIcon = styled.span`
	width: 34px;
	height: 34px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${T.primaryTint};
	color: ${T.primary};
`
const Mono = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	font-weight: 500;
	color: ${T.textStrong};
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
const RowBreak = styled.div`
	flex-basis: 100%;
	width: 0;
	height: 0;
	margin: 0;
	padding: 0;
`
const HeaderStamp = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 14px;
	margin-right: 48px;
	transform: rotate(-1deg);
	user-select: none;
	white-space: nowrap;

	.glyph {
		font-family: 'JetBrains Mono', monospace;
		font-size: 26px;
		color: #e85d2f;
		font-weight: 700;
	}
	.text {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 38px;
		line-height: 1;
		color: #e85d2f;
		letter-spacing: 0.3px;
	}
	.count {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: ${T.textMuted};
		padding-left: 14px;
		margin-left: 2px;
		border-left: 1px dashed rgba(36, 30, 22, 0.25);
	}
	.count em {
		font-style: normal;
		color: ${T.textStrong};
		font-weight: 700;
		font-size: 16px;
	}

	@media (max-width: 720px) {
		display: none;
	}
`
const Muted = styled.span`
	color: ${T.textMuted};
	font-size: 12px;
`
const Plain = styled.span`
	font-size: 13.5px;
	font-weight: 500;
	color: ${T.textStrong};
`
const DateCell = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13.5px;
	color: ${T.textStrong};
	font-weight: 600;
	letter-spacing: 0.3px;
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
