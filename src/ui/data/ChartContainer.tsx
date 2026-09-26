import { FC, ReactNode } from 'react'
import styled from 'styled-components'

/**
 * ChartContainer — fixed aspect wrapper for any chart body.
 *
 * The API is intentionally chart-library agnostic: it accepts
 * children and simply constrains layout. New work targets Recharts
 * per B1 (approved 2026-09-26), but existing ApexCharts / Chart.js
 * call sites keep rendering unchanged when mounted inside this
 * container.
 *
 * Design guarantees:
 * - fixed aspect ratio (default 16 / 9);
 * - consistent inner padding (token-driven);
 * - no drop-shadow, no gradient background;
 * - optional caption slot above the chart;
 * - optional legend slot, position `top | bottom` (default bottom).
 *
 * Chart libraries that ship their own legend should hide it and
 * pass a token-driven legend into the `legend` slot instead.
 */
export type ChartLegendPosition = 'top' | 'bottom'

interface ChartContainerProps {
	children: ReactNode
	caption?: ReactNode
	legend?: ReactNode
	legendPosition?: ChartLegendPosition
	aspectRatio?: number
	className?: string
}

const Root = styled.section`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	padding: ${({ theme }) => theme.spacing!.lg}px;
	min-width: 0;
`

const Caption = styled.header`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.overline.fontFamily};
	font-size: ${({ theme }) => theme.typography!.overline.fontSize};
	line-height: ${({ theme }) => theme.typography!.overline.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.overline.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.overline.letterSpacing};
	text-transform: uppercase;
`

const AspectBox = styled.div<{ $aspectRatio: number }>`
	position: relative;
	width: 100%;
	aspect-ratio: ${({ $aspectRatio }) => $aspectRatio};
	min-width: 0;

	> * {
		width: 100%;
		height: 100%;
	}
`

const Legend = styled.footer`
	display: flex;
	flex-wrap: wrap;
	gap: ${({ theme }) => theme.spacing!.md}px;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.caption.fontFamily};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	line-height: ${({ theme }) => theme.typography!.caption.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.caption.fontWeight};
`

const ChartContainer: FC<ChartContainerProps> = ({
	children,
	caption,
	legend,
	legendPosition = 'bottom',
	aspectRatio = 16 / 9,
	className,
}) => (
	<Root className={className}>
		{caption && <Caption>{caption}</Caption>}
		{legend && legendPosition === 'top' && <Legend>{legend}</Legend>}
		<AspectBox $aspectRatio={aspectRatio}>{children}</AspectBox>
		{legend && legendPosition === 'bottom' && <Legend>{legend}</Legend>}
	</Root>
)

export default ChartContainer
