import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	NotificationsOutlined,
	BoltOutlined,
	AutoAwesomeOutlined,
	CheckCircleOutlineOutlined,
	ErrorOutlineOutlined,
	InsightsOutlined,
} from '@mui/icons-material'
import {
	BellWrap,
	NotifList,
	Popover,
	PopoverFoot,
	PopoverHead,
} from './notification.styled'

interface Notif {
	id: string
	icon: JSX.Element
	iconBg: string
	iconColor: string
	title: string
	desc: string
	time: string
	unread?: boolean
	to?: string
}

const MOCK_NOTIFS: Notif[] = [
	{
		id: 'n1',
		icon: <BoltOutlined />,
		iconBg: '#eef2ff',
		iconColor: '#6366f1',
		title: 'Vibeworker sent 12 new job posts',
		desc: 'Webhook processed a fresh batch a few minutes ago.',
		time: '5m',
		unread: true,
		to: '/job-posts',
	},
	{
		id: 'n2',
		icon: <InsightsOutlined />,
		iconBg: '#ecfdf5',
		iconColor: '#10b981',
		title: 'New job post matched at 94%',
		desc: '“Full-stack developer for SaaS platform” — worth a look.',
		time: '22m',
		unread: true,
		to: '/job-posts',
	},
	{
		id: 'n3',
		icon: <CheckCircleOutlineOutlined />,
		iconBg: '#e0f2fe',
		iconColor: '#0284c7',
		title: 'Proposal #482 was accepted',
		desc: 'Client scheduled a follow-up call.',
		time: '1h',
		unread: true,
	},
	{
		id: 'n4',
		icon: <ErrorOutlineOutlined />,
		iconBg: '#fef2f2',
		iconColor: '#ef4444',
		title: '3 job posts failed to parse',
		desc: 'AI evaluation errored on invalid rawText payload.',
		time: '3h',
		to: '/job-posts',
	},
	{
		id: 'n5',
		icon: <AutoAwesomeOutlined />,
		iconBg: '#fef3c7',
		iconColor: '#d97706',
		title: 'Prompt updated: Job Evaluation v3',
		desc: 'A new version is now active for scoring.',
		time: '5h',
		to: '/prompts',
	},
]

const CLOSE_DURATION_MS = 200

const NotificationBell = () => {
	const [open, setOpen] = useState(false)
	const [closing, setClosing] = useState(false)
	const [wiggleKey, setWiggleKey] = useState(0)
	const [items, setItems] = useState<Notif[]>(MOCK_NOTIFS)
	const wrapRef = useRef<HTMLDivElement | null>(null)
	const closeTimerRef = useRef<number | null>(null)
	const navigate = useNavigate()

	const unreadCount = items.filter((i) => i.unread).length

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

	const handleMarkAllRead = () => {
		setItems((prev) => prev.map((i) => ({ ...i, unread: false })))
	}

	const handleClickItem = (n: Notif) => {
		setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, unread: false } : i)))
		if (n.to) {
			navigate(n.to)
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
						{items.map((n) => (
							<li
								key={n.id}
								className={n.unread ? 'unread' : ''}
								onClick={() => handleClickItem(n)}
							>
								<span
									className='notif-icon'
									style={{ background: n.iconBg, color: n.iconColor }}
								>
									{n.icon}
								</span>
								<div className='notif-body'>
									<div className='notif-title'>{n.title}</div>
									<div className='notif-desc'>{n.desc}</div>
								</div>
								<span className='notif-time'>{n.time}</span>
							</li>
						))}
					</NotifList>

					<PopoverFoot>
						<button className='muted' onClick={handleMarkAllRead}>
							Mark all as read
						</button>
						<button
							onClick={() => {
								closePopover()
								navigate('/notifications')
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
