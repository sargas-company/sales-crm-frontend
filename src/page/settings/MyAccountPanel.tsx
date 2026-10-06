import { CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { STAGGER_STEP, atom } from './_shared/stagger'
import { Avatar } from '@mui/material'
import { CheckRounded, DeleteOutline, FaceOutlined, ShieldOutlined } from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import {
	useGetMeQuery,
	useRemoveAvatarMutation,
	useSetAvatarPresetMutation,
	useUpdateMeMutation,
} from '../../store/auth/authApi'
import Modal from '../../components/modal/Modal'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import OwnerRatOverlay, { shouldShowRat } from './OwnerRatOverlay'
import { AVATAR_PRESETS, type AvatarGender, avatarUrlFor } from './avatarPresets'

/**
 * "My account" — personal settings section for the current authenticated
 * user. Lives inside the Settings page sidebar as a non-permission-gated
 * entry (any logged-in user sees + edits only their own data).
 *
 * Workspace-level settings live in the other sections (registry-driven).
 * This panel is intentionally separate so a user cannot confuse "my
 * timezone" with "workspace timezone".
 */
const MyAccountPanel = () => {
	const { data: me, refetch } = useGetMeQuery()
	const { showToast } = useToast()
	const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation()
	const [setAvatarPreset, { isLoading: isPicking }] = useSetAvatarPresetMutation()
	const [removeAvatar, { isLoading: isRemoving }] = useRemoveAvatarMutation()

	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [pickerOpen, setPickerOpen] = useState(false)
	const [removeOpen, setRemoveOpen] = useState(false)
	const [showRat, setShowRat] = useState(false)
	const avatarActionsRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (me) {
			setFirstName(me.firstName ?? '')
			setLastName(me.lastName ?? '')
		}
	}, [me])

	// Owner-only easter egg: once per device per day, when My account
	// mounts, scamper a little rat across the viewport bottom.
	// Temporarily disabled — flip RAT_EASTER_EGG_ENABLED back to `true`
	// when we want it back.
	const RAT_EASTER_EGG_ENABLED = false
	useEffect(() => {
		if (!RAT_EASTER_EGG_ENABLED) return
		if (!me) return
		if (!shouldShowRat(me.role?.name, me.id)) return
		setShowRat(true)
	}, [me])

	if (!me) return <Loading>Loading…</Loading>

	const initials =
		((me.firstName?.[0] ?? '') + (me.lastName?.[0] ?? '')).toUpperCase() ||
		me.email.slice(0, 2).toUpperCase()

	const dirty =
		firstName.trim() !== (me.firstName ?? '') || lastName.trim() !== (me.lastName ?? '')

	const handleSave = async () => {
		if (!firstName.trim() || !lastName.trim()) {
			showToast('First and last name are required', 'warning')
			return
		}
		try {
			await updateMe({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
			}).unwrap()
			showToast('Profile updated', 'success')
			refetch()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const handleRevert = () => {
		setFirstName(me.firstName ?? '')
		setLastName(me.lastName ?? '')
	}

	const handlePickPreset = async (id: string) => {
		try {
			await setAvatarPreset({ id }).unwrap()
			showToast('Avatar updated', 'success')
			setPickerOpen(false)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const handleRemoveAvatar = async () => {
		try {
			await removeAvatar().unwrap()
			showToast('Avatar removed', 'success')
			setRemoveOpen(false)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	// Monotonically increasing index — every visible row claims the next
	// one, so the whole panel reveals strictly one atom at a time.
	let i = 0
	const delay = (): CSSProperties => ({
		animationDelay: `${i++ * STAGGER_STEP}ms`,
	})

	return (
		<>
			<Shell>
				<Card>
					<CardTitle style={delay()}>Avatar</CardTitle>
					<CardSubtitle style={delay()}>
						Pick one from the gallery — custom uploads are not available.
					</CardSubtitle>
					<AvatarRow style={delay()}>
						<AvatarWrap>
							<Avatar
								src={me.avatarUrl ?? undefined}
								alt={`${me.firstName} ${me.lastName}`}
								sx={{
									width: 92,
									height: 92,
									bgcolor: T.primary,
									fontSize: 32,
									fontWeight: 700,
								}}
							>
								{!me.avatarUrl && initials}
							</Avatar>
						</AvatarWrap>
						<AvatarActions ref={avatarActionsRef}>
							<UploadBtn
								type='button'
								onClick={() => setPickerOpen(true)}
								disabled={isPicking}
							>
								<FaceOutlined style={{ fontSize: 16 }} />
								{me.avatarUrl ? 'Change avatar' : 'Choose avatar'}
							</UploadBtn>
							{me.avatarUrl && (
								<RemoveBtn
									type='button'
									onClick={() => setRemoveOpen(true)}
									disabled={isRemoving}
								>
									<DeleteOutline style={{ fontSize: 16 }} />
									Remove
								</RemoveBtn>
							)}
						</AvatarActions>
					</AvatarRow>
				</Card>

				{pickerOpen && (
					<AvatarPickerModal
						currentUrl={me.avatarUrl ?? null}
						onPick={handlePickPreset}
						onClose={() => setPickerOpen(false)}
						loading={isPicking}
					/>
				)}

				{removeOpen && (
					<ConfirmModal
						icon={<DeleteOutline />}
						iconTone='danger'
						title='Remove your avatar?'
						description={
							<>
								Your profile will fall back to the colored initials{' '}
								<strong>{initials}</strong>. You can pick a new one any time.
							</>
						}
						confirmLabel='Remove'
						confirmLoadingLabel='Removing…'
						confirmColor='error'
						isLoading={isRemoving}
						onClose={() => setRemoveOpen(false)}
						onConfirm={handleRemoveAvatar}
					/>
				)}

				<Card>
					<CardTitle style={delay()}>Identity</CardTitle>
					<CardSubtitle style={delay()}>
						Changes here only affect your own profile. Email and role are managed elsewhere.
					</CardSubtitle>
					<FieldGrid>
						<Field style={delay()}>
							<label htmlFor='me-first'>First name</label>
							<input
								id='me-first'
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								placeholder='First name'
							/>
						</Field>
						<Field style={delay()}>
							<label htmlFor='me-last'>Last name</label>
							<input
								id='me-last'
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								placeholder='Last name'
							/>
						</Field>
						<Field style={delay()}>
							<label>Email</label>
							<ReadOnlyValue>{me.email}</ReadOnlyValue>
						</Field>
						<Field style={delay()}>
							<label>Role</label>
							<ReadOnlyRole>
								<ShieldOutlined style={{ fontSize: 14 }} />
								{me.role?.label ?? '—'}
							</ReadOnlyRole>
						</Field>
					</FieldGrid>
				</Card>
			</Shell>

			<FloatingSaveBar $visible={dirty} aria-hidden={!dirty}>
				<div className='savebar-pill'>
					<SaveBarInfo>Unsaved profile change</SaveBarInfo>
					<SaveBarActions>
						<GhostBtn
							type='button'
							onClick={handleRevert}
							disabled={isSaving || !dirty}
							tabIndex={dirty ? 0 : -1}
						>
							Discard
						</GhostBtn>
						<PrimaryBtn
							type='button'
							onClick={handleSave}
							disabled={isSaving || !dirty}
							tabIndex={dirty ? 0 : -1}
						>
							{isSaving ? 'Saving…' : 'Save changes'}
						</PrimaryBtn>
					</SaveBarActions>
				</div>
			</FloatingSaveBar>

			{showRat && (
				<OwnerRatOverlay
					userId={me.id}
					anchorRef={avatarActionsRef}
					onDone={() => setShowRat(false)}
				/>
			)}
		</>
	)
}

export default MyAccountPanel

/* ─── Avatar picker modal ────────────────────────── */

const CLOSE_DURATION_MS = 220

const AvatarPickerModal = ({
	currentUrl,
	onPick,
	onClose,
	loading,
}: {
	currentUrl: string | null
	onPick: (id: string) => void
	onClose: () => void
	loading: boolean
}) => {
	const [tab, setTab] = useState<AvatarGender>('male')
	const [closing, setClosing] = useState(false)
	const items = useMemo(() => AVATAR_PRESETS.filter((p) => p.gender === tab), [tab])

	// Delay the parent unmount until the exit animation finishes so
	// the fade-out actually plays. A second call during a close is a
	// no-op — the timer owns the dismissal.
	const requestClose = () => {
		if (closing) return
		setClosing(true)
		window.setTimeout(onClose, CLOSE_DURATION_MS)
	}

	// Sliding orange indicator — measure the active button position
	// and translate the pill to it with a spring ease, same mechanic
	// as the Sales Analytics filter pills.
	//
	// `measured` gates the indicator render so it only mounts once we
	// know where to put it — otherwise the first paint shows the gray
	// toggle with the orange tape sliding in from the left edge.
	const pillsRef = useRef<HTMLDivElement>(null)
	const [ind, setInd] = useState<{ left: number; width: number }>({
		left: 0,
		width: 0,
	})
	const [measured, setMeasured] = useState(false)
	useLayoutEffect(() => {
		// Modal mounts into a portal whose wrapper is attached to the
		// DOM in Modal's own useEffect — i.e. AFTER our useLayoutEffect.
		// Measuring now returns zeros because the container is still
		// detached. Defer to the next frame so the wrapper is in the DOM
		// and offsetLeft/Width are real.
		let raf = 0
		const measure = () => {
			const root = pillsRef.current
			if (!root) return
			const el = root.querySelector<HTMLButtonElement>('[data-active="true"]')
			if (el && el.offsetWidth > 0) {
				setInd({ left: el.offsetLeft, width: el.offsetWidth })
				setMeasured(true)
				return
			}
			raf = requestAnimationFrame(measure)
		}
		raf = requestAnimationFrame(measure)
		return () => cancelAnimationFrame(raf)
	}, [tab])

	return (
		<Modal handleOutClick={requestClose}>
			<PickerSurface $closing={closing} onClick={(e) => e.stopPropagation()}>
				<PickerHead>
					<div>
						<h3>Choose avatar</h3>
						<p>Pick one from the gallery.</p>
					</div>
					<PickerClose type='button' onClick={requestClose} aria-label='Close'>
						×
					</PickerClose>
				</PickerHead>
				<PickerTabs ref={pillsRef} role='tablist'>
					{measured && (
						<PickerTabInd
							style={{
								transform: `translateX(${ind.left}px) rotate(-1.2deg)`,
								width: `${ind.width}px`,
							}}
						/>
					)}
					<PickerTab
						type='button'
						$active={tab === 'male'}
						data-active={tab === 'male' || undefined}
						onClick={() => setTab('male')}
						role='tab'
					>
						Male
					</PickerTab>
					<PickerTab
						type='button'
						$active={tab === 'female'}
						data-active={tab === 'female' || undefined}
						onClick={() => setTab('female')}
						role='tab'
					>
						Female
					</PickerTab>
				</PickerTabs>
				<PickerGrid>
					{items.map((p) => {
						const url = avatarUrlFor(p)
						const picked = currentUrl === url
						return (
							<PickerCell
								key={p.id}
								type='button'
								$picked={picked}
								disabled={loading || closing}
								onClick={() => {
									onPick(p.id)
									requestClose()
								}}
							>
								<img src={url} alt={p.seed} loading='lazy' />
								{picked && (
									<PickerCheck>
										<CheckRounded style={{ fontSize: 14 }} />
									</PickerCheck>
								)}
							</PickerCell>
						)
					})}
				</PickerGrid>
			</PickerSurface>
		</Modal>
	)
}

/* ─── Styles ────────────────────────────────────── */

const Shell = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
`
const Loading = styled.div`
	padding: 32px;
	color: ${T.textSecondary};
	text-align: center;
`
const Card = styled.div`
	padding: 20px 22px;
	border-radius: 14px;
	border: 1px solid ${T.border};
	background: #ffffff;
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const CardTitle = styled.h3`
	${atom};
	margin: 0;
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-size: 15px;
	font-weight: 700;
	color: ${T.textStrong};
`
const CardSubtitle = styled.p`
	${atom};
	margin: 0 0 6px;
	font-size: 12px;
	color: ${T.textSecondary};
	line-height: 1.5;
`
const AvatarRow = styled.div`
	${atom};
	display: flex;
	align-items: center;
	gap: 20px;
	flex-wrap: wrap;
`
const AvatarWrap = styled.div`
	position: relative;
	.MuiAvatar-root {
		box-shadow: 0 6px 16px -8px rgba(15, 23, 42, 0.3);
	}
`
const AvatarActions = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`
const UploadBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 9px 16px;
	border-radius: 10px;
	border: none;
	background: #0369a1;
	color: #ffffff;
	font: inherit;
	font-weight: 600;
	font-size: 12.5px;
	cursor: pointer;
	transition: background 160ms;

	svg {
		transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&:hover:not(:disabled) {
		background: #075985;
	}
	&:hover:not(:disabled) svg {
		transform: rotate(-14deg) scale(1.12);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`
const RemoveBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 7px;
	padding: 9px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(220, 38, 38, 0.3);
	background: #ffffff;
	color: #b91c1c;
	font: inherit;
	font-weight: 600;
	font-size: 12.5px;
	cursor: pointer;
	transition:
		background 180ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 180ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
		box-shadow 180ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
		transform-origin: 50% 20%;
	}

	&:hover:not(:disabled) {
		background: rgba(220, 38, 38, 0.08);
		border-color: #dc2626;
		transform: translateY(-1px);
		box-shadow: 0 6px 16px -8px rgba(220, 38, 38, 0.6);
	}
	&:hover:not(:disabled) svg {
		/* Trash lid tilts up — a tiny gesture that hints at "open to
		 * throw the avatar away". */
		transform: rotate(-16deg);
	}
	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`
const FieldGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 14px;
	margin-top: 4px;

	@media (max-width: 540px) {
		grid-template-columns: 1fr;
	}
`
const Field = styled.div`
	${atom};
	display: flex;
	flex-direction: column;
	gap: 5px;

	label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: ${T.textSecondary};
	}
	input {
		padding: 9px 12px;
		border-radius: 10px;
		border: 1.5px solid rgba(15, 23, 42, 0.1);
		font: inherit;
		font-size: 13.5px;
		color: ${T.textStrong};
		background: #ffffff;
		outline: none;

		&::placeholder {
			color: ${T.textMuted};
			font-style: italic;
			opacity: 1;
		}
	}
`
const ReadOnlyValue = styled.div`
	padding: 9px 12px;
	border-radius: 10px;
	background: rgba(15, 23, 42, 0.04);
	font-size: 13px;
	color: ${T.textStrong};
	font-family: 'JetBrains Mono', monospace;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`
const ReadOnlyRole = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 9px 12px;
	border-radius: 10px;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.3px;
	align-self: flex-start;
`
/* ─── Picker styles ────────────────────────────── */

const popIn = keyframes`
	from { opacity: 0; transform: translateY(14px) scale(0.94); filter: blur(4px); }
	to   { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
`

const popOut = keyframes`
	from { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
	to   { opacity: 0; transform: translateY(-6px) scale(0.96); filter: blur(2px); }
`

const cellIn = keyframes`
	from { opacity: 0; transform: translateY(6px) scale(0.92); }
	to   { opacity: 1; transform: translateY(0) scale(1); }
`

const PickerSurface = styled.div<{ $closing: boolean }>`
	max-width: 560px;
	width: 100%;
	margin: 1rem;
	background: #ffffff;
	border-radius: 20px;
	box-shadow:
		0 40px 80px -30px rgba(15, 23, 42, 0.3),
		0 4px 10px rgba(15, 23, 42, 0.06);
	border: 1px solid rgba(15, 23, 42, 0.06);
	display: flex;
	flex-direction: column;
	overflow: hidden;
	animation: ${(p) => (p.$closing ? popOut : popIn)} ${(p) => (p.$closing ? '220ms' : '360ms')}
		cubic-bezier(0.22, 1, 0.36, 1) both;
`

const PickerHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 16px;
	padding: 22px 24px 14px;

	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.4px;
		color: ${T.textStrong};
	}
	p {
		margin: 4px 0 0;
		font-size: 13px;
		color: ${T.textSecondary};
	}
`

const PickerClose = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	padding: 0;
	border-radius: 10px;
	border: none;
	background: transparent;
	color: ${T.textMuted};
	font-size: 24px;
	line-height: 1;
	font-weight: 400;
	cursor: pointer;
	transition:
		background 160ms,
		color 160ms;

	&:hover {
		background: rgba(15, 23, 42, 0.05);
		color: ${T.textStrong};
	}
`

const PickerTabs = styled.div`
	position: relative;
	display: flex;
	gap: 2px;
	padding: 3px;
	margin: 0 24px 14px;
	background: rgba(37, 45, 58, 0.06);
	border-radius: 999px;
	align-items: center;
`

/* Sliding orange tape pill — same mechanic as Sales Analytics TapeIndicator:
 * translateX + width animate in sync with a spring ease, with a baked-in
 * -1.2° rotation so it reads as a hand-stuck label rather than a chip. */
const PickerTabInd = styled.span`
	position: absolute;
	top: 3px;
	bottom: 3px;
	left: 0;
	border-radius: 999px;
	background: #e85d2f;
	box-shadow:
		0 2px 0 rgba(36, 30, 22, 0.14),
		0 4px 10px rgba(232, 93, 47, 0.22);
	transform-origin: center;
	transition:
		transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		width 420ms cubic-bezier(0.34, 1.56, 0.64, 1),
		opacity 200ms ease;
	pointer-events: none;
	will-change: transform, width;

	@media (prefers-reduced-motion: reduce) {
		transition:
			transform 0ms,
			width 0ms,
			opacity 0ms;
	}
`

const PickerTab = styled.button<{ $active: boolean }>`
	position: relative;
	z-index: 1;
	flex: 1;
	padding: 8px 18px;
	border-radius: 999px;
	border: none;
	background: transparent;
	color: ${(p) => (p.$active ? '#ffffff' : T.textSecondary)};
	font: inherit;
	font-size: 12.5px;
	font-weight: 600;
	letter-spacing: 0.1px;
	white-space: nowrap;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	transition: color 240ms cubic-bezier(0.22, 1, 0.36, 1);

	&:hover {
		color: ${(p) => (p.$active ? '#ffffff' : T.textStrong)};
	}
`

const PickerGrid = styled.div`
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: 10px;
	padding: 4px 24px 24px;
	max-height: 460px;
	overflow-y: auto;

	/* Cascade avatar tiles — each one appears a beat after the last.
	 * Short step (28ms) so the full 20-item grid finishes quickly. */
	& > * {
		animation-delay: 0ms;
	}
	& > *:nth-child(1) {
		animation-delay: 20ms;
	}
	& > *:nth-child(2) {
		animation-delay: 50ms;
	}
	& > *:nth-child(3) {
		animation-delay: 80ms;
	}
	& > *:nth-child(4) {
		animation-delay: 110ms;
	}
	& > *:nth-child(5) {
		animation-delay: 140ms;
	}
	& > *:nth-child(6) {
		animation-delay: 170ms;
	}
	& > *:nth-child(7) {
		animation-delay: 200ms;
	}
	& > *:nth-child(8) {
		animation-delay: 230ms;
	}
	& > *:nth-child(9) {
		animation-delay: 260ms;
	}
	& > *:nth-child(10) {
		animation-delay: 290ms;
	}
	& > *:nth-child(11) {
		animation-delay: 320ms;
	}
	& > *:nth-child(12) {
		animation-delay: 350ms;
	}
	& > *:nth-child(13) {
		animation-delay: 380ms;
	}
	& > *:nth-child(14) {
		animation-delay: 410ms;
	}
	& > *:nth-child(15) {
		animation-delay: 440ms;
	}
	& > *:nth-child(16) {
		animation-delay: 470ms;
	}
	& > *:nth-child(17) {
		animation-delay: 500ms;
	}
	& > *:nth-child(18) {
		animation-delay: 530ms;
	}
	& > *:nth-child(19) {
		animation-delay: 560ms;
	}
	& > *:nth-child(20) {
		animation-delay: 590ms;
	}

	@media (max-width: 560px) {
		grid-template-columns: repeat(4, 1fr);
	}
	@media (max-width: 400px) {
		grid-template-columns: repeat(3, 1fr);
	}
`

const PickerCell = styled.button<{ $picked: boolean }>`
	position: relative;
	aspect-ratio: 1 / 1;
	border-radius: 14px;
	border: 2px solid ${(p) => (p.$picked ? T.primary : 'rgba(37, 45, 58, 0.08)')};
	background: #ffffff;
	padding: 4px;
	cursor: pointer;
	animation: ${cellIn} 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
	transition:
		border-color 160ms,
		transform 160ms,
		background 160ms;

	img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: contain;
	}

	&:hover:not(:disabled) {
		transform: translateY(-2px);
		border-color: ${(p) => (p.$picked ? T.primary : T.textSecondary)};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const PickerCheck = styled.span`
	position: absolute;
	top: 6px;
	right: 6px;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background: ${T.primary};
	color: #ffffff;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 6px rgba(3, 105, 161, 0.35);
`

/* ─── Floating SaveBar (identical to SettingsPage's) ─────── */

const FloatingSaveBar = styled.div<{ $visible: boolean }>`
	position: fixed;
	bottom: 24px;
	left: 50%;
	z-index: 90;
	pointer-events: ${(p) => (p.$visible ? 'auto' : 'none')};
	transform: translate(-50%, ${(p) => (p.$visible ? '0' : '24px')});
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transition:
		opacity 240ms cubic-bezier(0.22, 1, 0.36, 1) ${(p) => (p.$visible ? '60ms' : '0ms')},
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	will-change: opacity, transform;

	& > .savebar-pill {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 12px 16px;
		min-width: min(560px, calc(100vw - 48px));
		border-radius: 14px;
		background: #0f172a;
		color: #ffffff;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 2px 4px rgba(15, 23, 42, 0.22),
			0 10px 24px -6px rgba(15, 23, 42, 0.3),
			0 28px 60px -16px rgba(15, 23, 42, 0.45);
	}
`

const SaveBarInfo = styled.span`
	font-size: 12.5px;
	font-weight: 600;
`

const SaveBarActions = styled.div`
	display: inline-flex;
	gap: 8px;
`

const PrimaryBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #0284c7, #0369a1);
	color: #ffffff;
	font: inherit;
	font-weight: 700;
	font-size: 12.5px;
	cursor: pointer;

	&:hover:not(:disabled) {
		filter: brightness(1.05);
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const GhostBtn = styled.button`
	padding: 8px 14px;
	border-radius: 10px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	background: transparent;
	color: #ffffff;
	font: inherit;
	font-weight: 500;
	font-size: 12.5px;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
	}
	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`
