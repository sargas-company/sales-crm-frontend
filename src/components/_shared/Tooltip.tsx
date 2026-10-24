import {
	ReactNode,
	useLayoutEffect,
	useRef,
	useState,
	cloneElement,
	isValidElement,
	ReactElement,
} from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'

type Side = 'top' | 'bottom'

type Props = {
	title: string
	description?: ReactNode
	preview?: ReactNode
	cta?: { label: string; meta?: string; onClick?: () => void }
	side?: Side
	delay?: number
	/* Expects exactly one element child — Fragment or multiple
	 * children will be ignored. */
	children: ReactElement
}

type Pos = { top: number; left: number } | null

const SIDE_GAP = 10

export const Tooltip = ({
	title,
	description,
	preview,
	cta,
	side = 'bottom',
	delay = 140,
	children,
}: Props) => {
	const [open, setOpen] = useState(false)
	const [closing, setClosing] = useState(false)
	const [pos, setPos] = useState<Pos>(null)
	const anchorRef = useRef<HTMLElement | null>(null)
	const popRef = useRef<HTMLDivElement | null>(null)
	const openTimer = useRef<number | null>(null)
	const closeTimer = useRef<number | null>(null)

	const show = () => {
		if (closeTimer.current) {
			window.clearTimeout(closeTimer.current)
			closeTimer.current = null
		}
		if (open) {
			setClosing(false)
			return
		}
		if (openTimer.current) window.clearTimeout(openTimer.current)
		openTimer.current = window.setTimeout(() => {
			setClosing(false)
			setOpen(true)
		}, delay)
	}
	const hide = () => {
		if (openTimer.current) {
			window.clearTimeout(openTimer.current)
			openTimer.current = null
		}
		if (!open) return
		setClosing(true)
		closeTimer.current = window.setTimeout(() => {
			setOpen(false)
			setClosing(false)
			setPos(null)
			closeTimer.current = null
		}, 180)
	}

	useLayoutEffect(() => {
		if (!open) return
		const anchor = anchorRef.current
		const pop = popRef.current
		if (!anchor || !pop) return
		const place = () => {
			const r = anchor.getBoundingClientRect()
			const pw = pop.offsetWidth
			const ph = pop.offsetHeight
			let top =
				side === 'bottom' ? r.bottom + SIDE_GAP : r.top - ph - SIDE_GAP
			let left = r.left + r.width / 2 - pw / 2
			left = Math.max(8, Math.min(window.innerWidth - pw - 8, left))
			top = Math.max(8, Math.min(window.innerHeight - ph - 8, top))
			setPos({ top, left })
		}
		place()
		window.addEventListener('scroll', place, true)
		window.addEventListener('resize', place)
		return () => {
			window.removeEventListener('scroll', place, true)
			window.removeEventListener('resize', place)
		}
	}, [open, side])

	if (!isValidElement(children)) return null
	const child = children as ReactElement<{
		onMouseEnter?: (e: React.MouseEvent) => void
		onMouseLeave?: (e: React.MouseEvent) => void
		onFocus?: (e: React.FocusEvent) => void
		onBlur?: (e: React.FocusEvent) => void
		ref?: React.Ref<HTMLElement>
	}>

	const clone = cloneElement(child, {
		ref: (node: HTMLElement) => {
			anchorRef.current = node
			const original = (child as unknown as { ref?: React.Ref<HTMLElement> })
				.ref
			if (typeof original === 'function') original(node)
			else if (original && 'current' in (original as object)) {
				;(original as React.MutableRefObject<HTMLElement | null>).current =
					node
			}
		},
		onMouseEnter: (e: React.MouseEvent) => {
			show()
			child.props.onMouseEnter?.(e)
		},
		onMouseLeave: (e: React.MouseEvent) => {
			hide()
			child.props.onMouseLeave?.(e)
		},
		onFocus: (e: React.FocusEvent) => {
			show()
			child.props.onFocus?.(e)
		},
		onBlur: (e: React.FocusEvent) => {
			hide()
			child.props.onBlur?.(e)
		},
	})

	return (
		<>
			{clone}
			{open
				? createPortal(
						<Pop
							ref={popRef}
							$side={side}
							$closing={closing}
							style={
								pos
									? { top: pos.top, left: pos.left }
									: { top: -9999, left: -9999, visibility: 'hidden' }
							}
							role='tooltip'
						>
							<PopTitle>{title}</PopTitle>
							{preview ? <PopPreview>{preview}</PopPreview> : null}
							{description ? (
								<PopDescription>{description}</PopDescription>
							) : null}
							{cta ? (
								<PopCta type='button' onClick={cta.onClick}>
									<span>{cta.label}</span>
									{cta.meta ? <PopCtaMeta>{cta.meta}</PopCtaMeta> : null}
								</PopCta>
							) : null}
						</Pop>,
						document.body,
					)
				: null}
		</>
	)
}

/* ---------- animations ---------- */

const popIn = keyframes`
	0%   { opacity: 0; transform: translateY(-6px) scale(0.9); }
	60%  { opacity: 1; transform: translateY(1px) scale(1.015); }
	100% { opacity: 1; transform: translateY(0) scale(1); }
`

const popOut = keyframes`
	0%   { opacity: 1; transform: translateY(0) scale(1); }
	100% { opacity: 0; transform: translateY(-4px) scale(0.95); }
`

/* ---------- styled ---------- */

const Pop = styled.div<{ $side: Side; $closing?: boolean }>`
	position: fixed;
	z-index: 10000;
	pointer-events: none;
	will-change: transform, opacity;
	min-width: 300px;
	max-width: 640px;
	padding: 22px 22px 18px;
	border-radius: 20px;
	background: #0f172a;
	color: #ffffff;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.08),
		0 24px 50px -16px rgba(15, 23, 42, 0.6),
		0 2px 6px -2px rgba(15, 23, 42, 0.3);
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	transform-origin: ${({ $side }) =>
		$side === 'bottom' ? 'top center' : 'bottom center'};
	animation: ${({ $closing }) =>
			$closing ? popOut : popIn}
		${({ $closing }) => ($closing ? '180ms' : '260ms')}
		cubic-bezier(0.22, 1.2, 0.36, 1) both;
`

const PopTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-style: italic;
	font-size: 17px;
	font-weight: 700;
	letter-spacing: -0.3px;
	line-height: 1.15;
	color: #ffffff;
	margin-bottom: 14px;
`

const PopPreview = styled.div`
	margin: 0 0 14px;
	padding: 12px;
	border-radius: 14px;
	background: #f8fafc;
	color: #0f172a;
	position: relative;
	overflow: hidden;
`

const PopDescription = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 12.5px;
	font-weight: 400;
	line-height: 1.55;
	color: #cbd5e1;
	margin-bottom: 14px;
`

const PopCta = styled.button`
	pointer-events: auto;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	width: 100%;
	justify-content: center;
	padding: 10px 16px;
	border-radius: 999px;
	border: none;
	background: #1e293b;
	color: #ffffff;
	font-family: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	transition: background 160ms ease;

	&:hover {
		background: #334155;
	}
`

const PopCtaMeta = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	color: #94a3b8;
	font-size: 11px;
`
