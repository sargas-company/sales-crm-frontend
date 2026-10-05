import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import {
	CalendarTodayRounded,
	ChevronLeftRounded,
	ChevronRightRounded,
	CloseRounded,
} from '@mui/icons-material'

interface Props {
	label: string
	value: string
	onChange: (iso: string) => void
	min?: string
	max?: string
	placeholder?: string
	tabIndex?: number
	/** Accent colour family — 'blue' (default) or 'orange'. */
	accent?: 'blue' | 'orange'
	/** Trigger height variant — 'md' (default) or 'lg' (matches inline
	 * selects in filter bars). */
	size?: 'md' | 'lg'
}

const ACCENTS = {
	blue: {
		base: '#0369a1',
		rgb: '3, 105, 161',
		darkBase: '#38bdf8',
		darkRgb: '56, 189, 248',
	},
	orange: {
		base: '#e85d2f',
		rgb: '232, 93, 47',
		darkBase: '#fb923c',
		darkRgb: '251, 146, 60',
	},
} as const

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']
const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
]

function toIso(d: Date): string {
	const yr = d.getFullYear()
	const mo = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${yr}-${mo}-${day}`
}

function parseIso(s: string): Date | null {
	if (!s) return null
	const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
	if (!m) return null
	const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
	return Number.isNaN(d.getTime()) ? null : d
}

function sameYMD(a: Date, b: Date): boolean {
	return (
		a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate()
	)
}

function formatShort(iso: string): string {
	const d = parseIso(iso)
	if (!d) return ''
	return d.toLocaleDateString('en-US', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	})
}

function monthGrid(year: number, month: number): Date[] {
	const first = new Date(year, month, 1)
	const jsDow = first.getDay() // 0 = Sun
	const dowMonFirst = (jsDow + 6) % 7 // 0 = Mon
	const start = new Date(year, month, 1 - dowMonFirst)
	const days: Date[] = []
	for (let i = 0; i < 42; i++) {
		days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
	}
	return days
}

const DatePickerPill = ({
	label,
	value,
	onChange,
	min,
	max,
	placeholder = 'Select date',
	tabIndex,
	accent = 'blue',
	size = 'md',
}: Props) => {
	const palette = ACCENTS[accent]
	const accentVars = {
		'--dp-accent': palette.base,
		'--dp-accent-rgb': palette.rgb,
		'--dp-accent-dark': palette.darkBase,
		'--dp-accent-dark-rgb': palette.darkRgb,
	} as Record<string, string>
	const [open, setOpen] = useState(false)
	const [viewYear, setViewYear] = useState(() => {
		const d = parseIso(value) ?? new Date()
		return d.getFullYear()
	})
	const [viewMonth, setViewMonth] = useState(() => {
		const d = parseIso(value) ?? new Date()
		return d.getMonth()
	})

	const rootRef = useRef<HTMLDivElement>(null)
	const triggerRef = useRef<HTMLButtonElement>(null)
	const popRef = useRef<HTMLDivElement>(null)
	const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

	useLayoutEffect(() => {
		if (!open) return
		const measure = () => {
			if (!triggerRef.current) return
			const r = triggerRef.current.getBoundingClientRect()
			setPos({ top: r.bottom + 8, left: r.left })
		}
		measure()
		window.addEventListener('resize', measure)
		window.addEventListener('scroll', measure, true)
		return () => {
			window.removeEventListener('resize', measure)
			window.removeEventListener('scroll', measure, true)
		}
	}, [open])

	useEffect(() => {
		if (!open) return
		const onDoc = (e: MouseEvent) => {
			if (!rootRef.current || !popRef.current) return
			const t = e.target as Node
			if (rootRef.current.contains(t) || popRef.current.contains(t)) return
			setOpen(false)
		}
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setOpen(false)
		}
		document.addEventListener('mousedown', onDoc)
		document.addEventListener('keydown', onEsc)
		return () => {
			document.removeEventListener('mousedown', onDoc)
			document.removeEventListener('keydown', onEsc)
		}
	}, [open])

	useEffect(() => {
		if (!open) return
		const d = parseIso(value)
		if (d) {
			setViewYear(d.getFullYear())
			setViewMonth(d.getMonth())
		}
	}, [open, value])

	const minDate = useMemo(() => (min ? parseIso(min) : null), [min])
	const maxDate = useMemo(() => (max ? parseIso(max) : null), [max])
	const selected = useMemo(() => parseIso(value), [value])
	const today = useMemo(() => {
		const d = new Date()
		d.setHours(0, 0, 0, 0)
		return d
	}, [])

	const grid = useMemo(() => monthGrid(viewYear, viewMonth), [viewYear, viewMonth])

	const shiftMonth = (delta: number) => {
		const m = viewMonth + delta
		const yr = viewYear + Math.floor(m / 12)
		const mm = ((m % 12) + 12) % 12
		setViewYear(yr)
		setViewMonth(mm)
	}

	const isDisabled = (d: Date): boolean => {
		if (minDate && d < minDate) return true
		if (maxDate && d > maxDate) return true
		return false
	}

	const handlePick = (d: Date) => {
		if (isDisabled(d)) return
		onChange(toIso(d))
		setOpen(false)
	}

	const handleClear = () => {
		onChange('')
		setOpen(false)
	}

	const popover = (
		<Popover
			ref={popRef}
			$open={open}
			aria-hidden={!open}
			style={
				pos
					? { top: `${pos.top}px`, left: `${pos.left}px`, ...accentVars }
					: { visibility: 'hidden', ...accentVars }
			}
		>
			<PopHead>
				<NavBtn type='button' onClick={() => shiftMonth(-1)} aria-label='Previous month'>
					<ChevronLeftRounded />
				</NavBtn>
				<MonthTitle>
					{MONTH_NAMES[viewMonth]} <span className='yr'>{viewYear}</span>
				</MonthTitle>
				<NavBtn type='button' onClick={() => shiftMonth(1)} aria-label='Next month'>
					<ChevronRightRounded />
				</NavBtn>
			</PopHead>
			<Weekdays>
				{WEEKDAYS.map((w) => (
					<span key={w}>{w}</span>
				))}
			</Weekdays>
			<DaysGrid>
				{grid.map((d) => {
					const isThisMonth = d.getMonth() === viewMonth
					const disabled = isDisabled(d)
					const isSelected = selected ? sameYMD(d, selected) : false
					const isToday = sameYMD(d, today)
					return (
						<DayBtn
							key={d.toISOString()}
							type='button'
							onClick={() => handlePick(d)}
							disabled={disabled}
							$otherMonth={!isThisMonth}
							$selected={isSelected}
							$today={isToday}
						>
							{d.getDate()}
						</DayBtn>
					)
				})}
			</DaysGrid>
			<PopFooter>
				<FooterBtn
					type='button'
					onClick={() => {
						const t = new Date()
						t.setHours(0, 0, 0, 0)
						if (!isDisabled(t)) {
							onChange(toIso(t))
							setOpen(false)
						}
					}}
				>
					Today
				</FooterBtn>
				{value && (
					<FooterBtn type='button' className='muted' onClick={handleClear}>
						Clear
					</FooterBtn>
				)}
			</PopFooter>
		</Popover>
	)

	return (
		<Root ref={rootRef} style={accentVars}>
			<Trigger
				ref={triggerRef}
				type='button'
				onClick={() => setOpen((v) => !v)}
				$active={open}
				$hasValue={!!value}
				$size={size}
				$accent={accent}
				tabIndex={tabIndex}
			>
				<CalendarTodayRounded className='ico' />
				<span className='lbl'>{label}</span>
				<span className={value ? 'val' : 'val empty'}>{value ? formatShort(value) : placeholder}</span>
				{value && (
					<CloseIcon
						as='span'
						role='button'
						tabIndex={-1}
						aria-label='Clear date'
						onClick={(e) => {
							e.stopPropagation()
							onChange('')
						}}
					>
						<CloseRounded />
					</CloseIcon>
				)}
			</Trigger>
			{typeof document !== 'undefined' && createPortal(popover, document.body)}
		</Root>
	)
}

export default DatePickerPill

/* ── Styles ─────────────────────────────────────────────────────── */

const Root = styled.div`
	position: relative;
	display: inline-block;
`

const Trigger = styled.button<{
	$active: boolean
	$hasValue: boolean
	$size: 'md' | 'lg'
	$accent: 'blue' | 'orange'
}>`
	position: relative;
	display: inline-flex;
	align-items: center;
	gap: 10px;
	box-sizing: border-box;
	min-height: ${(p) => (p.$size === 'lg' ? '42px' : 'auto')};
	padding: ${(p) =>
		p.$size === 'lg' ? '10px 16px 10px 14px' : '9px 16px 9px 14px'};
	border-radius: 999px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	font: inherit;
	cursor: pointer;
	transition:
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 200ms ease,
		box-shadow 220ms ease;

	.ico {
		font-size: 15px;
		color: #64748b;
		transition:
			color 200ms ease,
			transform 260ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}
	.lbl {
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: #0f172a;
	}
	.val {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-variant-numeric: tabular-nums;
		font-size: 12.5px;
		font-weight: 600;
		color: ${(p) => (p.$hasValue ? '#0f172a' : '#94a3b8')};
		letter-spacing: -0.1px;
		min-width: 90px;
		text-align: left;
	}
	.val.empty {
		font-family: 'Inter', system-ui, sans-serif;
		font-weight: 500;
	}

	&:hover {
		transform: translateY(-1px);
		border-color: ${(p) =>
			p.$accent === 'orange' ? '#241E16' : 'rgba(15, 23, 42, 0.18)'};
	}
	&:hover .ico {
		color: var(--dp-accent);
		transform: rotate(-6deg);
	}

	${(p) =>
		p.$active &&
		`
		border-color: ${p.$accent === 'orange' ? '#241E16' : 'var(--dp-accent)'};
		.ico { color: var(--dp-accent); }
	`}

	[data-theme='dark'] && {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.10);
	}
	[data-theme='dark'] && .ico {
		color: #94a3b8;
	}
	[data-theme='dark'] && .lbl {
		color: #e2e8f0;
	}
	[data-theme='dark'] && .val {
		color: ${(p) => (p.$hasValue ? '#ffffff' : 'rgba(203, 213, 225, 0.55)')};
	}
	[data-theme='dark'] &&:hover {
		border-color: rgba(255, 255, 255, 0.24);
	}
	[data-theme='dark'] &&:hover .ico {
		color: var(--dp-accent-dark);
	}
	${(p) =>
		p.$active &&
		`
		[data-theme='dark'] && {
			border-color: var(--dp-accent-dark);
		}
		[data-theme='dark'] && .ico { color: var(--dp-accent-dark); }
	`}
`

const CloseIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 20px;
	height: 20px;
	border-radius: 50%;
	color: #94a3b8;
	transition:
		background 160ms ease,
		color 160ms ease;

	svg {
		font-size: 15px;
	}

	&:hover {
		background: rgba(15, 23, 42, 0.08);
		color: #0f172a;
	}
`

const Popover = styled.div<{ $open: boolean }>`
	position: fixed;
	z-index: 1200;
	min-width: 300px;
	padding: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 18px;
	box-shadow:
		0 4px 8px rgba(15, 23, 42, 0.04),
		0 20px 48px rgba(15, 23, 42, 0.14);
	pointer-events: ${(p) => (p.$open ? 'auto' : 'none')};
	opacity: ${(p) => (p.$open ? 1 : 0)};
	transform: translateY(${(p) => (p.$open ? '0' : '-6px')})
		scale(${(p) => (p.$open ? 1 : 0.98)});
	transform-origin: top left;
	transition:
		opacity 180ms ease,
		transform 220ms cubic-bezier(0.22, 1.35, 0.36, 1);
`

const PopHead = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 2px 4px 10px;
`

const MonthTitle = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.3px;
	color: #0f172a;

	.yr {
		color: #64748b;
		font-weight: 500;
		margin-left: 4px;
	}
`

const NavBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	border: 0;
	background: transparent;
	color: #64748b;
	cursor: pointer;
	transition:
		background 140ms ease,
		color 140ms ease;

	svg {
		font-size: 20px;
	}

	&:hover {
		background: rgba(15, 23, 42, 0.06);
		color: #0f172a;
	}
`

const Weekdays = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 2px;
	padding: 0 2px 6px;

	span {
		text-align: center;
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.4px;
		text-transform: uppercase;
		color: #94a3b8;
	}
`

const DaysGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 2px;
`

const DayBtn = styled.button<{
	$otherMonth: boolean
	$selected: boolean
	$today: boolean
}>`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	height: 34px;
	border: 0;
	border-radius: 10px;
	background: transparent;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	font-variant-numeric: tabular-nums;
	color: ${(p) => (p.$otherMonth ? '#cbd5e1' : '#0f172a')};
	font-weight: ${(p) => (p.$selected ? 700 : 500)};
	cursor: pointer;
	transition:
		background 140ms ease,
		color 140ms ease,
		transform 140ms ease;

	&:hover:not(:disabled) {
		background: ${(p) =>
			p.$selected
				? 'var(--dp-accent)'
				: 'rgba(var(--dp-accent-rgb), 0.10)'};
		color: ${(p) => (p.$selected ? '#ffffff' : 'var(--dp-accent)')};
	}

	&:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	${(p) =>
		p.$today &&
		!p.$selected &&
		`
		box-shadow: inset 0 0 0 1.5px rgba(var(--dp-accent-rgb), 0.6);
	`}

	${(p) =>
		p.$selected &&
		`
		background: var(--dp-accent);
		color: #ffffff;
	`}
`

const PopFooter = styled.div`
	display: flex;
	justify-content: space-between;
	gap: 8px;
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid rgba(15, 23, 42, 0.06);
`

const FooterBtn = styled.button`
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 999px;
	border: 0;
	background: rgba(var(--dp-accent-rgb), 0.08);
	color: var(--dp-accent);
	font: inherit;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: pointer;
	transition:
		background 140ms ease,
		color 140ms ease;

	&:hover {
		background: rgba(var(--dp-accent-rgb), 0.16);
	}

	&.muted {
		background: transparent;
		color: #94a3b8;

		&:hover {
			background: rgba(15, 23, 42, 0.06);
			color: #0f172a;
		}
	}
`
