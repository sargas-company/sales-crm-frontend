import { FC, ReactNode } from 'react'
import Empty from '../../state/Empty'

/**
 * Table-shaped Empty state. Renders a single `<tr>` spanning
 * `colSpan` columns, with the shared `Empty` primitive centred
 * inside. Consumers pass `colSpan` matching their column count.
 */
interface EmptyStateProps {
	colSpan: number
	icon?: ReactNode
	title: ReactNode
	description?: ReactNode
	action?: ReactNode
	className?: string
}

const EmptyState: FC<EmptyStateProps> = ({
	colSpan,
	icon,
	title,
	description,
	action,
	className,
}) => (
	<tr aria-label='table empty state' className={className}>
		<td colSpan={colSpan}>
			<Empty icon={icon} title={title} description={description} action={action} />
		</td>
	</tr>
)

export default EmptyState
