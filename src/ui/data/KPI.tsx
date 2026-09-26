import { FC, ReactNode } from 'react'
import styled, { css } from 'styled-components'

/**
 * KPI tile: label, headline value, optional delta.
 *
 * `trend` is the DIRECTION of the change (`up | down | flat`) —
 * how the number moved. `deltaTone` is the SEMANTIC colour
 * (`positive | negative | neutral`) — whether that direction is
 * good or bad in this metric's context.
 *
 * If `deltaTone` is omitted, the tile falls back to the direction
 * mapping (`up → positive`, `down → negative`, `flat → neutral`),
 * which is right for metrics where "up is good" (revenue, active
 * users). For metrics where the meaning is inverted (expenses,
 * error rate), pass `deltaTone` explicitly so a fall in expenses
 * can render green and a rise in errors red.
 */
export type KPITrend = 'up' | 'down' | 'flat'
export type KPIDeltaTone = 'positive' | 'negative' | 'neutral'

interface KPIProps {
	label: ReactNode
	value: ReactNode
	delta?: ReactNode
	trend?: KPITrend
	deltaTone?: KPIDeltaTone
	hint?: ReactNode
	className?: string
}

const trendToTone = (trend: KPITrend): KPIDeltaTone => {
	if (trend === 'up') return 'positive'
	if (trend === 'down') return 'negative'
	return 'neutral'
}

const Tile = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
	padding: ${({ theme }) => theme.spacing!.lg}px;
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	box-shadow: ${({ theme }) => theme.shadow!.sm};
	min-width: 0;
`

const Label = styled.span`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.overline.fontFamily};
	font-size: ${({ theme }) => theme.typography!.overline.fontSize};
	line-height: ${({ theme }) => theme.typography!.overline.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.overline.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.overline.letterSpacing};
	text-transform: uppercase;
`

const Value = styled.span`
	color: ${({ theme }) => theme.colors!.text.primary};
	font-family: ${({ theme }) => theme.typography!.display.fontFamily};
	font-size: ${({ theme }) => theme.typography!.display.fontSize};
	line-height: ${({ theme }) => theme.typography!.display.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.display.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.display.letterSpacing};
	overflow-wrap: anywhere;
`

const Row = styled.div`
	display: flex;
	align-items: baseline;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	flex-wrap: wrap;
`

const Delta = styled.span<{ $tone: KPIDeltaTone }>`
	font-family: ${({ theme }) => theme.typography!.bodySm.fontFamily};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	line-height: ${({ theme }) => theme.typography!.bodySm.lineHeight};
	font-weight: 600;

	${({ $tone, theme }) => {
		if ($tone === 'positive')
			return css`
				color: ${theme.colors!.status.success};
			`
		if ($tone === 'negative')
			return css`
				color: ${theme.colors!.status.danger};
			`
		return css`
			color: ${theme.colors!.text.secondary};
		`
	}}
`

const Hint = styled.span`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.caption.fontFamily};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	line-height: ${({ theme }) => theme.typography!.caption.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.caption.fontWeight};
`

const KPI: FC<KPIProps> = ({ label, value, delta, trend = 'flat', deltaTone, hint, className }) => {
	const tone = deltaTone ?? trendToTone(trend)
	return (
		<Tile className={className}>
			<Label>{label}</Label>
			<Row>
				<Value>{value}</Value>
				{delta !== undefined && delta !== null && <Delta $tone={tone}>{delta}</Delta>}
			</Row>
			{hint && <Hint>{hint}</Hint>}
		</Tile>
	)
}

export default KPI
