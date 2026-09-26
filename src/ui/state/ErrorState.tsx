import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Error-state display. Shown when a data fetch / operation
 * failed. Renders a title, optional description (typically a
 * one-line error summary), and an optional retry action.
 * Colours come from `status.danger` tokens.
 */
interface ErrorStateProps {
	title?: ReactNode
	description?: ReactNode
	action?: ReactNode
	className?: string
}

const Root = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: ${({ theme }) => theme.spacing!.md}px;
	padding: ${({ theme }) => theme.spacing!.xxl}px ${({ theme }) => theme.spacing!.xl}px;
	text-align: center;
`

const Title = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.status.danger};
	font-family: ${({ theme }) => theme.typography!.h4.fontFamily};
	font-size: ${({ theme }) => theme.typography!.h4.fontSize};
	line-height: ${({ theme }) => theme.typography!.h4.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.h4.fontWeight};
`

const Description = styled.p`
	margin: 0;
	max-width: 40ch;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.bodySm.fontFamily};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	line-height: ${({ theme }) => theme.typography!.bodySm.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.bodySm.fontWeight};
`

const ErrorState: FC<ErrorStateProps> = ({
	title = 'Something went wrong',
	description,
	action,
	className,
}) => (
	<Root role='alert' className={className}>
		<Title>{title}</Title>
		{description && <Description>{description}</Description>}
		{action}
	</Root>
)

export default ErrorState
