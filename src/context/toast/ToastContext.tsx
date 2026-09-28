import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import styled, { keyframes } from 'styled-components'
import {
	CheckCircleRounded,
	ErrorRounded,
	InfoRounded,
	WarningRounded,
	CloseRounded,
} from '@mui/icons-material'

// ─── Types ───────────────────────────────────────────────────────────────────

type Severity = 'success' | 'error' | 'warning' | 'info'

interface Toast {
	id: string
	message: string
	severity: Severity
	duration: number
	dismissing?: boolean
}

interface ToastContextValue {
	showToast: (message: string, severity?: Severity, duration?: number) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

const EXIT_MS = 260

// ─── Provider ────────────────────────────────────────────────────────────────

export const ToastProvider = ({ children }: { children: ReactNode }) => {
	const [toasts, setToasts] = useState<Toast[]>([])
	const autoTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
	const exitTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

	const finalize = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
		delete autoTimers.current[id]
		delete exitTimers.current[id]
	}, [])

	const dismissToast = useCallback(
		(id: string) => {
			if (autoTimers.current[id]) {
				clearTimeout(autoTimers.current[id])
				delete autoTimers.current[id]
			}
			if (exitTimers.current[id]) return
			setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, dismissing: true } : t)))
			exitTimers.current[id] = setTimeout(() => finalize(id), EXIT_MS)
		},
		[finalize]
	)

	const showToast = useCallback(
		(message: string, severity: Severity = 'info', duration = 3800) => {
			const id = `${Date.now()}-${Math.random()}`
			setToasts((prev) => [...prev, { id, message, severity, duration }])
			autoTimers.current[id] = setTimeout(() => dismissToast(id), duration)
		},
		[dismissToast]
	)

	useEffect(() => {
		return () => {
			Object.values(autoTimers.current).forEach(clearTimeout)
			Object.values(exitTimers.current).forEach(clearTimeout)
		}
	}, [])

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{createPortal(
				<ToastStack>
					{toasts.map((toast) => (
						<ToastItem key={toast.id} toast={toast} onClose={() => dismissToast(toast.id)} />
					))}
				</ToastStack>,
				document.body
			)}
		</ToastContext.Provider>
	)
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useToast = (): ToastContextValue => {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error('useToast must be used within ToastProvider')
	return ctx
}

// ─── Toast item ──────────────────────────────────────────────────────────────

interface ToastItemProps {
	toast: Toast
	onClose: () => void
}

const iconMap = {
	success: CheckCircleRounded,
	error: ErrorRounded,
	warning: WarningRounded,
	info: InfoRounded,
} as const

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
	const Icon = iconMap[toast.severity]
	return (
		<ToastCard $severity={toast.severity} $dismissing={!!toast.dismissing}>
			<IconWrap>
				<Icon sx={{ fontSize: 22 }} />
			</IconWrap>
			<Body>
				<Message>{toast.message}</Message>
			</Body>
			<CloseButton type='button' onClick={onClose} aria-label='Dismiss'>
				<CloseRounded sx={{ fontSize: 16 }} />
			</CloseButton>
			<ProgressBar $duration={toast.duration} $paused={!!toast.dismissing} />
		</ToastCard>
	)
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const paletteMap: Record<Severity, { fg: string }> = {
	success: { fg: '#15803d' },
	error: { fg: '#b91c1c' },
	warning: { fg: '#a26608' },
	info: { fg: 'rgb(3, 105, 161)' },
}

const slideIn = keyframes`
	from {
		opacity: 0;
		transform: translateX(120%) scale(0.96);
		filter: blur(4px);
	}
	60% {
		opacity: 1;
		transform: translateX(-8px) scale(1);
		filter: blur(0);
	}
	100% {
		transform: translateX(0) scale(1);
	}
`

const slideOut = keyframes`
	from {
		opacity: 1;
		transform: translateX(0) scale(1);
	}
	to {
		opacity: 0;
		transform: translateX(80%) scale(0.94);
		filter: blur(2px);
	}
`

const progressShrink = keyframes`
	from { transform: scaleX(1); }
	to   { transform: scaleX(0); }
`

const iconPop = keyframes`
	0%   { transform: scale(0.5) rotate(-14deg); opacity: 0; }
	60%  { transform: scale(1.16) rotate(6deg); opacity: 1; }
	85%  { transform: scale(0.94) rotate(-2deg); }
	100% { transform: scale(1) rotate(0deg); }
`

const ToastStack = styled.div`
	position: fixed;
	bottom: 1.5rem;
	right: 1.5rem;
	z-index: 9999;
	display: flex;
	flex-direction: column;
	gap: 0.7rem;
	pointer-events: none;

	@media (max-width: 480px) {
		bottom: 1rem;
		right: 1rem;
		left: 1rem;
	}
`

const ToastCard = styled.div<{ $severity: Severity; $dismissing: boolean }>`
	position: relative;
	pointer-events: all;
	display: grid;
	grid-template-columns: auto 1fr auto;
	align-items: center;
	gap: 12px;
	min-width: 320px;
	max-width: 460px;
	overflow: hidden;
	padding: 14px 14px 14px 18px;
	border: none;
	border-radius: 14px;
	color: #fff;
	background: ${({ $severity }) => {
		const fg = paletteMap[$severity].fg
		return `linear-gradient(135deg, ${fg} 0%, ${fg} 55%, ${fg}dd 100%)`
	}};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.1),
		0 16px 36px -14px ${({ $severity }) => paletteMap[$severity].fg}88;
	animation: ${({ $dismissing }) => ($dismissing ? slideOut : slideIn)}
		${({ $dismissing }) => ($dismissing ? '240ms' : '520ms')} cubic-bezier(0.22, 1.15, 0.36, 1) both;
`

const IconWrap = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	width: 34px;
	height: 34px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.22);
	color: #fff;
	animation: ${iconPop} 640ms cubic-bezier(0.22, 1.35, 0.36, 1) 80ms both;
`

const Body = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const Message = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.4;
	font-weight: 600;
	color: inherit;
	letter-spacing: -0.005em;
	word-break: break-word;
`

const CloseButton = styled.button`
	appearance: none;
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	color: rgba(255, 255, 255, 0.78);
	transition:
		background 160ms ease,
		color 160ms ease;

	&:hover {
		background: rgba(255, 255, 255, 0.16);
		color: #fff;
	}
`

const ProgressBar = styled.span<{ $duration: number; $paused: boolean }>`
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	height: 3px;
	background: rgba(255, 255, 255, 0.55);
	transform-origin: left center;
	animation: ${progressShrink} ${({ $duration }) => $duration}ms linear forwards;
	animation-play-state: ${({ $paused }) => ($paused ? 'paused' : 'running')};
`
