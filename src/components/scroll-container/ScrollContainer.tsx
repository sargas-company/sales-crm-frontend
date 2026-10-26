import { forwardRef, ReactNode, useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import Box from '../box/Box'
import { BoxProps } from '../box/type'

const SCROLL_IDLE_MS = 700

const ScrollContainer = forwardRef<HTMLDivElement, Props>((props, ref) => {
	const { maxHeight, children, classes, onClick, scrollBarSize, height } = props
	const contentRef = useRef<HTMLDivElement | null>(null)
	const [scrolling, setScrolling] = useState(false)

	/* Show the scrollbar only while the user is actively scrolling
	 * — the thumb fades back out ~700ms after the last scroll event.
	 * Mere hover no longer triggers it. */
	useEffect(() => {
		const el = contentRef.current
		if (!el) return
		let timer: number | null = null
		const onScroll = () => {
			setScrolling(true)
			if (timer) window.clearTimeout(timer)
			timer = window.setTimeout(() => {
				setScrolling(false)
				timer = null
			}, SCROLL_IDLE_MS)
		}
		el.addEventListener('scroll', onScroll, { passive: true })
		return () => {
			el.removeEventListener('scroll', onScroll)
			if (timer) window.clearTimeout(timer)
		}
	}, [])

	return (
		<StyledScrollContainer
			className={`${classes ? classes : ''} ${scrolling ? 'scrolling' : ''}`.trim()}
			height={height}
			maxHeight={maxHeight}
			onClick={onClick}
			scrollBarSize={scrollBarSize}
			ref={ref}
		>
			<Box
				{...props}
				ref={(node: HTMLDivElement | null) => {
					contentRef.current = node
				}}
				className='scroll-content'
			>
				{children}
			</Box>
		</StyledScrollContainer>
	)
})
export default ScrollContainer

interface Props extends BoxProps {
	maxHeight: string
	height?: string
	children: ReactNode
	classes?: string
	onClick?: () => void
	scrollBarSize?: string
}

const StyledScrollContainer = styled('div')<{
	maxHeight: string
	height?: string
	scrollBarSize?: string
}>`
	width: 100%;
	min-width: 0px;
	display: contents;

	& .scroll-content {
		width: 100%;
		max-height: ${({ maxHeight }) => maxHeight};
		${({ height }) => height && `height: ${height};`}
		overflow-y: auto;
		/* Reserve a stable gutter for the scrollbar so the content
		 * area doesn't resize when the scrollbar appears/disappears.
		 * Fixes the pill-width "jump" (and chevron shift) in the
		 * nav sidebar when a group is expanded and new rows push
		 * the content past the viewport. */
		scrollbar-gutter: stable;
	}

	& ::-webkit-scrollbar {
		width: ${({ scrollBarSize }) => scrollBarSize || `8px`};
	}
	& ::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 6px;
		transition: background 240ms ease;
	}
	&.scrolling ::-webkit-scrollbar-thumb {
		background: #9f9f9f70;
	}
`
