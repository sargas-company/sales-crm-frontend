import { FC, ReactNode, MouseEvent } from 'react'
import styled, { keyframes } from 'styled-components'
import useTheme from '../../theme/useTheme'
import genColorShades from '../../utils/genColorShades'

const rowFadeIn = keyframes`
	from {
		opacity: 0;
		transform: translate3d(0, 6px, 0);
	}
	to {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
`

const DataGridRow: FC<Props> = (props) => {
	const {
		theme: { mode, primaryColor },
	} = useTheme()
	const { dataId, rowId, children, onClick, selected, animationIndex } = props
	return (
		<StyledRow
			theme={{
				mode,
				color: genColorShades(primaryColor.color, { intensity: 1, total: 1 })[0],
			}}
			key={dataId}
			role='row'
			aria-label='data-row'
			className={`data-grid-row ${selected ? 'row-selected' : ''}`}
			data-id={dataId}
			data-rowindex={rowId}
			animationIndex={animationIndex}
			onClick={(event: MouseEvent<HTMLDivElement>) => onClick && onClick(event, rowId)}
		>
			{children}
		</StyledRow>
	)
}

interface Props {
	children: ReactNode
	dataId: number | string
	rowId: number | string
	selected?: boolean
	animationIndex?: number
	onClick?: (event: MouseEvent<HTMLDivElement>, rowId?: string | number) => void
}

const StyledRow = styled('div')<{ animationIndex?: number }>`
	display: flex;
	position: relative;
	flex-wrap: nowrap;
	vertical-align: middle;
	min-height: 64px;
	border-bottom: 1px solid
		${({ theme }) => (theme.mode?.name === 'dark' ? 'rgba(177, 177, 177, 0.14)' : 'rgba(122, 122, 122, 0.14)')};
	transition:
		background 0.22s ease,
		transform 0.22s ease,
		box-shadow 0.22s ease;
	will-change: transform, background;
	animation: ${rowFadeIn} 0.35s ease-out both;
	animation-delay: ${({ animationIndex }) =>
		animationIndex !== undefined ? `${Math.min(animationIndex * 40, 400)}ms` : '0ms'};

	&:hover {
		background: ${({ theme }) => (theme.mode?.name === 'dark' ? '#ffffff10' : '#f2f4f7')};
		transform: translateX(2px);
	}
	&.row-selected {
		background: ${({ theme }) => theme.color};
	}
	&:last-child {
		border-bottom: none;
	}

	& .list-action-wrapper {
		position: absolute;
		width: 100%;
		margin-top: 50px;
	}
`
export default DataGridRow
