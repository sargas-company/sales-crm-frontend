import { FC } from 'react'
import NormalButton from './Button.style'
import { ButtonType } from '.'

const Button: FC<ButtonType> = (props) => {
	const { className, children, styles, type } = props
	return (
		<NormalButton
			{...props}
			className={className ? className : ''}
			style={{ ...styles }}
			type={type ? type : 'button'}
		>
			{children}
		</NormalButton>
	)
}
export default Button
