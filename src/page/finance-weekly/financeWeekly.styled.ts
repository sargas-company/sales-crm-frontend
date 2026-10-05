import styled, { keyframes, css } from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'

const popIn = keyframes`
	from { opacity: 0; transform: scale(0.96); filter: blur(4px); }
	to   { opacity: 1; transform: scale(1);    filter: blur(0); }
`

const popOut = keyframes`
	from { opacity: 1; transform: scale(1);    filter: blur(0); }
	to   { opacity: 0; transform: scale(0.96); filter: blur(4px); }
`

const popSuccessOut = keyframes`
	0%   { opacity: 1; transform: scale(1)    translateY(0);   filter: blur(0); }
	40%  { opacity: 1; transform: scale(1.03) translateY(0);   filter: blur(0); }
	100% { opacity: 0; transform: scale(1.06) translateY(-6px); filter: blur(3px); }
`

const spin = keyframes`
	to { transform: rotate(360deg); }
`

const checkDraw = keyframes`
	from { stroke-dashoffset: 24; }
	to   { stroke-dashoffset: 0; }
`

const successPulse = keyframes`
	0%   { transform: scale(1); }
	40%  { transform: scale(1.08); }
	100% { transform: scale(1); }
`

const successWave = keyframes`
	0%   { transform: scale(0.4); opacity: 0.55; }
	100% { transform: scale(3.5); opacity: 0; }
`

const halo = keyframes`
	0%, 100% { transform: scale(1); opacity: 0.55; }
	50%      { transform: scale(1.4); opacity: 0; }
`

const rowIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

const inscriptionIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const squiggleDraw = keyframes`
	0% { stroke-dashoffset: 260; }
	60%, 100% { stroke-dashoffset: 0; }
`

const iconWiggle = keyframes`
	0%, 100% { transform: rotate(0); }
	25% { transform: rotate(-10deg); }
	75% { transform: rotate(10deg); }
`

/* ─── Header right block (inscription + month nav) ───────────────── */

export const HeaderRight = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 22px;
`

export const Inscription = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-style: italic;
	font-size: 28px;
	font-weight: 500;
	line-height: 1;
	letter-spacing: -0.6px;
	white-space: nowrap;
	animation: ${inscriptionIn} 500ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (max-width: 720px) {
		font-size: 22px;
	}
`

export const InsciMuted = styled.span`
	color: ${T.textStrong};
	opacity: 0.85;
`

export const InsciAccent = styled.span`
	position: relative;
	display: inline-block;
	color: #d97706;
	font-weight: 700;
	font-style: italic;
	padding-bottom: 4px;
`

export const InsciSquiggle = styled.svg`
	position: absolute;
	left: 0;
	right: 0;
	bottom: -4px;
	width: 100%;
	height: 10px;
	color: #d97706;
	stroke-dasharray: 260;
	animation: ${squiggleDraw} 1.6s cubic-bezier(0.22, 1, 0.36, 1) 300ms both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		stroke-dashoffset: 0;
	}
`

export const InsciDot = styled.span`
	color: ${T.textStrong};
	font-weight: 700;
	margin-left: -6px;
`

/* Hero-variant inscription — for use on the dark blue HeroBlock. */

export const HeroInscription = styled(Inscription)`
	font-size: 26px;

	@media (max-width: 720px) {
		font-size: 20px;
	}
`

export const HeroInsciMuted = styled(InsciMuted)`
	color: #ffffff;
	opacity: 0.9;
`

export const HeroInsciAccent = styled(InsciAccent)`
	color: #fbbf24;
`

export const HeroInsciSquiggle = styled(InsciSquiggle)`
	color: #fbbf24;
`

export const HeroInsciDot = styled(InsciDot)`
	color: #ffffff;
`

export const HeaderFilterRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
`

export const MonthIconWrap = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: center;
`

export const MonthBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 9px;
	padding: 0 18px;
	height: 44px;
	box-sizing: border-box;
	border-radius: 999px;
	border: 1.5px solid ${T.primary};
	background: #ffffff;
	color: ${T.primary};
	font: inherit;
	font-size: 13.5px;
	font-weight: 600;
	line-height: 1;
	cursor: pointer;
	text-transform: none;
	white-space: nowrap;
	flex-shrink: 0;
	transition:
		background 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		transform: translateY(-1px);
	}

	&:hover ${MonthIconWrap} {
		animation: ${iconWiggle} 620ms ease-in-out;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover ${MonthIconWrap} {
			animation: none;
		}
	}
`

export const MonthLabel = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;
`

export const MonthRange = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 12px;
	color: ${T.primary};
	opacity: 0.7;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.2px;
`

export const NavArrow = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	height: 44px;
	border-radius: 999px;
	border: 1.5px solid ${T.divider};
	background: #ffffff;
	color: ${T.textSecondary};
	cursor: pointer;
	transition:
		border-color 160ms ease,
		color 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover:not(:disabled) {
		border-color: ${T.primary};
		color: ${T.primary};
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	svg {
		font-size: 22px;
	}
`

/* ─── Hero KPI ───────────────────────────────────────────────────── */

export const HeroBlock = styled.div`
	padding: 24px 26px;
	border-radius: 16px;
	background: linear-gradient(135deg, ${T.primary}, #075985);
	color: #ffffff;
	box-shadow: 0 8px 24px rgba(3, 105, 161, 0.2);
	position: relative;
	overflow: hidden;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		background: radial-gradient(circle at 90% -20%, rgba(255, 255, 255, 0.18), transparent 55%);
		pointer-events: none;
	}
`

export const HeroTopRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
	position: relative;
	z-index: 1;
`

const slideFromRight = keyframes`
	0%   { opacity: 0; transform: translateX(28px); filter: blur(4px); }
	100% { opacity: 1; transform: translateX(0);    filter: blur(0); }
`

const slideFromLeft = keyframes`
	0%   { opacity: 0; transform: translateX(-28px); filter: blur(4px); }
	100% { opacity: 1; transform: translateX(0);     filter: blur(0); }
`

const peekFade = keyframes`
	0%   { opacity: 0; transform: translateY(3px); }
	100% { opacity: 1; transform: translateY(0); }
`

const centerPop = keyframes`
	0%   { opacity: 0; transform: scale(0.94); filter: blur(5px); }
	60%  { opacity: 1; filter: blur(0); transform: scale(1.02); }
	100% { opacity: 1; transform: scale(1); filter: blur(0); }
`

export const MonthPeekBar = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 32px;
	color: #ffffff;
`

export const MonthPeekBtn = styled.button<{ $right?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	background: transparent;
	border: 0;
	color: rgba(255, 255, 255, 0.55);
	cursor: pointer;
	font: inherit;
	font-size: 14px;
	font-weight: 500;
	padding: 4px 0;
	transition:
		color 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover:not(:disabled) {
		color: #ffffff;
		transform: ${(p) => (p.$right ? 'translateX(2px)' : 'translateX(-2px)')};
	}
	&:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.chev {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.28);
		background: rgba(255, 255, 255, 0.06);
		transition:
			background 160ms ease,
			border-color 160ms ease;
	}
	.chev svg {
		font-size: 18px;
	}
	&:hover:not(:disabled) .chev {
		background: rgba(255, 255, 255, 0.18);
		border-color: rgba(255, 255, 255, 0.5);
	}
	.name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	}
`

export const MonthPeekCenter = styled.div<{ $dir: 'prev' | 'next' | null }>`
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	animation: ${({ $dir }) =>
			$dir === 'prev' ? slideFromLeft : $dir === 'next' ? slideFromRight : centerPop}
		420ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	.label {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.6px;
		color: #ffffff;
		text-transform: uppercase;
	}
	.range {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.65);
		margin-top: 2px;
	}
`

export const MonthPeekNameAnim = styled.span`
	display: inline-block;
	animation: ${peekFade} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

export const HeroLabel = styled.div`
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.7px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.85);
	margin-bottom: 4px;
`

export const HeroValue = styled.div`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 36px;
	font-weight: 700;
	letter-spacing: -0.9px;
	line-height: 1.05;
`

export const HeroCountBadge = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	padding: 6px 12px 6px 10px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(4px);

	.n {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.4px;
	}
	.lbl {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: rgba(255, 255, 255, 0.75);
	}
`

export const HeroLegend = styled.div`
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 16px;
	margin-top: 20px;
	padding-top: 18px;
	border-top: 1px solid rgba(255, 255, 255, 0.18);
	position: relative;
	z-index: 1;

	@media (max-width: 900px) {
		grid-template-columns: repeat(2, 1fr);
	}
`

export const HeroLegendItem = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
	position: relative;

	& + &::before {
		content: '';
		position: absolute;
		left: -8px;
		top: 4px;
		bottom: 4px;
		width: 1px;
		background: rgba(255, 255, 255, 0.16);
	}
`

export const HeroLegendLabel = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.7px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.88);
`

export const HeroLegendValue = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-size: 18px;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: -0.3px;
	line-height: 1.15;
`

export const HeroLegendCount = styled.span`
	font-size: 11.5px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.6);
`

/* ─── Predictions summary card ───────────────────────────────────── */

export const SummaryCard = styled.div`
	background: #ffffff;
	border: 1px solid ${T.divider};
	border-radius: 16px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 8px 24px rgba(15, 23, 42, 0.06);
	overflow: hidden;
`

export const SumHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18px;
	padding: 16px 20px;
	background: ${T.subtleBg};
	border-bottom: 1px solid ${T.divider};
`

export const SumTitleWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

export const SumEyebrow = styled.span`
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.6px;
	text-transform: uppercase;
	color: ${T.warning};
	display: inline-flex;
	align-items: center;
	gap: 6px;

	.pulse {
		width: 6px;
		height: 6px;
		background: ${T.warning};
		border-radius: 50%;
		position: relative;
	}
	.pulse::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: ${T.warning};
		animation: ${halo} 2s ease-in-out infinite;
	}
`

export const SumTitle = styled.h3`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 18px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.4px;
	margin: 0;
`

export const SumTotal = styled.div`
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 2px;

	.lbl {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: ${T.textMuted};
	}
	.val {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 20px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
	}
`

export const ForecastList = styled.div`
	display: flex;
	flex-direction: column;
`

export const ForecastRow = styled.div<{ $index: number }>`
	display: grid;
	grid-template-columns: 130px 1fr auto auto;
	gap: 20px;
	align-items: center;
	padding: 12px 20px;
	border-bottom: 1px solid ${T.divider};
	animation: ${rowIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${(p) => Math.min(p.$index, 12) * 40}ms;

	&:last-child {
		border-bottom: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	.date {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: ${T.textStrong};
		letter-spacing: -0.2px;
	}
	.tags {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.tag {
		display: inline-flex;
		align-items: center;
		padding: 3px 10px;
		border-radius: 999px;
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.amt {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 15px;
		color: ${T.textStrong};
		letter-spacing: -0.3px;
	}
	.cum {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 11.5px;
		color: ${T.textMuted};
		white-space: nowrap;
	}

	@media (max-width: 700px) {
		grid-template-columns: auto auto;
		row-gap: 4px;
		.tags {
			grid-column: 1 / -1;
		}
	}
`

export const ForecastEmpty = styled.div`
	padding: 40px 24px 44px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 14px;
	color: ${T.textSecondary};

	.icon-wrap {
		position: relative;
		width: 68px;
		height: 68px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
	.icon-wrap svg {
		font-size: 34px;
		color: #b8874a;
		position: relative;
		z-index: 1;
	}
	.icon-wrap .halo {
		position: absolute;
		inset: 6px;
		border-radius: 50%;
		border: 1.5px dashed rgba(184, 135, 74, 0.5);
		animation: ${spin} 14s linear infinite;
	}
	.text {
		text-align: center;
		max-width: 320px;
		line-height: 1.5;
	}
	.text .title {
		display: block;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 15px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.3px;
		margin-bottom: 4px;
	}
	.text .hint {
		font-size: 12.5px;
		color: ${T.textSecondary};
	}

	@media (prefers-reduced-motion: reduce) {
		.icon-wrap .halo {
			animation: none;
		}
	}
`

/* ─── Grid card ──────────────────────────────────────────────────── */

export const GridCard = styled.div`
	background: #ffffff;
	border: 1px solid ${T.divider};
	border-radius: ${T.radius};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 8px 24px rgba(15, 23, 42, 0.06);
	overflow: hidden;
`

export const GridCardHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 18px;
	padding: 16px 20px;
	background: ${T.subtleBg};
	border-bottom: 1px solid ${T.divider};
	flex-wrap: wrap;

	.title-row {
		display: inline-flex;
		align-items: center;
		gap: 18px;
		flex-wrap: wrap;
		min-width: 0;
	}
	h3 {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 18px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
		margin: 0;
		white-space: nowrap;
	}
	.hint {
		font-size: 11.5px;
		color: ${T.textSecondary};
	}
`

export const LegendInline = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 18px;
	flex-wrap: wrap;
	padding-left: 18px;
	border-left: 1px solid ${T.divider};

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 500;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: #0f172a;
	}
	.chip .dot {
		position: relative;
		width: 13px;
		height: 13px;
		border-radius: 50%;
		background: var(--c);
		box-shadow:
			0 0 0 3px color-mix(in srgb, var(--c) 24%, transparent),
			inset 0 0 0 1.5px rgba(255, 255, 255, 0.45),
			inset 0 -1px 2px rgba(0, 0, 0, 0.14);
	}
	.chip .dot::after {
		content: '';
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		background: var(--c);
		animation: ${halo} 2.2s ease-in-out infinite;
	}

	@media (prefers-reduced-motion: reduce) {
		.chip .dot::after {
			animation: none;
		}
	}
`

export const GridScroll = styled.div`
	overflow: auto;
	max-width: 100%;
	border-radius: 0;
`

export const GridTable = styled.table`
	width: 100%;
	border-collapse: separate;
	border-spacing: 0;
	font-size: 13px;
	border-radius: 0;

	th,
	td {
		border-radius: 0;
	}

	thead th {
		position: sticky;
		top: 0;
		background: ${T.cardBg};
		border-bottom: 1px solid rgba(15, 23, 42, 0.28);
		border-right: 1px solid rgba(15, 23, 42, 0.28);
		text-align: left;
		padding: 12px 12px;
		font-weight: 600;
		font-size: 11.5px;
		color: ${T.textSecondary};
		text-transform: uppercase;
		letter-spacing: 0.4px;
		z-index: 2;
		white-space: nowrap;
	}
	thead th:last-child {
		border-right: 0;
	}
	thead th.project-col {
		left: 0;
		position: sticky;
		z-index: 3;
		background: ${T.cardBg};
		min-width: 240px;
		border-right: 0;
		box-shadow: 1px 0 0 rgba(15, 23, 42, 0.28);
	}
	thead th .week-label {
		display: block;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-variation-settings: 'opsz' 32;
		text-transform: none;
		letter-spacing: -0.3px;
		color: ${T.textStrong};
		font-size: 15px;
		margin-top: 4px;
		font-weight: 700;
	}
	tbody tr {
		height: 1px;
	}
	tbody td {
		border-bottom: 1px solid rgba(15, 23, 42, 0.28);
		border-right: 1px solid rgba(15, 23, 42, 0.28);
		padding: 0;
		vertical-align: middle;
		height: inherit;
	}
	tbody td:last-child {
		border-right: 0;
	}
	tbody td.project-col {
		position: sticky;
		left: 0;
		background: ${T.cardBg};
		padding: 12px 14px;
		border-right: 0;
		box-shadow: 1px 0 0 rgba(15, 23, 42, 0.28);
		z-index: 1;
	}
	tbody tr:hover td.project-col {
		background: ${T.subtleBg};
	}
	tbody td.project-col .name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-weight: 500;
		color: ${T.textStrong};
		font-size: 15px;
		letter-spacing: -0.3px;
	}
	tbody td.project-col .client {
		font-size: 11.5px;
		color: ${T.textSecondary};
		margin-top: 2px;
	}
	tfoot td {
		background: ${T.cardBg};
		font-weight: 700;
		padding: 12px 12px;
		border-top: 1px solid rgba(15, 23, 42, 0.28);
		border-right: 1px solid rgba(15, 23, 42, 0.28);
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		color: ${T.textStrong};
	}
	tfoot td:last-child {
		border-right: 0;
	}
	tfoot td.project-col {
		position: sticky;
		left: 0;
		background: ${T.cardBg};
		border-right: 0;
		box-shadow: 1px 0 0 rgba(15, 23, 42, 0.28);
		text-align: right;
		color: ${T.textMuted};
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
`

export const Cell = styled('button')<{ $bg: string; $fg: string; $empty: boolean }>`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 3px;
	width: 100%;
	height: 100%;
	min-width: 116px;
	min-height: 58px;
	padding: 8px 12px;
	border: 0;
	border-radius: 0;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	font-family: inherit;
	cursor: pointer;
	transition: all 140ms ease;
	text-align: center;
	box-sizing: border-box;

	${(p) =>
		p.$empty &&
		css`
			background: transparent;
			color: ${T.textMuted};
		`}

	&:hover {
		filter: brightness(0.96);
		box-shadow: inset 0 0 0 2px rgba(3, 105, 161, 0.35);
	}
	.amt {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 14px;
		letter-spacing: -0.2px;
	}
	.st {
		font-size: 13px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.4px;
		opacity: 0.85;
	}
	.placeholder {
		font-size: 20px;
		color: ${T.textMuted};
		font-weight: 300;
	}
`

/* ─── Cell editor popover ────────────────────────────────────────── */

export const PopoverShell = styled.div<{
	$closing?: boolean
	$closingKind?: 'cancel' | 'success'
	$flip?: boolean
}>`
	position: fixed;
	z-index: 1000;
	background: white;
	border: 1px solid ${T.divider};
	border-radius: 18px;
	box-shadow:
		0 20px 40px -20px rgba(15, 23, 42, 0.35),
		0 4px 8px rgba(15, 23, 42, 0.08);
	width: 480px;
	display: flex;
	transform-origin: ${(p) => (p.$flip ? 'top center' : 'bottom center')};
	overflow: hidden;
	animation: ${(p) =>
		p.$closing
			? p.$closingKind === 'success'
				? css`
						${popSuccessOut} 420ms cubic-bezier(0.22, 1, 0.36, 1) both
					`
				: css`
						${popOut} 220ms cubic-bezier(0.4, 0, 0.6, 1) both
					`
			: css`
					${popIn} 260ms cubic-bezier(0.22, 1, 0.36, 1) both
				`};

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		opacity: ${(p) => (p.$closing ? 0 : 1)};
	}

	@media (max-width: 560px) {
		width: min(94vw, 480px);
		flex-direction: column;
	}

	.success-wave {
		position: absolute;
		left: 50%;
		bottom: 42px;
		width: 60px;
		height: 60px;
		margin-left: -30px;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(22, 163, 74, 0.45) 0%, rgba(22, 163, 74, 0) 70%);
		pointer-events: none;
		transform: scale(0.4);
		opacity: 0;
	}
	&.success-wave-on .success-wave {
		animation: ${successWave} 600ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}
`

export const PopoverLeft = styled.aside<{ $bg: string; $fg: string }>`
	width: 168px;
	min-width: 168px;
	background: ${(p) => p.$bg};
	color: ${(p) => p.$fg};
	padding: 22px 20px;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 20px;
	transition:
		background 260ms cubic-bezier(0.22, 1, 0.36, 1),
		color 260ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (max-width: 560px) {
		width: 100%;
		min-width: 0;
		padding: 16px 18px;
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.eyebrow {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.75px;
		opacity: 0.7;
	}
	.proj {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.4px;
		line-height: 1.15;
		margin-top: 4px;
		overflow-wrap: break-word;
	}
	.week {
		font-family: 'JetBrains Mono', monospace;
		font-size: 11.5px;
		opacity: 0.7;
		margin-top: 18px;
	}
	.amount-big {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 22px;
		font-weight: 700;
		letter-spacing: -0.5px;
		margin-top: 8px;
		line-height: 1;
	}
`

export const PopoverRight = styled.div`
	flex: 1;
	padding: 18px 20px;
	display: flex;
	flex-direction: column;
	min-width: 0;

	label {
		display: flex;
		align-items: baseline;
		flex-wrap: wrap;
		gap: 6px;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.6px;
		color: ${T.textMuted};
		margin: 10px 0 6px;
		transition: color 220ms ${T.ease};
	}
	label:first-child {
		margin-top: 0;
	}
	label .req {
		color: ${T.error};
		font-weight: 800;
		animation: cellReqIn 260ms cubic-bezier(0.22, 1.35, 0.36, 1) both;
	}
	label .hint {
		font-size: 10.5px;
		font-weight: 500;
		text-transform: none;
		letter-spacing: 0;
		color: ${T.error};
		margin-left: 2px;
		animation: cellHintIn 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes cellReqIn {
		from {
			opacity: 0;
			transform: translateY(-2px) scale(0.7);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}
	@keyframes cellHintIn {
		from {
			opacity: 0;
			transform: translateY(-3px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		label .req,
		label .hint {
			animation: none;
		}
	}
	.statuses {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.st-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		border: 0;
		background: transparent;
		padding: 7px 10px;
		border-radius: 8px;
		font-size: 12.5px;
		font-weight: 500;
		color: #0f172a;
		cursor: pointer;
		transition:
			background 160ms ease,
			color 160ms ease;
		font-family: inherit;
		text-align: left;
	}
	.st-btn:hover {
		background: rgba(15, 23, 42, 0.04);
	}
	.st-btn.active {
		font-weight: 600;
	}
	.st-btn:focus {
		outline: none;
	}
	.st-btn::-moz-focus-inner {
		border: 0;
	}
	.st-btn .dot {
		position: relative;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		box-shadow:
			0 0 0 2px rgba(15, 23, 42, 0.08),
			inset 0 0 0 1.5px rgba(255, 255, 255, 0.4),
			inset 0 -1px 2px rgba(0, 0, 0, 0.18);
	}
	input[type='text'],
	textarea {
		width: 100%;
		padding: 8px 10px;
		border: 0;
		border-radius: 8px;
		font-size: 12.5px;
		font-family: inherit;
		background: ${T.subtleBg};
		color: ${T.textStrong};
		outline: 0;
		box-sizing: border-box;
		box-shadow: inset 0 0 0 1px ${T.divider};
		transition:
			background 260ms ${T.ease},
			box-shadow 240ms ${T.ease},
			transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	input[type='text']:hover,
	textarea:hover {
		background: white;
		box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.14);
	}
	input[type='text']:focus,
	textarea:focus {
		background: white;
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}
	input[type='text'][data-invalid='true'] {
		background: white;
		box-shadow: 0 0 0 4px rgba(201, 75, 75, 0.14);
		animation: cellInvalidIn 320ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	input[type='text'][data-invalid='true']:focus {
		box-shadow: 0 0 0 4px rgba(201, 75, 75, 0.22);
	}
	input[type='text'].shake {
		animation: cellShake 340ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
	}

	@keyframes cellInvalidIn {
		from {
			box-shadow: 0 0 0 0 rgba(201, 75, 75, 0);
		}
	}
	@keyframes cellShake {
		10%, 90% { transform: translateX(-1px); }
		20%, 80% { transform: translateX(2px); }
		30%, 50%, 70% { transform: translateX(-3px); }
		40%, 60% { transform: translateX(3px); }
	}
	@media (prefers-reduced-motion: reduce) {
		input[type='text'][data-invalid='true'],
		input[type='text'].shake {
			animation: none;
		}
	}
	textarea {
		resize: vertical;
		min-height: 46px;
		background: transparent;
	}
	textarea:hover,
	textarea:focus {
		background: transparent;
	}

	/* Amount section collapse — smoothly hides label + input when the
	   status doesn't support amount, so the popup grows/shrinks in place
	   instead of snapping. amt-inner needs overflow:hidden for the
	   grid-template-rows trick, and negative side margins + padding so the
	   input's invalid-state shadow-glow doesn't get clipped. */
	.amt-collapse {
		display: grid;
		grid-template-rows: 1fr;
		transition:
			grid-template-rows 280ms cubic-bezier(0.22, 1, 0.36, 1),
			opacity 220ms ease;
		opacity: 1;
		margin: 0 -6px;
	}
	.amt-collapse[data-open='false'] {
		grid-template-rows: 0fr;
		opacity: 0;
		pointer-events: none;
	}
	.amt-collapse > .amt-inner {
		min-height: 0;
		overflow: hidden;
		padding: 6px 6px;
	}

	@media (prefers-reduced-motion: reduce) {
		.amt-collapse {
			transition: none;
		}
	}
	.actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 6px;
		margin-top: 14px;
	}
	.actions button.save {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: ${T.primary};
		color: white;
		border: 0;
		height: 36px;
		min-width: 92px;
		padding: 0 18px;
		border-radius: 10px;
		font-weight: 700;
		cursor: pointer;
		font-size: 13px;
		box-shadow: 0 2px 6px rgba(3, 105, 161, 0.22);
		transition:
			min-width 300ms cubic-bezier(0.22, 1, 0.36, 1),
			padding 240ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 120ms ease,
			box-shadow 200ms ease,
			background 260ms ease,
			border-radius 300ms ease,
			opacity 260ms ease;
		overflow: hidden;
	}
	.actions button.save:hover:not(:disabled) {
		background: #027cc0;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(3, 105, 161, 0.28);
	}
	.actions button.save:disabled {
		cursor: not-allowed;
	}
	.actions button.save:disabled:not(.saving):not(.success) {
		opacity: 0.5;
	}
	.actions button.save.saving,
	.actions button.save.success {
		min-width: 36px;
		padding: 0;
		border-radius: 999px;
		width: 36px;
	}
	.actions button.save.success {
		background: #16a34a;
		box-shadow: 0 6px 20px rgba(22, 163, 74, 0.38);
		animation: ${successPulse} 520ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}
	.actions button.save .label {
		transition: opacity 140ms ease;
	}
	.actions button.save.saving .label,
	.actions button.save.success .label {
		opacity: 0;
		width: 0;
		overflow: hidden;
	}
	.actions button.save .spinner {
		position: absolute;
		inset: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 140ms ease;
	}
	.actions button.save.saving .spinner {
		opacity: 1;
	}
	.actions button.save .spinner::before {
		content: '';
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.35);
		border-top-color: #ffffff;
		border-radius: 50%;
		animation: ${spin} 720ms linear infinite;
	}
	.actions button.save .check {
		position: absolute;
		inset: 0;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition: opacity 100ms ease 60ms;
	}
	.actions button.save.success .check {
		opacity: 1;
	}
	.actions button.save .check svg {
		width: 20px;
		height: 20px;
		overflow: visible;
	}
	.actions button.save .check svg path {
		fill: none;
		stroke: #ffffff;
		stroke-width: 2.8;
		stroke-linecap: round;
		stroke-linejoin: round;
		stroke-dasharray: 24;
		stroke-dashoffset: 24;
	}
	.actions button.save.success .check svg path {
		animation: ${checkDraw} 380ms cubic-bezier(0.22, 1, 0.36, 1) 80ms forwards;
	}
	.actions button.cancel {
		background: transparent;
		color: ${T.textSecondary};
		border: 0;
		padding: 8px 12px;
		font-weight: 600;
		cursor: pointer;
		font-size: 13px;
	}
	.actions button.delete {
		background: transparent;
		color: #b91c1c;
		border: 0;
		padding: 8px 10px;
		font-weight: 600;
		cursor: pointer;
		font-size: 12px;
	}
`

/* ─── Grid v2 — time-off / posts-calendar inspired ─────────────── */

const cellFillIn = keyframes`
	from { opacity: 0; transform: scale(0.85); }
	to   { opacity: 1; transform: scale(1); }
`

export const GridScroller = styled.div`
	overflow-x: auto;
	overflow-y: hidden;
	border-radius: 16px;
	background: #ffffff;
	box-shadow:
		inset 0 0 0 1px rgba(15, 23, 42, 0.06),
		0 1px 2px rgba(15, 23, 42, 0.02);
	-webkit-overflow-scrolling: touch;
	overscroll-behavior-x: contain;

	&::-webkit-scrollbar {
		height: 10px;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 999px;
		border: 2px solid transparent;
		background-clip: padding-box;
		transition: background 220ms ease;
	}
	scrollbar-color: transparent transparent;
	scrollbar-width: thin;

	&:hover,
	&:focus-within {
		&::-webkit-scrollbar-thumb {
			background: rgba(3, 105, 161, 0.35);
			background-clip: padding-box;
		}
		scrollbar-color: rgba(3, 105, 161, 0.35) transparent;
	}
	&::-webkit-scrollbar-thumb:hover {
		background: ${T.primary};
		background-clip: padding-box;
	}
`

const rowEnterAnim = keyframes`
	0% {
		opacity: 0;
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-top-width: 0;
		border-bottom-width: 0;
		transform: scaleX(0.4);
		transform-origin: left center;
	}
	60% {
		opacity: 1;
	}
	100% {
		opacity: 1;
		max-height: 200px;
		transform: scaleX(1);
	}
`

const rowExitAnim = keyframes`
	0% {
		opacity: 1;
		max-height: 200px;
		padding-top: 10px;
		padding-bottom: 10px;
		border-top-width: 1px;
		border-bottom-width: 1px;
		transform: scaleX(1);
		transform-origin: right center;
	}
	40% {
		opacity: 0;
		transform: scaleX(0.2);
	}
	100% {
		opacity: 0;
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-top-width: 0;
		border-bottom-width: 0;
		transform: scaleX(0.2);
	}
`

export const GridChart = styled.div`
	display: grid;
	position: relative;
	background: #ffffff;
	min-width: 100%;
	width: max-content;
`

export const RowBody = styled.div<{ $leaving?: boolean }>`
	display: contents;

	& > * {
		box-sizing: border-box !important;
		overflow: hidden !important;
		min-height: 0 !important;
		animation: ${(p) =>
			p.$leaving
				? css`
						${rowExitAnim} 520ms cubic-bezier(0.4, 0, 0.6, 1) both
					`
				: css`
						${rowEnterAnim} 480ms cubic-bezier(0.22, 1, 0.36, 1) both
					`} !important;
		${(p) =>
			p.$leaving &&
			css`
				pointer-events: none;
			`}
	}

	@media (prefers-reduced-motion: reduce) {
		& > * {
			animation: none !important;
		}
	}
`

export const GridCurrentCol = styled.div`
	background: rgba(3, 105, 161, 0.06);
	z-index: 0;
	pointer-events: none;
`

export const GridHeaderCorner = styled.div`
	position: sticky;
	left: 0;
	top: 0;
	z-index: 6;
	background: #fbfaff;
	padding: 12px 18px;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-variation-settings: 'opsz' 32;
	font-size: 14.5px;
	font-weight: 500;
	color: #0f172a;
	letter-spacing: -0.3px;
	display: flex;
	align-items: center;
	min-width: 240px;
	box-shadow:
		1px 0 0 rgba(15, 23, 42, 0.08),
		0 1px 0 rgba(15, 23, 42, 0.08);
`

export const GridHeaderWeek = styled.div<{ $current?: boolean }>`
	position: sticky;
	top: 0;
	z-index: 4;
	background: ${(p) => (p.$current ? '#e6f0fa' : '#fbfaff')};
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 10px 8px;
	box-shadow: ${(p) =>
		p.$current
			? 'inset -1px 0 0 rgba(15, 23, 42, 0.1), 0 2px 0 rgba(3, 105, 161, 0.45)'
			: 'inset -1px 0 0 rgba(15, 23, 42, 0.1), 0 1px 0 rgba(15, 23, 42, 0.12)'};
	overflow: hidden;

	.wk {
		font-size: 10px;
		color: ${T.textSecondary};
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.dates {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-size: 12.5px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.2px;
		margin-top: 2px;
	}
`

export const GridHeaderTotal = styled(GridHeaderWeek)`
	background: #dceaf5;
	padding: 12px 14px;
	flex-direction: row;
	align-items: center;
	justify-content: center;
	text-align: center;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-variation-settings: 'opsz' 32;
	font-size: 14.5px;
	font-weight: 500;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
	text-transform: none;
	box-shadow:
		inset 2px 0 0 rgba(3, 105, 161, 0.28),
		inset -1px 0 0 rgba(15, 23, 42, 0.1),
		0 1px 0 rgba(15, 23, 42, 0.12);
`

export const GridProjectCell = styled.div`
	position: sticky;
	left: 0;
	z-index: 3;
	background: #ffffff;
	padding: 10px 14px 10px 18px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 10px;
	min-width: 240px;
	box-shadow:
		1px 0 0 rgba(15, 23, 42, 0.08),
		inset 0 -1px 0 rgba(15, 23, 42, 0.06);

	.body {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.name {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 14.5px;
		font-weight: 600;
		color: ${T.textStrong};
		line-height: 1.2;
		letter-spacing: -0.3px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.client {
		font-size: 11px;
		color: ${T.textSecondary};
		line-height: 1.2;
	}
	.hide-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: 0;
		background: transparent;
		color: ${T.textMuted};
		cursor: pointer;
		opacity: 0;
		transform: translateX(4px);
		transition:
			opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 240ms cubic-bezier(0.22, 1, 0.36, 1),
			color 200ms ease;
		flex-shrink: 0;
	}
	.hide-btn svg {
		font-size: 17px;
		transition:
			transform 340ms cubic-bezier(0.22, 1.5, 0.36, 1),
			color 200ms ease;
	}
	.hide-btn:hover {
		color: #b74848;
	}
	.hide-btn:hover svg {
		transform: scale(1.18);
	}
	.hide-btn:active svg {
		transform: scale(0.9);
		transition-duration: 120ms;
	}
	&:hover .hide-btn {
		opacity: 1;
		transform: translateX(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.hide-btn,
		.hide-btn svg {
			transition: none;
			transform: none;
		}
	}
`

export const AddProjectAnchor = styled.div`
	position: relative;
	display: inline-flex;
`

export const AddProjectBtn = styled.button<{ $open?: boolean; $muted?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 14px 6px 12px;
	border-radius: 999px;
	border: 1.5px solid ${(p) => (p.$muted ? 'rgba(15, 23, 42, 0.12)' : T.primary)};
	background: ${(p) => (p.$muted ? 'rgba(15, 23, 42, 0.08)' : T.primary)};
	color: ${(p) => (p.$muted ? T.textMuted : '#ffffff')};
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: ${(p) => (p.$muted ? 'not-allowed' : 'pointer')};
	box-shadow: ${(p) => (p.$muted ? 'none' : '0 4px 12px -4px rgba(3, 105, 161, 0.35)')};
	transition:
		background 160ms ease,
		border-color 160ms ease,
		box-shadow 200ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	${(p) =>
		!p.$muted &&
		css`
			&:hover {
				transform: translateY(-1px);
			}
		`}

	svg {
		font-size: 16px;
		transition: transform 480ms cubic-bezier(0.22, 1.4, 0.36, 1);
		transform-origin: center;
	}
	${(p) =>
		!p.$muted &&
		css`
			&:hover svg {
				transform: rotate(180deg) scale(1.15);
			}
			&:active svg {
				transform: rotate(180deg) scale(1);
				transition-duration: 120ms;
			}
		`}
	${(p) =>
		p.$open &&
		css`
			svg {
				transform: rotate(45deg);
			}
			&:hover svg {
				transform: rotate(225deg) scale(1.15);
			}
		`}

	@media (prefers-reduced-motion: reduce) {
		svg,
		&:hover svg {
			transition: none;
			transform: none;
		}
	}
`

export const AddProjectMenu = styled.div`
	position: absolute;
	top: calc(100% + 6px);
	right: 0;
	z-index: 20;
	min-width: 240px;
	max-height: 320px;
	overflow-y: auto;
	background: #ffffff;
	border: 1px solid ${T.divider};
	border-radius: 12px;
	box-shadow:
		0 20px 40px -20px rgba(15, 23, 42, 0.25),
		0 4px 10px rgba(15, 23, 42, 0.06);
	padding: 6px;
	animation: ${keyframes`
		from { opacity: 0; transform: translateY(-6px) scale(0.98); }
		to   { opacity: 1; transform: translateY(0) scale(1); }
	`} 180ms cubic-bezier(0.22, 1, 0.36, 1) both;

	.empty {
		padding: 14px 16px;
		font-size: 12.5px;
		color: ${T.textSecondary};
		text-align: center;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 8px;
		border: 0;
		background: transparent;
		color: ${T.textStrong};
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		text-align: left;
		width: 100%;
		transition: background 140ms ease;
	}
	.row:hover {
		background: ${T.primaryTint};
		color: ${T.primary};
	}
	.row svg {
		font-size: 16px;
		color: ${T.textMuted};
		flex-shrink: 0;
	}
	.row:hover svg {
		color: ${T.primary};
	}
	.row .name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.row .client {
		font-size: 11px;
		color: ${T.textSecondary};
		font-weight: 400;
	}
`

export const HiddenProjectsBar = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
	padding: 12px 20px;
	background: #fbfaff;
	border-top: 1px solid rgba(15, 23, 42, 0.06);

	.head {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: ${T.textMuted};
	}
	.count {
		background: rgba(15, 23, 42, 0.08);
		border-radius: 999px;
		padding: 2px 8px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10.5px;
		font-weight: 700;
		color: ${T.textSecondary};
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 10px 5px 8px;
		border-radius: 999px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		background: #ffffff;
		color: ${T.textStrong};
		font: inherit;
		font-size: 12px;
		font-weight: 500;
		cursor: pointer;
		transition:
			border-color 160ms ease,
			background 160ms ease,
			transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.chip svg {
		font-size: 15px;
		color: ${T.textMuted};
		transition: color 160ms ease;
	}
	.chip:hover {
		border-color: ${T.primary};
		background: ${T.primaryTint};
		color: ${T.primary};
		transform: translateY(-1px);
	}
	.chip:hover svg {
		color: ${T.primary};
	}
`

export const GridBodyCell = styled.div<{ $empty?: boolean }>`
	position: relative;
	background: transparent;
	box-shadow:
		inset -1px 0 0 rgba(15, 23, 42, 0.06),
		inset 0 -1px 0 rgba(15, 23, 42, 0.06);
	min-height: 62px;
	display: flex;
	align-items: stretch;
	justify-content: stretch;
	padding: 6px;

	button {
		width: 100%;
		background: transparent;
		border: 0;
		padding: 0;
		font: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 10px;
		color: ${T.textMuted};
		transition:
			background 160ms ease,
			color 160ms ease;
	}
	${(p) =>
		p.$empty &&
		css`
			button:hover {
				background: rgba(3, 105, 161, 0.06);
				color: ${T.primary};
			}
		`}
	.placeholder {
		font-size: 20px;
		font-weight: 300;
		opacity: 0.4;
		transition: opacity 160ms ease;
	}
	button:hover .placeholder {
		opacity: 1;
	}
`

const contentFlip = keyframes`
	0%   { transform: translateY(0);     opacity: 1; }
	40%  { transform: translateY(-14px); opacity: 0; }
	41%  { transform: translateY(14px);  opacity: 0; }
	100% { transform: translateY(0);     opacity: 1; }
`

const checkPop = keyframes`
	0%   { opacity: 0; transform: scale(0.2) rotate(-40deg); }
	60%  { opacity: 1; transform: scale(1.15) rotate(4deg); }
	100% { opacity: 1; transform: scale(1) rotate(0); }
`

export const GridBodyFill = styled.button<{
	$bg: string
	$fg: string
	$accent: string
	$selected?: boolean
}>`
	position: relative;
	overflow: hidden;
	display: flex !important;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 3px;
	width: 100%;
	height: 100%;
	padding: 8px 10px !important;
	border: 0;
	border-radius: 10px !important;
	background: ${(p) => p.$bg} !important;
	color: ${(p) => p.$fg} !important;
	font-family: inherit;
	cursor: pointer;
	box-shadow: ${(p) =>
		p.$selected
			? `inset 0 0 0 1px ${p.$accent}22,
			   0 0 0 2px #ffffff,
			   0 0 0 4px ${p.$accent},
			   0 8px 18px -6px ${p.$accent}99`
			: `inset 0 0 0 1px ${p.$accent}22`};
	transform: ${(p) => (p.$selected ? 'scale(0.94)' : 'scale(1)')};
	filter: ${(p) => (p.$selected ? 'brightness(1.06) saturate(1.1)' : 'none')};
	transition:
		box-shadow 220ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
		filter 220ms ease;
	animation: ${cellFillIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transition: none;
		&:hover .amt,
		&:hover .st {
			animation: none;
		}
	}

	.amt {
		font-family: 'JetBrains Mono', monospace;
		font-variant-numeric: tabular-nums;
		font-weight: 700;
		font-size: 13.5px;
		letter-spacing: -0.2px;
		color: inherit !important;
	}
	.st {
		font-size: 12.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		opacity: 0.72;
		color: inherit !important;
	}
	.selection-check {
		position: absolute;
		top: 4px;
		right: 4px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #ffffff;
		color: ${(p) => p.$accent};
		display: inline-flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 2px 6px rgba(15, 23, 42, 0.22);
		animation: ${checkPop} 320ms cubic-bezier(0.22, 1.4, 0.36, 1);
	}
	.selection-check svg {
		font-size: 14px;
	}
	&:hover .amt {
		animation: ${contentFlip} 500ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	&:hover .st {
		animation: ${contentFlip} 500ms cubic-bezier(0.22, 1, 0.36, 1) 60ms;
	}
`

export const GridRowTotalCell = styled.div`
	background: #eef4fa;
	box-shadow:
		inset 2px 0 0 rgba(3, 105, 161, 0.28),
		inset 0 -1px 0 rgba(15, 23, 42, 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 10px 12px;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-weight: 700;
	font-size: 14.5px;
	color: ${T.textStrong};
	letter-spacing: -0.2px;
`

export const GridFooterCorner = styled.div`
	position: sticky;
	left: 0;
	z-index: 5;
	background: #eef4fa;
	padding: 14px 18px;
	min-width: 240px;
	text-align: left;
	color: #0f172a;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-variation-settings: 'opsz' 32;
	font-size: 14.5px;
	font-weight: 500;
	letter-spacing: -0.3px;
	box-shadow:
		1px 0 0 rgba(15, 23, 42, 0.08),
		inset 0 2px 0 rgba(3, 105, 161, 0.22);
	display: flex;
	align-items: center;
	justify-content: flex-start;
`

export const GridFooterCell = styled.div<{ $current?: boolean }>`
	background: ${(p) => (p.$current ? '#dceaf5' : '#eef4fa')};
	box-shadow:
		inset -1px 0 0 rgba(15, 23, 42, 0.06),
		inset 0 2px 0 rgba(3, 105, 161, 0.22);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 14px 8px;
	font-family: 'JetBrains Mono', monospace;
	font-variant-numeric: tabular-nums;
	font-weight: 700;
	font-size: 14.5px;
	color: ${T.textStrong};
	letter-spacing: -0.2px;
`

export const GridFooterTotal = styled(GridFooterCell)`
	background: #dceaf5;
	color: ${T.textStrong};
	font-size: 15px;
	box-shadow:
		inset 2px 0 0 rgba(3, 105, 161, 0.28),
		inset 0 2px 0 rgba(3, 105, 161, 0.28);
`

/* ─── Manual calculator (select-payments mode) ──────────────────── */

const panelSlideUp = keyframes`
	0%   { opacity: 0; transform: translate(-50%, 32px) scale(0.9);  filter: blur(6px); }
	60%  { opacity: 1;                                  filter: blur(0); }
	100% { opacity: 1; transform: translate(-50%, 0)     scale(1);    filter: blur(0); }
`

const panelSlideDown = keyframes`
	0%   { opacity: 1; transform: translate(-50%, 0)     scale(1);    filter: blur(0); }
	40%  { opacity: 0.75; }
	100% { opacity: 0; transform: translate(-50%, 40px) scale(0.86); filter: blur(6px); }
`

const numberPulse = keyframes`
	0%   { transform: scale(1); }
	40%  { transform: scale(1.08); }
	100% { transform: scale(1); }
`

export const HeadRightCluster = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const calcLabelIn = keyframes`
	from { transform: translateY(120%); opacity: 0; filter: blur(2px); }
	to   { transform: translateY(0);    opacity: 1; filter: blur(0); }
`

export const CalcBtnLabel = styled.span`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	line-height: inherit;
	vertical-align: middle;
	white-space: nowrap;

	> .sizer {
		visibility: hidden;
		pointer-events: none;
	}
	> .text {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		animation: ${calcLabelIn} 380ms cubic-bezier(0.22, 1.2, 0.36, 1) both;
		will-change: transform, opacity;
	}

	@media (prefers-reduced-motion: reduce) {
		> .text {
			animation: none;
		}
	}
`

export const CalcToggleBtn = styled.button<{ $active?: boolean; $hasSelection?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 6px 14px 6px 12px;
	border-radius: 999px;
	border: 1.5px solid ${(p) => (p.$active ? '#0f172a' : '#c2670a')};
	background-image: linear-gradient(90deg, #0f172a 0%, #0f172a 45%, #c2670a 55%, #c2670a 100%);
	background-size: 220% 100%;
	background-repeat: no-repeat;
	background-position: ${(p) => (p.$active ? '0% 0%' : '100% 0%')};
	color: #ffffff;
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: pointer;
	box-shadow: ${(p) =>
		p.$active
			? '0 4px 14px -4px rgba(15, 23, 42, 0.45)'
			: '0 4px 12px -4px rgba(194, 103, 10, 0.45)'};
	transition:
		background-position 640ms cubic-bezier(0.76, 0, 0.24, 1),
		border-color 380ms ease 120ms,
		box-shadow 380ms ease 100ms,
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1);

	@media (prefers-reduced-motion: reduce) {
		transition:
			background-position 0ms,
			border-color 0ms,
			box-shadow 0ms;
	}

	&:hover {
		transform: translateY(-1px);
	}

	svg {
		font-size: 16px;
		transition: transform 640ms cubic-bezier(0.68, -0.2, 0.32, 1.4);
		transform-origin: center;
		transform: ${(p) => (p.$active ? 'rotate(360deg)' : 'rotate(0deg)')};
	}
	&:hover svg {
		transform: ${(p) =>
			p.$active ? 'rotate(346deg) scale(1.15)' : 'rotate(-14deg) scale(1.15)'};
	}
	&:active svg {
		transform: ${(p) => (p.$active ? 'rotate(346deg) scale(1)' : 'rotate(-14deg) scale(1)')};
		transition-duration: 120ms;
	}

	.count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 18px;
		padding: 0 6px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.22);
		color: #ffffff;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 11px;
		font-weight: 700;
		margin-left: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover {
			transform: none;
		}
		svg,
		&:hover svg {
			transition: none;
			transform: none;
		}
	}
`

export const CalcPanel = styled.div<{ $leaving?: boolean }>`
	position: fixed;
	left: 50%;
	bottom: 24px;
	transform: translateX(-50%);
	z-index: 900;
	display: inline-flex;
	align-items: center;
	gap: 18px;
	padding: 10px 12px 10px 22px;
	border-radius: 999px;
	background: linear-gradient(135deg, #0f172a, #1e293b);
	color: #ffffff;
	box-shadow:
		0 24px 44px -14px rgba(15, 23, 42, 0.55),
		0 4px 10px rgba(15, 23, 42, 0.18);
	animation: ${(p) =>
		p.$leaving
			? css`
					${panelSlideDown} 380ms cubic-bezier(0.55, 0, 0.68, 0.4) both
				`
			: css`
					${panelSlideUp} 420ms cubic-bezier(0.22, 1.2, 0.36, 1) both
				`};
	${(p) =>
		p.$leaving &&
		css`
			pointer-events: none;
		`}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		opacity: ${(p) => (p.$leaving ? 0 : 1)};
	}

	@media (max-width: 560px) {
		padding: 10px 12px;
		gap: 12px;
	}
`

export const CalcPanelStat = styled.div`
	display: inline-flex;
	flex-direction: column;
	line-height: 1.1;

	.lbl {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.55);
	}
	.val {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 15px;
		font-weight: 700;
		letter-spacing: -0.2px;
		color: #ffffff;
		margin-top: 2px;
		display: inline-block;
		animation: ${numberPulse} 380ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	.val.total {
		font-size: 22px;
		letter-spacing: -0.5px;
	}
`

export const CalcPanelDivider = styled.span`
	width: 1px;
	height: 26px;
	background: rgba(255, 255, 255, 0.14);
`

export const CalcPanelBtn = styled.button<{ $variant?: 'ghost' | 'solid' }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	padding: ${(p) => (p.$variant === 'solid' ? '8px 14px' : '8px 12px')};
	border-radius: 999px;
	border: 0;
	background: ${(p) =>
		p.$variant === 'solid' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(255, 255, 255, 0.08)'};
	color: ${(p) => (p.$variant === 'solid' ? '#0f172a' : '#ffffff')};
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: pointer;
	transition:
		background 160ms ease,
		transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover:not(:disabled) {
		background: ${(p) => (p.$variant === 'solid' ? '#ffffff' : 'rgba(255, 255, 255, 0.16)')};
		transform: translateY(-1px);
	}
	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	svg {
		font-size: 15px;
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) {
			transform: none;
		}
	}
`

/* ─── Legend ────────────────────────────────────────────────────── */
