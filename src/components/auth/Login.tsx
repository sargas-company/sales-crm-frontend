import React, { FC, ReactNode, useEffect, useRef, useState } from 'react'
import { Icon } from '@iconify/react'
import styled, { keyframes } from 'styled-components'
import useTogglePassword from '../../hooks/useTogglePassword'
import { Alert, Button, TextField } from '../../ui'
import Box from '../box/Box'
import Form from '../form/Form'

const ALERT_EXIT_MS = 240

const GoogleIcon = () => (
	<svg viewBox='0 0 48 48' width='20' height='20' aria-hidden='true'>
		<path
			fill='#EA4335'
			d='M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
		/>
		<path
			fill='#4285F4'
			d='M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
		/>
		<path
			fill='#FBBC05'
			d='M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
		/>
		<path
			fill='#34A853'
			d='M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
		/>
	</svg>
)

export interface LoginFormData {
	email: string
	password: string
	remember?: boolean
}

interface Props {
	onSubmit: (inputs: LoginFormData) => void
	hyperComponent?: ReactNode
	isLoading?: boolean
	serverError?: string
}

const Login: FC<Props> = ({ onSubmit, hyperComponent, isLoading, serverError }) => {
	const { isToggle, handleTogglePassword } = useTogglePassword()
	const [inputs, setInputs] = useState<LoginFormData>({
		email: '',
		password: '',
	})

	const [isRemember, setIsRemember] = useState(false)
	const [error, setError] = useState<string>('')
	// `displayedError` lives one unmount-cycle behind `error || serverError`
	// so the alert can play its exit animation BEFORE the DOM node is
	// removed. `phase` drives the enter / exit CSS classes.
	const [displayedError, setDisplayedError] = useState<string>('')
	const [phase, setPhase] = useState<'enter' | 'exit'>('enter')
	const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

	useEffect(() => {
		const current = error || serverError || ''
		if (exitTimer.current) {
			clearTimeout(exitTimer.current)
			exitTimer.current = null
		}
		if (current) {
			setDisplayedError(current)
			setPhase('enter')
			return
		}
		if (displayedError) {
			setPhase('exit')
			exitTimer.current = setTimeout(() => {
				setDisplayedError('')
			}, ALERT_EXIT_MS)
		}
		return () => {
			if (exitTimer.current) clearTimeout(exitTimer.current)
		}
	}, [error, serverError, displayedError])

	const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.currentTarget
		setInputs((prevInputs) => ({ ...prevInputs, [name]: value }))
		if (error) setError('')
	}

	const handleSubmit = () => {
		const { email, password } = inputs
		if (!email || !password) {
			setError('Email and password are required.')
			return
		}
		onSubmit({ email, password, remember: isRemember })
		setError('')
	}

	useEffect(() => {
		return () => {
			setIsRemember(false)
		}
	}, [])

	return (
		<Page>
			<Content>
				<Display>SIGN IN.</Display>
				<SubCaps>
					<span className='line' />
					<span className='mid'>internal console access</span>
					<span className='line' />
				</SubCaps>

				<Form onSubmit={handleSubmit} preventDefault>
					{hyperComponent}
					<Box display='flex' flexDirection='column' space={1}>
						{displayedError && (
							<AlertWrap className={phase}>
								<Alert severity='error'>{displayedError}</Alert>
							</AlertWrap>
						)}
						<FieldSlot>
							<TextField
								type='text'
								name='email'
								label='Email'
								value={inputs.email}
								onChange={handleChangeInput}
							/>
						</FieldSlot>
						<FieldSlot>
							<TextField
								type={!isToggle ? 'password' : 'text'}
								name='password'
								label='Password'
								value={inputs.password}
								onChange={handleChangeInput}
								endAdornment={
									<EyeToggle
										type='button'
										onClick={handleTogglePassword}
										aria-label={isToggle ? 'Hide password' : 'Show password'}
									>
										<Icon icon={isToggle ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} />
									</EyeToggle>
								}
							/>
						</FieldSlot>
						<ButtonSlot>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Signing in...' : 'Sign in'}
							</Button>
						</ButtonSlot>
					</Box>
				</Form>
			</Content>
		</Page>
	)
}

export default Login

const contentIn = keyframes`
	from { opacity: 0; transform: translateY(14px); }
	to   { opacity: 1; transform: translateY(0); }
`

const fieldFade = keyframes`
	from { opacity: 0; transform: translateY(8px); }
	to   { opacity: 1; transform: translateY(0); }
`

const cursiveDraw = keyframes`
	from { opacity: 0; transform: translate(-6px, 4px) rotate(-6deg); }
	to   { opacity: 1; transform: translate(0, 0)     rotate(-6deg); }
`

const shineText = keyframes`
	0%   { background-position: -140% 0; }
	60%  { background-position: 140% 0; }
	100% { background-position: 140% 0; }
`

const footDotPulse = keyframes`
	0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
	50%      { transform: scale(1.3); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
`

const alertEnter = keyframes`
	0%   { opacity: 0; transform: translateY(-6px) scale(0.98); max-height: 0; margin-bottom: 0; }
	60%  { opacity: 1; }
	100% { opacity: 1; transform: translateY(0) scale(1); max-height: 160px; margin-bottom: 0; }
`

const alertExit = keyframes`
	0%   { opacity: 1; transform: translateY(0) scale(1); max-height: 160px; margin-bottom: 0; }
	100% { opacity: 0; transform: translateY(-6px) scale(0.98); max-height: 0; margin-bottom: 0; padding: 0; }
`

const iconShake = keyframes`
	0%, 100% { transform: rotate(0deg) scale(1); }
	10% { transform: rotate(-24deg) scale(1.22); }
	22% { transform: rotate(22deg) scale(1.18); }
	34% { transform: rotate(-16deg) scale(1.14); }
	46% { transform: rotate(12deg) scale(1.1); }
	58% { transform: rotate(-6deg) scale(1.05); }
	72% { transform: rotate(3deg) scale(1.02); }
`

/* Single keyframe combines blink (scaleY ≈ 0 ↔ 1) with a short
   look-around nudge and a mild overall scale pulse. One animation
   = one transform, no conflicts between composited animations. */
const eyeBlink = keyframes`
	0%   { transform: translate(0, 0)      scaleY(1)    scale(1); }
	14%  { transform: translate(-1.5px, -0.5px) scaleY(0.08) scale(1.08); }
	28%  { transform: translate(-1.5px, -0.5px) scaleY(1)    scale(1.14); }
	48%  { transform: translate(1.6px, 0.6px)   scaleY(1)    scale(1.14); }
	62%  { transform: translate(1.6px, 0.6px)   scaleY(0.08) scale(1.1); }
	76%  { transform: translate(0.6px, 0.8px)   scaleY(1)    scale(1.08); }
	100% { transform: translate(0, 0)      scaleY(1)    scale(1); }
`

/**
 * Password-visibility toggle styled from scratch — the shared UI
 * IconButton paints a blue `.hover-layer` circle on hover; we want a
 * clean icon that just blinks + looks around when the pointer hits
 * it. Positioned absolutely over the TextField's end-slot.
 */
const EyeToggle = styled.button`
	position: absolute;
	right: 8px;
	top: 50%;
	transform: translateY(-50%);
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	padding: 0;
	border: 0;
	border-radius: 999px;
	background: transparent;
	color: #64748b;
	cursor: pointer;
	outline: none;
	transition: color 160ms ease;

	svg {
		font-size: 20px;
		transform-origin: center;
		transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&:hover {
		color: #0f172a;
		background: transparent;
	}
	&:hover svg {
		animation: ${eyeBlink} 900ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	&:focus-visible {
		box-shadow: 0 0 0 2px rgba(3, 105, 161, 0.22);
	}

	@media (prefers-reduced-motion: reduce) {
		&:hover svg {
			animation: none;
		}
	}
`

/**
 * Wraps the shared Alert so the login screen gets:
 *   - a softer 14px border-radius instead of the default 6px;
 *   - enter animation on mount (slide + fade + height grow);
 *   - exit animation before unmount (same, reversed).
 *
 * The actual unmount is deferred by ALERT_EXIT_MS inside the
 * component so the exit keyframes can complete.
 */
const AlertWrap = styled('div')`
	overflow: hidden;
	transform-origin: top center;
	will-change: opacity, transform, max-height;

	/* Base Alert pads the icon + message block with padding-top: 5px
	   so a title row stays aligned with the icon. We removed the
	   title, so the shim becomes visible asymmetry — collapse it and
	   center the icon against the message text instead. Scoped at
	   deep selectors so the base rules do not win on specificity. */
	& .alert__wrapper {
		border-radius: 14px;
		padding: 14px 18px;
		display: flex;
		align-items: center;
	}
	& .alert__wrapper .alert__content {
		display: flex;
		align-items: center;
		gap: 0.8rem;
	}
	& .alert__wrapper .alert__content .alert__icon {
		padding-top: 0;
		display: inline-flex;
		align-items: center;
	}
	& .alert__wrapper .alert__content .alert__icon svg {
		display: block;
		transform-origin: center;
	}
	&.enter .alert__wrapper .alert__content .alert__icon svg {
		animation: ${iconShake} 820ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms both;
	}
	@media (prefers-reduced-motion: reduce) {
		&.enter .alert__wrapper .alert__content .alert__icon svg {
			animation: none;
		}
	}
	& .alert__wrapper .alert__content .alert__message {
		padding-top: 0;
		font-size: 13px;
		line-height: 1.45;
	}

	&.enter {
		animation: ${alertEnter} 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	&.exit {
		animation: ${alertExit} ${ALERT_EXIT_MS}ms cubic-bezier(0.4, 0, 1, 1) both;
	}

	@media (prefers-reduced-motion: reduce) {
		&.enter,
		&.exit {
			animation: none;
		}
	}
`

const Page = styled('div')`
	position: relative;
	flex: 1 1 auto;
	align-self: stretch;
	width: 100%;
	min-width: 0;
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #ffffff;
	padding: 32px 20px;
`

const Content = styled('div')`
	width: 100%;
	max-width: 380px;
	animation: ${contentIn} 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;

	@media (prefers-reduced-motion: reduce) {
		animation: none !important;
	}
`

const Cursive = styled('span')`
	display: inline-block;
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-size: clamp(30px, 4.4vw, 46px);
	font-weight: 700;
	color: #f59e0b;
	line-height: 1;
	transform: rotate(-6deg);
	transform-origin: left center;
	margin-left: 6px;
	margin-bottom: -6px;
	text-shadow: 0 6px 22px rgba(245, 158, 11, 0.24);
	animation: ${cursiveDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;

	@media (prefers-reduced-motion: reduce) {
		transform: rotate(-6deg);
		animation: none;
	}
`

const Display = styled('h1')`
	margin: 0;
	font-family: 'Bebas Neue', 'Inter', system-ui, sans-serif;
	font-size: clamp(64px, 9.5vw, 108px);
	line-height: 0.88;
	letter-spacing: 1px;
	color: #0f172a;
	background: linear-gradient(
		90deg,
		#0f172a 0%,
		#0f172a 45%,
		#94a3b8 55%,
		#0f172a 65%,
		#0f172a 100%
	);
	background-size: 250% 100%;
	-webkit-background-clip: text;
	background-clip: text;
	-webkit-text-fill-color: transparent;
	animation:
		${fieldFade} 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both,
		${shineText} 7s ease-in-out infinite 2s;
	position: relative;
`

const SubCaps = styled('div')`
	margin: 14px 0 28px;
	display: flex;
	align-items: center;
	gap: 12px;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 10.5px;
	font-weight: 700;
	color: #94a3b8;
	text-transform: uppercase;
	letter-spacing: 3.5px;
	animation: ${fieldFade} 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.28s both;

	.line {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, #cbd5e1, transparent);
		max-width: 60px;
	}
	.mid {
		white-space: nowrap;
	}
`

const GoogleSlot = styled('div')`
	width: 100%;
	margin-bottom: 14px;
	animation: ${fieldFade} 0.45s cubic-bezier(0.22, 1, 0.36, 1) 320ms both;
`

const GoogleButton = styled('button')`
	width: 100%;
	min-height: 48px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 12px;
	padding: 12px 16px;
	background: #ffffff;
	color: #0f172a;
	border: 1px solid #e2e8f0;
	border-radius: 10px;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14px;
	font-weight: 700;
	letter-spacing: -0.1px;
	cursor: pointer;
	transition:
		background 0.18s ease,
		border-color 0.18s ease,
		transform 0.15s ease,
		box-shadow 0.2s ease;

	svg {
		flex-shrink: 0;
	}

	&:hover {
		background: #f8fafc;
		border-color: #cbd5e1;
		transform: translateY(-1px);
		box-shadow: 0 10px 24px -14px rgba(15, 23, 42, 0.25);
	}

	&:active {
		transform: translateY(0);
	}

	&:focus-visible {
		outline: 2px solid #93c5fd;
		outline-offset: 2px;
	}
`

const Divider = styled('div')`
	display: flex;
	align-items: center;
	gap: 12px;
	margin-bottom: 14px;
	animation: ${fieldFade} 0.45s cubic-bezier(0.22, 1, 0.36, 1) 400ms both;

	.d-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, transparent, #e2e8f0, #e2e8f0, transparent);
	}
	.d-label {
		font-family: 'Inter', system-ui, sans-serif;
		font-size: 10.5px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 3px;
		color: #94a3b8;
		white-space: nowrap;
	}
`

const FieldSlot = styled('div')`
	animation: ${fieldFade} 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;

	&:nth-child(1) {
		animation-delay: 480ms;
	}
	&:nth-child(2) {
		animation-delay: 560ms;
	}
	&:nth-child(3) {
		animation-delay: 640ms;
	}
`

const ButtonSlot = styled('div')`
	margin-top: 8px;
	width: 100%;
	animation: ${fieldFade} 0.45s cubic-bezier(0.22, 1, 0.36, 1) 720ms both;

	button {
		width: 100% !important;
		min-height: 48px;
		font-family: 'Bebas Neue', 'Inter', system-ui, sans-serif;
		font-size: 18px !important;
		letter-spacing: 3px !important;
		text-transform: uppercase;
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease,
			background 0.2s ease !important;
	}
	button:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 12px 26px -12px rgba(15, 23, 42, 0.35) !important;
		background: ${({ theme }) => theme.colors!.accent.primary} !important;
	}
	button:active:not(:disabled) {
		transform: translateY(0);
	}
`

const FootLine = styled('div')`
	margin-top: 26px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	font-size: 11.5px;
	color: #64748b;
	font-weight: 600;
	animation: ${fieldFade} 0.45s cubic-bezier(0.22, 1, 0.36, 1) 820ms both;

	.foot-item {
		display: inline-flex;
		align-items: center;
		gap: 7px;
	}
	.foot-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #10b981;
		animation: ${footDotPulse} 2.4s ease-in-out infinite;
	}
	.foot-item-link a {
		color: #f59e0b;
		text-decoration: none;
		font-weight: 700;
		transition: color 0.2s ease;
	}
	.foot-item-link a:hover {
		color: #d97706;
		text-decoration: underline;
	}

	@media (prefers-reduced-motion: reduce) {
		.foot-dot {
			animation: none;
		}
	}
`
