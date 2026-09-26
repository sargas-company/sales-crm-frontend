import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Page-level header. Renders a title, optional subtitle, and an
 * actions slot aligned to the trailing edge.
 */
interface PageHeaderProps {
	title: ReactNode
	subtitle?: ReactNode
	actions?: ReactNode
	className?: string
}

const Header = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: ${({ theme }) => theme.spacing!.lg}px;
	padding-block: ${({ theme }) => theme.spacing!.md}px;
	border-bottom: 1px solid ${({ theme }) => theme.colors!.border.subtle};
`

const Titles = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	min-width: 0;
`

const Title = styled.h1`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.primary};
	font-family: ${({ theme }) => theme.typography!.h1.fontFamily};
	font-size: ${({ theme }) => theme.typography!.h1.fontSize};
	line-height: ${({ theme }) => theme.typography!.h1.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.h1.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.h1.letterSpacing};
`

const Subtitle = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.body.fontFamily};
	font-size: ${({ theme }) => theme.typography!.body.fontSize};
	line-height: ${({ theme }) => theme.typography!.body.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.body.fontWeight};
`

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	flex-shrink: 0;
`

const PageHeader: FC<PageHeaderProps> = ({ title, subtitle, actions, className }) => {
	return (
		<Header className={className}>
			<Titles>
				<Title>{title}</Title>
				{subtitle && <Subtitle>{subtitle}</Subtitle>}
			</Titles>
			{actions && <Actions>{actions}</Actions>}
		</Header>
	)
}

export default PageHeader
