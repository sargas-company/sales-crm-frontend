import { FC, ReactNode } from 'react'
import Badge, { BadgeTone } from './Badge'

/**
 * Thin wrapper over `Badge` for semantic status values. Callers
 * pass a status string; the component maps it to a `Badge` tone.
 * Unknown statuses fall back to neutral tone with the label
 * shown verbatim.
 */
export type StatusKind = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

interface StatusBadgeProps {
	status: StatusKind
	label?: ReactNode
	className?: string
}

const kindToTone: Record<StatusKind, BadgeTone> = {
	success: 'success',
	warning: 'warning',
	danger: 'danger',
	info: 'info',
	neutral: 'neutral',
}

const StatusBadge: FC<StatusBadgeProps> = ({ status, label, className }) => {
	return (
		<Badge tone={kindToTone[status]} variant='subtle' className={className}>
			{label ?? status}
		</Badge>
	)
}

export default StatusBadge
