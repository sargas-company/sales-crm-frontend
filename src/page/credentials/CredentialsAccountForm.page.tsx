import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	CloseRounded,
	LockOutlined,
	UploadFileOutlined,
	VpnKeyOutlined,
} from '@mui/icons-material'
import { TextField } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../../components/auth/PermissionGate'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../components/_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../components/_shared/formShell.styled'
import { useAppSelector } from '../../hooks'
import {
	useArchiveAccountMutation,
	useCreateAccountMutation,
	useDeleteAttachmentMutation,
	useGetAccountQuery,
	useHardDeleteAccountMutation,
	useListAttachmentsQuery,
	useUpdateAccountMutation,
	useUploadAttachmentMutation,
	useGetCredentialsPolicyQuery,
	type SecretPayload,
} from '../../store/credentials/credentialsApi'
import { API_BASE_URL } from '../../api/baseApi'
import HardDeleteModal from './HardDeleteModal'
import VaultSetupGate from './VaultSetupGate'

interface Props {
	mode: 'create' | 'edit'
}

interface FormFields {
	serviceName: string
	category: string
	serviceUrl: string
	tagsStr: string
	usernameHint: string
	username: string
	email: string
	password: string
	totpSeed: string
	pin: string
	secureNote: string
	recoveryStr: string
	customFields: { label: string; value: string }[]
}

interface FormErrors {
	serviceName?: string
	category?: string
}

const empty: FormFields = {
	serviceName: '',
	category: '',
	serviceUrl: '',
	tagsStr: '',
	usernameHint: '',
	username: '',
	email: '',
	password: '',
	totpSeed: '',
	pin: '',
	secureNote: '',
	recoveryStr: '',
	customFields: [],
}

const CredentialsAccountForm = ({ mode }: Props) => {
	const navigate = useNavigate()
	const params = useParams()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'
	const paramId = params.id as string

	const { data: existing, isLoading: loadingExisting, isError: fetchError } =
		useGetAccountQuery(paramId, { skip: !isEdit })

	const [fields, setFields] = useState<FormFields>(empty)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createAcct, { isLoading: creating }] = useCreateAccountMutation()
	const [updateAcct, { isLoading: updating }] = useUpdateAccountMutation()
	const [archive] = useArchiveAccountMutation()
	const [hardDelete] = useHardDeleteAccountMutation()
	const [showDelete, setShowDelete] = useState(false)
	const permissions = useAppSelector((s) => s.auth.permissions ?? [])
	const canHardDelete = permissions.includes('credentials:hard_delete')
	const busy = creating || updating

	useEffect(() => {
		if (!existing || !isEdit) return
		setFields((prev) => ({
			...prev,
			serviceName: existing.serviceName,
			category: existing.category,
			serviceUrl: existing.serviceUrl ?? '',
			tagsStr: existing.tags.join(', '),
			usernameHint: existing.usernameHint ?? '',
		}))
	}, [existing, isEdit])

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = () => {
		const next: FormErrors = {}
		if (!fields.serviceName.trim()) next.serviceName = 'Service name is required'
		if (!fields.category.trim()) next.category = 'Category is required'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const addCustom = () =>
		setFields((f) => ({ ...f, customFields: [...f.customFields, { label: '', value: '' }] }))
	const updCustom = (i: number, k: 'label' | 'value', v: string) =>
		setFields((f) => ({
			...f,
			customFields: f.customFields.map((c, j) =>
				i === j ? { ...c, [k]: v } : c,
			),
		}))
	const rmCustom = (i: number) =>
		setFields((f) => ({
			...f,
			customFields: f.customFields.filter((_, j) => j !== i),
		}))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return

		const secrets: SecretPayload = {}
		if (fields.username) secrets.username = fields.username
		if (fields.email) secrets.email = fields.email
		if (fields.password) secrets.password = fields.password
		if (fields.totpSeed) secrets.totpSeed = fields.totpSeed
		if (fields.pin) secrets.pin = fields.pin
		if (fields.secureNote) secrets.secureNote = fields.secureNote
		const recovery = fields.recoveryStr
			.split(/[\s,]+/)
			.map((c) => c.trim())
			.filter(Boolean)
		if (recovery.length) secrets.recoveryCodes = recovery
		const custom = fields.customFields.filter((c) => c.label.trim())
		if (custom.length) secrets.customFields = custom

		const tags = fields.tagsStr
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean)

		try {
			if (!isEdit) {
				await createAcct({
					profileId: paramId,
					serviceName: fields.serviceName.trim(),
					category: fields.category.trim(),
					serviceUrl: fields.serviceUrl.trim() || undefined,
					tags,
					usernameHint: fields.usernameHint.trim() || undefined,
					secrets,
				}).unwrap()
				showToast('Account created', 'success')
				navigate(`/credentials/profiles/${paramId}`)
			} else {
				const result = await updateAcct({
					id: paramId,
					body: {
						serviceName: fields.serviceName.trim(),
						category: fields.category.trim(),
						serviceUrl: fields.serviceUrl.trim() || undefined,
						tags,
						usernameHint: fields.usernameHint.trim() || undefined,
						secrets: Object.keys(secrets).length ? secrets : undefined,
					},
				}).unwrap()
				showToast('Account updated', 'success')
				navigate(`/credentials/profiles/${result.profileId}`)
			}
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	if (isEdit && loadingExisting)
		return <FormLoading label='Loading account…' />
	if (isEdit && (fetchError || !existing))
		return <FormNotFound label='Account not found' />

	const backTo = isEdit
		? `/credentials/profiles/${existing?.profileId ?? ''}`
		: `/credentials/profiles/${paramId}`

	return (
		<Shell $dark={isDark}>
			<VaultSetupGate />
			<Surface $dark={isDark}>
				<FormHeader
					backTo={backTo}
					backLabel='Back to profile'
					icon={<VpnKeyOutlined />}
					title={isEdit ? 'Edit account' : 'New account'}
					subtitle={
						isEdit
							? 'Update service info and encrypted secrets'
							: 'One account per service — logins and secrets are AES-encrypted at rest'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>
				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Service'
							hint='Which service this account is for'
						/>
						<FieldGrid>
							<Field
								label='Service name'
								required
								error={errors.serviceName}
							>
								<TextField
									name='service-name'
									placeholder='Upwork, Gmail, LinkedIn…'
									value={fields.serviceName}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('serviceName', e.target.value)
									}
									width='100%'
									error={!!errors.serviceName}
								/>
							</Field>
							<Field label='Category' required error={errors.category}>
								<TextField
									name='category'
									placeholder='Platform, Email, DevOps…'
									value={fields.category}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('category', e.target.value)
									}
									width='100%'
									error={!!errors.category}
								/>
							</Field>
							<Field label='Service URL' span='full'>
								<TextField
									name='service-url'
									placeholder='https://example.com'
									value={fields.serviceUrl}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('serviceUrl', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field
								label='Login hint'
								hint='Shown while vault is locked (e.g. va****@gmail.com)'
							>
								<TextField
									name='username-hint'
									placeholder='va****@gmail.com'
									value={fields.usernameHint}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('usernameHint', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Tags' hint='Comma-separated'>
								<TextField
									name='tags'
									placeholder='work, team-shared'
									value={fields.tagsStr}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('tagsStr', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Login credentials'
							hint='Encrypted at rest · never cached in Redux or localStorage'
						/>
						<FieldGrid>
							<Field label='Username'>
								<TextField
									name='username'
									value={fields.username}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('username', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Email'>
								<TextField
									name='email'
									value={fields.email}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('email', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Password' span='full'>
								<TextField
									name='password'
									type='password'
									placeholder={
										isEdit ? 'Leave blank to keep current' : ''
									}
									value={fields.password}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('password', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Two-factor'
							hint='TOTP seed and recovery codes'
						/>
						<FieldGrid>
							<Field
								label='TOTP seed (base32)'
								hint='Scanned from authenticator setup QR'
								span='full'
							>
								<TextField
									name='totp-seed'
									placeholder='JBSWY3DPEHPK3PXP'
									value={fields.totpSeed}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('totpSeed', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field
								label='Recovery codes'
								hint='One per line, or comma-separated'
								span='full'
							>
								<TextareaStyled
									rows={3}
									value={fields.recoveryStr}
									onChange={(e) =>
										setField('recoveryStr', e.target.value)
									}
									placeholder='abcd-efgh-ijkl'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={260}>
						<SectionHead
							num='04'
							title='Extras'
							hint='PIN, note, and custom fields'
						/>
						<FieldGrid>
							<Field label='PIN'>
								<TextField
									name='pin'
									value={fields.pin}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('pin', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Secure note' span='full'>
								<TextareaStyled
									rows={4}
									value={fields.secureNote}
									onChange={(e) =>
										setField('secureNote', e.target.value)
									}
								/>
							</Field>
							<Field
								label='Custom secret fields'
								hint='Add any key/value secret not covered above'
								span='full'
							>
								<CustomList>
									{fields.customFields.map((f, i) => (
										<CustomRow key={i}>
											<TextField
												name={`custom-label-${i}`}
												placeholder='Label'
												value={f.label}
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													updCustom(i, 'label', e.target.value)
												}
												width='100%'
											/>
											<TextField
												name={`custom-value-${i}`}
												placeholder='Value'
												value={f.value}
												onChange={(e: ChangeEvent<HTMLInputElement>) =>
													updCustom(i, 'value', e.target.value)
												}
												width='100%'
											/>
											<RemoveBtn
												type='button'
												onClick={() => rmCustom(i)}
												aria-label='Remove field'
											>
												<CloseRounded style={{ fontSize: 16 }} />
											</RemoveBtn>
										</CustomRow>
									))}
									<AddFieldBtn type='button' onClick={addCustom}>
										<AddRounded style={{ fontSize: 16 }} />
										Add field
									</AddFieldBtn>
								</CustomList>
							</Field>
						</FieldGrid>
					</Section>

					{isEdit && existing && (
						<Section $delay={320}>
							<SectionHead
								num='05'
								title='Attachments'
								hint='Encrypted files — PDFs, images, docs'
							/>
							<AttachmentsSection accountId={paramId} />
						</Section>
					)}

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Editing account · secrets are AES-encrypted'
								: 'Account will be created immediately · secrets AES-encrypted'}
						</FootLeft>
						<FootActions>
							{isEdit && existing?.status === 'ACTIVE' && (
								<PrimaryGhostButton
									type='button'
									onClick={async () => {
										if (!confirm('Archive this account?')) return
										try {
											await archive(paramId).unwrap()
											showToast('Account archived', 'success')
											navigate(
												`/credentials/profiles/${existing.profileId}`,
											)
										} catch (err) {
											showToast(parseServerError(err), 'error')
										}
									}}
								>
									Archive
								</PrimaryGhostButton>
							)}
							{isEdit && canHardDelete && existing && (
								<PrimaryGhostButton
									type='button'
									onClick={() => setShowDelete(true)}
								>
									Hard delete
								</PrimaryGhostButton>
							)}
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate(backTo)}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={
									isEdit ? 'credentials:update' : 'credentials:create'
								}
							>
								<PrimarySolidButton type='submit' disabled={busy}>
									{busy
										? 'Saving…'
										: isEdit
											? 'Save changes'
											: 'Create account'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>

			{showDelete && existing && (
				<HardDeleteModal
					title='Permanently delete account'
					description='This also removes every attachment. Audit entries remain forever.'
					confirmationLabel={existing.serviceName}
					expectedConfirmation={existing.serviceName}
					onClose={() => setShowDelete(false)}
					onConfirm={async ({ confirmation, mfa }) => {
						await hardDelete({ id: paramId, confirmation, mfa }).unwrap()
						showToast('Account deleted', 'success')
						navigate(`/credentials/profiles/${existing.profileId}`)
					}}
				/>
			)}
		</Shell>
	)
}

export default CredentialsAccountForm

/* ─── Attachments (shown only in edit mode) ─────────────────────── */

const AttachmentsSection = ({ accountId }: { accountId: string }) => {
	const { data: items = [] } = useListAttachmentsQuery(accountId)
	const [upload, { isLoading: uploading }] = useUploadAttachmentMutation()
	const [remove] = useDeleteAttachmentMutation()
	const { data: policy } = useGetCredentialsPolicyQuery()
	const maxMb = policy?.maxAttachmentMegabytes ?? 10
	const { showToast } = useToast()

	const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const maxBytes = maxMb * 1024 * 1024
		if (file.size > maxBytes) {
			showToast(
				`File exceeds the ${maxMb} MB limit.`,
				'error',
			)
			e.target.value = ''
			return
		}
		try {
			await upload({ accountId, file }).unwrap()
			showToast('File uploaded', 'success')
		} catch (ex) {
			showToast(parseServerError(ex), 'error')
		}
		e.target.value = ''
	}

	const download = async (attachmentId: string, filename: string) => {
		try {
			const res = await fetch(
				`${API_BASE_URL}/credential-accounts/attachments/${attachmentId}/download`,
				{ credentials: 'include' },
			)
			if (!res.ok) throw new Error(`HTTP ${res.status}`)
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = filename
			a.click()
			setTimeout(() => URL.revokeObjectURL(url), 1000)
		} catch (ex) {
			showToast((ex as Error).message, 'error')
		}
	}

	return (
		<AttachBox>
			{items.length === 0 ? (
				<AttachEmpty>
					<LockOutlined style={{ fontSize: 22, opacity: 0.4 }} />
					<span>No attachments yet</span>
				</AttachEmpty>
			) : (
				<AttachList>
					{items.map((a) => (
						<AttachRow key={a.id}>
							<AttachInfo>
								<AttachName>{a.filename}</AttachName>
								<AttachMeta>
									{a.mime} · {Math.round(a.size / 1024)} KB ·{' '}
									{new Date(a.createdAt).toLocaleDateString()}
								</AttachMeta>
							</AttachInfo>
							<AttachActions>
								<AttachLink
									type='button'
									onClick={() => download(a.id, a.filename)}
								>
									Download
								</AttachLink>
								<AttachDanger
									type='button'
									onClick={async () => {
										if (!confirm('Delete attachment?')) return
										try {
											await remove({ id: a.id, accountId }).unwrap()
											showToast('Attachment deleted', 'success')
										} catch (ex) {
											showToast(parseServerError(ex), 'error')
										}
									}}
								>
									Delete
								</AttachDanger>
							</AttachActions>
						</AttachRow>
					))}
				</AttachList>
			)}
			<UploadLabel>
				<input type='file' hidden onChange={onPick} />
				<UploadFileOutlined style={{ fontSize: 16 }} />
				{uploading ? 'Uploading…' : `Add file (max ${maxMb} MB)`}
			</UploadLabel>
		</AttachBox>
	)
}

/* ─── Styled components ──────────────────────────────────────────── */

const TextareaStyled = styled.textarea`
	width: 100%;
	padding: 10px 12px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.12);
	background: #ffffff;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	line-height: 1.5;
	color: #0f172a;
	resize: vertical;
	outline: none;
	transition: border-color 160ms;
	&:focus {
		border-color: #0369a1;
	}
`

const CustomList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const CustomRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr 32px;
	gap: 8px;
	align-items: center;
`

const RemoveBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	padding: 0;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #64748b;
	cursor: pointer;
	transition: all 160ms;
	&:hover {
		border-color: #dc2626;
		color: #dc2626;
		background: rgba(220, 38, 38, 0.04);
	}
`

const AddFieldBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	align-self: flex-start;
	padding: 8px 14px;
	border-radius: 999px;
	border: 1.5px dashed rgba(15, 23, 42, 0.14);
	background: transparent;
	color: #64748b;
	font: inherit;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 160ms;
	&:hover {
		border-color: #0369a1;
		color: #0369a1;
		background: rgba(3, 105, 161, 0.04);
	}
`

const AttachBox = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const AttachList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const AttachRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 10px 14px;
	background: rgba(15, 23, 42, 0.03);
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.06);
`

const AttachInfo = styled.div`
	min-width: 0;
`

const AttachName = styled.div`
	font-size: 13px;
	font-weight: 600;
	color: #0f172a;
	word-break: break-all;
`

const AttachMeta = styled.div`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11px;
	color: #64748b;
	margin-top: 2px;
`

const AttachActions = styled.div`
	display: inline-flex;
	gap: 6px;
	flex-shrink: 0;
`

const AttachLink = styled.button`
	padding: 6px 12px;
	border-radius: 999px;
	border: none;
	background: rgba(3, 105, 161, 0.08);
	color: #0369a1;
	font: inherit;
	font-size: 11px;
	font-weight: 600;
	cursor: pointer;
	transition: background 160ms;
	&:hover {
		background: rgba(3, 105, 161, 0.14);
	}
`

const AttachDanger = styled(AttachLink)`
	background: rgba(220, 38, 38, 0.08);
	color: #dc2626;
	&:hover {
		background: rgba(220, 38, 38, 0.14);
	}
`

const AttachEmpty = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 20px;
	border-radius: 10px;
	border: 1px dashed rgba(15, 23, 42, 0.12);
	background: #fafafd;
	color: #64748b;
	font-size: 13px;
	justify-content: center;
`

const UploadLabel = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	align-self: flex-start;
	padding: 8px 14px;
	border-radius: 999px;
	border: 1.5px dashed rgba(15, 23, 42, 0.14);
	background: transparent;
	color: #64748b;
	font-size: 12px;
	font-weight: 600;
	cursor: pointer;
	transition: all 160ms;
	&:hover {
		border-color: #0369a1;
		color: #0369a1;
		background: rgba(3, 105, 161, 0.04);
	}
`

