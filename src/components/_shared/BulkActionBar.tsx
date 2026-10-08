import { useEffect, useState } from 'react'
import { DeleteOutline } from '@mui/icons-material'
import styled, { keyframes } from 'styled-components'

import { T } from '../sales-analytics/_shared/tokens'

/**
 * Floating bulk-action bar shared by list pages that support row
 * selection + bulk operations (currently: Project Reports, Client
 * Requests, Client Calls, Job Posts).
 *
 * - Mounts with a soft spring in-animation; unmounts after the exit
 *   transition finishes so leaving items complete their animation
 *   before React removes them from the DOM.
 * - Clear button (×) rotates on hover.
 * - Delete trash wiggles on hover and press-dips on active.
 * - Count number pops on every change via a `key` remount.
 * - Honours `prefers-reduced-motion`.
 *
 * Owner-of-list controls permission gating from outside the bar —
 * this component renders unconditionally when `count > 0`.
 */
export interface BulkActionBarProps {
	/** Current size of the parent selection set. The bar auto-hides at 0. */
	count: number
	/** User cleared the selection — reset Set in the parent. */
	onClear: () => void
	/** User clicked the delete button — open a ConfirmModal in the parent. */
	onConfirm: () => void
	/** `true` while the bulk request is in flight. Disables the button. */
	isLoading?: boolean
	/** Label shown next to the trash icon. Defaults to `Delete {count}`. */
	label?: string
	/** Label shown next to the counter. Defaults to `selected`. */
	countLabel?: string
}

const EXIT_MS = 220

const BulkActionBar = ({
	count,
	onClear,
	onConfirm,
	isLoading = false,
	label,
	countLabel = 'selected',
}: BulkActionBarProps) => {
	const [mounted, setMounted] = useState(count > 0)
	const [exiting, setExiting] = useState(false)

	useEffect(() => {
		if (count > 0) {
			setMounted(true)
			setExiting(false)
			return
		}
		if (mounted) {
			setExiting(true)
			const t = window.setTimeout(() => {
				setMounted(false)
				setExiting(false)
			}, EXIT_MS + 40)
			return () => window.clearTimeout(t)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [count])

	if (!mounted) return null

	const effectiveLabel = isLoading
		? 'Deleting…'
		: label ?? `Delete ${count}`

	return (
		<Bar $exiting={exiting} aria-live='polite' aria-hidden={exiting}>
			<Count>
				<CountNumber key={count || 'leaving'}>{count}</CountNumber>
				<CountLabel>{countLabel}</CountLabel>
			</Count>
			<Ghost type='button' onClick={onClear}>
				<ClearGlyph aria-hidden='true'>×</ClearGlyph>
				Clear
			</Ghost>
			<DangerBtn type='button' onClick={onConfirm} disabled={isLoading}>
				<TrashIcon aria-hidden='true'>
					<DeleteOutline />
				</TrashIcon>
				{effectiveLabel}
			</DangerBtn>
		</Bar>
	)
}

export default BulkActionBar

/* ─── enter / exit transitions ─────────────────────────────────── */

const barEnter = keyframes`
	0%   { opacity: 0; transform: translateY(-6px) scale(0.94); }
	60%  { opacity: 1; transform: translateY(1px) scale(1.015); }
	100% { opacity: 1; transform: translateY(0)  scale(1); }
`

const barExit = keyframes`
	0%   { opacity: 1; transform: translateY(0) scale(1); }
	100% { opacity: 0; transform: translateY(-6px) scale(0.94); }
`

const Bar = styled.div<{ $exiting: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 6px 10px 6px 14px;
	border-radius: 10px;
	background: rgba(220, 38, 38, 0.08);
	border: 1px solid rgba(220, 38, 38, 0.22);
	transform-origin: top right;
	will-change: transform, opacity;
	animation: ${({ $exiting }) => ($exiting ? barExit : barEnter)}
		${({ $exiting }) => ($exiting ? '220ms' : '260ms')}
		cubic-bezier(0.22, 1.3, 0.36, 1) both;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

/* ─── Counter badge — the number pops on change ────────────────── */

const Count = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;
	color: #b91c1c;
`

const countPop = keyframes`
	0%   { transform: scale(0.6); opacity: 0; }
	60%  { transform: scale(1.18); opacity: 1; }
	100% { transform: scale(1); }
`

const CountNumber = styled.span`
	display: inline-block;
	min-width: 1ch;
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.2px;
	font-variant-numeric: tabular-nums;
	transform-origin: center;
	animation: ${countPop} 300ms cubic-bezier(0.22, 1.4, 0.36, 1) both;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const CountLabel = styled.span`
	font-size: 12.5px;
	font-weight: 500;
	color: #b91c1c;
	opacity: 0.85;
`

/* ─── Clear ghost — the × spins on hover ───────────────────────── */

const Ghost = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border: none;
	background: transparent;
	color: ${T.textSecondary};
	font-family: inherit;
	font-size: 13px;
	font-weight: 500;
	padding: 6px 10px;
	border-radius: 8px;
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease;
	&:hover {
		background: rgba(15, 23, 42, 0.05);
		color: ${T.textStrong};
	}
`

const ClearGlyph = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 16px;
	height: 16px;
	line-height: 1;
	font-size: 18px;
	font-weight: 700;
	transition: transform 260ms cubic-bezier(0.22, 1.3, 0.36, 1);
	${Ghost}:hover & {
		transform: rotate(180deg) scale(1.15);
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

/* ─── Delete button — the trash wiggles on hover ───────────────── */

const trashWiggle = keyframes`
	0%   { transform: rotate(0deg) translateY(0); }
	20%  { transform: rotate(-14deg) translateY(-1px); }
	40%  { transform: rotate(12deg) translateY(-1px); }
	60%  { transform: rotate(-10deg) translateY(0); }
	80%  { transform: rotate(6deg)  translateY(0); }
	100% { transform: rotate(0deg) translateY(0); }
`

const trashPressed = keyframes`
	0%   { transform: translateY(0); }
	50%  { transform: translateY(2px) scale(0.92); }
	100% { transform: translateY(0); }
`

const DangerBtn = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 7px;
	border: 1px solid rgba(220, 38, 38, 0.5);
	background: #dc2626;
	color: #ffffff;
	font-family: inherit;
	font-size: 13px;
	font-weight: 600;
	padding: 8px 14px;
	border-radius: 10px;
	cursor: pointer;
	transition: background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
	&:hover:not(:disabled) {
		background: #b91c1c;
		box-shadow: 0 2px 6px rgba(220, 38, 38, 0.35);
	}
	&:active:not(:disabled) {
		transform: translateY(1px);
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

const TrashIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: 50% 20%;
	svg {
		font-size: 18px;
	}
	${DangerBtn}:hover:not(:disabled) & {
		animation: ${trashWiggle} 520ms cubic-bezier(0.36, 0, 0.66, -0.56) both;
	}
	${DangerBtn}:active:not(:disabled) & {
		animation: ${trashPressed} 220ms ease-out both;
	}
	@media (prefers-reduced-motion: reduce) {
		${DangerBtn}:hover:not(:disabled) &,
		${DangerBtn}:active:not(:disabled) & {
			animation: none;
		}
	}
`
