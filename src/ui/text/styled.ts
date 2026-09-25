import styled from 'styled-components'
import TextType, { fontWeight } from './type'
import { alertColor, Colors } from '../color/alert'

export const StyledText = styled('span')<TextType>`
	text-align: ${({ align }) => align};

	${({ color }) =>
		color
			? `color: ${alertColor.hasOwnProperty(color) ? alertColor[color as keyof Colors] : color};`
			: ''};

	${({ secondary, theme, color }) =>
		secondary
			? `color: ${secondary && color ? color : theme.mode.name === 'dark' ? 'rgba(211, 211, 211, 60%);' : 'rgba(25, 25, 25, 50%);'}`
			: ''}

	letter-spacing: ${({ size }) => {
		if (!size) return '0.1px'
		if (size >= 28) return '-0.4px'
		if (size >= 20) return '-0.2px'
		if (size >= 16) return '0'
		return '0.1px'
	}};

	font-weight: ${({ weight }) => weight && fontWeight[weight]};

	text-transform: ${({ textTransform }) => (textTransform ? textTransform : 'none')};
	${({ lineHeight }) => (lineHeight ? `line-height: ${lineHeight};` : '')}

	${({ textOverflow }) =>
		textOverflow && textOverflow !== 'unset'
			? `
    min-width: 0px;
    white-space: nowrap;
    text-overflow: ${textOverflow};
    overflow: hidden;
`
			: ''}


${({ size }) => size && `font-size: ${size}px;`}
    & svg {
		${({ size }) => size && `font-size: ${size}px`};
	}
`
export default StyledText
