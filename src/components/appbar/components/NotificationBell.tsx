import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	NotificationsOutlined,
	ErrorOutlineOutlined,
	WarningAmberOutlined,
	InfoOutlined,
} from '@mui/icons-material'
import {
	BellWrap,
	NotifList,
	Popover,
	PopoverFoot,
	PopoverHead,
} from './notification.styled'
import {
	useGetAttentionQuery,
	type AttentionItem,
} from '../../../store/attention/attentionApi'
import usePermissions from '../../../hooks/usePermissions'

const severityIcon = (sev: AttentionItem['severity']) =>
	sev === 'critical' ? (
		<ErrorOutlineOutlined />
	) : sev === 'warn' ? (
		<WarningAmberOutlined />
	) : (
		<InfoOutlined />
	)

const relTime = (iso: string): string => {
	const diffMs = Date.now() - new Date(iso).getTime()
	if (diffMs < 0) return 'now'
	const s = Math.round(diffMs / 1000)
	if (s < 60) return `${s}s`
	const m = Math.round(s / 60)
	if (m < 60) return `${m}m`
	const h = Math.round(m / 60)
	if (h < 24) return `${h}h`
	const d = Math.round(h / 24)
	return `${d}d`
}

const CLOSE_DURATION_MS = 200

const NotificationBell = () => {
	const [open, setOpen] = useState(false)
	const [closing, setClosing] = useState(false)
	const [wiggleKey, setWiggleKey] = useState(0)
	const wrapRef = useRef<HTMLDivElement | null>(null)
	const closeTimerRef = useRef<number | null>(null)
	const navigate = useNavigate()
	const { has } = usePermissions()
	const canView = has('notifications:view')

	// Skip the attention request entirely when the caller lacks the
	// gate — RTK Query's `skip` option prevents the fetch, so no 403
	// hits the network for Regular Manager.
	const { data } = useGetAttentionQuery(undefined, {
		pollingInterval: 120_000,
		skip: !canView,
	})
	const items = data?.items ?? []
	const unreadCount = items.length

	const triggerWiggle = () => {
		setWiggleKey((k) => k + 1)
	}

	const closePopover = () => {
		if (closing) return
		setClosing(true)
		if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
		closeTimerRef.current = window.setTimeout(() => {
			setOpen(false)
			setClosing(false)
		}, CLOSE_DURATION_MS)
	}

	const handleToggle = () => {
		triggerWiggle()
		if (open) {
			closePopover()
		} else {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
			setClosing(false)
			setOpen(true)
		}
	}

	const handleClickItem = (n: AttentionItem) => {
		if (n.action?.route) {
			navigate(n.action.route)
			closePopover()
		}
	}

	useEffect(() => {
		if (!open || closing) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closePopover()
		}
		const onDown = (e: MouseEvent) => {
			const target = e.target as Node | null
			if (!target) return
			if (wrapRef.current && !wrapRef.current.contains(target)) {
				closePopover()
			}
		}
		window.addEventListener('keydown', onKey)
		document.addEventListener('mousedown', onDown)
		return () => {
			window.removeEventListener('keydown', onKey)
			document.removeEventListener('mousedown', onDown)
		}
	}, [open, closing])

	useEffect(() => {
		return () => {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
		}
	}, [])

	// Early-return MUST sit after every hook on this path. Permissions
	// hydrate asynchronously after login (`setMe` dispatch happens on
	// one microtask, the first NotificationBell render on the next),
	// so a conditional return above `useEffect` would make the hook
	// count flip between renders — exactly the "Rendered more hooks
	// than during the previous render" crash this guard caused before.
	if (!canView) return null

	return (
		<BellWrap ref={wrapRef}>
			<button
				className={`bell-button ${open && !closing ? 'is-open' : ''}`}
				onClick={handleToggle}
				aria-label='Notifications'
				aria-expanded={open}
				aria-haspopup='dialog'
			>
				<span
					key={wiggleKey}
					className={`bell-icon-wrap ${wiggleKey > 0 ? 'wiggle' : ''}`}
				>
					<NotificationsOutlined />
				</span>
				{unreadCount > 0 && (
					<span className='bell-badge'>{unreadCount > 9 ? '9+' : unreadCount}</span>
				)}
			</button>

			{open && (
				<Popover closing={closing} role='dialog' aria-label='Notifications'>
					<PopoverHead>
						<span className='head-title'>Notifications</span>
						{unreadCount > 0 && (
							<span className='head-count'>{unreadCount} new</span>
						)}
					</PopoverHead>

					<NotifList>
						{items.length === 0 && (
							<li className='notif-empty'>
								Nothing needs your attention right now.
							</li>
						)}
						{items.map((n) => (
							<li
								key={n.id}
								className='unread'
								onClick={() => handleClickItem(n)}
							>
								<span className='notif-icon'>
									{severityIcon(n.severity)}
									<span className='notif-unread-dot' />
								</span>
								<div className='notif-body'>
									<div className='notif-title'>{n.title}</div>
									{n.description && (
										<div className='notif-desc'>{n.description}</div>
									)}
								</div>
								<span className='notif-time'>
									{relTime(n.createdAt)}
								</span>
							</li>
						))}
					</NotifList>

					<PopoverFoot>
						<button
							onClick={() => {
								closePopover()
								navigate('/notifications/list')
							}}
						>
							View all →
						</button>
					</PopoverFoot>
				</Popover>
			)}
		</BellWrap>
	)
}

export default NotificationBell
