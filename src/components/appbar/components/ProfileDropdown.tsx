import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '@mui/material'
import { Icon as IconifyIcon } from '@iconify/react'
import {
	ExitToApp,
	HelpOutlineOutlined,
	KeyboardArrowDownRounded,
	LanguageRounded,
	MenuBookOutlined,
	OpenInNewRounded,
	PersonOutlineOutlined,
	SettingsOutlined,
	VerifiedOutlined,
	VpnKeyOutlined,
} from '@mui/icons-material'
import useLogout from '../../../hooks/useLogout'
import { useGetMeQuery } from '../../../store/auth/authApi'
import { TriggerWrap, Trigger, Popover, ProfileHead, MenuList, MenuFoot } from './profile.styled'

const CLOSE_DURATION_MS = 200

const ProfileDropdown = () => {
	const navigate = useNavigate()
	const logout = useLogout()
	const { data: me } = useGetMeQuery()

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

	const fullName = me ? `${me.firstName} ${me.lastName}`.trim() || me.email : '—'
	const initials = me
		? ((me.firstName?.[0] ?? '') + (me.lastName?.[0] ?? '')).toUpperCase() ||
			me.email.slice(0, 2).toUpperCase()
		: '?'
	const avatarSrc = me?.avatarUrl ?? undefined

	return (
		<TriggerWrap ref={wrapRef}>
			<Trigger
				isOpen={open && !closing}
				onClick={handleToggle}
				aria-haspopup='menu'
				aria-expanded={open}
			>
				<Avatar
					src={avatarSrc}
					alt={fullName}
					sx={{
						width: 36,
						height: 36,
						bgcolor: '#0369a1',
						fontSize: 14,
						fontWeight: 700,
					}}
				>
					{!avatarSrc && initials}
				</Avatar>
				<KeyboardArrowDownRounded className='trigger-chevron' />
			</Trigger>

			{open && (
				<Popover closing={closing} role='menu'>
					<ProfileHead>
						<div className='p-avatar-wrap'>
							<Avatar
								src={avatarSrc}
								alt={fullName}
								sx={{
									width: 56,
									height: 56,
									bgcolor: '#0369a1',
									fontSize: 20,
									fontWeight: 700,
								}}
							>
								{!avatarSrc && initials}
							</Avatar>
							<span className='p-avatar-status' />
						</div>
						<div className='p-body'>
							<div className='p-name'>{fullName}</div>
							<div className='p-email'>{me?.email ?? '—'}</div>
						</div>
					</ProfileHead>

					<MenuList>
						<li onClick={() => handleNavigate('/settings?s=my_account')}>
							<span className='item-icon'>
								<PersonOutlineOutlined />
							</span>
							<span className='item-label'>My account</span>
						</li>
						<li onClick={() => handleNavigate('/settings')}>
							<span className='item-icon'>
								<SettingsOutlined />
							</span>
							<span className='item-label'>Settings</span>
						</li>
						<li onClick={() => handleNavigate('/credentials/vault-settings')}>
							<span className='item-icon'>
								<VpnKeyOutlined />
							</span>
							<span className='item-label'>My vault access</span>
						</li>

						<li className='menu-sep' aria-hidden='true' />

						<li onClick={() => handleNavigate('/runbook')}>
							<span className='item-icon'>
								<MenuBookOutlined />
							</span>
							<span className='item-label'>Runbook</span>
						</li>
						<li onClick={() => handleNavigate('/help')}>
							<span className='item-icon'>
								<HelpOutlineOutlined />
							</span>
							<span className='item-label'>Help &amp; FAQ</span>
						</li>

						<li className='menu-sep' aria-hidden='true' />

						<li
							className='menu-external'
							onClick={() =>
								window.open('https://sargas.io', '_blank', 'noopener,noreferrer')
							}
						>
							<span className='item-icon'>
								<LanguageRounded />
							</span>
							<span className='item-label'>sargas.io</span>
							<span className='item-external' aria-hidden='true'>
								<OpenInNewRounded />
							</span>
						</li>
						<li
							className='menu-external'
							onClick={() =>
								window.open(
									'https://www.upwork.com/agencies/1772989322229334016/',
									'_blank',
									'noopener,noreferrer'
								)
							}
						>
							<span className='item-icon'>
								<IconifyIcon icon='simple-icons:upwork' />
							</span>
							<span className='item-label'>Upwork profile</span>
							<span className='item-external' aria-hidden='true'>
								<OpenInNewRounded />
							</span>
						</li>
						<li
							className='menu-external'
							onClick={() =>
								window.open(
									'https://clutch.co/profile/sargas-agency-o',
									'_blank',
									'noopener,noreferrer'
								)
							}
						>
							<span className='item-icon'>
								<VerifiedOutlined />
							</span>
							<span className='item-label'>Clutch profile</span>
							<span className='item-external' aria-hidden='true'>
								<OpenInNewRounded />
							</span>
						</li>
					</MenuList>

					<MenuFoot>
						<button className='logout-btn' onClick={handleLogout}>
							<span className='logout-icon'>
								<ExitToApp />
							</span>
							<span className='logout-label'>Sign out</span>
						</button>
					</MenuFoot>
				</Popover>
			)}
		</TriggerWrap>
	)
}

export default ProfileDropdown
