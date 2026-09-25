import { FC, ReactNode } from 'react'
import styled from 'styled-components'

const AuthLayout: FC<Props> = ({ LeftContent, RightContent }) => {
	return (
		<StyledAuthLayout>
			<div className='auth_left_content'>{LeftContent}</div>
			<div className='auth_right_content'>{RightContent}</div>
		</StyledAuthLayout>
	)
}
export default AuthLayout

interface Props {
	LeftContent: ReactNode
	RightContent: ReactNode
}

const StyledAuthLayout = styled('section')`
	display: flex;
	position: relative;
	min-height: 100vh;
	width: 100%;
	overflow-x: hidden;
	background: #ffffff;

	& > .auth_left_content {
		flex: 1 1 0;
		min-width: 0;
		display: flex;
		align-items: stretch;
		position: relative;

		@media (max-width: 899px) {
			display: none;
		}

		& > * {
			flex: 1 1 auto;
			width: 100%;
		}
	}

	& > .auth_right_content {
		flex: 0 0 auto;
		width: 100%;
		display: flex;
		align-items: stretch;

		@media (min-width: 900px) {
			width: 480px;
			max-width: 480px;
		}

		& > * {
			flex: 1 1 auto;
			width: 100%;
		}
	}
`
