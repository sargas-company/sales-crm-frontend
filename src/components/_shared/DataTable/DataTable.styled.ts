import styled, { keyframes } from 'styled-components'
import { T } from '../../sales-analytics/_shared/tokens'

/* ── Animations ──────────────────────────────────────────────────────── */

export const shimmer = keyframes`
	0%   { background-position: -400px 0; }
	100% { background-position: 400px 0; }
`

export const rowIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

export const emptyFade = keyframes`
	from { opacity: 0; transform: scale(0.94); }
	to   { opacity: 1; transform: scale(1); }
`

export const iconFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50%      { transform: translateY(-6px); }
`

/* ── Shell ───────────────────────────────────────────────────────────── */

export const TableCard = styled.div`
	background: #fff;
	border: 1px solid ${T.border};
	border-radius: ${T.radius};
	overflow: hidden;
`

export const TableScrollWrap = styled.div<{ $leftHint: boolean; $rightHint: boolean }>`
	position: relative;

	&::before,
	&::after {
		content: '';
		position: absolute;
		top: 0;
		bottom: 0;
		width: 14px;
		pointer-events: none;
		z-index: 4;
		opacity: 0;
		transition: opacity 180ms ${T.ease};
	}
	&::before {
		left: 0;
		background: linear-gradient(90deg, rgba(15, 23, 42, 0.03), rgba(15, 23, 42, 0));
		opacity: ${({ $leftHint }) => ($leftHint ? 1 : 0)};
	}
	&::after {
		right: 0;
		background: linear-gradient(-90deg, rgba(15, 23, 42, 0.03), rgba(15, 23, 42, 0));
		opacity: ${({ $rightHint }) => ($rightHint ? 1 : 0)};
	}
`

export const TableScroll = styled.div`
	overflow-x: auto;
	overflow-y: hidden;
	min-height: 0;
	scrollbar-color: transparent transparent;
	transition: scrollbar-color 180ms ease;

	&:hover {
		scrollbar-color: #d5d3dc transparent;
	}

	&::-webkit-scrollbar {
		height: 10px;
		width: 0;
	}
	&::-webkit-scrollbar-track {
		background: transparent;
	}
	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 999px;
		border: 2px solid #fff;
		transition: background 180ms ease;
	}
	&:hover::-webkit-scrollbar-thumb {
		background: #d5d3dc;
	}
	&:hover::-webkit-scrollbar-thumb:hover {
		background: #b3adc2;
	}
`

/* ── Table ───────────────────────────────────────────────────────────── */

export const Table = styled.table`
	width: 100%;
	table-layout: auto;
	border-collapse: collapse;
	font-size: 14px;

	thead th {
		text-align: center;
		font-size: 12.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.8px;
		color: ${T.textStrong};
		background: ${T.subtleBg};
		padding: 15px 22px;
		white-space: nowrap;
	}

	tbody td {
		padding: 16px 22px;
		vertical-align: middle;
		border-bottom: 1px solid ${T.divider};
	}
	tbody tr:last-child td {
		border-bottom: none;
	}

	th.col-actions,
	td.col-actions {
		white-space: nowrap;
		padding-right: 12px;
	}
	th.col-actions {
		text-align: center;
	}
	td.col-actions {
		text-align: right;
	}

	/* Spacer column — absorbs extra width between the last data column
	   and the Actions column. Collapses to 0 when the table needs to
	   scroll horizontally. */
	.col-spacer {
		width: 100%;
		padding: 0;
		background: transparent;
	}
	thead th.col-spacer {
		background: ${T.subtleBg};
	}

	/* Opt-in selection column — stays flush left with a tight padding so
	   it feels like a gutter, not a data column. */
	th.col-select,
	td.col-select {
		width: 42px;
		padding: 0 0 0 18px;
		text-align: left;
	}
`

export const SelectCheckbox = styled.input`
	appearance: none;
	-webkit-appearance: none;
	width: 18px;
	height: 18px;
	border: 1.5px solid ${T.border};
	border-radius: 5px;
	background: #ffffff;
	cursor: pointer;
	display: inline-grid;
	place-content: center;
	transition:
		background 160ms ${T.ease},
		border-color 160ms ${T.ease},
		box-shadow 160ms ${T.ease};

	&::before {
		content: '';
		width: 10px;
		height: 10px;
		clip-path: polygon(14% 44%, 0 60%, 40% 100%, 100% 20%, 86% 7%, 40% 70%);
		transform: scale(0);
		transform-origin: center;
		background: #ffffff;
		transition: transform 160ms ${T.ease};
	}

	&:checked {
		background: ${T.primary};
		border-color: ${T.primary};
	}
	&:checked::before {
		transform: scale(1);
	}
	&:indeterminate {
		background: ${T.primary};
		border-color: ${T.primary};
	}
	&:indeterminate::before {
		content: '';
		width: 10px;
		height: 2px;
		clip-path: none;
		background: #ffffff;
		transform: scale(1);
	}
	&:hover:not(:disabled) {
		border-color: ${T.primary};
	}
	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px rgba(3, 105, 161, 0.22);
	}
`

export const DataRow = styled.tr<{ $delay?: number }>`
	transition: background 120ms ${T.ease};
	animation: ${rowIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${({ $delay }) => $delay ?? 0}ms;

	&:hover {
		background: #fbfafc;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* ── Actions primitives (exported for row-cell content) ─────────────── */

export const Actions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	justify-content: flex-end;
`

export const IconAction = styled.button<{ $danger?: boolean }>`
	flex: 0 0 34px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	width: 34px;
	min-width: 34px;
	max-width: 34px;
	height: 34px;
	min-height: 34px;
	max-height: 34px;
	padding: 0;
	margin: 0;
	line-height: 0;
	aspect-ratio: 1 / 1;
	background: transparent;
	border: none;
	border-radius: 50%;
	color: ${T.textSecondary};
	cursor: pointer;
	transition:
		background 160ms ${T.ease},
		color 160ms ${T.ease};

	svg {
		font-size: 19px;
	}

	&:hover:not(:disabled) {
		background: ${({ $danger }) =>
			$danger ? 'rgba(201, 75, 75, 0.12)' : 'rgba(3, 105, 161, 0.12)'};
		color: ${({ $danger }) => ($danger ? T.error : T.primary)};
	}

	&:focus-visible {
		outline: none;
		background: ${({ $danger }) =>
			$danger ? 'rgba(201, 75, 75, 0.12)' : 'rgba(3, 105, 161, 0.12)'};
		color: ${({ $danger }) => ($danger ? T.error : T.primary)};
		box-shadow: 0 0 0 3px
			${({ $danger }) => ($danger ? 'rgba(201, 75, 75, 0.22)' : 'rgba(3, 105, 161, 0.22)')};
	}

	&:disabled {
		color: ${T.textMuted};
		cursor: not-allowed;
		opacity: 0.5;
	}
`

/* ── Pager ───────────────────────────────────────────────────────────── */

export const Pager = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 22px;
	background: ${T.subtleBg};
	box-shadow: 0 -4px 10px -8px rgba(15, 23, 42, 0.18);
	font-size: 12.5px;
	color: ${T.textSecondary};
	flex-shrink: 0;

	.pager-current {
		font-weight: 600;
		color: ${T.textStrong};
		font-size: 13px;
	}
`

export const PagerInfo = styled.span`
	font-size: 13px;
	color: ${T.textStrong};
`

export const PagerButtons = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
`

export const PagerBtn = styled.button`
	background: #fff;
	border: 1px solid ${T.border};
	border-radius: ${T.radiusXs};
	padding: 6px 12px;
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	color: ${T.textStrong};
	cursor: pointer;
	transition:
		background 120ms ${T.ease},
		border-color 120ms ${T.ease};

	&:hover:not(:disabled) {
		border-color: ${T.primary};
		color: ${T.primary};
		background: ${T.primaryTint};
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

/* ── States ──────────────────────────────────────────────────────────── */

export const InlineState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10px;
	padding: 48px 24px;
	text-align: center;

	.state-title {
		font-size: 16px;
		font-weight: 700;
		color: ${T.textStrong};
	}
	.state-sub {
		font-size: 13.5px;
		line-height: 1.5;
		color: ${T.textSecondary};
		max-width: 44ch;
	}
	.state-cta {
		margin-top: 6px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: ${T.primary};
		color: #fff;
		border: none;
		padding: 9px 16px;
		font-family: inherit;
		font-size: 13px;
		font-weight: 600;
		border-radius: ${T.radiusSm};
		cursor: pointer;
		transition: background 120ms ${T.ease};
	}
	.state-cta:hover {
		background: #027cc0;
	}
`

export const EmptyState = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 48px 24px;
	text-align: center;
	animation: ${emptyFade} 450ms ease-out both;
`

export const EmptyIconWrap = styled.div`
	width: 96px;
	height: 96px;
	border-radius: 50%;
	background: ${T.primaryTint};
	color: ${T.primary};
	display: inline-flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 6px;
	animation: ${iconFloat} 3.2s ease-in-out infinite;

	svg {
		font-size: 46px;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

export const EmptyTitle = styled.p`
	margin: 0;
	font-size: 15px;
	font-weight: 500;
	color: ${T.textSecondary};
`

export const EmptySub = styled.p`
	margin: 0;
	font-size: 13px;
	color: ${T.textMuted};
	max-width: 320px;
`

export const EmptyCta = styled.button`
	appearance: none;
	margin-top: 6px;
	padding: 8px 20px;
	border-radius: 999px;
	background: ${T.primary};
	color: #ffffff;
	border: none;
	font: inherit;
	font-size: 13px;
	font-weight: 700;
	letter-spacing: 0.3px;
	cursor: pointer;
	text-transform: none;
	transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
	&:hover {
		transform: translateY(-1px);
	}
`

/* ── Skeleton primitive ─────────────────────────────────────────────── */

export const Skeleton = styled.span<{
	$w?: string
	$h?: string
	$round?: boolean
	$inline?: boolean
}>`
	display: ${({ $inline }) => ($inline ? 'inline-block' : 'block')};
	width: ${({ $w }) => $w ?? '80%'};
	height: ${({ $h }) => $h ?? '12px'};
	background: #f0eef5;
	background-image: linear-gradient(
		90deg,
		rgba(240, 238, 245, 0) 0%,
		rgba(255, 255, 255, 0.85) 50%,
		rgba(240, 238, 245, 0) 100%
	);
	background-repeat: no-repeat;
	background-size: 400px 100%;
	border-radius: ${({ $round }) => ($round ? '50%' : T.radiusXs)};
	animation: ${shimmer} 1.4s linear infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		background: #f0eef5;
	}
`

export const SkeletonActions = styled.div`
	display: inline-flex;
	gap: 6px;
	justify-content: flex-end;
`

/* ── Sortable header ─────────────────────────────────────────────────── */

export const SortHeader = styled.button<{ $active: boolean }>`
	appearance: none;
	background: none;
	border: none;
	padding: 0;
	margin: 0 auto;
	font: inherit;
	color: inherit;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	line-height: inherit;
	letter-spacing: inherit;
	text-transform: inherit;
	white-space: nowrap;
	user-select: none;
	transition: color 120ms ${T.ease};

	&:hover {
		color: ${T.primary};
	}
	&:focus-visible {
		outline: none;
		color: ${T.primary};
	}
`

export const SortIndicator = styled.span<{ $active: boolean; $dir: 'asc' | 'desc' | null }>`
	display: inline-flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 2px;
	line-height: 0;

	.asc,
	.desc {
		width: 0;
		height: 0;
		border-left: 4px solid transparent;
		border-right: 4px solid transparent;
		transition: border-color 120ms ${T.ease};
	}
	.asc {
		border-bottom: 5px solid ${T.textMuted};
	}
	.desc {
		border-top: 5px solid ${T.textMuted};
	}

	${({ $active, $dir }) =>
		$active && $dir === 'asc'
			? `.asc { border-bottom-color: ${T.primary}; } .desc { border-top-color: rgba(148, 163, 184, 0.55); }`
			: ''}
	${({ $active, $dir }) =>
		$active && $dir === 'desc'
			? `.asc { border-bottom-color: rgba(148, 163, 184, 0.55); } .desc { border-top-color: ${T.primary}; }`
			: ''}
`
