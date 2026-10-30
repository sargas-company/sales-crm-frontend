import styled from 'styled-components'
import { formatDate } from '../../../utils/format'
import { formatDateTimeSec } from '../../../utils/formatDate'
import { T } from '../../../components/sales-analytics/_shared/tokens'

/* ─── Date + time cell ───────────────────────────────────────────
 * Date pops (semi-bold slate), time trails in mono muted.
 * Mirrors the Leads / Projects / Clients list pattern 1-to-1. */
export const DateTimeCell = ({ iso }: { iso: string }) => {
	const d = new Date(iso)
	const timeStr = d.toLocaleTimeString('en-GB', {
		hour: '2-digit',
		minute: '2-digit',
	})
	return (
		<DateTimeWrap title={formatDateTimeSec(iso)}>
			<DatePart>{formatDate(iso, 'short')}</DatePart>
			<TimePart>{timeStr}</TimePart>
		</DateTimeWrap>
	)
}

const DateTimeWrap = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	white-space: nowrap;
`
const DatePart = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: #0f172a;
	letter-spacing: -0.1px;
`
const TimePart = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 11.5px;
	font-weight: 400;
	color: ${T.textMuted};
	font-variant-numeric: tabular-nums;
`

/* ─── Pills (uppercase, tracked) ─────────────────────────────────
 * One geometry across the module: 4/10 pad, 999px radius, 11px /
 * weight 700 / uppercase / letter-spacing 0.3px / no-wrap. */
export const StatusPill = styled.span<{ $tone?: 'success' | 'danger' | 'warn' | 'info' | 'muted' }>`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	${({ $tone = 'info' }) => {
		switch ($tone) {
			case 'success':
				return `background: rgba(34, 197, 94, 0.14); color: #15803d;`
			case 'danger':
				return `background: rgba(239, 68, 68, 0.12); color: #b91c1c;`
			case 'warn':
				return `background: rgba(245, 158, 11, 0.16); color: #a26608;`
			case 'muted':
				return `background: rgba(100, 116, 139, 0.12); color: #64748b;`
			case 'info':
			default:
				return `background: rgba(3, 105, 161, 0.12); color: ${T.primary};`
		}
	}}
`

/* Category / section chip — a slightly softer purple-ish version so
 * it reads as a classification tag, not a status. */
export const CategoryPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	background: rgba(124, 58, 237, 0.1);
	color: #6d28d9;
`

/* Truncating single-line cell — wrap strong-text cells (names,
 * summaries, URLs) in this so they ellipsise instead of wrapping. */
export const Clip = styled.span<{ $max?: number }>`
	display: inline-block;
	max-width: ${({ $max }) => ($max ? `${$max}px` : '100%')};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	vertical-align: bottom;
`

/* Monospace numeric cell. */
export const NumCell = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
`

/* Muted em-dash for empty cells. */
export const EmptyCell = styled.span`
	color: ${T.textMuted};
	font-size: 13px;
`

/* Dashed muted badge for empty cells — mirrors the Leads /
 * Clients / Projects / Employees pattern 1-to-1. Use with a short
 * lowercase label (`no url`, `no title`, `not set`, `shared`). */
export const EmptyBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	border: 1.5px dashed rgba(100, 116, 139, 0.4);
	background: rgba(100, 116, 139, 0.06);
	color: ${T.textSecondary};
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	white-space: nowrap;
	cursor: default;

	svg {
		font-size: 15px;
		opacity: 0.7;
	}
`

/* Frequency chip — pop a numeric value so it stands out from the
 * other mono cells. Softer when 0, strong indigo-tint otherwise. */
export const FreqChip = styled.span<{ $warm?: boolean }>`
	display: inline-flex;
	align-items: center;
	padding: 3px 10px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.2px;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
	background: ${(p) => (p.$warm ? 'rgba(217, 119, 6, 0.14)' : 'rgba(3, 105, 161, 0.1)')};
	color: ${(p) => (p.$warm ? '#a26608' : '#0369a1')};
`
