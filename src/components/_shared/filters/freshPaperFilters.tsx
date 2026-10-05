import styled from 'styled-components'
import { FiltersBarWrap } from '../../../page/analytics/filters/filters.styled'

/* ─── Fresh-Paper palette (shared) ──────────────────────────────── */
export const PAPER_INK = '#241E16'
export const PAPER_MUTE = '#7D6E5D'
export const PAPER_RULE_STRONG = 'rgba(36, 30, 22, 0.14)'
export const PAPER_ACCENT = '#E85D2F'

/* FiltersBarWrap extension — same visual, tighter row-gap for the
 * two-row filter layout. */
export const FreshFiltersWrap = styled(FiltersBarWrap)`
	row-gap: 12px;
`

/* Compact pill search field — sits inline in the bar. */
export const SearchPill = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	box-sizing: border-box;
	min-height: 42px;
	padding: 0 14px;
	border: 1.5px solid ${PAPER_RULE_STRONG};
	border-radius: 999px;
	background: #ffffff;
	transition: border-color 180ms ease;

	&:hover,
	&:focus-within {
		border-color: ${PAPER_INK};
	}

	.ico {
		font-size: 17px !important;
		color: ${PAPER_MUTE};
	}

	input {
		border: 0;
		outline: 0;
		background: transparent;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: ${PAPER_INK};
		width: 220px;
		padding: 0;
	}
	input::placeholder {
		color: ${PAPER_MUTE};
	}
`

/* Stacked field — tiny mono title on top, 42px pill select below.
 * align-self: flex-end so the pill bottom lines up with the row's
 * bottom edge even when the title adds extra height. */
export const InlineField = styled.label`
	display: inline-flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
	align-self: flex-end;

	.l {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 10px;
		letter-spacing: 0.7px;
		text-transform: uppercase;
		color: ${PAPER_MUTE};
	}
`

export const InlineSelect = styled.select`
	appearance: none;
	-webkit-appearance: none;
	box-sizing: border-box;
	min-height: 42px;
	border: 1.5px solid ${PAPER_RULE_STRONG};
	border-radius: 999px;
	background: #ffffff
		url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237D6E5D' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")
		no-repeat right 12px center;
	background-size: 12px 12px;
	padding: 10px 34px 10px 16px;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: ${PAPER_INK};
	line-height: 1.2;
	cursor: pointer;
	transition: border-color 180ms ease;

	&:hover,
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: ${PAPER_INK};
	}

	&::-ms-expand {
		display: none;
	}
`

/* Clear-all button — matches the inline selects: same pill, same
 * 42px min-height, same 1.5px border, bottom-aligned. */
export const ClearBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	box-sizing: border-box;
	min-height: 42px;
	padding: 10px 16px;
	border-radius: 999px;
	border: 1.5px solid ${PAPER_RULE_STRONG};
	background: #ffffff;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	color: ${PAPER_MUTE};
	cursor: pointer;
	align-self: flex-end;
	transition: border-color 180ms ease, color 180ms ease, background 180ms ease;

	&:hover:not(:disabled) {
		border-color: ${PAPER_ACCENT};
		background: rgba(232, 93, 47, 0.06);
		color: ${PAPER_ACCENT};
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

/* Wraps a DatePickerPill so it bottom-aligns with the InlineField
 * selects on a row (the InlineField stack is taller because of its
 * title). */
export const BottomSlot = styled.div`
	display: inline-flex;
	align-self: flex-end;
`

/* Forced flex-wrap newline inside FreshFiltersWrap — turns one flex
 * row into two without changing the parent's flex behaviour. */
export const RowBreak = styled.span`
	flex-basis: 100%;
	width: 100%;
	height: 0;
	margin: 0;
`
