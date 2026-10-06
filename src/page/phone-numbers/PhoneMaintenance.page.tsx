import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	BuildOutlined,
	CheckRounded,
	NotificationsActiveOutlined,
	ScheduleOutlined,
	WarningAmberRounded,
} from '@mui/icons-material'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import { useToast } from '../../context/toast/ToastContext'
import {
	OPERATOR_LABEL,
	useCompleteMaintenanceMutation,
	useGetMaintenanceDefaultsQuery,
	useGetPhoneSummaryQuery,
	useListMaintenanceHistoryQuery,
	useListOpenMaintenanceQuery,
	type MaintenanceTask,
} from '../../store/phone-numbers/phoneNumbersApi'
import { DataTable, TableSkeleton, type DataTableColumn } from '../../components/_shared/DataTable'

const PAGE_SIZE = 25
const OPEN_PAGE_SIZE = 10

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

const dueLabel = (dueAt: string): { text: string; overdue: boolean } => {
	const due = new Date(dueAt).getTime()
	const now = Date.now()
	const diffMs = due - now
	const dayMs = 86_400_000
	const days = Math.round(diffMs / dayMs)
	if (days === 0) return { text: 'due today', overdue: true }
	if (days > 0) return { text: `in ${days}d`, overdue: false }
	return { text: `${-days}d overdue`, overdue: true }
}

const PhoneMaintenancePage = () => {
	const { showToast } = useToast()
	const { data: summary } = useGetPhoneSummaryQuery()
	const { data: open = [], isLoading, refetch } = useListOpenMaintenanceQuery()
	const { data: defaults } = useGetMaintenanceDefaultsQuery()
	const defaultTopUp = defaults?.topUpAmount ?? 10
	const [page, setPage] = useState(1)
	const [openPage, setOpenPage] = useState(1)
	const { data: history } = useListMaintenanceHistoryQuery({
		page,
		limit: PAGE_SIZE,
	})
	const [complete, { isLoading: isCompleting }] = useCompleteMaintenanceMutation()

	const [drafts, setDrafts] = useState<
		Record<string, { network: boolean; topup: boolean; amount: string; notes: string }>
	>({})

	const draftFor = (t: MaintenanceTask) =>
		drafts[t.id] ?? {
			network: !!t.networkRegisteredAt,
			topup: !!t.toppedUpAt,
			amount: t.topUpAmount ?? String(defaultTopUp),
			notes: '',
		}

	const updateDraft = (id: string, patch: Partial<ReturnType<typeof draftFor>>) => {
		setDrafts((prev) => ({
			...prev,
			[id]: { ...(prev[id] ?? draftFor({ id } as MaintenanceTask)), ...patch },
		}))
	}

	const submitTask = async (t: MaintenanceTask) => {
		const draft = draftFor(t)
		try {
			await complete({
				id: t.id,
				networkRegistered: draft.network,
				toppedUp: draft.topup,
				topUpAmount: draft.amount ? Number(draft.amount) : undefined,
				notes: draft.notes || undefined,
			}).unwrap()
			showToast('Progress saved', 'success')
			refetch()
		} catch (err) {
			showToast((err as Error).message, 'error')
		}
	}

	const total = (summary?.due ?? 0) + (summary?.overdue ?? 0)
	const closed = total === 0

	const historyColumns: DataTableColumn<MaintenanceTask>[] = [
		{
			key: 'number',
			label: 'Number',
			minWidth: 210,
			render: (r) => <Mono>{formatPhoneMask(r.phoneNumber.number)}</Mono>,
			skeleton: () => <TableSkeleton $w='170px' $h='14px' />,
		},
		{
			key: 'operator',
			label: 'Operator',
			minWidth: 110,
			render: (r) => OPERATOR_LABEL[r.phoneNumber.operator],
		},
		{
			key: 'dueAt',
			label: 'Due',
			minWidth: 100,
			render: (r) => new Date(r.dueAt).toLocaleDateString(),
		},
		{
			key: 'completedAt',
			label: 'Completed',
			minWidth: 110,
			render: (r) => (r.completedAt ? new Date(r.completedAt).toLocaleDateString() : '—'),
		},
		{
			key: 'topupAmount',
			label: 'Top-up',
			minWidth: 90,
			render: (r) => (r.topUpAmount ? `₴${r.topUpAmount}` : '—'),
		},
		{
			key: 'status',
			label: 'Status',
			minWidth: 100,
			render: (r) => <HistoryPill $status={r.status}>{r.status.toLowerCase()}</HistoryPill>,
		},
	]

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Operations' },
				{ label: 'Phone Numbers' },
				{ label: 'Maintenance', current: true },
			]}
			icon={<BuildOutlined />}
			title='Maintenance'
			subtitle='Register the SIM in the network and top up its balance every three months.'
			action={
				<HeaderStamp aria-hidden='true'>
					<span className='glyph'>↻</span>
					<span className='text'>quarterly rotation</span>
					<span className='count'>
						<em>{total}</em>&nbsp;open
					</span>
				</HeaderStamp>
			}
		>
			<FadeBlock $delay={60}>
				<HeroCards>
					<HeroCard>
						<HeroIcon>
							<WarningAmberRounded />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Due · overdue</HeroLabel>
							<HeroValue>{total}</HeroValue>
						</HeroBody>
					</HeroCard>
					<HeroCard>
						<HeroIcon>
							<ScheduleOutlined />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Next scheduled</HeroLabel>
							<HeroValue>
								{summary?.nextMaintenanceDate
									? new Date(summary.nextMaintenanceDate).toLocaleDateString()
									: '—'}
							</HeroValue>
						</HeroBody>
					</HeroCard>
					<HeroCard>
						<HeroIcon>
							<NotificationsActiveOutlined />
						</HeroIcon>
						<HeroBody>
							<HeroLabel>Discord reminder</HeroLabel>
							<HeroValue>Daily until closed</HeroValue>
						</HeroBody>
					</HeroCard>
				</HeroCards>
			</FadeBlock>

			<FadeBlock $delay={160}>
				{isLoading ? (
					<EmptyPanel>Loading…</EmptyPanel>
				) : closed ? (
					<EmptyPanel>
						<CheckRounded style={{ color: '#047857' }} />
						All maintenance complete. See you next quarter.
					</EmptyPanel>
				) : (
					<TaskList>
						{open
							.slice((openPage - 1) * OPEN_PAGE_SIZE, openPage * OPEN_PAGE_SIZE)
							.map((t) => {
								const draft = draftFor(t)
								const bothDone = draft.network && draft.topup
								const due = dueLabel(t.dueAt)
								const holderText = t.phoneNumber.holder
									? `${t.phoneNumber.holder.firstName} ${t.phoneNumber.holder.lastName}`
									: 'no holder'
								const progress = (draft.network ? 1 : 0) + (draft.topup ? 1 : 0)
								return (
									<V3bCard key={t.id} $overdue={t.status === 'OVERDUE'}>
										<V3bAccent $overdue={t.status === 'OVERDUE'} />
										<V3bHero>
											<V3bHeroLeft>
												<V3bPhone>{formatPhoneMask(t.phoneNumber.number)}</V3bPhone>
												<V3bSub>
													{OPERATOR_LABEL[t.phoneNumber.operator]} · {holderText} · due{' '}
													{new Date(t.dueAt).toLocaleDateString()}
												</V3bSub>
											</V3bHeroLeft>
											<V3bHeroRight>
												<V3bProgress $empty={progress === 0}>
													<em>{progress}</em>/2
												</V3bProgress>
												<V3bDueTag $overdue={due.overdue}>{due.text}</V3bDueTag>
											</V3bHeroRight>
										</V3bHero>
										<V3bDivider />
										<V3bToolbar>
											<V3bToggle
												$active={draft.network}
												onClick={() => updateDraft(t.id, { network: !draft.network })}
											>
												<span className='mark'>{draft.network ? '✓' : '○'}</span>
												Register
											</V3bToggle>
											<V3bToggle
												$active={draft.topup}
												onClick={() => updateDraft(t.id, { topup: !draft.topup })}
											>
												<span className='mark'>{draft.topup ? '✓' : '○'}</span>
												Top-up
											</V3bToggle>
											<V3bAmountWrap title='How much you topped up the SIM balance, in UAH (₴). Default is 10.'>
												<span className='prefix'>Top-up ₴</span>
												<V3bAmount
													type='number'
													inputMode='decimal'
													placeholder='10'
													value={draft.amount}
													size={Math.max(2, String(draft.amount ?? '').length || 2)}
													aria-label='Top-up amount in UAH'
													onChange={(e) =>
														updateDraft(t.id, { amount: e.target.value })
													}
												/>
											</V3bAmountWrap>
											<V3bSpacer />
											<PermissionGate permission='phone_numbers:maintain'>
												<PrimarySolidButton
													type='button'
													onClick={() => submitTask(t)}
													disabled={isCompleting || !bothDone}
												>
													Mark complete
												</PrimarySolidButton>
											</PermissionGate>
										</V3bToolbar>
									</V3bCard>
								)
							})}
					</TaskList>
				)}
			</FadeBlock>

			{open.length > 0 && (
				<FadeBlock $delay={240}>
					<Pager>
						<PagerBtn
							type='button'
							onClick={() => setOpenPage((p) => Math.max(1, p - 1))}
							disabled={openPage <= 1}
						>
							← Prev
						</PagerBtn>
						<PagerLabel>
							Page <em>{openPage}</em> of{' '}
							{Math.max(1, Math.ceil(open.length / OPEN_PAGE_SIZE))}
						</PagerLabel>
						<PagerBtn
							type='button'
							onClick={() =>
								setOpenPage((p) =>
									Math.min(Math.max(1, Math.ceil(open.length / OPEN_PAGE_SIZE)), p + 1)
								)
							}
							disabled={openPage * OPEN_PAGE_SIZE >= open.length}
						>
							Next →
						</PagerBtn>
					</Pager>
				</FadeBlock>
			)}

			<FadeBlock $delay={320}>
				<HistoryHeader>Recent completions</HistoryHeader>
				<DataTable
					columns={historyColumns}
					rows={history?.data ?? []}
					rowKey={(r) => r.id}
					isLoading={history === undefined}
					emptyTitle='No completed maintenance yet'
					pagination={{
						page,
						pageSize: PAGE_SIZE,
						total: history?.total ?? 0,
						onPageChange: setPage,
					}}
				/>
			</FadeBlock>
		</ListPageShell>
	)
}

export default PhoneMaintenancePage

/* ─── Styles ─────────────────────────────────────── */

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(10px); }
	to { opacity: 1; transform: translateY(0); }
`
const FadeBlock = styled.div<{ $delay?: number }>`
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${(p) => p.$delay ?? 0}ms;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* Time-off style hero cards. */
const HeroCards = styled.div`
	display: grid;
	grid-template-columns: repeat(3, 1fr);
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
	font-size: 22px;
	font-weight: 700;
	color: ${T.textStrong};
	line-height: 1.05;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.5px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`
const EmptyPanel = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 24px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px dashed rgba(15, 23, 42, 0.1);
	color: ${T.textSecondary};
	margin-bottom: 20px;
`
const TaskList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 24px;
`
const AmountInput = styled.input`
	margin-left: 8px;
	padding: 5px 10px;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	font-family: 'JetBrains Mono', monospace;
	font-size: 12.5px;
	width: 110px;
	outline: none;

	&:focus {
		border-color: ${T.primary};
	}
`
const HistoryHeader = styled.h3`
	margin: 24px 0 10px;
	font-family: 'Bricolage Grotesque', sans-serif;
	font-size: 15px;
	color: ${T.textStrong};
`
const Mono = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
`
/* ─── V3b · Hero header + task bar ─── */
const V3bCard = styled.article<{ $overdue: boolean }>`
	display: grid;
	grid-template-columns: 6px 1fr;
	background: #ffffff;
	border: 0;
	border-radius: 14px;
	overflow: hidden;
	${(p) => void p.$overdue && ''}
`
const V3bAccent = styled.div<{ $overdue: boolean }>`
	background: ${(p) => (p.$overdue ? '#b91c1c' : '#e85d2f')};
`
const V3bHero = styled.header`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 16px;
	padding: 16px 20px 12px;
`
const V3bHeroLeft = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`
const V3bHeroRight = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`
const V3bPhone = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 20px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
`
const V3bSub = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
`
const V3bProgress = styled.span<{ $empty?: boolean }>`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	font-weight: 700;
	color: ${T.textMuted};
	em {
		font-style: normal;
		color: ${(p) => (p.$empty ? '#b91c1c' : '#e85d2f')};
		font-size: 20px;
	}
`
const V3bDueTag = styled.span<{ $overdue: boolean }>`
	padding: 4px 12px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	background: ${(p) => (p.$overdue ? 'rgba(220, 38, 38, 0.1)' : 'rgba(217, 119, 6, 0.12)')};
	color: ${(p) => (p.$overdue ? '#b91c1c' : '#b45309')};
`
const V3bDivider = styled.div`
	height: 1px;
	background: rgba(15, 23, 42, 0.06);
`
const V3bToolbar = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	padding: 12px 20px 16px;
`
const V3bToggle = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border-radius: 10px;
	border: 1.5px solid ${(p) => (p.$active ? T.primary : 'rgba(15, 23, 42, 0.1)')};
	background: ${(p) => (p.$active ? 'rgba(3, 105, 161, 0.08)' : '#ffffff')};
	color: ${(p) => (p.$active ? T.primary : T.textStrong)};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: all 160ms ease;

	.mark {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 700;
	}

	&:hover:not([disabled]) {
		border-color: ${T.primary};
	}
`
const V3bAmountWrap = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 0 10px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	cursor: text;
	transition: border-color 160ms ease;

	&:focus-within {
		border-color: #e85d2f;
	}

	.prefix {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: ${T.textMuted};
		white-space: nowrap;
	}
`
const V3bAmount = styled.input`
	padding: 7px 0;
	border: 0;
	background: transparent;
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	width: auto;
	min-width: 24px;
	field-sizing: content;
	outline: none;
	color: ${T.textStrong};

	/* Hide the native number-input spinners — they bloat the width. */
	-moz-appearance: textfield;
	&::-webkit-outer-spin-button,
	&::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	&::placeholder {
		color: ${T.textMuted};
		font-weight: 500;
	}
`
const V3bSpacer = styled.span`
	flex: 1;
	min-width: 0;
`

/* ─── Pager for open task list ─── */
const Pager = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 8px;
	padding: 10px 14px;
	margin: 0 auto 24px;
	width: fit-content;
	border-radius: 999px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
`
const PagerBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 12px;
	border-radius: 999px;
	border: 0;
	background: transparent;
	color: ${T.textStrong};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: all 160ms ease;

	&:hover:not(:disabled) {
		background: rgba(232, 93, 47, 0.08);
		color: #e85d2f;
	}
	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
`
const PagerLabel = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13px;
	letter-spacing: 0.4px;
	color: ${T.textMuted};
	em {
		font-style: normal;
		color: ${T.textStrong};
		font-weight: 700;
		font-size: 15px;
	}
`

/* ─── Header stamp (top-right of page header) ─── */
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

/* ─── History pill (Recent completions status) ─── */
const HistoryPill = styled.span<{ $status: string }>`
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
		p.$status === 'COMPLETED'
			? 'rgba(5, 150, 105, 0.1)'
			: p.$status === 'OVERDUE'
				? 'rgba(220, 38, 38, 0.1)'
				: p.$status === 'DUE'
					? 'rgba(217, 119, 6, 0.12)'
					: 'rgba(100, 116, 139, 0.1)'};
	color: ${(p) =>
		p.$status === 'COMPLETED'
			? '#047857'
			: p.$status === 'OVERDUE'
				? '#b91c1c'
				: p.$status === 'DUE'
					? '#b45309'
					: '#475569'};
`
