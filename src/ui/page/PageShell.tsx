import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * Page-level content wrapper.
 *
 * Owns:
 * - content width cap (max-width),
 * - responsive horizontal padding,
 * - vertical structure (gap between direct children).
 *
 * Does NOT own the sidebar / header offset — that stays in
 * `AppLayout` (per spec §2 approved 2026-09-26, decision C).
 */
interface PageShellProps {
	children: ReactNode
	maxWidth?: number
	className?: string
}

const Wrapper = styled.div<{ $maxWidth: number }>`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xl}px;
	padding: ${({ theme }) => theme.spacing!.xl}px ${({ theme }) => theme.spacing!.xl}px;
	max-width: ${({ $maxWidth }) => $maxWidth}px;
	margin-inline: auto;
	width: 100%;

	@media (max-width: ${({ theme }) => theme.breakpoint!.md}px) {
		padding: ${({ theme }) => theme.spacing!.lg}px ${({ theme }) => theme.spacing!.md}px;
		gap: ${({ theme }) => theme.spacing!.lg}px;
	}
`

const PageShell: FC<PageShellProps> = ({ children, maxWidth = 1280, className }) => {
	return (
		<Wrapper $maxWidth={maxWidth} className={className}>
			{children}
		</Wrapper>
	)
}

export default PageShell
