import { FC, ReactNode } from 'react'
import styled, { css } from 'styled-components'

/**
 * Inline label primitive. `variant` controls surface treatment
 * (subtle tinted fill vs bordered outline). `tone` picks the
 * semantic color (neutral / accent / status role).
 */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeVariant = 'subtle' | 'outline'

interface BadgeProps {
	children: ReactNode
	tone?: BadgeTone
	variant?: BadgeVariant
	className?: string
}

const toneColor = (tone: BadgeTone, theme: import('../../theme/tokens').AppTheme): string => {
	switch (tone) {
		case 'success':
			return theme.colors!.status.success
		case 'warning':
			return theme.colors!.status.warning
		case 'danger':
			return theme.colors!.status.danger
		case 'info':
			return theme.colors!.status.info
		case 'accent':
			return theme.colors!.accent.primary
		case 'neutral':
		default:
			return theme.colors!.text.secondary
	}
}

/**
 * Return a token color mixed with `transparent` so the result is
 * visibly dimmer than the source. Works for hex, rgb() and rgba()
 * tokens because the CSS engine parses the value (no JS parsing).
 * Uses `color-mix(in srgb, ...)` — widely supported in Chrome 111+,
 * Safari 16.4+, Firefox 113+.
 */
const dim = (color: string, percent: number): string =>
	`color-mix(in srgb, ${color} ${percent}%, transparent)`

const Root = styled.span<{ $tone: BadgeTone; $variant: BadgeVariant }>`
	display: inline-flex;
	align-items: center;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	padding: 2px ${({ theme }) => theme.spacing!.sm}px;
	border-radius: ${({ theme }) => theme.radius!.pill}px;
	font-family: ${({ theme }) => theme.typography!.overline.fontFamily};
	font-size: ${({ theme }) => theme.typography!.overline.fontSize};
	line-height: ${({ theme }) => theme.typography!.overline.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.overline.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.overline.letterSpacing};
	text-transform: uppercase;
	white-space: nowrap;

	${({ $variant, $tone, theme }) => {
		const c = toneColor($tone, theme)
		if ($variant === 'outline') {
			return css`
				color: ${c};
				background: transparent;
				border: 1px solid ${c};
			`
		}
		return css`
			color: ${c};
			background: ${dim(c, 12)};
			border: 1px solid ${dim(c, 24)};
		`
	}}
`

const Badge: FC<BadgeProps> = ({ children, tone = 'neutral', variant = 'subtle', className }) => {
	return (
		<Root $tone={tone} $variant={variant} className={className}>
			{children}
		</Root>
	)
}

export default Badge
