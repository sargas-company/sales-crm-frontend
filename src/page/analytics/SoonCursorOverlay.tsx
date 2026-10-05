import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

/**
 * Floating "no entry" cursor that only shows while the mouse is over
 * a Sales Analytics tab marked as `disabled`. Native OS cursors cannot
 * animate, so we render our own DOM circle that follows the mouse
 * position with a CSS opacity + scale transition — the hover-in /
 * hover-out fade the user asked for.
 *
 * `SHOW_DELAY_MS` acts as an intent-check: a quick pass-through does
 * not trigger the overlay, only a real linger (≥ SHOW_DELAY_MS over
 * the disabled target) does.
 */
const SHOW_DELAY_MS = 180

const SoonCursorOverlay = () => {
	const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
	const [visible, setVisible] = useState(false)
	const timerRef = useRef<number | null>(null)
	const overRef = useRef(false)

	useEffect(() => {
		const match = (t: EventTarget | null): boolean => {
			if (!(t instanceof HTMLElement)) return false
			const btn = t.closest(
				'.tab-list-wrapper .tab-item',
			) as HTMLButtonElement | null
			return !!btn && (btn.disabled || btn.getAttribute('aria-disabled') === 'true')
		}

		const cancelShow = () => {
			if (timerRef.current !== null) {
				window.clearTimeout(timerRef.current)
				timerRef.current = null
			}
		}

		const onMove = (e: MouseEvent) => {
			setPos({ x: e.clientX, y: e.clientY })
			const nowOver = match(e.target)

			if (nowOver && !overRef.current) {
				// just entered — arm the show-timer
				overRef.current = true
				cancelShow()
				timerRef.current = window.setTimeout(() => {
					timerRef.current = null
					if (overRef.current) setVisible(true)
				}, SHOW_DELAY_MS)
			} else if (!nowOver && overRef.current) {
				// just left — cancel pending and hide immediately
				overRef.current = false
				cancelShow()
				setVisible(false)
			}
			// still over or still outside — do nothing
		}

		const onLeave = () => {
			overRef.current = false
			cancelShow()
			setVisible(false)
		}

		document.addEventListener('mousemove', onMove)
		document.addEventListener('mouseleave', onLeave)
		window.addEventListener('blur', onLeave)
		return () => {
			document.removeEventListener('mousemove', onMove)
			document.removeEventListener('mouseleave', onLeave)
			window.removeEventListener('blur', onLeave)
			cancelShow()
		}
	}, [])

	return (
		<Dot
			$visible={visible}
			style={{ transform: `translate3d(${pos.x - 14}px, ${pos.y - 14}px, 0)` }}
			aria-hidden='true'
		>
			<svg width='28' height='28' viewBox='0 0 28 28'>
				<circle
					cx='14'
					cy='14'
					r='10'
					fill='#ffffff'
					stroke='#dc2626'
					strokeWidth='2.6'
				/>
				<line
					x1='7'
					y1='7'
					x2='21'
					y2='21'
					stroke='#dc2626'
					strokeWidth='2.6'
					strokeLinecap='round'
				/>
			</svg>
		</Dot>
	)
}

export default SoonCursorOverlay

const Dot = styled.div<{ $visible: boolean }>`
	position: fixed;
	top: 0;
	left: 0;
	width: 28px;
	height: 28px;
	pointer-events: none;
	z-index: 10000;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	scale: ${(p) => (p.$visible ? '1' : '0.6')};
	transition:
		opacity 180ms cubic-bezier(0.22, 1, 0.36, 1),
		scale 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
	will-change: transform, opacity;
	filter: drop-shadow(0 2px 6px rgba(220, 38, 38, 0.25));
`
