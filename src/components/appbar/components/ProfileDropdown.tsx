import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@mui/material'
import {
	ExitToApp,
	KeyboardArrowDownRounded,
	SettingsOutlined,
	PersonOutlineOutlined,
	HelpOutlineOutlined,
	KeyboardOutlined,
	ChevronRightRounded,
	ShieldOutlined,
} from '@mui/icons-material'
import john from '../../../image/humans/3.png'
import useLogout from '../../../hooks/useLogout'
import {
	TriggerWrap,
	Trigger,
	Popover,
	ProfileHead,
	MenuList,
	MenuFoot,
} from './profile.styled'

const CLOSE_DURATION_MS = 200

const ProfileDropdown = () => {
	const navigate = useNavigate()
	const logout = useLogout()
	const [open, setOpen] = useState(false)
	const [closing, setClosing] = useState(false)
	const wrapRef = useRef<HTMLDivElement | null>(null)
	const closeTimerRef = useRef<number | null>(null)

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
		if (open) {
			closePopover()
		} else {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
			setClosing(false)
			setOpen(true)
		}
	}

	const handleNavigate = (path: string) => {
		navigate(path)
		closePopover()
	}

	const handleLogout = () => {
		closePopover()
		window.setTimeout(() => logout(), CLOSE_DURATION_MS)
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
		<TriggerWrap ref={wrapRef}>
			<Trigger
				isOpen={open && !closing}
				onClick={handleToggle}
				aria-haspopup='menu'
				aria-expanded={open}
			>
				<Avatar src={john} alt='John Doe' sx={{ width: 36, height: 36 }} />
				<KeyboardArrowDownRounded className='trigger-chevron' />
			</Trigger>

			{open && (
				<Popover closing={closing} role='menu'>
					<ProfileHead>
						<div
							className='p-avatar'
							style={{ backgroundImage: `url(${john})` }}
						>
							<span className='p-avatar-status' />
						</div>
						<div className='p-body'>
							<div className='p-name'>John Doe</div>
							<span className='p-role'>
								<ShieldOutlined />
								Administrator
							</span>
						</div>
					</ProfileHead>

					<MenuList>
						<li onClick={() => handleNavigate('/settings')}>
							<span className='item-icon'>
								<PersonOutlineOutlined />
							</span>
							<span className='item-label'>My Profile</span>
							<ChevronRightRounded className='item-arrow' />
						</li>
						<li onClick={() => handleNavigate('/settings')}>
							<span className='item-icon'>
								<SettingsOutlined />
							</span>
							<span className='item-label'>Settings</span>
							<ChevronRightRounded className='item-arrow' />
						</li>
						<li onClick={() => handleNavigate('/settings')}>
							<span className='item-icon'>
								<KeyboardOutlined />
							</span>
							<span className='item-label'>Keyboard Shortcuts</span>
							<ChevronRightRounded className='item-arrow' />
						</li>
						<li onClick={() => handleNavigate('/settings')}>
							<span className='item-icon'>
								<HelpOutlineOutlined />
							</span>
							<span className='item-label'>Help &amp; Support</span>
							<ChevronRightRounded className='item-arrow' />
						</li>
					</MenuList>

					<MenuFoot>
						<button className='logout-btn' onClick={handleLogout}>
							<span className='logout-icon'>
								<ExitToApp />
							</span>
							<span className='logout-label'>Logout</span>
							<ChevronRightRounded className='logout-arrow' />
						</button>
					</MenuFoot>
				</Popover>
			)}
		</TriggerWrap>
	)
}

export default ProfileDropdown
