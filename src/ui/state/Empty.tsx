import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Empty-state display. Shown when a list / table / section has no
 * items. Renders an optional icon, a title, and optional
 * description + action (e.g. a "Create X" button).
 */
interface EmptyProps {
	icon?: ReactNode
	title: ReactNode
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
	color: ${({ theme }) => theme.colors!.text.secondary};
`

const IconSlot = styled.div`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: 40px;
	line-height: 1;
	opacity: 0.7;
`

const Title = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.primary};
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

const Empty: FC<EmptyProps> = ({ icon, title, description, action, className }) => (
	<Root role='status' className={className}>
		{icon && <IconSlot>{icon}</IconSlot>}
		<Title>{title}</Title>
		{description && <Description>{description}</Description>}
		{action}
	</Root>
)

export default Empty
