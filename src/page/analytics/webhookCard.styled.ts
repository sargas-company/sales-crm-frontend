import styled, { keyframes } from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'

const flagWave = keyframes`
	0%, 100% { transform: translateX(-120%) skewX(-12deg); }
	60% { transform: translateX(180%) skewX(-12deg); }
`

const livePulse = keyframes`
	0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; opacity: 1; }
	50%      { transform: scale(1.25); box-shadow: 0 0 0 6px transparent; opacity: 0.85; }
`

const shimmer = keyframes`
	0%   { transform: translateX(-100%); }
	100% { transform: translateX(400%); }
`

const softBlink = keyframes`
	0%, 100% { opacity: 1; }
	50%      { opacity: 0.35; }
`

export type ScannerVisualState = 'running' | 'delayed' | 'down' | 'idle'

const stateTone: Record<
	ScannerVisualState,
	{ bg: string; text: string; dot: string; heroBorder: string }
> = {
	running: {
		bg: T.successTint,
		text: '#065f46',
		dot: '#16a34a',
		heroBorder: 'rgba(22, 163, 74, 0.35)',
	},
	delayed: {
		bg: T.warningTint,
		text: '#92400e',
		dot: '#d97706',
		heroBorder: 'rgba(217, 119, 6, 0.35)',
	},
	down: {
		bg: T.errorTint,
		text: '#7f1d1d',
		dot: '#dc2626',
		heroBorder: 'rgba(220, 38, 38, 0.35)',
	},
	idle: {
		bg: T.subtleBg,
		text: T.textSecondary,
		dot: T.textMuted,
		heroBorder: 'rgba(100, 116, 139, 0.35)',
	},
}

export const WebhookCard = styled('div')<{ state: ScannerVisualState }>`
	display: flex;
	flex-direction: column;
	padding: 24px 26px 22px;
	gap: 20px;

	/* ==== HEADER ==== */
	.wh-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 12px;
	}
	.wh-brand {
		display: flex;
		align-items: center;
		gap: 14px;
		min-width: 0;
	}
	.wh-logo {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: linear-gradient(135deg, #7c3aed 0%, #6366f1 55%, ${T.primary} 100%);
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		font-size: 18px;
		font-weight: 800;
		letter-spacing: -0.4px;
		box-shadow: 0 8px 20px rgba(99, 102, 241, 0.35);
		position: relative;
		overflow: hidden;

		&::after {
			content: '';
			position: absolute;
			inset: 0;
			background: linear-gradient(
				60deg,
				transparent 30%,
				rgba(255, 255, 255, 0.35) 50%,
				transparent 70%
			);
			animation: ${flagWave} 3.6s ease-in-out infinite;
			pointer-events: none;
		}
		@media (prefers-reduced-motion: reduce) {
			&::after {
				animation: none;
			}
		}
	}
	.wh-name {
		font-size: 17px;
		font-weight: 700;
		color: ${T.textStrong};
		display: flex;
		align-items: baseline;
		gap: 8px;
		letter-spacing: -0.2px;
	}
	.wh-name-sub {
		font-size: 11px;
		font-weight: 700;
		color: ${T.textMuted};
		letter-spacing: 0.6px;
		text-transform: uppercase;
	}
	.wh-hint {
		font-size: 13.5px;
		color: ${T.textSecondary};
		margin-top: 4px;
	}

	.wh-pill {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 7px 14px;
		border-radius: 999px;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		background: ${({ state }) => stateTone[state].bg};
		color: ${({ state }) => stateTone[state].text};
		border: 1px solid ${({ state }) => stateTone[state].heroBorder};
		white-space: nowrap;
	}
	.wh-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: ${({ state }) => stateTone[state].dot};
		color: ${({ state }) => stateTone[state].dot};
		animation: ${livePulse} 2.2s ease-in-out infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.wh-dot {
			animation: none;
		}
	}

	/* ==== HERO — soft sky blue ==== */
	.wh-hero {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 22px 26px;
		border-radius: 18px;
		background: linear-gradient(135deg, #075985 0%, #0369a1 45%, #0284c7 100%);
		color: #fff;
		box-shadow: 0 12px 32px -14px rgba(2, 132, 199, 0.45);
		position: relative;
		overflow: hidden;

		&::before {
			content: '';
			position: absolute;
			top: -30%;
			right: -10%;
			width: 260px;
			height: 260px;
			background: radial-gradient(circle, rgba(255, 255, 255, 0.14) 0%, transparent 60%);
			pointer-events: none;
		}
	}
	.wh-hero-left {
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 1;
	}
	.wh-hero-live {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.8px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.9);
	}
	.wh-hero-live-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #fff;
		box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.85);
		animation: ${livePulse} 1.6s ease-in-out infinite;
	}
	.wh-hero-label {
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
	}
	.wh-hero-value {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
		z-index: 1;
	}
	.wh-hero-num {
		font-size: 42px;
		font-weight: 800;
		letter-spacing: -1.2px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.wh-hero-suffix {
		font-size: 15px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.85);
	}

	/* ==== HERO WIDGET TILES — Pinterest style, per-tile mood via CSS vars ==== */
	.hw-tile {
		--hw-bg-start: #fffdf5;
		--hw-bg-end: #fef3c7;
		--hw-tint-blob: rgba(59, 130, 246, 0.08);
		--hw-border: rgba(234, 179, 8, 0.22);
		--hw-shadow: rgba(234, 179, 8, 0.35);
		--hw-shadow-strong: rgba(234, 179, 8, 0.45);
		--hw-icon: #facc15;
		--hw-icon-shadow: rgba(234, 179, 8, 0.45);
		--hw-icon-shadow-2: rgba(180, 83, 9, 0.25);
		--hw-label: rgba(180, 83, 9, 0.85);
		--hw-num: #1f1300;
		--hw-unit: rgba(69, 26, 3, 0.65);
		--hw-caption: rgba(120, 53, 15, 0.68);
		--hw-accent: #d97706;
		--hw-accent-soft: rgba(217, 119, 6, 0.15);

		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 20px;
		padding: 22px 24px 20px;
		border-radius: 24px;
		min-height: 220px;
		background: ${T.cardBg};
		border: 1px solid ${T.border};
		box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
	}

	.hw-tile-purple {
		--hw-bg-start: #f0f9ff;
		--hw-bg-end: #dbeafe;
		--hw-tint-blob: rgba(2, 132, 199, 0.08);
		--hw-border: rgba(2, 132, 199, 0.22);
		--hw-shadow: rgba(2, 132, 199, 0.32);
		--hw-shadow-strong: rgba(2, 132, 199, 0.42);
		--hw-icon: #0284c7;
		--hw-icon-shadow: rgba(2, 132, 199, 0.45);
		--hw-icon-shadow-2: rgba(7, 89, 133, 0.28);
		--hw-label: rgba(7, 89, 133, 0.85);
		--hw-num: #082f49;
		--hw-unit: rgba(8, 47, 73, 0.62);
		--hw-caption: rgba(7, 89, 133, 0.68);
		--hw-accent: #0369a1;
		--hw-accent-soft: rgba(3, 105, 161, 0.16);
	}
	.hw-tile-teal {
		--hw-bg-start: #f0f9ff;
		--hw-bg-end: #dbeafe;
		--hw-tint-blob: rgba(2, 132, 199, 0.08);
		--hw-border: rgba(2, 132, 199, 0.22);
		--hw-shadow: rgba(2, 132, 199, 0.32);
		--hw-shadow-strong: rgba(2, 132, 199, 0.42);
		--hw-icon: #0284c7;
		--hw-icon-shadow: rgba(2, 132, 199, 0.45);
		--hw-icon-shadow-2: rgba(7, 89, 133, 0.28);
		--hw-label: rgba(7, 89, 133, 0.85);
		--hw-num: #082f49;
		--hw-unit: rgba(8, 47, 73, 0.62);
		--hw-caption: rgba(7, 89, 133, 0.68);
		--hw-accent: #0369a1;
		--hw-accent-soft: rgba(3, 105, 161, 0.16);
	}
	.hw-tile-rose {
		--hw-bg-start: #f0f9ff;
		--hw-bg-end: #dbeafe;
		--hw-tint-blob: rgba(2, 132, 199, 0.08);
		--hw-border: rgba(2, 132, 199, 0.22);
		--hw-shadow: rgba(2, 132, 199, 0.32);
		--hw-shadow-strong: rgba(2, 132, 199, 0.42);
		--hw-icon: #0284c7;
		--hw-icon-shadow: rgba(2, 132, 199, 0.45);
		--hw-icon-shadow-2: rgba(7, 89, 133, 0.28);
		--hw-label: rgba(7, 89, 133, 0.85);
		--hw-num: #082f49;
		--hw-unit: rgba(8, 47, 73, 0.62);
		--hw-caption: rgba(7, 89, 133, 0.68);
		--hw-accent: #0369a1;
		--hw-accent-soft: rgba(3, 105, 161, 0.16);
	}
	.hw-tile-green {
		--hw-bg-start: #f4fdf7;
		--hw-bg-end: #d1fae5;
		--hw-tint-blob: rgba(20, 184, 166, 0.08);
		--hw-border: rgba(5, 150, 105, 0.24);
		--hw-shadow: rgba(5, 150, 105, 0.3);
		--hw-shadow-strong: rgba(5, 150, 105, 0.4);
		--hw-icon: #10b981;
		--hw-icon-shadow: rgba(16, 185, 129, 0.45);
		--hw-icon-shadow-2: rgba(6, 78, 59, 0.28);
		--hw-label: rgba(6, 78, 59, 0.85);
		--hw-num: #022c22;
		--hw-unit: rgba(2, 44, 34, 0.62);
		--hw-caption: rgba(6, 78, 59, 0.68);
		--hw-accent: #059669;
		--hw-accent-soft: rgba(5, 150, 105, 0.18);
	}
	.hw-tile-red {
		--hw-bg-start: #fff8f8;
		--hw-bg-end: #fecaca;
		--hw-tint-blob: rgba(251, 146, 60, 0.1);
		--hw-border: rgba(220, 38, 38, 0.26);
		--hw-shadow: rgba(220, 38, 38, 0.32);
		--hw-shadow-strong: rgba(220, 38, 38, 0.42);
		--hw-icon: #ef4444;
		--hw-icon-shadow: rgba(239, 68, 68, 0.45);
		--hw-icon-shadow-2: rgba(127, 29, 29, 0.28);
		--hw-label: rgba(127, 29, 29, 0.85);
		--hw-num: #450a0a;
		--hw-unit: rgba(69, 10, 10, 0.62);
		--hw-caption: rgba(127, 29, 29, 0.68);
		--hw-accent: #dc2626;
		--hw-accent-soft: rgba(220, 38, 38, 0.18);
	}

	.hw-bg {
		position: absolute;
		right: -18px;
		bottom: -20px;
		width: 150px;
		height: 150px;
		color: var(--hw-icon);
		pointer-events: none;
		filter:
			drop-shadow(0 10px 20px var(--hw-icon-shadow))
			drop-shadow(0 3px 6px var(--hw-icon-shadow-2));
		transform: rotate(-10deg);
		z-index: 0;
	}
	.hw-bg svg {
		width: 100%;
		height: 100%;
	}

	.hw-body {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.hw-label {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 1.2px;
		text-transform: uppercase;
		color: var(--hw-label);
	}
	.hw-num-row {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
	}
	.hw-num {
		font-size: 46px;
		font-weight: 800;
		color: var(--hw-num);
		letter-spacing: -1.6px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}
	.hw-unit {
		font-size: 14px;
		font-weight: 700;
		color: var(--hw-unit);
	}
	.hw-caption {
		font-size: 12.5px;
		font-weight: 600;
		color: var(--hw-caption);
		letter-spacing: 0.1px;
	}

	/* Sparkline (Last hour) */
	.hw-spark {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: flex-end;
		gap: 4px;
		height: 44px;
		max-width: 50%;
	}
	.hw-bar {
		flex: 1;
		min-height: 6px;
		border-radius: 3px;
		background: linear-gradient(180deg, rgba(234, 179, 8, 0.5), rgba(217, 119, 6, 0.55));
		transition: height 300ms ${T.ease};
	}
	.hw-bar.now {
		background: linear-gradient(180deg, #facc15 0%, #d97706 100%);
		box-shadow: 0 0 12px rgba(234, 179, 8, 0.55);
	}

	/* ---- Day timeline (Today) ---- */
	.hw-day {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.hw-day-time {
		align-self: center;
		font-size: 28px;
		font-weight: 700;
		color: var(--hw-num);
		letter-spacing: -0.9px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		display: inline-flex;
		align-items: baseline;
	}
	.hw-day-colon {
		color: var(--hw-accent);
		margin: 0 2px;
		animation: ${softBlink} 1.4s ease-in-out infinite;
	}
	@media (prefers-reduced-motion: reduce) {
		.hw-day-colon {
			animation: none;
		}
	}
	.hw-day-track {
		position: relative;
		height: 14px;
		border-radius: 999px;
		background: ${T.subtleBg};
		border: 1px solid ${T.border};
		overflow: hidden;
	}
	.hw-day-fill {
		position: relative;
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--hw-icon) 0%, var(--hw-accent) 100%);
		box-shadow:
			0 0 16px var(--hw-shadow),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		transition: width 600ms ${T.ease};
		overflow: hidden;
	}
	.hw-day-shine {
		position: absolute;
		top: 0;
		left: 0;
		width: 25%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 100%
		);
		animation: ${shimmer} 2.6s linear infinite;
		will-change: transform;
	}
	@media (prefers-reduced-motion: reduce) {
		.hw-day-shine {
			animation: none;
		}
	}
	.hw-day-mark {
		position: absolute;
		top: 50%;
		width: 2px;
		height: 6px;
		background: rgba(15, 23, 42, 0.14);
		border-radius: 999px;
		transform: translate(-50%, -50%);
		pointer-events: none;
	}

	/* ---- Percent bar with dynamic tone (Analyzed, Alerts) ---- */
	.hw-tone-good {
		--hw-tone-a: #22c55e;
		--hw-tone-b: #16a34a;
		--hw-tone-glow: rgba(22, 163, 74, 0.4);
	}
	.hw-tone-ok {
		--hw-tone-a: #2dd4bf;
		--hw-tone-b: #0d9488;
		--hw-tone-glow: rgba(13, 148, 136, 0.4);
	}
	.hw-tone-warn {
		--hw-tone-a: #fbbf24;
		--hw-tone-b: #d97706;
		--hw-tone-glow: rgba(217, 119, 6, 0.4);
	}
	.hw-tone-bad {
		--hw-tone-a: #f87171;
		--hw-tone-b: #dc2626;
		--hw-tone-glow: rgba(220, 38, 38, 0.4);
	}

	.hw-pct {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.hw-pct-num {
		align-self: flex-start;
		font-size: 28px;
		font-weight: 800;
		color: var(--hw-tone-b);
		letter-spacing: -0.9px;
		line-height: 1;
		font-variant-numeric: tabular-nums;
		display: inline-flex;
		align-items: baseline;
		gap: 2px;
	}
	.hw-pct-sign {
		font-size: 16px;
		font-weight: 700;
		color: var(--hw-tone-b);
		margin-right: 8px;
	}
	.hw-pct-caption {
		font-size: 13px;
		font-weight: 600;
		color: var(--hw-caption);
		letter-spacing: 0;
		align-self: center;
	}
	.hw-pct-track {
		position: relative;
		height: 14px;
		border-radius: 999px;
		background: ${T.subtleBg};
		border: 1px solid ${T.border};
		overflow: hidden;
	}
	.hw-pct-fill {
		position: relative;
		display: block;
		height: 100%;
		border-radius: 999px;
		background: linear-gradient(90deg, var(--hw-tone-a) 0%, var(--hw-tone-b) 100%);
		box-shadow:
			0 0 16px var(--hw-tone-glow),
			inset 0 1px 0 rgba(255, 255, 255, 0.35);
		transition:
			width 600ms ${T.ease},
			background 300ms ${T.ease},
			box-shadow 300ms ${T.ease};
		overflow: hidden;
	}
	.hw-pct-shine {
		position: absolute;
		top: 0;
		left: 0;
		width: 25%;
		height: 100%;
		background: linear-gradient(
			90deg,
			transparent 0%,
			rgba(255, 255, 255, 0.55) 50%,
			transparent 100%
		);
		animation: ${shimmer} 2.6s linear infinite;
		will-change: transform;
	}
	@media (prefers-reduced-motion: reduce) {
		.hw-pct-shine {
			animation: none;
		}
	}

	.wh-hero-tiles {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 14px;

		@media (max-width: 1180px) {
			grid-template-columns: repeat(2, 1fr);
		}
		@media (max-width: 560px) {
			grid-template-columns: 1fr;
		}
	}

`
