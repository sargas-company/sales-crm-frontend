import styled, { keyframes } from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'

const tooltipIn = keyframes`
	from { opacity: 0; transform: translateY(-4px) scale(0.98); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

export const HeatmapChartWrap = styled('div')`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 12px;
`

/* Mirrors the Fresh Paper tape-stamp pills from SalesFiltersBar — the
 * main page filter — so the Opportunity heatmap control reads as part
 * of the same filter vocabulary rather than its own one-off chip row. */
const PAPER_INK = '#241E16'
const PAPER_INK_SOFT = '#5C5243'
const PAPER_ACCENT = '#E85D2F'

export const MetricSwitcher = styled('div')`
	position: relative;
	display: inline-flex;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: rgba(36, 30, 22, 0.05);
	align-items: center;

	button {
		position: relative;
		z-index: 1;
		padding: 7px 16px;
		border-radius: 999px;
		border: none;
		background: transparent;
		color: ${PAPER_INK_SOFT};
		font: inherit;
		font-size: 12.5px;
		font-weight: 600;
		letter-spacing: 0.1px;
		white-space: nowrap;
		cursor: pointer;
		transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	button:hover:not(.active) {
		color: ${PAPER_INK};
	}
	button.active {
		color: #FDFAF2;
	}
	button:focus-visible {
		outline: 2px solid ${PAPER_ACCENT};
		outline-offset: 2px;
	}
`

/**
 * Sliding orange tape stamp that transforms between the active button
 * positions with a spring ease — identical mechanic to the one in
 * SalesFiltersBar. The -1.2° rotation is composed in the component
 * (`translateX(left) rotate(-1.2deg)`) so the slide animates through
 * the rotation.
 */
export const MetricTapeIndicator = styled('span')`
	position: absolute;
	top: 3px;
	bottom: 3px;
	left: 0;
	border-radius: 999px;
	background: ${PAPER_ACCENT};
	box-shadow:
		0 2px 0 rgba(36, 30, 22, 0.14),
		0 4px 10px rgba(232, 93, 47, 0.22);
	transform-origin: center;
	transition:
		transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		width 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 200ms ease;
	pointer-events: none;
	will-change: transform, width;

	@media (prefers-reduced-motion: reduce) {
		transition:
			transform 0ms,
			width 0ms,
			opacity 0ms;
	}
`

export const HeatmapSvg = styled('svg')`
	width: 100%;
	height: auto;
	max-width: 100%;

	.heat-cell {
		transition:
			opacity 160ms ${T.ease},
			transform 160ms ${T.ease};
		transform-origin: center;
		transform-box: fill-box;
	}
	.heat-cell.active {
		cursor: pointer;
	}
	.heat-cell.active:hover {
		opacity: 0.85;
		transform: scale(1.06);
	}
	.heat-cell:focus {
		outline: 2px solid #0369a1;
	}
`

export const HeatmapTooltip = styled('div')`
	position: fixed;
	z-index: 9999;
	min-width: 210px;
	background: ${T.cardBg};
	border: 1px solid ${T.border};
	border-radius: 14px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.06),
		0 16px 40px -14px rgba(15, 23, 42, 0.24);
	padding: 14px 16px;
	pointer-events: none;
	display: flex;
	flex-direction: column;
	gap: 12px;
	transform-origin: top left;
	animation: ${tooltipIn} 160ms ${T.ease} both;
	will-change: transform, opacity;

	.ht-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.ht-day {
		font-size: 11px;
		font-weight: 800;
		color: ${T.textSecondary};
		letter-spacing: 1px;
		text-transform: uppercase;
	}
	.ht-hours {
		font-size: 12.5px;
		font-weight: 700;
		color: ${T.textStrong};
		font-variant-numeric: tabular-nums;
	}
	.ht-total {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
	}
	.ht-total-num {
		font-size: 26px;
		font-weight: 800;
		color: ${T.textStrong};
		letter-spacing: -0.8px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.ht-total-label {
		font-size: 12.5px;
		font-weight: 500;
		color: ${T.textMuted};
	}
	.ht-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px 14px;
		padding-top: 10px;
		border-top: 1px solid ${T.divider};
	}
	.ht-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.ht-item-label {
		font-size: 11px;
		font-weight: 600;
		color: ${T.textMuted};
		letter-spacing: 0.2px;
	}
	.ht-item-value {
		font-size: 15px;
		font-weight: 700;
		color: ${T.textPrimary};
		font-variant-numeric: tabular-nums;
	}
`

export const HeatmapLegend = styled('div')`
	display: flex;
	align-items: center;
	gap: 12px;
	font-size: 13px;
	font-weight: 500;
	color: ${T.textSecondary};

	.legend-bar {
		width: 160px;
		height: 8px;
		border-radius: ${T.radiusPill};
		background: linear-gradient(90deg, #e0f2fe 0%, #0369a1 100%);
	}
`

export const Recommendations = styled('div')`
	margin-top: 20px;
	padding-top: 18px;
	border-top: 1px dashed rgba(15, 23, 42, 0.1);
	display: flex;
	flex-direction: column;
	gap: 12px;
	animation: ${tooltipIn} 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;

	.rec-title {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 11.5px;
		font-weight: 800;
		color: #475569;
		text-transform: uppercase;
		letter-spacing: 0.6px;
	}
	.rec-title::before {
		content: '';
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
	}

	.rec-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 10px;
	}

	.rec-card {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 18px 20px;
		border-radius: 14px;
		background: #ffffff;
		border: 1px solid #eef1f6;
		border-left: 4px solid #0369a1;
		transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
		min-width: 0;
	}
	.rec-card:hover {
		transform: translateY(-1px);
		box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.14);
	}

	.rec-label {
		font-size: 10.5px;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: #0369a1;
	}

	.rec-primary {
		font-size: 17px;
		font-weight: 800;
		color: #0f172a;
		letter-spacing: -0.3px;
		line-height: 1.2;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.rec-hint {
		font-size: 12px;
		color: #64748b;
		font-weight: 500;
	}
`
