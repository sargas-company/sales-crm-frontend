import styled from 'styled-components'
import { ButtonType, IconButtonProps } from '.'
import genColorShades from '../../utils/genColorShades'
import { alertColor, Colors } from '../color/alert'

const skinColor = (color: string) =>
	alertColor.hasOwnProperty(color) ? alertColor[color as keyof Colors] : color

const normalButton = styled.button<ButtonType>`
	display: inline-flex;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	align-items: center;
	${({ width }) => (width ? `min-width: ${width}; width: ${width};` : '')}
	position: relative;
	background-color: ${({ varient, color, theme }) =>
		varient === 'text' || varient === 'outlined'
			? 'transparent'
			: color
				? skinColor(color)
				: theme.colors!.accent.primary};
	box-sizing: border-box;
	border: 1.8px solid
		${({ varient, color, theme }) =>
			varient === 'outlined'
				? color
					? skinColor(color)
					: theme.colors!.accent.primary
				: 'transparent'};
	text-align: center;
	justify-content: center;
	vertical-align: middle;
	color: ${({ theme, color, varient }) =>
		varient === 'outlined' || varient === 'text'
			? color
				? skinColor(color)
				: theme.colors!.accent.primary
			: theme.colors!.accent.contrast};
	font-family: ${({ theme }) => theme.typography!.body.fontFamily};
	font-size: ${({ theme }) => theme.typography!.body.fontSize};
	font-weight: 500;
	letter-spacing: 0.15px;
	padding: ${({ theme }) => theme.spacing!.sm}px ${({ theme }) => theme.spacing!.lg}px;
	border-radius: ${({ theme }) => theme.radius!.sm}px;
	line-height: 1.2;
	cursor: pointer;
	pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
	opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
	overflow: hidden;
	transition:
		background 220ms cubic-bezier(0.4, 0, 0.2, 1),
		box-shadow 220ms cubic-bezier(0.4, 0, 0.2, 1),
		transform 180ms cubic-bezier(0.4, 0, 0.2, 1),
		border-color 220ms cubic-bezier(0.4, 0, 0.2, 1);

	&:hover {
		background: ${({ theme, color, varient }) =>
			varient === 'contained'
				? genColorShades(color ? color : theme.colors!.accent.primary, {
						total: 1,
						intensity: 9,
					}).toString()
				: genColorShades(color ? color : theme.colors!.accent.primary, {
						total: 1,
						intensity: 2,
					}).toString()};
		box-shadow: ${({ varient, color, theme }) =>
			varient === 'contained'
				? `0 6px 18px -6px ${color ? skinColor(color) : theme.colors!.accent.primary}66`
				: 'none'};
		transform: translateY(-1px);
	}

	&:active {
		transform: translateY(0);
		transition-duration: 90ms;
	}
`
export default normalButton

export const iconButton = styled(normalButton)<IconButtonProps>`
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: ${({ roundness, theme }) =>
		roundness === 'rounded'
			? `${theme.radius!.md}px`
			: roundness === 'square'
				? '0.1499rem'
				: '50%'};
	${({ fontSize }) => fontSize && `font-size: ${fontSize}px;`}
	min-height: ${({ size }) => (size ? size : 32)}px;
	height: ${({ size }) => (size ? size : 32)}px;
	min-width: ${({ size }) => (size ? `${size}` : 32)}px;
	width: ${({ size }) => (size ? size : 32)}px;
	color: ${({ varient, color, theme }) =>
		color ? color : varient === 'contained' ? theme.colors!.accent.contrast : 'inherit'};
	padding: 0px;
	user-select: none;
	overflow: hidden;
	z-index: 1;

	& svg {
		font-size: ${({ size }) => (size ? ((size / 16) * 90) / 100 : '1.5')}rem;
		${({ fontSize }) => fontSize && `font-size: ${fontSize}px;`}
	}

	& > .icon-button-content {
		opacity: ${({ contentOpacity }) => (contentOpacity ? `0.${contentOpacity}` : 1)};
	}

	& .hover-layer {
		position: absolute;
		display: block;
		height: 100%;
		width: 100%;
		content: '';
		background: ${({ theme, color }) =>
			color
				? alertColor.hasOwnProperty(color)
					? alertColor[color as keyof Colors]
					: color
				: theme.colors!.accent.primary};
		top: 0;
		left: 0;
		opacity: 0.1;
		z-index: -1;
		visibility: hidden;
	}
	&:hover .hover-layer {
		visibility: visible;
	}
`
