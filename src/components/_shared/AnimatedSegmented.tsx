import { ReactNode, useLayoutEffect, useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { T } from '../sales-analytics/_shared/tokens'

export interface AnimatedSegmentedItem<T extends string> {
	value: T | ''
	label: string
	color?: string
	icon?: ReactNode
}

interface Props<T extends string> {
	items: AnimatedSegmentedItem<T>[]
	active: T | ''
	onSelect: (v: T | '') => void
}

/**
 * Segmented pill group with a sliding indicator, spring easing,
 * pop-in colour dots and a gentle hover-lift on inactive labels.
 * Respects prefers-reduced-motion. Reusable across list pages.
 */
export function AnimatedSegmented<T extends string>({
	items,
	active,
	onSelect,
}: Props<T>) {
	const ref = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ left: number; width: number; opacity: number }>(
		{ left: 0, width: 0, opacity: 0 },
	)

	useLayoutEffect(() => {
		if (!ref.current) return
		const btn = ref.current.querySelector<HTMLButtonElement>('[data-active="true"]')
		if (btn) {
			setInd({ left: btn.offsetLeft, width: btn.offsetWidth, opacity: 1 })
		}
	}, [active, items.length])

	return (
		<SegGroup ref={ref}>
			<SegIndicator
				style={{
					transform: `translateX(${ind.left}px)`,
					width: `${ind.width}px`,
					opacity: ind.opacity,
				}}
			/>
			{items.map((item) => {
				const isActive = item.value === active
				return (
					<SegBtn
						key={item.value || '__all__'}
						type='button'
						data-active={isActive || undefined}
						$active={isActive}
						$color={item.color}
						onClick={() => onSelect(item.value)}
					>
						{item.icon ? (
							<SegIcon $active={isActive}>{item.icon}</SegIcon>
						) : item.color ? (
							<SegDot $active={isActive} $c={item.color} />
						) : null}
						<SegLabel>{item.label}</SegLabel>
					</SegBtn>
				)
			})}
		</SegGroup>
	)
}

/* ─── Styles ────────────────────────────────────────────────────── */

const groupIn = keyframes`
	from { opacity: 0; transform: translateY(4px); }
	to   { opacity: 1; transform: translateY(0); }
`

const SegGroup = styled.div`
	position: relative;
	display: inline-flex;
	align-items: center;
	padding: 4px;
	gap: 2px;
	border-radius: 999px;
	background: ${T.subtleBg};
	animation: ${groupIn} 400ms cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}

	[data-theme='dark'] & {
		background: rgba(255, 255, 255, 0.06);
	}
`

const SegIndicator = styled.span`
	position: absolute;
	top: 4px;
	bottom: 4px;
	left: 0;
	border-radius: 999px;
	background: #ffffff;
	box-shadow:
		0 1px 3px rgba(15, 23, 42, 0.14),
		0 1px 2px rgba(15, 23, 42, 0.06);
	transition:
		transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1),
		width 380ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 200ms ease;
	pointer-events: none;
	will-change: transform, width;

	@media (prefers-reduced-motion: reduce) {
		transition:
			transform 0ms,
			width 0ms,
			opacity 0ms;
	}

	[data-theme='dark'] & {
		background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
		box-shadow:
			0 2px 6px rgba(3, 105, 161, 0.48),
			inset 0 1px 0 rgba(255, 255, 255, 0.20);
	}
`

const SegBtn = styled.button<{ $active: boolean; $color?: string }>`
	position: relative;
	z-index: 1;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 14px;
	border-radius: 999px;
	border: none;
	background: transparent;
	color: ${({ $active, $color }) =>
		$active ? ($color ?? T.primary) : T.textSecondary};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	cursor: pointer;
	white-space: nowrap;
	transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);
	&:hover {
		color: ${({ $active, $color }) =>
			$active ? ($color ?? T.primary) : T.textStrong};
	}

	[data-theme='dark'] && {
		color: ${({ $active }) =>
			$active ? '#ffffff' : 'rgba(203, 213, 225, 0.72)'} !important;
	}
	[data-theme='dark'] &&:hover {
		color: ${({ $active }) =>
			$active ? '#ffffff' : '#e2e8f0'} !important;
	}
`

const dotPop = keyframes`
	0%   { transform: scale(1); }
	50%  { transform: scale(1.6); }
	100% { transform: scale(1.15); }
`

const SegDot = styled.span<{ $active: boolean; $c: string }>`
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: ${({ $c }) => $c};
	box-shadow: ${({ $active, $c }) =>
		$active ? `0 0 0 3px ${$c}25` : 'none'};
	transform: scale(${({ $active }) => ($active ? 1.15 : 1)});
	transition:
		transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1),
		box-shadow 260ms ease;

	${({ $active }) =>
		$active &&
		css`
			animation: ${dotPop} 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
		`}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transform: none;
	}
`

const iconTilt = keyframes`
	0%   { transform: rotate(0deg) scale(1); }
	40%  { transform: rotate(-8deg) scale(1.18); }
	100% { transform: rotate(0deg) scale(1); }
`

const SegIcon = styled.span<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1);

	${({ $active }) =>
		$active &&
		css`
			animation: ${iconTilt} 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
		`}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const SegLabel = styled.span`
	display: inline-block;
	transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1);
	${SegBtn}:hover & {
		transform: translateY(-1px);
	}

	@media (prefers-reduced-motion: reduce) {
		${SegBtn}:hover & {
			transform: none;
		}
	}
`
