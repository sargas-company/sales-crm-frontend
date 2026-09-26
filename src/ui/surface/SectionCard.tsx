import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Surface primitive for grouped content on a page.
 *
 * Replaces raw `Card` usage in new pages; existing `Card`
 * components stay until pages are migrated. Reads tokens for
 * background, border, radius, shadow, and spacing.
 */
interface SectionCardProps {
	children: ReactNode
	title?: ReactNode
	actions?: ReactNode
	padding?: 'none' | 'sm' | 'md' | 'lg'
	className?: string
}

const paddingMap = {
	none: '0',
	sm: 'sm',
	md: 'lg',
	lg: 'xl',
} as const

const Card = styled.section<{ $padding: 'none' | 'sm' | 'md' | 'lg' }>`
	display: flex;
	flex-direction: column;
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	box-shadow: ${({ theme }) => theme.shadow!.sm};
	padding: ${({ theme, $padding }) => {
		if ($padding === 'none') return '0'
		return `${theme.spacing![paddingMap[$padding] as 'sm' | 'lg' | 'xl']}px`
	}};
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const Title = styled.h2`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.primary};
	font-family: ${({ theme }) => theme.typography!.h3.fontFamily};
	font-size: ${({ theme }) => theme.typography!.h3.fontSize};
	line-height: ${({ theme }) => theme.typography!.h3.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.h3.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.h3.letterSpacing};
`

const Actions = styled.div`
	display: flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.sm}px;
`

const SectionCard: FC<SectionCardProps> = ({
	children,
	title,
	actions,
	padding = 'md',
	className,
}) => {
	return (
		<Card $padding={padding} className={className}>
			{(title || actions) && (
				<Header>
					{title && <Title>{title}</Title>}
					{actions && <Actions>{actions}</Actions>}
				</Header>
			)}
			{children}
		</Card>
	)
}

export default SectionCard
