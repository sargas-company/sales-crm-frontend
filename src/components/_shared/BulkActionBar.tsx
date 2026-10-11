import { useEffect, useRef, useState, type ReactNode } from 'react'
import { DeleteOutline } from '@mui/icons-material'
import styled, { keyframes } from 'styled-components'

import { T } from '../sales-analytics/_shared/tokens'

/**
 * Smooth integer tween from the previous value to `target`. Honours
 * `prefers-reduced-motion` (snaps instantly). Used by the counter
 * number so a selection going from e.g. 0 → 7 shows the digits
 * animating through, not snapping.
 */
function useCountTween(target: number, duration = 420): number {
	const [display, setDisplay] = useState(target)
	const prev = useRef(target)
	useEffect(() => {
		if (
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		) {
			prev.current = target
			setDisplay(target)
			return
		}
		const from = prev.current
		const to = target
		if (from === to) return
		let raf = 0
		const start = performance.now()
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			const cur = from + (to - from) * eased
			setDisplay(cur)
			if (t < 1) raf = requestAnimationFrame(step)
			else prev.current = to
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [target, duration])
	return display
}

const TweenedCount = ({ value }: { value: number }) => {
	const n = useCountTween(value)
	return <>{Math.round(n)}</>
}

/**
 * Floating bulk-action bar shared by list pages that support row
 * selection + bulk operations (currently: Project Reports, Client
 * Requests, Client Calls, Job Posts, LinkedIn Posts/Ideas).
 *
 * Zoned layout — two zones divided by a hairline:
 *   LEFT  — selection subject (big tabular count + "selected" label +
 *           small Clear link) on the subtle ink-tint surface so it
 *           reads as the "subject" of the bar;
 *   RIGHT — action bank (optional secondaries + Delete) on the card
 *           surface so buttons sit cleanly on white.
 *
 * - Mounts with a soft spring in-animation; unmounts after the exit
 *   transition finishes so leaving items complete their animation
 *   before React removes them from the DOM.
 * - Clear × rotates on hover.
 * - Delete trash wiggles on hover and press-dips on active.
 * - Secondary action icon spins once on hover.
 * - Count number pops on every change via a `key` remount.
 * - Honours `prefers-reduced-motion`.
 *
 * Owner-of-list controls permission gating from outside the bar —
 * this component renders unconditionally when `count > 0`.
 *
 * `secondaryActions` is optional: when a list page needs more than
 * the default Delete (Job Posts also offers Retry analysis), those
 * buttons live INSIDE the same bar so they share one mount/unmount
 * lifecycle with Delete. The page is responsible for not passing
 * actions the user doesn't have permission for.
 */
export interface BulkSecondaryAction {
	key: string
	label: string
	icon?: ReactNode
	tone?: 'default' | 'warning'
	onClick: () => void
	isLoading?: boolean
	/** Independent disable flag (e.g. no FAILED rows in a Retry
	 * selection even though count > 0). The button is also disabled
	 * when the bar is in its persistent empty state. */
	disabled?: boolean
	/** Optional count rendered in parentheses after `label`, in a
	 * fixed-width tweened slot. Keeps the button width stable while
	 * digits animate. If omitted, no number is rendered. */
	count?: number
}

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
	/** Optional extra buttons rendered left of the default Delete. */
	secondaryActions?: BulkSecondaryAction[]
	/** Hide the default Delete button (e.g. no delete permission). */
	hideDelete?: boolean
	/**
	 * When true, the bar stays mounted at count=0 (showing "0 selected"
	 * and disabled action buttons) instead of unmounting. Lets a host
	 * reserve the bar's visual footprint permanently in its layout.
	 * Default (unset / false) preserves the auto-hide behaviour for
	 * all other pages.
	 */
	persistent?: boolean
}

const EXIT_MS = 220

const BulkActionBar = ({
	count,
	onClear,
	onConfirm,
	isLoading = false,
	label,
	countLabel = 'selected',
	secondaryActions,
	hideDelete = false,
	persistent = false,
}: BulkActionBarProps) => {
	const [mounted, setMounted] = useState(persistent || count > 0)
	const [exiting, setExiting] = useState(false)

	useEffect(() => {
		if (persistent) {
			setMounted(true)
			setExiting(false)
			return
		}
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
	}, [count, persistent])

	if (!mounted) return null

	const empty = count === 0
	const hasSecondary = !!secondaryActions && secondaryActions.length > 0
	const deleteBody = isLoading
		? 'Deleting…'
		: label
		? label
		: (
			<>
				Delete{' '}
				<DeleteCountSlot>
					<TweenedCount value={count} />
				</DeleteCountSlot>
			</>
		)

	return (
		<Bar
			$exiting={exiting}
			$empty={empty && persistent}
			$persistent={persistent}
			aria-live='polite'
			aria-hidden={exiting}
		>
			<Left>
				<Count>
					<CountNumber>
						<TweenedCount value={count} />
					</CountNumber>
					<CountLabel>{countLabel}</CountLabel>
				</Count>
				<Clear type='button' onClick={onClear} disabled={empty}>
					<ClearX aria-hidden='true'>×</ClearX>
					Clear
				</Clear>
			</Left>
			{hasSecondary || !hideDelete ? <Split /> : null}
			<Right>
				{hasSecondary
					? secondaryActions!.map((a) => (
						<SecondaryBtn
							key={a.key}
							type='button'
							$tone={a.tone ?? 'default'}
							onClick={a.onClick}
							disabled={a.isLoading || a.disabled || empty}
						>
							{a.icon ? (
								<SecondaryIcon aria-hidden='true'>{a.icon}</SecondaryIcon>
							) : null}
							{a.label}
							{typeof a.count === 'number' ? (
								<>
									{' '}
									<SecondaryCountSlot>
										<TweenedCount value={a.count} />
									</SecondaryCountSlot>
								</>
							) : null}
						</SecondaryBtn>
					))
					: null}
				{hideDelete ? null : (
					<DangerBtn
						type='button'
						onClick={onConfirm}
						disabled={isLoading || empty}
					>
						<TrashIcon aria-hidden='true'>
							<DeleteOutline />
						</TrashIcon>
						{deleteBody}
					</DangerBtn>
				)}
			</Right>
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

const Bar = styled.div<{
	$exiting: boolean
	$empty?: boolean
	$persistent?: boolean
}>`
	display: inline-flex;
	align-items: stretch;
	background: ${T.cardBg};
	border: 1px solid ${T.border};
	border-radius: 12px;
	overflow: hidden;
	transform-origin: top right;
	will-change: transform, opacity;
	/* Non-persistent mode keeps the old mount/unmount animation.
	 * Persistent mode skips keyframe animation entirely — the bar
	 * is always on screen, and empty↔active transitions ride the
	 * opacity transition below. This prevents a visible pop every
	 * time count toggles between 0 and >0. */
	animation: ${({ $exiting, $persistent }) =>
			$persistent ? 'none' : $exiting ? barExit : barEnter}
		${({ $exiting }) => ($exiting ? '220ms' : '260ms')}
		cubic-bezier(0.22, 1.3, 0.36, 1) both;
	opacity: ${({ $empty }) => ($empty ? 0.55 : 1)};
	transition: opacity 220ms ease;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transition: none;
	}
`

const Left = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	padding: 10px 16px;
	background: ${T.subtleBg};
`

const Count = styled.span`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	white-space: nowrap;
`

const CountNumber = styled.span`
	display: inline-block;
	/* 2ch keeps the single ↔ double-digit transition from shifting
	 * the "selected" label while the tween rolls through. */
	min-width: 2ch;
	text-align: right;
	font-size: 18px;
	font-weight: 700;
	letter-spacing: -0.4px;
	color: ${T.textStrong};
	font-variant-numeric: tabular-nums;
`

const CountLabel = styled.span`
	font-size: 10.5px;
	font-weight: 800;
	letter-spacing: 1.4px;
	text-transform: uppercase;
	color: ${T.textSecondary};
`

const Clear = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 4px;
	border: 0;
	background: transparent;
	color: ${T.textSecondary};
	font-family: inherit;
	font-size: 12px;
	font-weight: 600;
	padding: 4px 6px;
	border-radius: 6px;
	cursor: pointer;
	transition: background 200ms ease, color 200ms ease, opacity 200ms ease;
	&:hover:not(:disabled) {
		background: rgba(15, 23, 42, 0.05);
		color: ${T.textStrong};
	}
	&:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const ClearX = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 14px;
	height: 14px;
	line-height: 1;
	font-size: 16px;
	font-weight: 700;
	transition: transform 260ms cubic-bezier(0.22, 1.3, 0.36, 1);
	${Clear}:hover & {
		transform: rotate(180deg);
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const Split = styled.span`
	width: 1px;
	align-self: stretch;
	background: ${T.divider};
`

const Right = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 10px;
	background: ${T.cardBg};
`

/* ─── Secondary actions — e.g. Job Posts Retry analysis ────────── */

const replaySpin = keyframes`
	0%   { transform: rotate(0deg); }
	100% { transform: rotate(-360deg); }
`

const SecondaryBtn = styled.button<{ $tone: 'default' | 'warning' }>`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border: 1px solid ${T.border};
	background: ${T.cardBg};
	color: ${({ $tone }) => ($tone === 'warning' ? '#a26608' : T.textStrong)};
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 600;
	padding: 7px 12px;
	border-radius: 8px;
	cursor: pointer;
	transition:
		border-color 200ms ease,
		background 200ms ease,
		color 200ms ease,
		opacity 200ms ease;
	&:hover:not(:disabled) {
		border-color: ${({ $tone }) =>
			$tone === 'warning' ? 'rgba(245, 158, 11, 0.5)' : T.primary};
		color: ${({ $tone }) =>
			$tone === 'warning' ? '#a26608' : T.primary};
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const SecondaryIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	svg {
		font-size: 16px;
	}
	${SecondaryBtn}:hover:not(:disabled) & {
		animation: ${replaySpin} 420ms cubic-bezier(0.6, 0.1, 0.36, 1) both;
	}
	@media (prefers-reduced-motion: reduce) {
		${SecondaryBtn}:hover:not(:disabled) & {
			animation: none;
		}
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

const DangerBtn = styled.button`
	appearance: none;
	display: inline-flex;
	align-items: center;
	gap: 7px;
	border: 0;
	background: #dc2626;
	color: #ffffff;
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 600;
	padding: 8px 14px;
	border-radius: 8px;
	cursor: pointer;
	transition:
		background 200ms ease,
		transform 160ms ease,
		opacity 200ms ease;
	&:hover:not(:disabled) {
		background: #b91c1c;
	}
	&:active:not(:disabled) {
		transform: translateY(1px);
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

/* Fixed-width slot for tweened digit(s) in action-button labels
 * (red Delete + secondary Retry). tabular-nums + right-align +
 * min-width in chars keeps digits from pushing the button edge
 * around while counts tween through single ↔ two digits. */
const DeleteCountSlot = styled.span`
	display: inline-block;
	min-width: 2ch;
	text-align: right;
	font-variant-numeric: tabular-nums;
`

const SecondaryCountSlot = styled.span`
	display: inline-block;
	min-width: 2ch;
	text-align: right;
	font-variant-numeric: tabular-nums;
`

const TrashIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transform-origin: 50% 20%;
	svg {
		font-size: 17px;
	}
	${DangerBtn}:hover:not(:disabled) & {
		animation: ${trashWiggle} 520ms cubic-bezier(0.36, 0, 0.66, -0.56) both;
	}
	@media (prefers-reduced-motion: reduce) {
		${DangerBtn}:hover:not(:disabled) & {
			animation: none;
		}
	}
`
