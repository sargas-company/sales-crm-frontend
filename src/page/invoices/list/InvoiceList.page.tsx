import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	DeleteOutline,
	VisibilityOutlined,
	EditOutlined,
	ReceiptLongOutlined,
	AddRounded,
	PaidOutlined,
	DownloadRounded,
	SearchOutlined,
	ClearRounded,
	FilterListOutlined,
	DescriptionOutlined,
	MailOutline,
	CheckCircleOutline,
	AttachMoneyOutlined,
} from '@mui/icons-material'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	DataTable,
	Actions,
	IconAction,
	TableSkeleton,
} from '../../../components/_shared/DataTable'
import type {
	DataTableColumn,
	DataTableSelection,
	SortState,
} from '../../../components/_shared/DataTable'
import { PrimarySolidButton } from '../../../components/_shared/formShell.styled'
import {
	BottomSlot,
	ClearBtn as FreshClearBtn,
	FreshFiltersWrap,
	InlineField,
	InlineSelect,
	RowBreak,
	SearchPill,
} from '../../../components/_shared/filters/freshPaperFilters'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../../analytics/filters/filters.styled'
import BulkActionBar from '../../../components/_shared/BulkActionBar'
import ConfirmModal from '../../../components/_shared/ConfirmModal'
import InvoiceDeleteModal from '../../../components/invoices/list/InvoiceDeleteModal'
import InvoiceMarkPaidModal from '../../../components/invoices/list/InvoiceMarkPaidModal'
import PermissionGate from '../../../components/auth/PermissionGate'
import {
	formatInvoiceMoney,
	getCounterpartyName,
	getInvoiceTotal,
} from '../../../components/invoices/list/utils'
import type {
	InvoiceItem,
	InvoiceSortBy,
	InvoiceStatus,
} from '../../../store/invoices/invoicesApi'
import {
	bulkDownloadInvoicesZip,
	useBulkDeleteInvoicesMutation,
	useGetInvoiceListQuery,
	useGetInvoiceStatsQuery,
} from '../../../store/invoices/invoicesApi'
import { useGetCounterpartiesQuery } from '../../../store/counterparties/counterpartiesApi'
import { formatDate } from '../../../utils/format'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import usePermissions from '../../../hooks/usePermissions'
import { useToast } from '../../../context/toast/ToastContext'

const PAGE_SIZE = 20

interface Target {
	id: string
	title: string
}

const invoiceLabel = (i: InvoiceItem) => (i.number ? `Invoice #${i.number}` : `Invoice ${i.id}`)

/** Status "preset" tabs — same tape visual as Employees / Clients. */
type StatusPreset = '' | InvoiceStatus
const STATUS_PRESETS: { value: StatusPreset; label: string }[] = [
	{ value: '', label: 'All' },
	{ value: 'open', label: 'Open' },
	{ value: 'paid', label: 'Paid' },
	{ value: 'draft', label: 'Draft' },
]

/** Light-weight count-up: animates `target` from the previous value
 *  on each render, used for KPI card counters. Mirrors the inline
 *  copies elsewhere in the codebase. */
function useCountUp(target: number, duration = 500): number {
	const [value, setValue] = useState(target)
	useEffect(() => {
		const from = value
		const to = target
		if (from === to) return
		const start = performance.now()
		let raf = 0
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			setValue(Math.round(from + (to - from) * eased))
			if (t < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		return () => cancelAnimationFrame(raf)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target])
	return value
}

const KpiCounter = ({ value }: { value: number | undefined }) => {
	const v = useCountUp(value ?? 0)
	if (value === undefined) return <>—</>
	return <>{v}</>
}

/** Money-counter: animates integer part of USD-ish amount and renders
 *  with grouped thousands + decimals. The animation targets the
 *  rounded-cents representation so tweens stay smooth. */
const KpiMoneyCounter = ({ value }: { value: number | undefined }) => {
	const cents = Math.round((value ?? 0) * 100)
	const animated = useCountUp(cents)
	if (value === undefined) return <>—</>
	const whole = animated / 100
	return (
		<>
			${whole.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
		</>
	)
}

const InvoiceList = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchParams, setSearchParams] = useSearchParams()

	// URL-synced filter values; deep link reproduces the exact state.
	const statusParam = (searchParams.get('status') ?? '') as StatusPreset
	const counterpartyIdParam = searchParams.get('counterparty') ?? ''
	const typeParam = (searchParams.get('type') ?? '') as '' | 'client' | 'contractor'
	const dateFromParam = searchParams.get('from') ?? ''
	const dateToParam = searchParams.get('to') ?? ''

	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const [page, setPage] = useState(1)
	const [sort, setSort] = useState<SortState | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<Target | null>(null)
	const [paidTarget, setPaidTarget] = useState<Target | null>(null)

	const [selected, setSelected] = useState<Set<string>>(() => new Set())
	const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)
	const [isDownloading, setIsDownloading] = useState(false)
	const [bulkDelete, { isLoading: isBulkDeleting }] = useBulkDeleteInvoicesMutation()

	// Pull a big page of counterparties for the dropdown. 500 is more
	// than enough for any realistic directory; if the owner ever grows
	// past that, swap for a typeahead.
	const { data: counterpartiesData } = useGetCounterpartiesQuery({
		page: 1,
		limit: 500,
		sortBy: 'firstName',
		sortDirection: 'asc',
	})
	const counterparties = counterpartiesData?.data ?? []

	const filterParams = {
		search: search || undefined,
		status: statusParam || undefined,
		counterpartyId: counterpartyIdParam || undefined,
		type: typeParam || undefined,
		dateFrom: dateFromParam || undefined,
		dateTo: dateToParam || undefined,
	}

	const { data: stats } = useGetInvoiceStatsQuery(filterParams)

	const { data, isLoading, isError, refetch } = useGetInvoiceListQuery({
		page,
		limit: PAGE_SIZE,
		...filterParams,
		sortBy: (sort?.key as InvoiceSortBy | undefined) ?? undefined,
		sortDirection: sort?.direction,
	})

	const updateParam = (key: string, value: string) => {
		const next = new URLSearchParams(searchParams)
		if (value) next.set(key, value)
		else next.delete(key)
		setSearchParams(next, { replace: true })
		setPage(1)
	}

	const clearFilters = () => {
		const next = new URLSearchParams(searchParams)
		next.delete('status')
		next.delete('counterparty')
		next.delete('type')
		next.delete('from')
		next.delete('to')
		setSearchParams(next, { replace: true })
		setSearchInput('')
		setPage(1)
	}

	const activeFilterCount =
		(statusParam ? 1 : 0) +
		(counterpartyIdParam ? 1 : 0) +
		(typeParam ? 1 : 0) +
		(dateFromParam ? 1 : 0) +
		(dateToParam ? 1 : 0) +
		(searchInput ? 1 : 0)

	// Status TapePills sliding indicator — same pattern as other
	// list pages (Clients / Employees / Phone numbers).
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState({ left: 0, width: 0, opacity: 0 })
	useLayoutEffect(() => {
		const root = pillsRef.current
		if (!root) return
		const el = root.querySelector<HTMLButtonElement>(
			'[role="tab"][data-active="true"]',
		)
		if (!el) {
			setInd((p) => ({ ...p, opacity: 0 }))
			return
		}
		const rootRect = root.getBoundingClientRect()
		const r = el.getBoundingClientRect()
		setInd({
			left: r.left - rootRect.left - 2,
			width: r.width + 4,
			opacity: 1,
		})
	}, [statusParam])

	useEffect(() => {
		setPage(1)
	}, [search, statusParam, counterpartyIdParam, typeParam, dateFromParam, dateToParam])
	const allItems = data ? (Array.isArray(data) ? data : data.data) : []
	const total = data ? (Array.isArray(data) ? data.length : data.total) : 0

	const handleSortChange = (next: SortState | null) => {
		setSort(next)
		setPage(1)
	}

	useEffect(() => {
		setPage(1)
	}, [search])

	// Count of selected rows that are actually downloadable (status
	// is open/paid). Drafts count toward the Delete action but not
	// the Download secondary-action counter.
	const downloadableSelectedCount = useMemo(
		() =>
			allItems.filter(
				(i) =>
					selected.has(i.id) && (i.status === 'open' || i.status === 'paid'),
			).length,
		[allItems, selected],
	)

	const selection = useMemo<DataTableSelection<InvoiceItem>>(
		() => ({
			selected,
			onToggleRow: (id, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					if (next) n.add(id)
					else n.delete(id)
					return n
				}),
			onToggleAllOnPage: (rows, next) =>
				setSelected((prev) => {
					const n = new Set(prev)
					for (const r of rows) {
						if (next) n.add(r.id)
						else n.delete(r.id)
					}
					return n
				}),
			headerLabel: 'Select every invoice on this page',
			rowLabel: (i) => `Select ${invoiceLabel(i)}`,
		}),
		[selected],
	)

	const handleBulkDelete = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		try {
			const res = await bulkDelete(ids).unwrap()
			const skippedPart = res.skipped.length
				? ` (${res.skipped.length} skipped)`
				: ''
			showToast(
				`Deleted ${res.deleted} invoice${res.deleted === 1 ? '' : 's'}${skippedPart}`,
				'success',
			)
			setSelected(new Set())
			setBulkDeleteOpen(false)
			refetch()
		} catch {
			showToast('Bulk delete failed', 'error')
		}
	}

	const handleBulkDownload = async () => {
		const ids = [...selected]
		if (ids.length === 0) return
		setIsDownloading(true)
		try {
			const { blob, filename, skippedCount } =
				await bulkDownloadInvoicesZip(ids)
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			document.body.appendChild(a)
			a.click()
			a.remove()
			URL.revokeObjectURL(url)
			const downloaded = ids.length - skippedCount
			showToast(
				`Downloaded ${downloaded} of ${ids.length} invoice${ids.length === 1 ? '' : 's'}` +
					(skippedCount > 0
						? ` (${skippedCount} skipped — drafts or missing PDF)`
						: ''),
				'success',
			)
		} catch {
			showToast('Bulk download failed', 'error')
		} finally {
			setIsDownloading(false)
		}
	}

	// Invoice scope inherits from the linked counterparty. Callers
	// without `contractor_scope:manage` cannot mutate a contractor
	// invoice — backend returns 403 — so hide row-level Edit /
	// Mark-Paid / Delete on those rows to keep the UI honest.
	const { has } = usePermissions()
	const canManageContractor = has('contractor_scope:manage')
	const canMutateRow = (i: InvoiceItem) =>
		i.counterparty?.type !== 'contractor' || canManageContractor

	const columns: DataTableColumn<InvoiceItem>[] = [
		{
			key: 'number',
			label: 'Invoice',
			minWidth: 140,
			sortable: true,
			sortValue: (i) => i.number ?? '',
			render: (i) => <InvoiceNum>{i.number ?? '—'}</InvoiceNum>,
			skeleton: () => <TableSkeleton $w='90px' $h='14px' />,
		},
		{
			key: 'counterparty',
			label: 'Counterparty',
			minWidth: 220,
			sortable: true,
			sortValue: (i) => getCounterpartyName(i),
			render: (i) => <Muted>{getCounterpartyName(i)}</Muted>,
			skeleton: () => <TableSkeleton $w='160px' $h='13px' />,
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 110,
			sortable: true,
			sortValue: (i) => i.status ?? '',
			render: (i) => (
				<StatusPill $status={i.status ?? 'draft'}>{i.status ?? 'draft'}</StatusPill>
			),
			skeleton: () => <TableSkeleton $w='60px' $h='22px' style={{ borderRadius: 999 }} />,
		},
		{
			key: 'date',
			label: 'Date',
			minWidth: 130,
			sortable: true,
			sortValue: (i) => new Date(i.date),
			render: (i) => <Muted>{formatDate(i.date, 'short')}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'dueDate',
			label: 'Due',
			minWidth: 130,
			sortable: true,
			sortValue: (i) => (i.dueDate ? new Date(i.dueDate) : null),
			render: (i) => <Muted>{i.dueDate ? formatDate(i.dueDate, 'short') : '—'}</Muted>,
			skeleton: () => <TableSkeleton $w='80px' $h='13px' />,
		},
		{
			key: 'total',
			label: 'Total',
			minWidth: 140,
			render: (i) => <MoneyPill>{formatInvoiceMoney(getInvoiceTotal(i), i.currency)}</MoneyPill>,
			skeleton: () => <TableSkeleton $w='100px' $h='24px' style={{ borderRadius: 8 }} />,
		},
		{
			key: 'currency',
			label: 'Currency',
			minWidth: 100,
			sortable: true,
			sortValue: (i) => i.currency,
			render: (i) => <Muted>{i.currency}</Muted>,
			skeleton: () => <TableSkeleton $w='40px' $h='13px' />,
		},
		{
			key: 'actions',
			label: 'Actions',
			render: (i) => (
				<Actions>
					<IconAction
						type='button'
						onClick={() => navigate(`/invoices/preview/${i.id}`)}
						aria-label='View invoice'
					>
						<VisibilityOutlined />
					</IconAction>
					{canMutateRow(i) && (
						<PermissionGate permission='invoices:update'>
							<IconAction
								type='button'
								onClick={() => navigate(`/invoices/edit/${i.id}`)}
								aria-label='Edit invoice'
							>
								<EditOutlined />
							</IconAction>
						</PermissionGate>
					)}
					{canMutateRow(i) && i.status !== 'paid' && (
						<PermissionGate permission='invoices:update'>
							<IconAction
								type='button'
								onClick={() => setPaidTarget({ id: i.id, title: invoiceLabel(i) })}
								aria-label='Mark as paid'
							>
								<PaidOutlined />
							</IconAction>
						</PermissionGate>
					)}
					{canMutateRow(i) && (
						<PermissionGate permission='invoices:delete'>
							<IconAction
								type='button'
								$danger
								onClick={() => setDeleteTarget({ id: i.id, title: invoiceLabel(i) })}
								aria-label='Delete invoice'
							>
								<DeleteOutline />
							</IconAction>
						</PermissionGate>
					)}
				</Actions>
			),
		},
	]

	return (
		<>
			<ListPageShell
				crumbs={[{ label: 'Billing' }, { label: 'Invoices', current: true }]}
				icon={<ReceiptLongOutlined />}
				title='Invoices'
				subtitle='Client invoices, totals and payment status.'
				action={
					<PermissionGate permission='invoices:create'>
						<PrimarySolidButton type='button' onClick={() => navigate('/invoices/add/')}>
							<AddRounded />
							New invoice
						</PrimarySolidButton>
					</PermissionGate>
				}
				filters={
					<InvoiceFiltersWrap role='region' aria-label='Invoices filters'>
						<div className='filter-lead'>
							<span className='lead-icon'>
								<FilterListOutlined />
							</span>
							<div className='lead-text'>
								<span className='top'>Filter</span>
								<span className='bot'>
									{STATUS_PRESETS.find((p) => p.value === statusParam)?.label ??
										'All'}
								</span>
							</div>
						</div>

						<TapePills ref={pillsRef} role='tablist' aria-label='Status preset'>
							<TapeIndicator
								style={{
									transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
									width: `${ind.width}px`,
									opacity: ind.opacity,
								}}
							/>
							{STATUS_PRESETS.map((p) => (
								<TapePill
									key={p.value || 'all'}
									type='button'
									role='tab'
									data-active={statusParam === p.value || undefined}
									aria-selected={statusParam === p.value}
									$active={statusParam === p.value}
									onClick={() => updateParam('status', p.value)}
								>
									{p.label}
								</TapePill>
							))}
						</TapePills>

						<div className='filter-spacer' />

						<div className='upwork-hint' aria-hidden='true'>
							<span className='row'>
								<span className='w'>every</span>
								<span className='amber-wrap'>
									<span className='a'>INVOICE</span>
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
								<span className='w'>in sight</span>
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
							<SearchPill>
								<SearchOutlined className='ico' />
								<input
									type='text'
									value={searchInput}
									onChange={(e) => setSearchInput(e.target.value)}
									placeholder='Search by invoice number'
									aria-label='Search invoices'
								/>
							</SearchPill>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Counterparty</span>
								<InlineSelect
									value={counterpartyIdParam}
									onChange={(e) => updateParam('counterparty', e.target.value)}
								>
									<option value=''>Any</option>
									{counterparties.map((c) => (
										<option key={c.id} value={c.id}>
											{`${c.firstName} ${c.lastName}`.trim() ||
												c.company ||
												c.id}
										</option>
									))}
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>Type</span>
								<InlineSelect
									value={typeParam}
									onChange={(e) => updateParam('type', e.target.value)}
								>
									<option value=''>Any</option>
									<option value='client'>Client</option>
									<option value='contractor'>Contractor</option>
								</InlineSelect>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>From</span>
								<InlineDateInput
									type='date'
									value={dateFromParam}
									onChange={(e) => updateParam('from', e.target.value)}
								/>
							</InlineField>
						</BottomSlot>

						<BottomSlot>
							<InlineField>
								<span className='l'>To</span>
								<InlineDateInput
									type='date'
									value={dateToParam}
									onChange={(e) => updateParam('to', e.target.value)}
								/>
							</InlineField>
						</BottomSlot>

						<div className='filter-spacer' />

						<FreshClearBtn
							type='button'
							onClick={clearFilters}
							disabled={activeFilterCount === 0}
						>
							<ClearRounded style={{ fontSize: 15 }} />
							Clear
						</FreshClearBtn>
					</InvoiceFiltersWrap>
				}
			>
				<KpiRow>
					<KpiCard>
						<KpiIcon>
							<DescriptionOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Total</KpiLabel>
							<KpiNum>
								<KpiCounter value={stats?.total} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<AttachMoneyOutlined />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Total amount</KpiLabel>
							<KpiNum>
								<KpiMoneyCounter value={stats?.totalAmount} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<MailOutline />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Open</KpiLabel>
							<KpiNum>
								<KpiCounter value={stats?.open} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
					<KpiCard>
						<KpiIcon>
							<CheckCircleOutline />
						</KpiIcon>
						<KpiBody>
							<KpiLabel>Paid</KpiLabel>
							<KpiNum>
								<KpiCounter value={stats?.paid} />
							</KpiNum>
						</KpiBody>
					</KpiCard>
				</KpiRow>

				<BulkBarSlot aria-live='polite'>
					<BulkActionBar
						persistent
						count={selected.size}
						onClear={() => setSelected(new Set())}
						onConfirm={() => setBulkDeleteOpen(true)}
						isLoading={isBulkDeleting}
						secondaryActions={[
							{
								key: 'download',
								label: 'Download selected',
								count: downloadableSelectedCount,
								icon: <DownloadRounded />,
								tone: 'default',
								onClick: handleBulkDownload,
								isLoading: isDownloading,
								disabled: downloadableSelectedCount === 0,
							},
						]}
					/>
				</BulkBarSlot>

				<DataTable
					columns={columns}
					rows={allItems}
					rowKey={(i) => i.id}
					isLoading={isLoading}
					isError={isError}
					onRetry={refetch}
					searchActive={!!search}
					sort={sort}
					onSortChange={handleSortChange}
					selection={selection}
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total,
						onPageChange: setPage,
					}}
				/>
			</ListPageShell>

			{bulkDeleteOpen && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					title={`Delete ${selected.size} invoice${selected.size === 1 ? '' : 's'}?`}
					description={
						<>
							You are about to delete <strong>{selected.size}</strong> invoice
							{selected.size === 1 ? '' : 's'}. This cannot be undone.
						</>
					}
					confirmLabel={`Delete ${selected.size}`}
					confirmLoadingLabel='Deleting…'
					confirmColor='error'
					cancelLabel='Cancel'
					onClose={() => setBulkDeleteOpen(false)}
					onConfirm={handleBulkDelete}
					isLoading={isBulkDeleting}
				/>
			)}

			{deleteTarget && (
				<InvoiceDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (allItems.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}

			{paidTarget && (
				<InvoiceMarkPaidModal
					id={paidTarget.id}
					title={paidTarget.title}
					onClose={() => setPaidTarget(null)}
					onSuccess={refetch}
				/>
			)}
		</>
	)
}

export default InvoiceList

const InvoiceNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
	white-space: nowrap;
`

const Muted = styled.span`
	font-size: 13.5px;
	color: ${T.textSecondary};
`

const MoneyPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 5px 12px;
	border-radius: 8px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.primary};
	background: ${T.primaryTint};
	border: 0;
	white-space: nowrap;
`

/* Lives inside ListPageShell's FiltersBar (flex-wrap: wrap) — grows
   to take the remaining horizontal space to the right of the search
   field. Zero padding so the bar's own inner padding is the only
   spacer. */
const BulkBarSlot = styled.div`
	flex: 1;
	min-width: 320px;
	display: flex;
	justify-content: flex-end;
`

/* Full-width extension of the shared FreshFiltersWrap (same width:100%
 * trick used on EmployeeList). */
const InvoiceFiltersWrap = styled(FreshFiltersWrap)`
	width: 100%;
	padding: 18px 22px;
`

/* Native date input styled to visually match InlineSelect — min-height
 * 42px, same radius / border / typography. */
const InlineDateInput = styled.input`
	appearance: none;
	-webkit-appearance: none;
	box-sizing: border-box;
	min-height: 42px;
	border: 1.5px solid rgba(36, 30, 22, 0.14);
	border-radius: 999px;
	background: #ffffff;
	padding: 10px 14px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: #241e16;
	line-height: 1.2;
	cursor: pointer;
	transition: border-color 180ms ease;

	&:hover,
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: #241e16;
	}
`

/* ─── KPI cards (clone of TimeOffList's row). ───────────────── */

const KpiRow = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
	gap: 14px;
	margin-bottom: 18px;
`

const KpiCard = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 16px 18px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid ${T.border};
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
`

const KpiIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 12px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 22px;
	}
`

const KpiBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const KpiLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const KpiNum = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 26px;
	font-weight: 700;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.3px;
	line-height: 1.1;
`

const StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	background: ${({ $status }) =>
		$status === 'paid'
			? 'rgba(34, 197, 94, 0.14)'
			: $status === 'draft'
				? 'rgba(148, 163, 184, 0.18)'
				: 'rgba(245, 158, 11, 0.16)'};
	color: ${({ $status }) =>
		$status === 'paid' ? '#15803d' : $status === 'draft' ? '#475569' : '#a26608'};
`
