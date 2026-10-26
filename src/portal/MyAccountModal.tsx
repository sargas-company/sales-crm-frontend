import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Avatar } from '@mui/material'
import {
	PersonOutlineRounded,
	DeleteOutlineRounded,
} from '@mui/icons-material'

import ConfirmModal from '../components/_shared/ConfirmModal'
import {
	useGetMeQuery,
	useUpdateMeMutation,
	useRemoveAvatarMutation,
	useSetAvatarPresetMutation,
} from '../store/auth/authApi'
import { useToast } from '../context/toast/ToastContext'
import { AVATAR_PRESETS, avatarUrlFor } from '../page/settings/avatarPresets'

interface Props {
	onClose: () => void
}

/* Portal user's "My account" — opened from the user menu as a
 * ConfirmModal. Editable: first/last name, display name, avatar
 * (preset gallery, same as admin). Read-only: email. */
export const MyAccountModal = ({ onClose }: Props) => {
	const { data: me } = useGetMeQuery()
	const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation()
	const [setAvatarPreset, { isLoading: isPicking }] =
		useSetAvatarPresetMutation()
	const [removeAvatar, { isLoading: isRemoving }] = useRemoveAvatarMutation()
	const { showToast } = useToast()

	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [displayName, setDisplayName] = useState('')
	const [closing, setClosing] = useState(false)
	const [galleryOpen, setGalleryOpen] = useState(false)
	const gRef = useRef<HTMLDivElement | null>(null)
	const hydratedRef = useRef(false)

	/* Prime fields from server once /me arrives. Prevents overwriting
	 * user edits on background refetches. */
	useEffect(() => {
		if (hydratedRef.current || !me) return
		hydratedRef.current = true
		setFirstName(me.firstName ?? '')
		setLastName(me.lastName ?? '')
		setDisplayName(me.displayName ?? '')
	}, [me])

	/* Close gallery on outside click. */
	useEffect(() => {
		if (!galleryOpen) return
		const onDown = (e: MouseEvent) => {
			if (gRef.current && !gRef.current.contains(e.target as Node))
				setGalleryOpen(false)
		}
		document.addEventListener('mousedown', onDown)
		return () => document.removeEventListener('mousedown', onDown)
	}, [galleryOpen])

	const dirty =
		(me?.firstName ?? '') !== firstName.trim() ||
		(me?.lastName ?? '') !== lastName.trim() ||
		(me?.displayName ?? '') !== displayName.trim()

	const initials =
		((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() ||
		(displayName[0] ?? me?.email?.[0] ?? '?').toUpperCase()

	const handleSave = async () => {
		try {
			await updateMe({
				firstName: firstName.trim(),
				lastName: lastName.trim(),
				displayName: displayName.trim() === '' ? null : displayName.trim(),
			}).unwrap()
			showToast('Account updated', 'success')
			setClosing(true)
		} catch (e) {
			const msg =
				(e as { data?: { message?: string } })?.data?.message ??
				'Failed to update'
			showToast(msg, 'error')
		}
	}

	const handlePickPreset = async (id: string) => {
		try {
			await setAvatarPreset({ id }).unwrap()
			showToast('Avatar updated', 'success')
			setGalleryOpen(false)
		} catch {
			showToast('Failed to set avatar', 'error')
		}
	}
	const handleRemoveAvatar = async () => {
		try {
			await removeAvatar().unwrap()
			showToast('Avatar removed', 'success')
		} catch {
			showToast('Failed to remove avatar', 'error')
		}
	}

	return (
		<ConfirmModal
			icon={<PersonOutlineRounded />}
			iconTone='ink'
			title='My account'
			description='Change your name, display name or avatar. Email is set by Discord and cannot be changed.'
			confirmLabel='Save'
			confirmLoadingLabel='Saving…'
			confirmColor='ink'
			cancelLabel='Close'
			onConfirm={handleSave}
			onClose={onClose}
			forceClose={closing}
			isLoading={isSaving || isPicking || isRemoving}
			confirmDisabled={!dirty || firstName.trim() === ''}
			maxWidth={520}
		>
			<Body>
				<AvatarRow>
					<AvatarPreview>
						<Avatar
							src={me?.avatarUrl ?? undefined}
							alt={firstName}
							sx={{
								width: 72,
								height: 72,
								bgcolor: '#ffffff',
								color: '#0f172a',
								fontSize: 24,
								fontWeight: 700,
								border: '1px solid rgba(15, 23, 42, 0.1)',
							}}
						>
							{!me?.avatarUrl && initials}
						</Avatar>
					</AvatarPreview>
					<AvatarActions>
						<AvatarBtnRow>
							<ChangeBtn
								type='button'
								onClick={() => setGalleryOpen((v) => !v)}
							>
								Change avatar
							</ChangeBtn>
							{me?.avatarUrl && (
								<RemoveBtn type='button' onClick={handleRemoveAvatar}>
									<DeleteOutlineRounded style={{ fontSize: 15 }} />
									Remove
								</RemoveBtn>
							)}
						</AvatarBtnRow>
						<AvatarHint>Pick one from the gallery.</AvatarHint>
					</AvatarActions>
				</AvatarRow>

				{galleryOpen && (
					<Gallery ref={gRef}>
						{AVATAR_PRESETS.map((p) => {
							const url = avatarUrlFor(p)
							const active = me?.avatarUrl === url
							return (
								<GalleryItem
									key={p.id}
									type='button'
									$active={active}
									onClick={() => handlePickPreset(p.id)}
								>
									<img src={url} alt='' />
								</GalleryItem>
							)
						})}
					</Gallery>
				)}

				<Fields>
					<Field>
						<Label>First name</Label>
						<Input
							value={firstName}
							onChange={(e) => setFirstName(e.target.value)}
							placeholder='First name'
						/>
					</Field>
					<Field>
						<Label>Last name</Label>
						<Input
							value={lastName}
							onChange={(e) => setLastName(e.target.value)}
							placeholder='Last name'
						/>
					</Field>
				</Fields>
				<Field>
					<Label>Display name</Label>
					<Input
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						placeholder='Optional nickname shown on shares'
					/>
					<Hint>Leave empty to use "First Last" by default.</Hint>
				</Field>
				<Field>
					<Label>Email</Label>
					<Input value={me?.email ?? ''} disabled readOnly />
					<Hint>Managed by Discord.</Hint>
				</Field>
			</Body>
		</ConfirmModal>
	)
}

const Body = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 4px 2px 2px;
`
const AvatarRow = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
`
const AvatarPreview = styled.div``
const AvatarActions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`
const AvatarBtnRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;
`
const ChangeBtn = styled.button`
	display: inline-flex;
	align-items: center;
	padding: 8px 14px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #334155;
	font-family: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background 160ms ease, border-color 160ms ease;
	&:hover {
		background: rgba(15, 23, 42, 0.03);
		border-color: rgba(15, 23, 42, 0.14);
	}
`
const RemoveBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #64748b;
	font-family: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: background 160ms ease, color 160ms ease, border-color 160ms ease;
	&:hover {
		background: #dc2626;
		color: #ffffff;
		border-color: #dc2626;
	}
`
const AvatarHint = styled.p`
	margin: 0;
	font-size: 11.5px;
	color: #94a3b8;
`
const Gallery = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
	gap: 8px;
	padding: 10px;
	background: rgba(15, 23, 42, 0.03);
	border: 1px solid rgba(15, 23, 42, 0.06);
	border-radius: 12px;
	max-height: 220px;
	overflow-y: auto;
	&::-webkit-scrollbar { width: 6px; }
	&::-webkit-scrollbar-thumb {
		background: rgba(15, 23, 42, 0.15);
		border-radius: 999px;
	}
`
const GalleryItem = styled.button<{ $active: boolean }>`
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	aspect-ratio: 1 / 1;
	border-radius: 10px;
	border: ${({ $active }) =>
		$active ? '2px solid #0f172a' : '1px solid rgba(15, 23, 42, 0.1)'};
	background: #ffffff;
	cursor: pointer;
	padding: 4px;
	overflow: hidden;
	transition: transform 160ms ease, border-color 160ms ease;
	&:hover {
		transform: translateY(-2px);
		border-color: #0f172a;
	}
	img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		border-radius: 8px;
	}
`
const Fields = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
`
const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`
const Label = styled.label`
	font-size: 11.5px;
	font-weight: 700;
	color: #475569;
	text-transform: uppercase;
	letter-spacing: 0.5px;
`
const Input = styled.input`
	padding: 10px 14px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	border-radius: 10px;
	font-family: inherit;
	font-size: 14px;
	color: #0f172a;
	background: #ffffff;
	transition: border-color 160ms ease, box-shadow 160ms ease;
	&:focus {
		outline: none;
		border-color: #0f172a;
		box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
	}
	&:disabled {
		background: #f1f5f9;
		color: #64748b;
		cursor: not-allowed;
	}
`
const Hint = styled.p`
	margin: 0;
	font-size: 11px;
	color: #94a3b8;
`
