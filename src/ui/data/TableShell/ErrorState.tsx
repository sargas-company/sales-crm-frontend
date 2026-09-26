import { FC, ReactNode } from 'react'
import ErrorStateBase from '../../state/ErrorState'

/**
 * Table-shaped Error state. Single `<tr>` spanning `colSpan`
 * columns; the shared `ErrorState` primitive lives inside.
 */
interface ErrorStateProps {
	colSpan: number
	title?: ReactNode
	description?: ReactNode
	action?: ReactNode
	className?: string
}

const ErrorState: FC<ErrorStateProps> = ({ colSpan, title, description, action, className }) => (
	<tr aria-label='table error state' className={className}>
		<td colSpan={colSpan}>
			<ErrorStateBase title={title} description={description} action={action} />
		</td>
	</tr>
)

export default ErrorState
