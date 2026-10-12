import {
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'

import { COUNTRIES } from '../../utils/location'

/*
 * Reusable country autocomplete — the same shape the Job Posts list
 * ships, trimmed to pure-static country suggestions (no city-endpoint
 * dependency so Sales surfaces can use it without a cross-domain
 * API call). The field stays a free-text substring so a user can
 * type a city or any fragment the dropdown doesn't cover; `onChange`
 * fires on every keystroke, picking a country just fills the full
 * country name.
 */
interface Props {
	value: string
	onChange: (v: string) => void
	placeholder?: string
	ariaLabel?: string
	/** Forwarded to the input so forms can focus it by name. */
	name?: string
	/** Error state — mirrors the TextField red border. */
	error?: boolean
	/**
	 * Visual variant.
	 *   - `default` — matches the form TextField (height, border,
	 *                 radius, focus ring) so it sits in a FieldGrid
	 *                 without a size or stroke mismatch.
	 *   - `paper`   — matches the "paper" filter pill used in the
	 *                 list toolbars (same min-height, border, radius
	 *                 and typography as `InlineSelect` in
	 *                 freshPaperFilters so the row stays aligned).
	 */
	variant?: 'default' | 'paper'
}

const CountryAutocomplete = ({
	value,
	onChange,
	placeholder,
	ariaLabel,
	name,
	error,
	variant = 'default',
}: Props) => {
	const [open, setOpen] = useState(false)
	const [active, setActive] = useState(0)
	const wrapRef = useRef<HTMLDivElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const matches = useMemo(() => {
		const q = value.trim().toLowerCase()
		const list =
			q === ''
				? COUNTRIES
				: COUNTRIES.filter(
						(c) =>
							c.name.toLowerCase().includes(q) ||
							c.iso2.toLowerCase() === q,
					)
		return list.slice(0, 10)
	}, [value])

	useEffect(() => {
		if (!open) return
		const onDocClick = (e: MouseEvent) => {
			const t = e.target as Node
			if (
				!wrapRef.current?.contains(t) &&
				!menuRef.current?.contains(t)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', onDocClick)
		return () => document.removeEventListener('mousedown', onDocClick)
	}, [open])

	useEffect(() => {
		setActive(0)
	}, [value, open])

	const pick = (name: string) => {
		onChange(name)
		setOpen(false)
		inputRef.current?.blur()
	}

	const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setOpen(true)
			setActive((i) => Math.min(i + 1, matches.length - 1))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setActive((i) => Math.max(i - 1, 0))
		} else if (e.key === 'Enter' && open && matches[active]) {
			e.preventDefault()
			pick(matches[active].name)
		} else if (e.key === 'Escape') {
			setOpen(false)
		}
	}

	// Portal + fixed position — same stacking-escape trick as the
	// Job Posts implementation so sticky headers / card z-indices
	// never clip the dropdown.
	const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(
		null,
	)
	useLayoutEffect(() => {
		if (!open) return
		const update = () => {
			const el = wrapRef.current
			if (!el) return
			const r = el.getBoundingClientRect()
			setRect({ top: r.bottom + 6, left: r.left, width: r.width })
		}
		update()
		window.addEventListener('resize', update)
		window.addEventListener('scroll', update, true)
		return () => {
			window.removeEventListener('resize', update)
			window.removeEventListener('scroll', update, true)
		}
	}, [open])

	const InputEl = variant === 'paper' ? PaperInput : Input
	return (
		<Wrap ref={wrapRef}>
			<InputEl
				ref={inputRef}
				type='text'
				name={name}
				$error={error}
				aria-invalid={error ? true : undefined}
				placeholder={placeholder ?? 'Any country'}
				value={value}
				maxLength={60}
				onChange={(e) => {
					onChange(e.target.value)
					setOpen(true)
				}}
				onFocus={() => setOpen(true)}
				onKeyDown={onKey}
				aria-label={ariaLabel ?? 'Country'}
				autoComplete='off'
				role='combobox'
				aria-expanded={open}
				aria-autocomplete='list'
			/>
			{open && matches.length > 0 && rect
				? createPortal(
						<Menu
							ref={menuRef}
							role='listbox'
							style={{
								top: rect.top,
								left: rect.left,
								minWidth: rect.width,
							}}
						>
							{matches.map((c, i) => (
								<Option
									key={c.iso2}
									role='option'
									aria-selected={i === active}
									$active={i === active}
									onMouseDown={(e) => {
										e.preventDefault()
										pick(c.name)
									}}
									onMouseEnter={() => setActive(i)}
								>
									<span className='flag'>{c.flag || '🏳️'}</span>
									<span className='name'>{c.name}</span>
									<span className='code'>{c.iso2}</span>
								</Option>
							))}
						</Menu>,
						document.body,
					)
				: null}
		</Wrap>
	)
}

export default CountryAutocomplete

const Wrap = styled.div`
	position: relative;
	display: inline-block;
	width: 100%;
`

/* Mirrors the form TextField (ui/input/text-field): same height,
   border weight, radius, font and focus ring, so Country never reads
   as a foreign control inside a FieldGrid. */
const Input = styled.input<{ $error?: boolean }>`
	width: 100%;
	box-sizing: border-box;
	padding: 1rem 0.8rem;
	font: inherit;
	font-size: 1rem;
	line-height: normal;
	border: 1.5px solid
		${({ $error }) => ($error ? '#d32f2f' : '#c9c9c9c4')};
	border-radius: 8px;
	background: transparent;
	color: inherit;
	outline: none;
	transition:
		border-color 160ms ease,
		box-shadow 160ms ease;

	&:hover:not(:focus):not(:disabled) {
		border-color: ${({ $error }) => ($error ? '#d32f2f' : '#9f9f9f')};
	}
	&:focus,
	&:focus-visible {
		border-color: ${({ $error }) => ($error ? '#d32f2f' : 'rgba(3, 105, 161, 1)')};
		/* Mirrors the TextField rule: error ring stays exactly 1.5px —
		   focus on an invalid field adds no outline and no glow. */
		outline: ${({ $error }) =>
			$error ? 'none' : 'rgba(3, 105, 161, 1) solid 2px'};
		outline-offset: -1px;
	}
	&:disabled {
		pointer-events: none;
		color: #b3b3b3;
	}
	&::placeholder {
		color: rgba(15, 23, 42, 0.4);
	}
`

// Paper variant — mirrors InlineSelect in freshPaperFilters so a
// country filter sits on the same row as other list filters without
// a size or stroke mismatch. The chevron SVG and token values here
// are copied verbatim from InlineSelect; keep them in sync if the
// paper filter palette changes.
const PAPER_INK = '#1F1A14'
const PAPER_MUTE = '#7D6E5D'
const PAPER_RULE_STRONG = 'rgba(31, 26, 20, 0.22)'

const PaperInput = styled.input<{ $error?: boolean }>`
	appearance: none;
	-webkit-appearance: none;
	box-sizing: border-box;
	width: 100%;
	min-width: 180px;
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
	cursor: text;
	transition: border-color 180ms ease;

	&:hover,
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: ${PAPER_INK};
	}
	&::placeholder {
		color: ${PAPER_MUTE};
		font-weight: 500;
	}
`

const Menu = styled.div`
	position: fixed;
	z-index: 1000;
	background: #fff;
	border: 1px solid rgba(15, 23, 42, 0.12);
	border-radius: 10px;
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.06),
		0 12px 28px -8px rgba(15, 23, 42, 0.18);
	padding: 4px;
	max-height: 320px;
	overflow-y: auto;
`

const Option = styled.div<{ $active?: boolean }>`
	display: grid;
	grid-template-columns: 24px 1fr auto;
	align-items: center;
	gap: 10px;
	padding: 7px 10px;
	border-radius: 7px;
	cursor: pointer;
	background: ${(p) => (p.$active ? 'rgba(59, 130, 246, 0.08)' : 'transparent')};
	&:hover {
		background: rgba(59, 130, 246, 0.08);
	}
	.flag {
		font-size: 18px;
		line-height: 1;
	}
	.name {
		font-size: 13.5px;
		color: #0f172a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.code {
		font-size: 10.5px;
		color: rgba(15, 23, 42, 0.5);
		letter-spacing: 0.04em;
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	}
`
