import styled, { keyframes } from 'styled-components'
import {
	AddCircleOutline,
	CallOutlined,
	DeleteOutline,
	EditOutlined,
	HistoryOutlined,
	LinkOffOutlined,
	LinkOutlined,
	NotesOutlined,
	SwapHorizOutlined,
	ThermostatOutlined,
	TrendingUpOutlined,
} from '@mui/icons-material'
import { T } from '../sales-analytics/_shared/tokens'

/** Minimal shape — matches both /leads/:id/activity and /clients/:id/activity. */
export interface ActivityEvent {
	id: string
	action: string
	actorUserId: string | null
	actorName: string | null
	actorEmail: string | null
	changes: Record<string, unknown> | null
	metadata: Record<string, unknown> | null
	severity: 'INFO' | 'WARNING' | 'CRITICAL'
	result: 'SUCCESS' | 'DENIED' | 'FAILED'
	occurredAt: string
}

interface Props {
	events: ActivityEvent[] | undefined
	isLoading: boolean
	isError: boolean
	emptyLabel?: string
}

const actionLabel: Record<string, string> = {
	'lead.create': 'Lead created',
	'lead.update': 'Lead updated',
	'lead.status_changed': 'Status changed',
	'lead.temperature_changed': 'Temperature changed',
	'lead.note_changed': 'Notes updated',
	'lead.contact_changed': 'Contact details updated',
	'lead.call_created': 'Call scheduled',
	'lead.delete': 'Lead deleted',
	'client.create': 'Client created',
	'client.update': 'Client updated',
	'client.status_changed': 'Status changed',
	'client.note_changed': 'Notes updated',
	'client.contact_changed': 'Contact details updated',
	'client.call_created': 'Call scheduled',
	'client.project_linked': 'Project linked',
	'client.project_unlinked': 'Project unlinked',
	'client.project_changed': 'Project reassigned to this client',
	'client.delete': 'Client deleted',
}

/** Icon per action family — kept small and intentional so the timeline
 *  reads as "a sequence of concrete events", not a wall of dots. */
const actionIcon = (action: string) => {
	if (action.endsWith('.create')) return <AddCircleOutline />
	if (action.endsWith('.delete')) return <DeleteOutline />
	if (action.endsWith('.status_changed')) return <TrendingUpOutlined />
	if (action.endsWith('.temperature_changed')) return <ThermostatOutlined />
	if (action.endsWith('.note_changed')) return <NotesOutlined />
	if (action.endsWith('.contact_changed')) return <SwapHorizOutlined />
	if (action.endsWith('.call_created')) return <CallOutlined />
	if (action.endsWith('.project_linked')) return <LinkOutlined />
	if (action.endsWith('.project_unlinked')) return <LinkOffOutlined />
	if (action.endsWith('.project_changed')) return <SwapHorizOutlined />
	if (action.endsWith('.update')) return <EditOutlined />
	return <HistoryOutlined />
}

const labelOf = (action: string) => actionLabel[action] ?? action

const actorOf = (e: ActivityEvent) => e.actorName || e.actorEmail || 'system'

const formatWhen = (iso: string) => {
	try {
		const d = new Date(iso)
		return (
			d.toLocaleDateString(undefined, {
				day: '2-digit',
				month: 'short',
				year: 'numeric',
			}) +
			' · ' +
			d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
		)
	} catch {
		return iso
	}
}

/** Short relative age — e.g. "3h ago" / "2d ago" — rendered as a quiet
 *  secondary caption next to the full timestamp. */
const relativeAge = (iso: string): string | null => {
	const t = Date.parse(iso)
	if (Number.isNaN(t)) return null
	const diff = Date.now() - t
	if (diff < 0) return null
	const m = Math.round(diff / 60_000)
	if (m < 1) return 'just now'
	if (m < 60) return `${m}m ago`
	const h = Math.round(m / 60)
	if (h < 24) return `${h}h ago`
	const d = Math.round(h / 24)
	if (d < 30) return `${d}d ago`
	const mo = Math.round(d / 30)
	if (mo < 12) return `${mo}mo ago`
	return `${Math.round(mo / 12)}y ago`
}

/** Humanise a `changes` entry of the shape `{ before, after } | { changed: true }`. */
const diffLine = (field: string, diff: unknown): string | null => {
	if (!diff || typeof diff !== 'object') return null
	const d = diff as Record<string, unknown>
	if (d.changed === true) return `${field}: changed`
	if ('before' in d || 'after' in d) {
		const before = String(d.before ?? '∅')
		const after = String(d.after ?? '∅')
		return `${field}: ${before} → ${after}`
	}
	return null
}

export const ActivityTimeline = ({
	events,
	isLoading,
	isError,
	emptyLabel = 'No activity recorded yet.',
}: Props) => {
	if (isLoading) {
		return <Shell>Loading activity…</Shell>
	}
	if (isError) {
		return (
			<Shell>
				<ErrorText>Could not load activity. Try again later.</ErrorText>
			</Shell>
		)
	}
	if (!events || events.length === 0) {
		return (
			<Shell>
				<Empty>
					<EmptyIcon aria-hidden>
						<HistoryOutlined />
					</EmptyIcon>
					<span>{emptyLabel}</span>
				</Empty>
			</Shell>
		)
	}
	return (
		<Shell>
			<Rail>
				{events.map((e, i) => {
					const diffs = e.changes
						? Object.entries(e.changes)
								.map(([k, v]) => diffLine(k, v))
								.filter(Boolean)
						: []
					// A couple of safe metadata snippets we whitelist for
					// display — never a blind JSON dump. Project name on
					// link/unlink events is the main one.
					const projectName =
						e.metadata && typeof e.metadata === 'object'
							? (e.metadata as Record<string, unknown>).projectName
							: undefined
					if (typeof projectName === 'string' && projectName) {
						diffs.push(`project: ${projectName}`)
					}
					const ageStr = relativeAge(e.occurredAt)
					return (
						<Row key={e.id} $delay={i * 60}>
							<Spine>
								<IconChip
									$severity={e.severity}
									$result={e.result}
									aria-hidden
								>
									{actionIcon(e.action)}
								</IconChip>
							</Spine>
							<Content>
								<Header>
									<Label>{labelOf(e.action)}</Label>
									<Meta>
										<Actor>{actorOf(e)}</Actor>
										<Sep>·</Sep>
										<When title={formatWhen(e.occurredAt)}>
											{formatWhen(e.occurredAt)}
										</When>
										{ageStr && (
											<>
												<Sep>·</Sep>
												<Age>{ageStr}</Age>
											</>
										)}
									</Meta>
								</Header>
								{diffs.length > 0 && (
									<Diffs>
										{diffs.map((d, idx) => (
											<li key={idx}>{d}</li>
										))}
									</Diffs>
								)}
							</Content>
						</Row>
					)
				})}
			</Rail>
		</Shell>
	)
}

export const ActivityHeading = ({ title = 'Activity' }: { title?: string }) => (
	<HeadWrap>
		<HistoryOutlined style={{ fontSize: 18, color: T.textSecondary }} />
		<span>{title}</span>
	</HeadWrap>
)

/* ─── Styles ───────────────────────────────────────────────── */

const rowIn = keyframes`
	from { opacity: 0; transform: translateX(-4px); }
	to   { opacity: 1; transform: translateX(0); }
`

const Shell = styled.div`
	padding: 12px 0 4px;
	color: ${T.textPrimary};
	font-size: 13px;
`
const HeadWrap = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: 0.2px;
`

/* Rail = events stacked; no inter-row gap — each row owns its vertical
   padding, so the thread can span the full inter-icon distance. */
const Rail = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
`

const Row = styled.li<{ $delay: number }>`
	display: grid;
	grid-template-columns: 32px 1fr;
	gap: 14px;
	padding: 14px 0;
	align-items: flex-start;
	animation: ${rowIn} 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${({ $delay }) => $delay}ms;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* Column that carries the icon chip and paints the connecting thread
   down to the next icon. The ::before line runs from the bottom of
   the current icon through this row's remaining padding AND the next
   row's top padding (overflow intentionally visible) so icons are
   actually connected, not fringed. The last row drops the thread so
   the timeline ends cleanly. */
const Spine = styled.div`
	position: relative;
	width: 32px;
	min-height: 32px;
	display: flex;
	justify-content: center;

	&::before {
		content: '';
		position: absolute;
		top: 32px; /* below the 32px icon chip */
		bottom: -28px; /* row pad-bottom (14) + next row pad-top (14) */
		left: 50%;
		transform: translateX(-50%);
		width: 2px;
		border-radius: 2px;
		background: linear-gradient(
			to bottom,
			rgba(15, 23, 42, 0.14),
			rgba(15, 23, 42, 0.06)
		);
	}

	${Row}:last-child &::before {
		display: none;
	}
`

const severityColor = (
	severity: 'INFO' | 'WARNING' | 'CRITICAL',
	result: 'SUCCESS' | 'DENIED' | 'FAILED',
) => {
	if (result === 'FAILED' || severity === 'CRITICAL')
		return { fg: '#b91c1c', bg: 'rgba(239, 68, 68, 0.12)' }
	if (result === 'DENIED' || severity === 'WARNING')
		return { fg: '#a26608', bg: 'rgba(245, 158, 11, 0.16)' }
	return { fg: T.primary, bg: 'rgba(3, 105, 161, 0.1)' }
}

const IconChip = styled.span<{
	$severity: 'INFO' | 'WARNING' | 'CRITICAL'
	$result: 'SUCCESS' | 'DENIED' | 'FAILED'
}>`
	position: relative;
	z-index: 1;
	width: 32px;
	height: 32px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: ${({ $severity, $result }) => severityColor($severity, $result).bg};
	color: ${({ $severity, $result }) => severityColor($severity, $result).fg};
	box-shadow: 0 0 0 3px #fff;
	transition: transform 180ms cubic-bezier(0.22, 1.35, 0.36, 1);

	svg {
		font-size: 17px;
	}

	${Row}:hover & {
		transform: scale(1.06);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		${Row}:hover & {
			transform: none;
		}
	}
`

const Content = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
	padding-top: 5px;
`
const Header = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px 12px;
	align-items: baseline;
	justify-content: space-between;
`
const Label = styled.span`
	font-weight: 600;
	color: ${T.textStrong};
	font-size: 13.5px;
`
const Meta = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	flex-wrap: wrap;
	font-size: 12px;
	color: ${T.textSecondary};
`
const Actor = styled.span`
	font-weight: 500;
	color: ${T.textSecondary};
`
const When = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
`
const Age = styled.span`
	color: ${T.textMuted};
	font-size: 11.5px;
`
const Sep = styled.span`
	opacity: 0.5;
`
const Diffs = styled.ul`
	list-style: '— ';
	padding-left: 14px;
	margin: 2px 0 0;
	color: ${T.textSecondary};
	font-size: 12.5px;
`

const Empty = styled.div`
	padding: 24px 20px;
	border: 1px dashed rgba(15, 23, 42, 0.08);
	border-radius: 12px;
	color: ${T.textSecondary};
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
`
const EmptyIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 12px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	svg {
		font-size: 24px;
	}
`

const ErrorText = styled.span`
	color: #b91c1c;
	font-weight: 500;
`

export default ActivityTimeline
