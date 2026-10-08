import styled from 'styled-components'
import { HistoryOutlined } from '@mui/icons-material'
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
		return <Shell>{emptyLabel}</Shell>
	}
	return (
		<Shell>
			<Rail>
				{events.map((e) => {
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
					return (
						<Row key={e.id}>
							<Dot $severity={e.severity} />
							<Content>
								<Header>
									<Label>{labelOf(e.action)}</Label>
									<Meta>
										{actorOf(e)} · {formatWhen(e.occurredAt)}
									</Meta>
								</Header>
								{diffs.length > 0 && (
									<Diffs>
										{diffs.map((d, i) => (
											<li key={i}>{d}</li>
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

const Shell = styled.div`
	padding: 12px 0;
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
const Rail = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const Row = styled.li`
	display: flex;
	gap: 12px;
	align-items: flex-start;
`
const Dot = styled.span<{ $severity: 'INFO' | 'WARNING' | 'CRITICAL' }>`
	flex-shrink: 0;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	margin-top: 6px;
	background: ${({ $severity }) =>
		$severity === 'WARNING'
			? '#f59e0b'
			: $severity === 'CRITICAL'
				? '#ef4444'
				: T.primary};
`
const Content = styled.div`
	min-width: 0;
	flex: 1;
`
const Header = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: baseline;
	justify-content: space-between;
`
const Label = styled.span`
	font-weight: 600;
	color: ${T.textStrong};
`
const Meta = styled.span`
	font-size: 12px;
	color: ${T.textSecondary};
`
const Diffs = styled.ul`
	list-style: '— ';
	padding-left: 14px;
	margin: 4px 0 0;
	color: ${T.textSecondary};
	font-size: 12.5px;
`
const ErrorText = styled.span`
	color: #b91c1c;
	font-weight: 500;
`

export default ActivityTimeline
