import styled, { keyframes } from 'styled-components'

/* ── Animations ─────────────────────────────────────────────────────────── */

export const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0); }
`

export const spin = keyframes`
	to { transform: rotate(360deg); }
`

export const pulse = keyframes`
	0%, 100% { opacity: 1; }
	50%      { opacity: 0.55; }
`

/* ── Containers ─────────────────────────────────────────────────────────── */

export const Shell = styled.div<{ $dark: boolean }>`
	width: 100%;
	padding: 24px 20px 40px;
	display: flex;
	justify-content: center;
`

export const Surface = styled.div<{ $dark: boolean; $maxWidth?: number }>`
	width: 100%;
	max-width: ${({ $maxWidth }) => $maxWidth ?? 880}px;
	background: ${({ $dark }) => ($dark ? '#252d3a' : '#ffffff')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#eceaf3')};
	border-radius: 18px;
	box-shadow: ${({ $dark }) =>
		$dark
			? '0 30px 60px -40px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.15)'
			: '0 30px 60px -40px rgba(63, 51, 111, 0.25), 0 2px 6px rgba(63, 51, 111, 0.05)'};
	overflow: hidden;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

/* ── Header ─────────────────────────────────────────────────────────────── */

export const HeaderBlock = styled.div<{ $dark: boolean }>`
	padding: 24px 32px 24px;
	border-bottom: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#f0eef7')};
	display: flex;
	flex-direction: column;
	gap: 18px;
`

export const BackChip = styled.button<{ $dark: boolean }>`
	align-self: flex-start;
	appearance: none;
	background: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.04)' : '#f5f3fb')};
	border: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#ecebf5')};
	color: ${({ $dark }) => ($dark ? '#c7c9d3' : '#5a5476')};
	padding: 6px 12px 6px 8px;
	border-radius: 999px;
	cursor: pointer;
	font-size: 12px;
	font-weight: 500;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	transition: all 160ms ease;
	line-height: 1;

	&:hover {
		background: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.08)' : '#ede9f7')};
		color: ${({ $dark }) => ($dark ? '#e8e9ee' : '#3a3541')};
		transform: translateX(-2px);
	}

	svg {
		flex-shrink: 0;
	}
`

export const HeaderRow = styled.div`
	display: flex;
	align-items: center;
	gap: 16px;
`

export const IconTile = styled.div<{ $dark: boolean; $primary: string }>`
	width: 48px;
	height: 48px;
	border-radius: 12px;
	background: ${({ $primary }) => $primary};
	color: #ffffff;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 8px 20px -8px ${({ $primary }) => $primary};
	position: relative;
	overflow: hidden;

	&::after {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), transparent 60%);
		pointer-events: none;
	}
`

export const TitleCol = styled.div`
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
`

export const Title = styled.h1`
	margin: 0;
	font-family: 'Inter', sans-serif;
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.01em;
	line-height: 1.2;
	color: inherit;
`

export const SubTitle = styled.p<{ $dark: boolean }>`
	margin: 0;
	font-size: 13px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#7a7591')};
`

export type ModeTone = 'edit' | 'new' | 'draft' | 'danger' | 'view'

const modeBg = (tone: ModeTone, dark: boolean) => {
	if (tone === 'edit') return dark ? 'rgba(3, 105, 161, 0.18)' : 'rgba(3, 105, 161, 0.10)'
	if (tone === 'draft') return dark ? 'rgba(245, 158, 11, 0.15)' : '#fff4e0'
	if (tone === 'danger') return dark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2'
	if (tone === 'view') return dark ? 'rgba(100, 116, 139, 0.18)' : '#eef2f7'
	return dark ? 'rgba(34, 197, 94, 0.15)' : '#e5f8ec'
}
const modeFg = (tone: ModeTone, dark: boolean) => {
	if (tone === 'edit') return dark ? '#38bdf8' : '#0369a1'
	if (tone === 'draft') return dark ? '#fcd34d' : '#a26608'
	if (tone === 'danger') return dark ? '#fca5a5' : '#b91c1c'
	if (tone === 'view') return dark ? '#cbd5e1' : '#475569'
	return dark ? '#86efac' : '#15803d'
}
const modeBorder = (tone: ModeTone, dark: boolean) => {
	if (tone === 'edit') return dark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(3, 105, 161, 0.25)'
	if (tone === 'draft') return dark ? 'rgba(245, 158, 11, 0.25)' : '#ffe6b8'
	if (tone === 'danger') return dark ? 'rgba(239, 68, 68, 0.25)' : '#fecaca'
	if (tone === 'view') return dark ? 'rgba(100, 116, 139, 0.28)' : '#d6dde6'
	return dark ? 'rgba(34, 197, 94, 0.25)' : '#bde5c8'
}
const modeDot = (tone: ModeTone) => {
	if (tone === 'edit') return '#0369a1'
	if (tone === 'draft') return '#f59e0b'
	if (tone === 'danger') return '#ef4444'
	if (tone === 'view') return '#64748b'
	return '#22c55e'
}

export const ModeBadge = styled.div<{ $dark: boolean; $tone: ModeTone }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.06em;
	text-transform: uppercase;
	flex-shrink: 0;
	background: ${({ $tone, $dark }) => modeBg($tone, $dark)};
	color: ${({ $tone, $dark }) => modeFg($tone, $dark)};
	border: 1px solid ${({ $tone, $dark }) => modeBorder($tone, $dark)};
`

export const Dot = styled.span<{ $tone: ModeTone }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${({ $tone }) => modeDot($tone)};
	animation: ${pulse} 2s ease-in-out infinite;
`

/* ── Sections ───────────────────────────────────────────────────────────── */

export const Section = styled.div<{ $delay?: number }>`
	padding: 28px 32px 8px;
	border-bottom: 1px solid transparent;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${({ $delay }) => $delay ?? 80}ms;

	& + & {
		padding-top: 24px;
	}
`

export const SectionHeadWrap = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	margin-bottom: 18px;
`

export const SectionNum = styled.span<{ $dark: boolean; $primary: string }>`
	font-family: 'Bebas Neue', 'Inter', sans-serif;
	font-size: 15px;
	letter-spacing: 0.06em;
	color: ${({ $primary }) => $primary};
	padding: 2px 8px;
	border-radius: 6px;
	background: ${({ $dark, $primary }) => ($dark ? `${$primary}22` : `${$primary}14`)};
	line-height: 1.3;
	flex-shrink: 0;
`

export const SectionText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

export const SectionTitle = styled.h2`
	margin: 0;
	font-size: 15px;
	font-weight: 600;
	letter-spacing: -0.005em;
`

export const SectionHint = styled.p<{ $dark: boolean }>`
	margin: 0;
	font-size: 12px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#8a85a3')};
`

/* ── Field primitives ───────────────────────────────────────────────────── */

export const FieldGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(12, 1fr);
	gap: 16px 18px;
`

export const FieldStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`

export type FieldSpan = 'auto' | 'full' | 'third' | 'two-thirds' | 'quarter'

export const FieldRoot = styled.div<{ $span: FieldSpan }>`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	${({ $span }) => {
		if ($span === 'full') return 'grid-column: span 12;'
		if ($span === 'third')
			return 'grid-column: span 4; @media (max-width: 640px) { grid-column: span 12; }'
		if ($span === 'two-thirds')
			return 'grid-column: span 8; @media (max-width: 640px) { grid-column: span 12; }'
		if ($span === 'quarter')
			return 'grid-column: span 3; @media (max-width: 640px) { grid-column: span 12; }'
		return 'grid-column: span 6; @media (max-width: 640px) { grid-column: span 12; }'
	}}
`

export const FieldLabelRow = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 8px;
`

export const FieldLabel = styled.label`
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: inherit;
	opacity: 0.7;
`

export const ReqStar = styled.span`
	color: #ef4444;
	margin-left: 4px;
`

export const FieldHint = styled.span`
	font-size: 11px;
	opacity: 0.55;
`

export const FieldInput = styled.div`
	position: relative;
`

export const FieldError = styled.span`
	font-size: 12px;
	color: #ef4444;
	display: flex;
	align-items: center;
	gap: 4px;

	&::before {
		content: '!';
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: #ef4444;
		color: #ffffff;
		font-size: 10px;
		font-weight: 700;
		line-height: 1;
	}
`

/* ── Info panel (analog of BoostPanel) ──────────────────────────────────── */

export const InfoPanel = styled.div<{
	$dark: boolean
	$active?: boolean
	$tone?: 'blue' | 'amber' | 'green'
}>`
	grid-column: span 12;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 14px 16px;
	border-radius: 12px;
	background: ${({ $dark, $active, $tone = 'blue' }) => {
		if (!$active) return $dark ? 'rgba(255, 255, 255, 0.03)' : '#faf9fd'
		if ($tone === 'amber') return $dark ? 'rgba(245, 158, 11, 0.08)' : '#fffaf0'
		if ($tone === 'green') return $dark ? 'rgba(34, 197, 94, 0.06)' : '#f2fbf5'
		return $dark ? 'rgba(59, 130, 246, 0.06)' : '#f4f7ff'
	}};
	border: 1px solid
		${({ $dark, $active, $tone = 'blue' }) => {
			if (!$active) return $dark ? '#323a48' : '#ecebf5'
			if ($tone === 'amber') return $dark ? 'rgba(245, 158, 11, 0.25)' : '#ffe6b8'
			if ($tone === 'green') return $dark ? 'rgba(34, 197, 94, 0.22)' : '#c9ecd4'
			return $dark ? 'rgba(59, 130, 246, 0.22)' : '#d9e4ff'
		}};
	transition: all 220ms ease;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`

/* ── Footer bar ─────────────────────────────────────────────────────────── */

export const FootBar = styled.div<{ $dark: boolean }>`
	margin-top: 12px;
	padding: 18px 32px;
	border-top: 1px solid ${({ $dark }) => ($dark ? '#323a48' : '#f0eef7')};
	background: ${({ $dark }) =>
		$dark ? 'rgba(255, 255, 255, 0.015)' : 'linear-gradient(to bottom, transparent, #faf9fd)'};
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	animation: ${fadeUp} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: 320ms;

	@media (max-width: 640px) {
		flex-direction: column-reverse;
		align-items: stretch;
	}
`

export const FootLeft = styled.div<{ $dark?: boolean }>`
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#8a85a3')};
`

export const DotMini = styled.span<{ $color?: string }>`
	width: 6px;
	height: 6px;
	border-radius: 50%;
	background: ${({ $color }) => $color ?? '#22c55e'};
	box-shadow: 0 0 0 3px ${({ $color }) => ($color ? `${$color}30` : 'rgba(34, 197, 94, 0.18)')};
	animation: ${pulse} 2s ease-in-out infinite;
`

export const FootActions = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;

	@media (max-width: 640px) {
		justify-content: flex-end;
	}
`

export const PrimarySolidButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: rgba(3, 105, 161, 1);
	color: #ffffff;
	border: none;
	padding: 11px 18px;
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.01em;
	border-radius: 12px;
	cursor: pointer;
	transition:
		transform 120ms cubic-bezier(0.4, 0, 0.2, 1),
		box-shadow 160ms cubic-bezier(0.4, 0, 0.2, 1),
		background 160ms cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 2px 6px rgba(3, 105, 161, 0.22);

	svg {
		font-size: 18px;
	}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 16px rgba(3, 105, 161, 0.28);
		background: #027cc0;
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		box-shadow: none;
	}
`

/* Ghost / outlined brand-blue button — same size as
   PrimarySolidButton, white background with a blue outline. Hover
   only lifts the button; no color, border or shadow change so the
   outlined family reads as quietly interactive. */
export const PrimaryGhostButton = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: transparent;
	color: rgba(3, 105, 161, 1);
	border: 1px solid rgba(3, 105, 161, 0.35);
	padding: 10px 17px;
	font-family: inherit;
	font-size: 14px;
	font-weight: 600;
	letter-spacing: 0.01em;
	border-radius: 12px;
	cursor: pointer;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		font-size: 18px;
	}

	&:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`

/* Icon micro-animations shared by "Edit …" and "Back …" buttons.
   Mirrors the pattern used in the client-calls / invoices previews so
   every mutation-CTA feels alive on hover. */
const editWiggle = keyframes`
	0%   { rotate: 0deg; translate: 0 0; }
	25%  { rotate: -22deg; translate: -1px 2px; }
	55%  { rotate: 14deg; translate: 1px -1px; }
	80%  { rotate: -6deg; translate: 0 1px; }
	100% { rotate: 0deg; translate: 0 0; }
`

const arrowNudgeLeft = keyframes`
	0%   { translate: 0 0; }
	50%  { translate: -3px 0; }
	100% { translate: 0 0; }
`

/* PrimarySolidButton variant with an animated edit icon on hover. */
export const EditSolidButton = styled(PrimarySolidButton)`
	svg {
		transform-origin: 40% 60%;
		transition: scale 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		scale: 1.18;
		animation: ${editWiggle} 640ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
			scale: 1;
		}
	}
`

/* PrimaryGhostButton variant with a leftwards-nudging arrow — pair
   with a left-pointing icon (e.g. ArrowBackRounded) for "Back …"
   buttons in view/edit surfaces. */
export const BackGhostButton = styled(PrimaryGhostButton)`
	svg {
		transition: translate 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	&:hover:not(:disabled) svg {
		animation: ${arrowNudgeLeft} 520ms cubic-bezier(0.22, 1, 0.36, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover:not(:disabled) svg {
			animation: none;
		}
	}
`

/* ── Loading ────────────────────────────────────────────────────────────── */

export const LoadingBlock = styled.div<{ $dark: boolean }>`
	padding: 60px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#8a85a3')};
	font-size: 14px;

	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: ${spin} 800ms linear infinite;
		opacity: 0.6;
	}
`
