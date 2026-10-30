import { useLayoutEffect, useRef, useState } from 'react'
import {
	TapeIndicator,
	TapePill,
	TapePills,
} from '../../analytics/filters/filters.styled'

interface Preset<T extends string> {
	value: T
	label: string
}

interface Props<T extends string> {
	presets: Preset<T>[]
	value: T
	onChange: (v: T) => void
	ariaLabel: string
}

/* Wrapper around TapePills + TapeIndicator (orange sliding tape) —
 * identical mechanic to SalesFiltersBar / LeadList. Pass a preset
 * list and the current value; it handles the measure + translate. */
export function FilterTapes<T extends string>({
	presets,
	value,
	onChange,
	ariaLabel,
}: Props<T>) {
	const ref = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ left: number; width: number; opacity: number }>({
		left: 0,
		width: 0,
		opacity: 0,
	})
	useLayoutEffect(() => {
		if (!ref.current) return
		const el = ref.current.querySelector<HTMLButtonElement>('[data-active="true"]')
		if (el) setInd({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
	}, [value])
	return (
		<TapePills ref={ref} role='tablist' aria-label={ariaLabel}>
			<TapeIndicator
				style={{
					transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
					width: `${ind.width}px`,
					opacity: ind.opacity,
				}}
			/>
			{presets.map((p) => (
				<TapePill
					key={p.value}
					type='button'
					role='tab'
					data-active={value === p.value || undefined}
					aria-selected={value === p.value}
					$active={value === p.value}
					onClick={() => onChange(p.value)}
				>
					{p.label}
				</TapePill>
			))}
		</TapePills>
	)
}
