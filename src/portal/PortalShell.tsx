import { ReactNode, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Avatar } from '@mui/material'
import {
	ExitToApp,
	KeyboardArrowDownRounded,
	PersonOutlineOutlined,
} from '@mui/icons-material'

import { useGetMeQuery } from '../store/auth/authApi'
import {
	TriggerWrap,
	Trigger,
	Popover,
	ProfileHead,
	MenuList,
	MenuFoot,
} from '../components/appbar/components/profile.styled'
import sargasLogo from '../assets/logo.png'
import { MyAccountModal } from './MyAccountModal'

/* Portal shell — thin header + outlet.
 * Deliberately minimal: Sargas wordmark left, user avatar + menu right.
 * NO sidebar, NO help / notifications / runbook links.
 * Menu items: My account, Sign out.
 * Visual language of the user menu is lifted straight from the admin
 * ProfileDropdown so admin + worker see the same chrome. */
const CLOSE_DURATION_MS = 200

export const PortalShell = ({ children }: { children: ReactNode }) => {
	const { data: me } = useGetMeQuery()
	const navigate = useNavigate()

	const [open, setOpen] = useState(false)
	const [closing, setClosing] = useState(false)
	const [accountOpen, setAccountOpen] = useState(false)
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
		if (open) closePopover()
		else {
			if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current)
			setClosing(false)
			setOpen(true)
		}
	}

	const signOut = () => {
		closePopover()
		window.setTimeout(() => {
			try {
				localStorage.removeItem('access_token')
			} catch {
				/* ignore */
			}
			navigate('/portal/login', { replace: true })
		}, CLOSE_DURATION_MS)
	}
	const openAccount = () => {
		closePopover()
		window.setTimeout(() => setAccountOpen(true), CLOSE_DURATION_MS)
	}

	/* Dismiss on Esc + outside click. */
	useEffect(() => {
		if (!open || closing) return
		const onKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') closePopover()
		}
		const onDown = (e: MouseEvent) => {
			const t = e.target as Node | null
			if (t && wrapRef.current && !wrapRef.current.contains(t)) closePopover()
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

	const fullName = me
		? `${me.firstName ?? ''} ${(me as unknown as { lastName?: string }).lastName ?? ''}`
				.trim() ||
			me.displayName ||
			me.email
		: '—'
	const initials = me
		? ((me.firstName?.[0] ?? '') +
				((me as unknown as { lastName?: string }).lastName?.[0] ?? '')
			).toUpperCase() ||
			(me.displayName?.[0] ?? me.email[0]).toUpperCase()
		: '?'
	const avatarSrc = me?.avatarUrl ?? undefined

	return (
		<Root>
			<Header>
				{/* Brand — identical to AppLogo on the admin shell: real
				 *  logo image + "Sargas" in Bebas Neue. One language
				 *  across admin + portal. */}
				<BrandRow>
					<LogoSlot>
						<LogoImg src={sargasLogo} alt='Sargas' />
					</LogoSlot>
					<LogoText>Sargas</LogoText>
				</BrandRow>

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
								bgcolor: '#ffffff',
								color: '#0f172a',
								fontSize: 14,
								fontWeight: 700,
								border: '1px solid rgba(15, 23, 42, 0.1)',
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
											bgcolor: '#ffffff',
											color: '#0f172a',
											fontSize: 20,
											fontWeight: 700,
											border: '1px solid rgba(15, 23, 42, 0.1)',
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
								<li onClick={openAccount}>
									<span className='item-icon'>
										<PersonOutlineOutlined />
									</span>
									<span className='item-label'>My account</span>
								</li>
							</MenuList>

							<MenuFoot>
								<button className='logout-btn' onClick={signOut}>
									<span className='logout-icon'>
										<ExitToApp />
									</span>
									<span className='logout-label'>Sign out</span>
								</button>
							</MenuFoot>
						</Popover>
					)}
				</TriggerWrap>
			</Header>

			<Main>{children}</Main>

			{accountOpen && (
				<MyAccountModal onClose={() => setAccountOpen(false)} />
			)}
		</Root>
	)
}

/* ─── Shell layout ───────────────────────────────────────────────── */
const Root = styled.div`
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f8fafc;
`
const Header = styled.header`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 14px 28px;
	background: #ffffff;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
	position: sticky;
	top: 0;
	z-index: 100;
`

/* Admin AppLogo clone — real logo image + Bebas Neue "Sargas". */
const BrandRow = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	text-decoration: none;
`
const LogoSlot = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
`
const LogoImg = styled.img`
	max-width: 100%;
	max-height: 100%;
	object-fit: contain;
`
const LogoText = styled.span`
	font-family: 'Bebas Neue', 'Inter', system-ui, sans-serif;
	font-size: 32px;
	font-weight: 400;
	line-height: 1;
	letter-spacing: 3px;
	text-transform: uppercase;
	color: #252d3a;
`
const Main = styled.main`
	flex: 1;
	display: flex;
	flex-direction: column;
	/* Stretch the page card to the viewport bottom so the surface
	 *  reads as full-height, not a floating slip. The direct child
	 *  from a page like FileManager is the ListPageShell ViewFade +
	 *  ShellCard chain — both get flex: 1 to extend. */
	& > * {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
	& > * > * {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}
`
