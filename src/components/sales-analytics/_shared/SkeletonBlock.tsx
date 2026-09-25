import styled, { keyframes } from 'styled-components'
import { T } from './tokens'

interface Props {
	height?: number | string
	width?: number | string
	radius?: number
	className?: string
}

const shimmer = keyframes`
	0% { background-position: -200% 0; }
	100% { background-position: 200% 0; }
`

const Bar = styled('div')<{ $height: string; $width: string; $radius: number }>`
	height: ${({ $height }) => $height};
	width: ${({ $width }) => $width};
	border-radius: ${({ $radius }) => `${$radius}px`};
	background: linear-gradient(90deg, ${T.subtleBg} 0%, #ecebf2 50%, ${T.subtleBg} 100%);
	background-size: 200% 100%;
	animation: ${shimmer} 1.4s ease-in-out infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const SkeletonBlock = ({ height = 120, width = '100%', radius = 8, className }: Props) => (
	<Bar
		className={className}
		$height={typeof height === 'number' ? `${height}px` : height}
		$width={typeof width === 'number' ? `${width}px` : width}
		$radius={radius}
		aria-busy='true'
		aria-live='polite'
	/>
)

export default SkeletonBlock
