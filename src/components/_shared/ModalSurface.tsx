import { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import useTheme from '../../theme/useTheme'

interface Props {
	children: ReactNode
	maxWidth?: number
	padding?: number | string
}

const ModalSurface = ({ children, maxWidth = 520, padding = 28 }: Props) => {
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	return (
		<Surface $dark={isDark} $maxWidth={maxWidth} $padding={padding}>
			{children}
		</Surface>
	)
}

export default ModalSurface

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(6px) scale(0.985); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const Surface = styled.div<{ $dark: boolean; $maxWidth: number; $padding: number | string }>`
	max-width: ${({ $maxWidth }) => $maxWidth}px;
	width: 100%;
	margin: 1rem;
	background: ${({ $dark }) => ($dark ? '#252d3a' : '#ffffff')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#eceaf3')};
	border-radius: 18px;
	box-shadow: ${({ $dark }) =>
		$dark
			? '0 40px 80px -30px rgba(0, 0, 0, 0.7), 0 4px 10px rgba(0, 0, 0, 0.2)'
			: '0 40px 80px -30px rgba(63, 51, 111, 0.30), 0 4px 10px rgba(63, 51, 111, 0.08)'};
	padding: ${({ $padding }) =>
		typeof $padding === 'number' ? `${$padding}px` : $padding};
	animation: ${fadeIn} 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	overflow: hidden;
`
