import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import {
	PaymentStatus,
	FinanceGridEntry,
	useUpsertWeeklyEntryMutation,
	useDeleteWeeklyEntryMutation,
} from '../../store/finance-weekly/financeWeeklyApi'

import { PopoverShell, PopoverLeft, PopoverRight } from './financeWeekly.styled'
import { STATUS_META } from './statusMeta'

interface Props {
	anchor: DOMRect
	weekId: string
	projectId: string
	projectName: string
	weekLabel: string
	initial: FinanceGridEntry | null
	onClose: () => void
}

const STATUS_ORDER: PaymentStatus[] = [
	'received',
	'in_transit',
	'expected_later',
	'planned_invoice',
]

// `no_work` never has money attached; `expected_later` is a "we know it's
// coming eventually, don't have a number yet" bucket, so the amount field
// is hidden entirely for both. Everything else is real revenue that must
// be quantified — without an amount the row can't roll up into any metric.
const NO_AMOUNT_STATUSES = new Set<PaymentStatus>(['no_work', 'expected_later'])
const REQUIRED_AMOUNT_STATUSES = new Set<PaymentStatus>([
	'received',
	'in_transit',
	'planned_invoice',
])

export default function CellEditor({
	anchor,
	weekId,
	projectId,
	projectName,
	weekLabel,
	initial,
	onClose,
}: Props) {
	const [status, setStatus] = useState<PaymentStatus>(initial?.status ?? 'in_transit')
	const [amount, setAmount] = useState<string>(initial?.amount ?? '')
	const [note, setNote] = useState<string>(initial?.note ?? '')
	const [closing, setClosing] = useState(false)
	const [closingKind, setClosingKind] = useState<'cancel' | 'success'>('cancel')
	const [saveState, setSaveState] = useState<'idle' | 'saving' | 'success'>('idle')
	const [waveOn, setWaveOn] = useState(false)
	const [upsert] = useUpsertWeeklyEntryMutation()
	const [remove, { isLoading: removing }] = useDeleteWeeklyEntryMutation()
	const wrapRef = useRef<HTMLDivElement>(null)
	const closeTimerRef = useRef<number | null>(null)
	const [pos, setPos] = useState<{
		top: number
		left: number
		flip: boolean
		ready: boolean
	}>({ top: 0, left: 0, flip: false, ready: false })

	const computePos = () => {
		const el = wrapRef.current
		if (!el) return
		const rect = el.getBoundingClientRect()
		const w = rect.width || 340
		const h = rect.height || 320
		const pad = 12
		const vpW = window.innerWidth
		const vpH = window.innerHeight

		// Prefer above the anchor
		let top = anchor.top - h - 10
		let flip = false
		if (top < pad) {
			// Flip below
			top = anchor.bottom + 10
			flip = true
			// If below overflows too, clamp
			if (top + h > vpH - pad) {
				top = Math.max(pad, vpH - h - pad)
			}
		}

		// Horizontal: center on the anchor, clamped inside viewport
		let left = anchor.left + anchor.width / 2 - w / 2
		if (left < pad) left = pad
		if (left + w > vpW - pad) left = vpW - w - pad

		setPos({ top, left, flip, ready: true })
	}

	useLayoutEffect(() => {
		computePos()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [anchor])

	useEffect(() => {
		const onResize = () => computePos()
		window.addEventListener('resize', onResize)
		window.addEventListener('scroll', onResize, true)
		return () => {
			window.removeEventListener('resize', onResize)
			window.removeEventListener('scroll', onResize, true)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// Watch our own size — when the Amount section collapses/expands and
	// the popup was anchored above the cell, this keeps the popup's bottom
	// edge glued to the cell instead of drifting up.
	useEffect(() => {
		const el = wrapRef.current
		if (!el || typeof ResizeObserver === 'undefined') return
		const ro = new ResizeObserver(() => computePos())
		ro.observe(el)
		return () => ro.disconnect()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const requestClose = (kind: 'cancel' | 'success' = 'cancel') => {
		if (closing) return
		setClosingKind(kind)
		setClosing(true)
		closeTimerRef.current = window.setTimeout(onClose, kind === 'success' ? 420 : 220)
	}

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
		}
	}, [])

	useEffect(() => {
		const onDocClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement | null
			if (!wrapRef.current || !target) return
			if (wrapRef.current.contains(target)) return
			// Ignore clicks on other grid cells — the parent will
			// re-mount CellEditor with the new anchor. Closing here
			// would race with the parent's setEditor and swallow the
			// re-open.
			if (target.closest('[data-cell-editor-anchor]')) return
			requestClose()
		}
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') requestClose()
		}
		const t = window.setTimeout(() => document.addEventListener('mousedown', onDocClick), 0)
		document.addEventListener('keydown', onKey)
		return () => {
			window.clearTimeout(t)
			document.removeEventListener('mousedown', onDocClick)
			document.removeEventListener('keydown', onKey)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const amountTrimmed = amount.trim()
	const amountRequired = REQUIRED_AMOUNT_STATUSES.has(status)
	const amountForbidden = NO_AMOUNT_STATUSES.has(status)
	const amountFormatValid =
		amountForbidden || !amountTrimmed || /^\d+(\.\d{1,2})?$/.test(amountTrimmed)
	const amountPositive = Number(amountTrimmed) > 0
	const amountMissing = amountRequired && (!amountTrimmed || !amountPositive)

	const canSave = useMemo(() => {
		if (!amountFormatValid) return false
		if (amountMissing) return false
		if (initial) {
			const normAmount = amountForbidden ? '' : amountTrimmed
			const initialAmount = initial.amount ?? ''
			const initialNote = initial.note ?? ''
			const noteVal = note.trim()
			const noteInitial = initialNote.trim()
			const unchanged =
				status === initial.status &&
				Number(normAmount || 0) === Number(initialAmount || 0) &&
				noteVal === noteInitial
			if (unchanged) return false
		}
		return true
	}, [status, amountFormatValid, amountMissing, amountForbidden, amountTrimmed, note, initial])

	const handleSave = async () => {
		if (saveState !== 'idle') return
		const payload = {
			fiscalWeekId: weekId,
			projectId,
			status,
			amount: NO_AMOUNT_STATUSES.has(status) ? null : amount || null,
			note: note.trim() || null,
		}
		setSaveState('saving')
		try {
			await upsert(payload).unwrap()
			setSaveState('success')
			setWaveOn(true)
			window.setTimeout(() => requestClose('success'), 620)
		} catch {
			setSaveState('idle')
		}
	}
	const handleDelete = async () => {
		if (!initial) return
		await remove(initial.id).unwrap()
		requestClose()
	}

	return createPortal(
		<PopoverShell
			ref={wrapRef}
			$closing={closing}
			$closingKind={closingKind}
			$flip={pos.flip}
			className={waveOn ? 'success-wave-on' : undefined}
			style={{
				top: pos.top,
				left: pos.left,
				visibility: pos.ready ? 'visible' : 'hidden',
			}}
			onMouseDown={(e) => e.stopPropagation()}
		>
			<PopoverLeft $bg={STATUS_META[status].bg} $fg={STATUS_META[status].fg}>
				<div>
					<div className='eyebrow'>{STATUS_META[status].label}</div>
					<div className='proj'>{projectName}</div>
					<div className='week'>{weekLabel}</div>
				</div>
				<div className='amount-big'>
					$
					{amount && !Number.isNaN(Number(amount))
						? Number(amount).toLocaleString('en-US', {
								minimumFractionDigits: amount.includes('.') ? 2 : 0,
								maximumFractionDigits: 2,
							})
						: '0'}
				</div>
			</PopoverLeft>

			<PopoverRight>
				<label>Status</label>
				<div className='statuses'>
					{STATUS_ORDER.map((s) => {
						const meta = STATUS_META[s]
						return (
							<button
								key={s}
								type='button'
								className={`st-btn ${status === s ? 'active' : ''}`}
								style={status === s ? { background: meta.bg, color: meta.fg } : undefined}
								onClick={() => setStatus(s)}
							>
								<span className='dot' style={{ background: meta.color }} />
								{meta.label}
							</button>
						)
					})}
				</div>

				<div className='amt-collapse' data-open={amountForbidden ? 'false' : 'true'} aria-hidden={amountForbidden}>
					<div className='amt-inner'>
						<label>
							Amount
							{amountRequired && <span className='req' aria-hidden='true'> *</span>}
							{amountRequired && amountMissing && (
								<span className='hint'>required for “{STATUS_META[status].label}”</span>
							)}
							{!amountRequired && !amountFormatValid && (
								<span className='hint'>use a number like 1234 or 1234.56</span>
							)}
						</label>
						<input
							type='text'
							inputMode='decimal'
							placeholder={amountRequired ? 'required · e.g. 1500.00' : '0.00'}
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							tabIndex={amountForbidden ? -1 : 0}
							aria-invalid={amountRequired && amountMissing}
							data-invalid={
								(amountRequired && amountMissing) ||
								(!amountFormatValid && !!amountTrimmed)
							}
						/>
					</div>
				</div>

				<label>Note</label>
				<textarea
					placeholder='optional…'
					value={note}
					onChange={(e) => setNote(e.target.value)}
				/>

				<div className='actions'>
					{initial ? (
						<button
							type='button'
							className='delete'
							onClick={handleDelete}
							disabled={removing}
						>
							Delete
						</button>
					) : (
						<span />
					)}
					<div style={{ display: 'inline-flex', gap: 4 }}>
						<button
							type='button'
							className='cancel'
							onClick={() => requestClose('cancel')}
							disabled={saveState !== 'idle' || closing}
						>
							Cancel
						</button>
						<button
							type='button'
							className={`save ${saveState}`}
							onClick={handleSave}
							disabled={saveState !== 'idle' || !canSave || closing}
						>
							<span className='label'>Save</span>
							<span className='spinner' aria-hidden='true' />
							<span className='check' aria-hidden='true'>
								<svg viewBox='0 0 24 24'>
									<path d='M5 12 L10 17 L19 7' />
								</svg>
							</span>
						</button>
					</div>
				</div>
			</PopoverRight>
			<span className='success-wave' aria-hidden='true' />
		</PopoverShell>,
		document.body
	)
}
