import { FC, ReactNode } from 'react'
import Loading from '../../state/Loading'

/**
 * Table-shaped Loading state. Single `<tr>` spanning `colSpan`
 * columns; the shared `Loading` primitive lives inside.
 */
interface LoadingStateProps {
	colSpan: number
	label?: ReactNode
	className?: string
}

const LoadingState: FC<LoadingStateProps> = ({ colSpan, label, className }) => (
	<tr aria-label='table loading state' className={className}>
		<td colSpan={colSpan}>
			<Loading label={label} />
		</td>
	</tr>
)

export default LoadingState
