import { DragEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	ViewInArRounded,
	WarningAmberRounded,
	Inventory2Outlined,
	HistoryRounded,
	HistoryToggleOffOutlined,
	SwapHorizRounded,
} from '@mui/icons-material'

import { T } from '../../components/sales-analytics/_shared/tokens'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	useListPhoneNumbersQuery,
	useMovePhoneBoardSlotMutation,
	type PhoneNumber,
	OPERATOR_LABEL,
	STATUS_LABEL,
} from '../../store/phone-numbers/phoneNumbersApi'
import { useListAuditLogQuery } from '../../store/audit-log/auditLogApi'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import usePermissions from '../../hooks/usePermissions'

/* The physical board layout — 2 columns × 6 rows (owner-confirmed
 * 2026-10-22). Taller cards + wider slots suit the orientation. */
const ROWS = 6
const COLS = 2
const TOTAL_SLOTS = ROWS * COLS // 12

const PhoneBoard = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { has } = usePermissions()
	const canEdit = has('phone_numbers:update')
	const canViewHistory = has('audit_logs:view')

	// Pull a big enough page to cover every phone once; the board has
	// at most TOTAL_SLOTS filled anyway + a handful of unassigned.
	const { data, isLoading, isError } = useListPhoneNumbersQuery({
		page: 1,
		limit: 500,
	})
	const [moveSlot] = useMovePhoneBoardSlotMutation()

	const [dragId, setDragId] = useState<string | null>(null)
	const [dragOverSlot, setDragOverSlot] = useState<number | null>(null)
	const [dragOverUnassigned, setDragOverUnassigned] = useState(false)

	const phones = data?.data ?? []
	const bySlot = useMemo(() => {
		const map = new Map<number, PhoneNumber>()
		for (const p of phones) {
			if (p.boardSlot !== null && p.boardSlot !== undefined) {
				map.set(p.boardSlot, p)
			}
		}
		return map
	}, [phones])

	const unassigned = useMemo(
		() => phones.filter((p) => p.boardSlot === null || p.boardSlot === undefined),
		[phones],
	)

	const doMove = async (id: string, slot: number | null) => {
		try {
			await moveSlot({ id, slot }).unwrap()
			showToast(slot === null ? 'Card unassigned' : `Moved to slot ${slot + 1}`, 'success')
		} catch (e) {
			showToast(parseServerError(e) || 'Move failed', 'error')
		}
	}

	const onDragStart = (id: string) => (e: DragEvent) => {
		if (!canEdit) {
			e.preventDefault()
			return
		}
		setDragId(id)
		e.dataTransfer.effectAllowed = 'move'
		// Firefox needs something written to dataTransfer or dragover
		// never fires on drop targets.
		e.dataTransfer.setData('text/plain', id)
	}
	const onDragEnd = () => {
		setDragId(null)
		setDragOverSlot(null)
		setDragOverUnassigned(false)
	}

	const onSlotDragOver = (slot: number) => (e: DragEvent) => {
		if (!canEdit || !dragId) return
		e.preventDefault()
		e.dataTransfer.dropEffect = 'move'
		if (dragOverSlot !== slot) setDragOverSlot(slot)
	}
	const onSlotDrop = (slot: number) => (e: DragEvent) => {
		e.preventDefault()
		if (!canEdit || !dragId) return
		const current = bySlot.get(slot)
		if (current?.id === dragId) {
			onDragEnd()
			return
		}
		void doMove(dragId, slot)
		onDragEnd()
	}

	const onUnassignedDragOver = (e: DragEvent) => {
		if (!canEdit || !dragId) return
		e.preventDefault()
		setDragOverUnassigned(true)
	}
	const onUnassignedDrop = (e: DragEvent) => {
		e.preventDefault()
		if (!canEdit || !dragId) return
		void doMove(dragId, null)
		onDragEnd()
	}

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Operations' },
				{ label: 'Phone Numbers', href: '/phone-numbers' },
				{ label: 'Board', current: true },
			]}
			icon={<ViewInArRounded />}
			title='SIM board'
			subtitle='Drag any card to another slot — mirrors the physical board. Changes save on drop.'
			action={
				<HeaderHint aria-hidden='true'>
					<HintRow>
						<HintW>every</HintW>
						<HintAccentWrap>
							<HintA>SLOT</HintA>
							<svg
								width='120'
								height='12'
								viewBox='0 0 120 12'
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
						</HintAccentWrap>
						<HintW>in sight</HintW>
					</HintRow>
					<HintStars>
						<svg width='14' height='14' viewBox='0 0 24 24' fill='currentColor'>
							<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
						</svg>
					</HintStars>
				</HeaderHint>
			}
		>
			<BoardLayout $hasHistory={canViewHistory}>
				<BoardStage>
					<BoardGrid style={{ ['--rows' as string]: ROWS, ['--cols' as string]: COLS }}>
						{Array.from({ length: TOTAL_SLOTS }, (_, i) => {
							const occupant = bySlot.get(i)
							const isHover = dragOverSlot === i && dragId
							return (
								<Slot
									key={i}
									$filled={!!occupant}
									$dragging={!!occupant && occupant.id === dragId}
									$hoverTarget={!!isHover}
									onDragOver={onSlotDragOver(i)}
									onDragLeave={() => setDragOverSlot(null)}
									onDrop={onSlotDrop(i)}
								>
									{occupant ? (
										<PhoneCard
											phone={occupant}
											slot={i}
											canEdit={canEdit}
											dragging={occupant.id === dragId}
											onDragStart={onDragStart(occupant.id)}
											onDragEnd={onDragEnd}
											onClick={() =>
												navigate(`/phone-numbers/view/${occupant.id}`)
											}
										/>
									) : (
										<EmptySlot>
											<SlotNum>{String(i + 1).padStart(2, '0')}</SlotNum>
											<EmptyLabel>empty</EmptyLabel>
										</EmptySlot>
									)}
								</Slot>
							)
						})}
					</BoardGrid>
				</BoardStage>

				{canViewHistory && <HistoryPanel />}

				<Sidebar>
					<SidebarHead>
						<SidebarTitle>Unassigned</SidebarTitle>
						<SidebarCount>{unassigned.length}</SidebarCount>
					</SidebarHead>
					<UnassignedDropZone
						$hover={dragOverUnassigned}
						onDragOver={onUnassignedDragOver}
						onDragLeave={() => setDragOverUnassigned(false)}
						onDrop={onUnassignedDrop}
					>
						{unassigned.length === 0 ? (
							<EmptyState>
								<EmptyIcon>
									<Inventory2Outlined />
								</EmptyIcon>
								<EmptyTitle>All placed</EmptyTitle>
								<EmptySub>
									Every SIM card lives on the board.
									<br />
									Drop a card here to send it back.
								</EmptySub>
							</EmptyState>
						) : (
							unassigned.map((p) => (
								<PhoneCard
									key={p.id}
									phone={p}
									slot={null}
									canEdit={canEdit}
									dragging={p.id === dragId}
									onDragStart={onDragStart(p.id)}
									onDragEnd={onDragEnd}
									onClick={() => navigate(`/phone-numbers/view/${p.id}`)}
								/>
							))
						)}
					</UnassignedDropZone>
					{!canEdit && (
						<ReadOnlyHint>
							You have view-only access — drag &amp; drop is disabled.
						</ReadOnlyHint>
					)}
				</Sidebar>

			</BoardLayout>

			{isLoading && <LoadingOverlay>Loading board…</LoadingOverlay>}
			{isError && (
				<LoadingOverlay $error>
					Could not load phone numbers. Reload the page.
				</LoadingOverlay>
			)}
		</ListPageShell>
	)
}

export default PhoneBoard

/* Pretty-print Ukrainian E.164: "+380501234567" → "+38 050 123 4567".
 * Groups: "+38" country, 3 operator (with leading 0 — e.g. 050 / 067),
 * 3 subscriber, 4 subscriber. Non-matching strings pass through. */
const prettyPhone = (raw: string): string =>
	raw.replace(/^(\+38)(\d{3})(\d{3})(\d{4})$/, '$1 $2 $3 $4')

/* ─── PhoneCard — ticket style ──────────────────────────────────── */

interface PhoneCardProps {
	phone: PhoneNumber
	slot: number | null
	canEdit: boolean
	dragging: boolean
	onDragStart: (e: DragEvent) => void
	onDragEnd: () => void
	onClick: () => void
}

const PhoneCard = (p: PhoneCardProps) => (
	<Ticket
		draggable={p.canEdit}
		onDragStart={p.onDragStart}
		onDragEnd={p.onDragEnd}
		onClick={p.onClick}
		$dragging={p.dragging}
		title={`${OPERATOR_LABEL[p.phone.operator]} · ${STATUS_LABEL[p.phone.status]}${p.phone.maintenanceRequired ? ' · maintenance required' : ''}`}
	>
		<TicketBand $op={p.phone.operator}>
			<BandLeft>{OPERATOR_LABEL[p.phone.operator].toUpperCase()}</BandLeft>
			<BandRight>
				{p.slot !== null
					? `SLOT ${String(p.slot + 1).padStart(2, '0')}`
					: 'UNASSIGNED'}
			</BandRight>
		</TicketBand>

		<Perforation />

		<TicketBody>
			<BodyTop>
				<TicketStatusPill $status={p.phone.status}>
					{STATUS_LABEL[p.phone.status]}
				</TicketStatusPill>
			</BodyTop>
			<TicketTitle>{prettyPhone(p.phone.number)}</TicketTitle>

			<BodyBottom>
				<TicketMeta>
					<i>Top-up</i>
					{p.phone.lastTopUpAt ? (
						<b>{new Date(p.phone.lastTopUpAt).toLocaleDateString('en-GB')}</b>
					) : (
						<b>never</b>
					)}
				</TicketMeta>
				{p.phone.maintenanceRequired && (
					<TicketWarnBadge title='Maintenance required'>
						<WarningAmberRounded style={{ fontSize: 24 }} />
					</TicketWarnBadge>
				)}
			</BodyBottom>
		</TicketBody>
	</Ticket>
)

/* ─── Styles ─────────────────────────────────────────────────────── */

const BoardLayout = styled.div<{ $hasHistory: boolean }>`
	display: grid;
	grid-template-columns: ${(p) =>
		p.$hasHistory ? 'minmax(0, 1fr) auto 300px' : 'minmax(0, 1fr) 300px'};
	gap: 28px;
	align-items: start;

	@media (max-width: 1200px) {
		grid-template-columns: minmax(0, 1fr) 300px;
	}
	@media (max-width: 980px) {
		grid-template-columns: 1fr;
	}
`

/* Flat board — no 3D tilt. Just a quiet backdrop so the ticket cards
 * carry the visual weight. */
const BoardStage = styled.div`
	position: relative;
`

const BoardGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(var(--cols, 2), minmax(240px, 1fr));
	grid-auto-rows: 190px;
	gap: 20px;
	padding: 20px;
	max-width: 620px;
	margin: 0 auto;
	background: #f1f5f9;
	border: 1px solid ${T.border};
	border-radius: 16px;
`

const Slot = styled.div<{
	$filled: boolean
	$dragging: boolean
	$hoverTarget: boolean
}>`
	position: relative;
	border-radius: 14px;
	outline: ${(p) =>
		p.$hoverTarget ? '2px dashed #6366f1' : '2px dashed transparent'};
	outline-offset: 2px;
	transition: outline-color 160ms ease;
	opacity: ${(p) => (p.$dragging ? 0.35 : 1)};
`

const EmptySlot = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 6px;
	width: 100%;
	height: 100%;
	border: 2px dashed rgba(100, 116, 139, 0.25);
	border-radius: 14px;
	background: #ffffff;
`

const SlotNum = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 20px;
	font-weight: 800;
	letter-spacing: 2px;
	color: rgba(100, 116, 139, 0.55);
`

const EmptyLabel = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 2px;
	text-transform: uppercase;
	color: rgba(100, 116, 139, 0.5);
`


/* ─── Sidebar: Unassigned list ───────────────────────────────────── */

const Sidebar = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 12px;
	position: sticky;
	top: 20px;
`

const SidebarHead = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	padding-bottom: 6px;
	border-bottom: 1px solid ${T.divider};
`

const SidebarTitle = styled.h3`
	margin: 0;
	font-size: 13px;
	font-weight: 800;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	color: ${T.textStrong};
`

const SidebarCount = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${T.textMuted};
`

const UnassignedDropZone = styled.div<{ $hover: boolean }>`
	display: flex;
	flex-direction: column;
	gap: 8px;
	min-height: 140px;
	padding: 12px;
	border-radius: 12px;
	border: 1.5px dashed
		${(p) => (p.$hover ? 'rgba(96, 165, 250, 0.9)' : T.border)};
	background: ${(p) =>
		p.$hover ? 'rgba(96, 165, 250, 0.08)' : 'rgba(15, 23, 42, 0.02)'};
	transition:
		background 140ms ease,
		border-color 140ms ease;
`


const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 10px;
	padding: 32px 16px 28px;
	text-align: center;
`

const EmptyIcon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 60px;
	height: 60px;
	border-radius: 50%;
	border: 2px dashed rgba(100, 116, 139, 0.3);
	background: rgba(100, 116, 139, 0.05);
	color: rgba(100, 116, 139, 0.7);
	svg {
		font-size: 28px;
	}
`

const EmptyTitle = styled.div`
	font-size: 14px;
	font-weight: 700;
	letter-spacing: 0.3px;
	color: ${T.textStrong};
`

const EmptySub = styled.div`
	font-size: 12px;
	line-height: 1.5;
	color: ${T.textMuted};
`

const ReadOnlyHint = styled.div`
	font-size: 11.5px;
	color: ${T.textMuted};
	padding: 6px 2px;
`

const LoadingOverlay = styled.div<{ $error?: boolean }>`
	margin-top: 16px;
	padding: 12px 14px;
	border-radius: 10px;
	background: ${(p) =>
		p.$error ? 'rgba(239, 68, 68, 0.08)' : 'rgba(15, 23, 42, 0.04)'};
	color: ${(p) => (p.$error ? '#b91c1c' : T.textSecondary)};
	font-size: 13px;
`


/* ─── Ticket card (reference-style) ─────────────────────────────── */

const OP_BAND_COLOR: Record<string, string> = {
	VODAFONE: '#fecaca',  // soft red
	KYIVSTAR: '#bfdbfe',  // soft blue
	LIFECELL: '#fef08a',  // soft yellow
	OTHER:    '#ddd6fe',  // soft lavender
}
const OP_BAND_INK: Record<string, string> = {
	VODAFONE: '#991b1b',
	KYIVSTAR: '#1e40af',
	LIFECELL: '#854d0e',
	OTHER:    '#5b21b6',
}

const Ticket = styled.article<{ $dragging: boolean }>`
	display: flex;
	flex-direction: column;
	height: 100%;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	box-shadow: 0 2px 6px -2px rgba(15, 23, 42, 0.08);
	overflow: hidden;
	cursor: grab;
	user-select: none;
	opacity: ${(p) => (p.$dragging ? 0.4 : 1)};
	transition:
		transform 180ms ease,
		box-shadow 180ms ease,
		border-color 180ms ease;

	&:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 18px -6px rgba(15, 23, 42, 0.14);
		border-color: rgba(15, 23, 42, 0.14);
	}
	&:active {
		cursor: grabbing;
	}
`

const TicketBand = styled.div<{ $op: string }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 10px 14px;
	background: ${(p) => OP_BAND_COLOR[p.$op] ?? OP_BAND_COLOR.OTHER};
	color: ${(p) => OP_BAND_INK[p.$op] ?? OP_BAND_INK.OTHER};
`

const BandLeft = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 11.5px;
	font-weight: 800;
	letter-spacing: 1.5px;
`

const BandRight = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 11.5px;
	font-weight: 700;
	letter-spacing: 1px;
	opacity: 0.85;
`

/* The dashed perforation separating band from body — like a torn
 * event ticket. */
const Perforation = styled.div`
	position: relative;
	height: 1px;
	background-image: linear-gradient(
		to right,
		rgba(15, 23, 42, 0.2) 50%,
		transparent 50%
	);
	background-size: 6px 1px;
	background-repeat: repeat-x;
`

const TicketBody = styled.div`
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 6px;
	padding: 10px 14px 12px;
`

const BodyTop = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 8px;
`


const TicketStatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	white-space: nowrap;
	background: ${(p) =>
		p.$status === 'ACTIVE'
			? '#dcfce7'
			: p.$status === 'HOLD'
				? '#fef3c7'
				: '#f1f5f9'};
	color: ${(p) =>
		p.$status === 'ACTIVE'
			? '#15803d'
			: p.$status === 'HOLD'
				? '#a16207'
				: '#475569'};
`

const TicketTitle = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
	font-size: 17px;
	font-weight: 800;
	color: #0f172a;
	letter-spacing: -0.2px;
	line-height: 1.15;
`

const BodyBottom = styled.div`
	margin-top: auto;
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 8px;
	padding-top: 4px;
`

const TicketMeta = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 5px;
	font-size: 12.5px;
	font-weight: 600;
	color: #0f172a;

	b {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
		font-weight: 800;
		letter-spacing: 0.2px;
	}

	i {
		font-style: normal;
		font-weight: 500;
		color: ${T.textSecondary};
		letter-spacing: 0.3px;
		font-size: 10.5px;
		text-transform: uppercase;
	}
`

const TicketWarnBadge = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #b91c1c;
`

/* ─── Header "upwork-hint" — orange+ink handwritten callout ──────── */

const PAPER_INK = '#241E16'
const PAPER_ACCENT = '#E85D2F'

const HeaderHint = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	pointer-events: none;
	color: ${PAPER_INK};

	@media (max-width: 900px) {
		display: none;
	}
`

const HintRow = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
`

const HintW = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-weight: 700;
	font-size: 28px;
	line-height: 1;
	letter-spacing: 0.2px;
	color: ${PAPER_INK};
`

const HintAccentWrap = styled.span`
	position: relative;
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	padding-bottom: 4px;
`

const HintA = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-weight: 700;
	font-size: 32px;
	line-height: 1;
	letter-spacing: 0.3px;
	color: ${PAPER_ACCENT};
`

const HintStars = styled.span`
	display: inline-flex;
	align-items: center;
	margin-left: 2px;
	color: ${PAPER_ACCENT};
`

/* ─── History panel (audit log of slot moves) ──────────────────── */

const PAGE_SIZE_HISTORY = 25
/* Backend `ListAuditLogDto.limit` is capped at 100 — bump against
 * that and stop. For a 12-slot board that's ~months of history; a
 * proper paginated viewer lives on /audit-log for the deep dive. */
const MAX_HISTORY_LIMIT = 100

const HistoryPanel = () => {
	const [page, setPage] = useState(1)
	const limit = Math.min(PAGE_SIZE_HISTORY * page, MAX_HISTORY_LIMIT)
	const { data, isLoading, isFetching } = useListAuditLogQuery({
		action: 'phone.board_slot.move',
		page: 1,
		limit,
		sort: 'desc',
	})

	const events = data?.data ?? []
	const total = data?.total ?? 0
	const hasMore = events.length < total && limit < MAX_HISTORY_LIMIT

	const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
		if (isFetching || !hasMore) return
		const el = e.currentTarget
		const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60
		if (nearBottom) setPage((p) => p + 1)
	}

	return (
		<HistoryWrap>
			<HistoryHead>
				<HistoryTitleRow>
					<HistoryRounded style={{ fontSize: 18 }} />
					<HistoryTitle>History</HistoryTitle>
				</HistoryTitleRow>
				<HistoryCount>{total}</HistoryCount>
			</HistoryHead>

			<HistoryScroll onScroll={onScroll}>
				{isLoading && events.length === 0 ? (
					<HistoryEmpty>Loading…</HistoryEmpty>
				) : events.length === 0 ? (
					<EmptyState>
						<EmptyIcon>
							<HistoryToggleOffOutlined />
						</EmptyIcon>
						<EmptyTitle>No moves yet</EmptyTitle>
						<EmptySub>
							Drag a card between slots and
							<br />
							the first entry will show up here.
						</EmptySub>
					</EmptyState>
				) : (
					<>
						{events.map((e) => {
							const changes = (e.changes as Record<string, unknown> | null) ?? null
							const slotDiff =
								changes && typeof changes === 'object'
									? (changes.boardSlot as { before: number | null; after: number | null } | undefined)
									: undefined
							return (
								<HistoryRow key={e.id}>
									<HistoryTime>{formatRelative(e.occurredAt)}</HistoryTime>
									<HistoryBody>
										<HistoryActor>
											{e.actorName || e.actorEmail || 'Someone'}
										</HistoryActor>{' '}
										<HistoryVerb>moved</HistoryVerb>{' '}
										<HistoryPhone>{e.targetLabel ?? 'phone'}</HistoryPhone>
										{slotDiff && (
											<HistoryDiff>
												<SlotTag>
													{slotDiff.before === null
														? 'unassigned'
														: `slot ${slotDiff.before + 1}`}
												</SlotTag>
												<SwapHorizRounded style={{ fontSize: 13, opacity: 0.6 }} />
												<SlotTag $to>
													{slotDiff.after === null
														? 'unassigned'
														: `slot ${slotDiff.after + 1}`}
												</SlotTag>
											</HistoryDiff>
										)}
									</HistoryBody>
								</HistoryRow>
							)
						})}
						{isFetching && (
							<HistoryEmpty>Loading more…</HistoryEmpty>
						)}
						{!hasMore && events.length > 0 && (
							<HistoryEnd>— end of history —</HistoryEnd>
						)}
					</>
				)}
			</HistoryScroll>
		</HistoryWrap>
	)
}

/** Short relative time: "2m ago" / "3h ago" / "4d ago" / DD/MM/YY. */
const formatRelative = (iso: string): string => {
	const d = new Date(iso)
	const diff = Date.now() - d.getTime()
	const minutes = Math.floor(diff / 60_000)
	if (minutes < 1) return 'just now'
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	if (days < 7) return `${days}d ago`
	return d.toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
	})
}

const HistoryWrap = styled.aside`
	display: flex;
	flex-direction: column;
	gap: 10px;
	width: 320px;
	background: #ffffff;
	border: 1px solid ${T.border};
	border-radius: 14px;
	overflow: hidden;
	position: sticky;
	top: 20px;
	max-height: calc(100vh - 60px);
`

const HistoryHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	padding: 12px 14px 10px;
	border-bottom: 1px solid ${T.divider};
`

const HistoryTitleRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	color: ${T.textStrong};
`

const HistoryTitle = styled.span`
	font-size: 13.5px;
	font-weight: 800;
	letter-spacing: 0.3px;
	text-transform: uppercase;
`

const HistoryCount = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	color: ${T.textMuted};
`

const HistoryScroll = styled.div`
	flex: 1;
	min-height: 220px;
	max-height: 65vh;
	overflow-y: auto;
	padding: 2px 10px 10px;

	/* Firefox: thin, auto-hiding feel via transparent + accent on hover */
	scrollbar-width: thin;
	scrollbar-color: transparent transparent;

	&:hover {
		scrollbar-color: rgba(100, 116, 139, 0.35) transparent;
	}

	/* WebKit: hide track + thumb unless hovered or actively scrolling */
	&::-webkit-scrollbar {
		width: 6px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 3px;
		transition: background 180ms ease;
	}
	&:hover::-webkit-scrollbar-thumb,
	&:focus-within::-webkit-scrollbar-thumb,
	&:active::-webkit-scrollbar-thumb {
		background: rgba(100, 116, 139, 0.35);
	}
`

const HistoryEmpty = styled.div`
	padding: 24px 10px;
	text-align: center;
	font-size: 12px;
	color: ${T.textMuted};
	font-style: italic;
`

const HistoryEnd = styled.div`
	padding: 12px;
	text-align: center;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	letter-spacing: 1px;
	color: ${T.textMuted};
`

const HistoryRow = styled.div`
	display: grid;
	grid-template-columns: 68px 1fr;
	gap: 8px;
	padding: 10px 4px;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);

	&:last-child {
		border-bottom: none;
	}
`

const HistoryTime = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: ${T.textMuted};
	padding-top: 2px;
`

const HistoryBody = styled.div`
	font-size: 12.5px;
	line-height: 1.5;
	color: ${T.textStrong};
`

const HistoryActor = styled.span`
	font-weight: 700;
`

const HistoryVerb = styled.span`
	color: ${T.textSecondary};
`

const HistoryPhone = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-weight: 700;
	color: #0f172a;
`

const HistoryDiff = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	margin-top: 4px;
`

const SlotTag = styled.span<{ $to?: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 2px 7px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	background: ${(p) =>
		p.$to ? 'rgba(34, 197, 94, 0.14)' : 'rgba(100, 116, 139, 0.14)'};
	color: ${(p) => (p.$to ? '#15803d' : '#475569')};
`
