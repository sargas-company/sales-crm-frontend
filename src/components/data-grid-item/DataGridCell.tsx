import { FC, memo, ReactNode } from 'react'
import { Text } from '../../ui'
import Box from '../box/Box'

const DataGridCell: FC<Props> = ({ value, width, flex, hidden, children, justify }) => {
	if (hidden) return <></>
	const cellWidth = typeof width === 'number' ? `${width}px` : width
	const flexStyle = flex
		? { flex, minWidth: 0, minHeight: 72, maxHeight: 72 }
		: { width: cellWidth, minWidth: cellWidth, maxWidth: cellWidth, minHeight: 72, maxHeight: 72 }
	return (
		<Box
			display='flex'
			align='center'
			justify={justify}
			wrap='nowrap'
			className='data-grid-cell'
			style={flexStyle}
			padding={24}
		>
			{value && !children && (
				typeof value === 'string' || typeof value === 'number'
					? <Text varient='body2' textOverflow='ellipsis' paragraph>{value}</Text>
					: <>{value}</>
			)}
			{children && children}
		</Box>
	)
}
export default memo(DataGridCell)
interface Props {
	value?: string | number | ReactNode
	width: number | string
	flex?: number
	hidden?: boolean
	children?: ReactNode
	justify?:
		| 'space-between'
		| 'space-around'
		| 'space-evenly'
		| 'flex-start'
		| 'center'
		| 'flex-end'
}
