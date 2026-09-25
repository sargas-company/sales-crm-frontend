import styled from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'

export const KpiPanel = styled('section')`
	background: ${T.cardBg};
	border: 1px solid ${T.border};
	border-radius: 18px;
	overflow: hidden;
`

export const KpiHeader = styled('header')`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 24px;
	border-bottom: 1px solid ${T.divider};
	background: ${T.subtleBg};

	.kpi-kicker {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 11px;
		font-weight: 800;
		color: ${T.textSecondary};
		letter-spacing: 2px;
		text-transform: uppercase;
	}
	.kpi-kicker::before {
		content: '';
		display: inline-block;
		width: 22px;
		height: 2px;
		background: ${T.textStrong};
		border-radius: 999px;
	}
	.kpi-period {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11.5px;
		font-weight: 700;
		color: ${T.textPrimary};
		letter-spacing: 0.4px;
		text-transform: uppercase;
		padding: 4px 10px;
		background: ${T.cardBg};
		border: 1px solid ${T.border};
		border-radius: 999px;
	}
	.kpi-period-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.textStrong};
	}
`

export const KpiStrip = styled('div')`
	display: grid;
	grid-template-columns: repeat(5, 1fr);

	@media (max-width: 1180px) {
		grid-template-columns: repeat(3, 1fr);
	}
	@media (max-width: 640px) {
		grid-template-columns: repeat(2, 1fr);
	}
`

export const KpiCell = styled('div')`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 22px 24px 24px;
	border-right: 1px solid ${T.divider};

	&:last-child {
		border-right: none;
	}

	@media (max-width: 1180px) {
		&:nth-child(3n) {
			border-right: none;
		}
		&:nth-child(n + 4) {
			border-top: 1px solid ${T.divider};
		}
	}
	@media (max-width: 640px) {
		&:nth-child(2n) {
			border-right: none;
		}
		&:nth-child(3n) {
			border-right: 1px solid ${T.divider};
		}
		&:nth-child(n + 3) {
			border-top: 1px solid ${T.divider};
		}
	}

	.kpi-label {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		font-weight: 800;
		color: ${T.textSecondary};
		letter-spacing: 1.2px;
		text-transform: uppercase;
	}
	.kpi-label::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.textStrong};
		flex-shrink: 0;
	}

	.kpi-value {
		display: inline-flex;
		align-items: baseline;
		gap: 3px;
		font-size: 44px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -1.6px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		font-feature-settings:
			'ss01' on,
			'ss02' on;
	}
	.kpi-suffix {
		font-size: 22px;
		font-weight: 600;
		color: ${T.textSecondary};
	}

	.kpi-caption {
		font-family: Georgia, 'Playfair Display', 'Times New Roman', serif;
		font-style: italic;
		font-size: 13.5px;
		font-weight: 400;
		color: ${T.textMuted};
		letter-spacing: 0.1px;
		line-height: 1.35;
	}
`
