import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AddRounded, CloseRounded, DeleteOutline, VpnKeyOutlined } from '@mui/icons-material'
import { TextField } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../../components/auth/PermissionGate'
import { useAppSelector } from '../../hooks'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../components/_shared/FormShell'
import {
	DangerGhostButton,
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
import {
	useCreateAccountMutation,
	useGetAccountQuery,
	useHardDeleteAccountMutation,
	useUpdateAccountMutation,
	type SecretPayload,
} from '../../store/credentials/credentialsApi'
import { fetchAccountReveal } from '../../store/credentials/revealTransport'
import HardDeleteModal from './HardDeleteModal'
import PasswordStrengthField from './PasswordStrengthField'

interface Props {
	mode: 'create' | 'edit'
}

interface FormFields {
	serviceName: string
	serviceUrl: string
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
	identity?: string
	password?: string
}

const empty: FormFields = {
	serviceName: '',
	serviceUrl: '',
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
	const [hardDeleteAcct] = useHardDeleteAccountMutation()
	const permissions = useAppSelector((s) => s.auth.permissions ?? [])
	const canHardDelete = permissions.includes('credentials:hard_delete')
	const [showDelete, setShowDelete] = useState(false)
	const busy = creating || updating
	// Snapshot of initial values — used on submit to diff and ship
	// only fields that actually changed. Keeps metadata-only edits
	// from forging a secrets update + no-op Discord notif.
	const initialRef = useRef<FormFields>(empty)
	// Guard so we auto-reveal exactly once per form mount.
	const revealedRef = useRef(false)
	const [revealing, setRevealing] = useState(false)

	useEffect(() => {
		if (!existing || !isEdit) return
		setFields((prev) => ({
			...prev,
			serviceName: existing.serviceName,
			serviceUrl: existing.serviceUrl ?? '',
		}))
	}, [existing, isEdit])

	// Auto-reveal secrets on edit so the form opens pre-populated. One
	// `reveal` audit event per form mount (same cost as a manual reveal
	// click). Failure is non-fatal — fields just stay blank and the
	// user can fill them manually.
	useEffect(() => {
		if (!isEdit || !existing || revealedRef.current) return
		revealedRef.current = true
		setRevealing(true)
		fetchAccountReveal(paramId)
			.then((res) => {
				const s = res.secrets
				setFields((prev) => {
					const next: FormFields = {
						...prev,
						username: s.username ?? '',
						email: s.email ?? '',
						password: s.password ?? '',
						totpSeed: s.totpSeed ?? '',
						pin: s.pin ?? '',
						secureNote: s.secureNote ?? '',
						recoveryStr: (s.recoveryCodes ?? []).join('\n'),
						customFields: (s.customFields ?? []).map((f) => ({
							label: f.label,
							value: f.value,
						})),
					}
					// Capture the "as-opened" snapshot so submit diff works.
					initialRef.current = next
					return next
				})
			})
			.catch((err) => {
				showToast(
					`Could not auto-reveal: ${parseServerError(err)}`,
					'error',
				)
			})
			.finally(() => setRevealing(false))
	}, [isEdit, existing, paramId, showToast])

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = () => {
		const next: FormErrors = {}
		if (!fields.serviceName.trim()) next.serviceName = 'Service name is required'
		// Username OR Email required (either one is enough).
		if (!fields.username.trim() && !fields.email.trim()) {
			next.identity = 'Username or Email is required'
		}
		// Password required on create; on edit a blank value keeps the
		// stored secret unchanged.
		if (!isEdit && !fields.password) {
			next.password = 'Password is required'
		}
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

		try {
			if (!isEdit) {
				// Create: send every non-empty secret the user filled in.
				const secrets = buildFullSecrets(fields)
				await createAcct({
					profileId: paramId,
					serviceName: fields.serviceName.trim(),
					// Category removed from UI per owner spec — backend DTO
					// still requires it, so synthesise a stable placeholder.
					// Dropping the backend column is a destructive migration;
					// deferring until the next DB-touching release.
					category: 'default',
					serviceUrl: fields.serviceUrl.trim() || undefined,
					secrets,
				}).unwrap()
				showToast('Account created', 'success')
				navigate(`/credentials/profiles/${paramId}`)
			} else {
				// Edit: diff against the "as opened" snapshot so Discord
				// doesn't scream for no reason + the backend's own change-
				// detector reports an accurate changed-field list.
				const changed = buildChangedSecrets(initialRef.current, fields)
				const body: Record<string, unknown> = {}
				if (fields.serviceName.trim() !== initialRef.current.serviceName) {
					body.serviceName = fields.serviceName.trim()
				}
				if (
					fields.serviceUrl.trim() !==
					(initialRef.current.serviceUrl ?? '').trim()
				) {
					body.serviceUrl = fields.serviceUrl.trim() || undefined
				}
				if (changed) body.secrets = changed
				if (Object.keys(body).length === 0) {
					showToast('No changes to save', 'info')
					return
				}
				const result = await updateAcct({
					id: paramId,
					body: body as never,
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
								span='full'
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
							<Field label='Service URL (optional)' span='full'>
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
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Login credentials'
							hint='Encrypted at rest · never cached in Redux or localStorage'
						/>
						<FieldGrid>
							<Field
								label='Username'
								hint='Either Username or Email is required'
								error={errors.identity}
							>
								<TextField
									name='username'
									placeholder='e.g. vadym.sargas'
									value={fields.username}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('username', e.target.value)
									}
									width='100%'
									error={!!errors.identity}
								/>
							</Field>
							<Field
								label='Email'
								hint='Either Email or Username is required'
								error={errors.identity}
							>
								<TextField
									name='email'
									placeholder='name@example.com'
									value={fields.email}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('email', e.target.value)
									}
									width='100%'
									error={!!errors.identity}
								/>
							</Field>
							<Field
								label='Password'
								required={!isEdit}
								span='full'
								error={errors.password}
							>
								<PasswordStrengthField
									name='password'
									value={fields.password}
									onChange={(next) => setField('password', next)}
									placeholder={
										isEdit
											? 'Leave blank to keep current'
											: 'Enter a strong password'
									}
									hasError={!!errors.password}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Two-factor'
							hint='TOTP seed and recovery codes (optional)'
						/>
						<FieldGrid>
							<Field
								label='TOTP seed (optional)'
								hint='base32 — scanned from authenticator setup QR'
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
								label='Recovery codes (optional)'
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
							hint='PIN, note, and custom fields (all optional)'
						/>
						<FieldGrid>
							<Field label='PIN (optional)'>
								<TextField
									name='pin'
									placeholder='e.g. 1234'
									value={fields.pin}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('pin', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Secure note (optional)' span='full'>
								<TextareaStyled
									rows={4}
									placeholder='e.g. backup email, support PIN, whatever you need to remember about this account'
									value={fields.secureNote}
									onChange={(e) =>
										setField('secureNote', e.target.value)
									}
								/>
							</Field>
							<Field
								label='Custom secret fields (optional)'
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
												<CloseRounded />
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

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Editing account · secrets are AES-encrypted'
								: 'Account will be created immediately · secrets AES-encrypted'}
						</FootLeft>
						<FootActions>
							{isEdit && canHardDelete && existing && (
								<DangerGhostButton
									type='button'
									onClick={() => setShowDelete(true)}
								>
									<DeleteOutline style={{ fontSize: 16 }} />
									Hard delete
								</DangerGhostButton>
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
					description='Encrypted secrets + full history will be removed. Audit entries remain forever. This cannot be undone.'
					confirmationLabel={existing.serviceName}
					expectedConfirmation={existing.serviceName}
					onClose={() => setShowDelete(false)}
					onConfirm={async ({ confirmation, mfa }) => {
						await hardDeleteAcct({
							id: paramId,
							confirmation,
							mfa,
						}).unwrap()
						showToast('Account deleted', 'success')
						navigate(`/credentials/profiles/${existing.profileId}`)
					}}
				/>
			)}
		</Shell>
	)
}

export default CredentialsAccountForm

/* ─── Secret payload builders ──────────────────────────────────────
 *
 * `buildFullSecrets` is used on CREATE (initial values are empty, so
 * we just drop empty strings).
 *
 * `buildChangedSecrets` is used on EDIT: it compares the current form
 * state against the "as opened" snapshot and returns the smallest
 * SecretPayload that reflects just the user's changes. Returns null
 * when nothing changed — the caller then omits `secrets` from the
 * PATCH entirely, which prevents a no-op Discord notif / version row.
 */
function buildFullSecrets(f: FormFields): SecretPayload {
	const s: SecretPayload = {}
	if (f.username) s.username = f.username
	if (f.email) s.email = f.email
	if (f.password) s.password = f.password
	if (f.totpSeed) s.totpSeed = f.totpSeed
	if (f.pin) s.pin = f.pin
	if (f.secureNote) s.secureNote = f.secureNote
	const recovery = f.recoveryStr
		.split(/[\s,]+/)
		.map((c) => c.trim())
		.filter(Boolean)
	if (recovery.length) s.recoveryCodes = recovery
	const custom = f.customFields.filter((c) => c.label.trim())
	if (custom.length) s.customFields = custom
	return s
}

function buildChangedSecrets(
	initial: FormFields,
	current: FormFields,
): SecretPayload | null {
	const diff: SecretPayload = {}
	let changed = false
	const scalarKeys = [
		'username',
		'email',
		'password',
		'totpSeed',
		'pin',
		'secureNote',
	] as const
	for (const k of scalarKeys) {
		if ((initial[k] ?? '').trim() !== (current[k] ?? '').trim()) {
			diff[k] = current[k] ?? ''
			changed = true
		}
	}
	// Recovery codes: compare normalised arrays.
	const normalise = (raw: string) =>
		raw.split(/[\s,]+/).map((c) => c.trim()).filter(Boolean)
	const prevRec = normalise(initial.recoveryStr).join('|')
	const nextRec = normalise(current.recoveryStr).join('|')
	if (prevRec !== nextRec) {
		diff.recoveryCodes = normalise(current.recoveryStr)
		changed = true
	}
	// Custom fields: compare as a (label, value) multiset.
	const asBag = (list: { label: string; value: string }[]) =>
		list
			.filter((f) => f.label.trim())
			.map((f) => `${f.label.trim()}=${f.value.trim()}`)
			.sort()
			.join('\n')
	if (asBag(initial.customFields) !== asBag(current.customFields)) {
		diff.customFields = current.customFields.filter((f) => f.label.trim())
		changed = true
	}
	return changed ? diff : null
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

/* Custom-secret list wrapper. Extra top margin lifts the first row
 * away from the "Custom secret fields" field-label, and extra bottom
 * padding gives the "Add field" button air so it doesn't collide
 * with the Section's bottom edge. Inner `gap` separates stacked
 * rows + the Add button from each other. */
const CustomList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
	margin-top: 10px;
	padding: 4px 4px 6px;
`

const CustomRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr auto;
	gap: 10px;
	/* Stretch so the X button matches the TextField height instead of
	 * floating as a small square next to tall inputs. */
	align-items: stretch;
`

/* Remove-X: borderless + transparent so it reads as a glyph next to
 * the inputs, not a hard-outlined button. On hover: colour shifts to
 * destructive red and the X rotates 180° — gives the deliberate "I
 * really meant delete" feel without a jarring border swap. */
const RemoveBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 44px;
	padding: 0;
	border: none;
	background: transparent;
	color: #94a3b8;
	cursor: pointer;
	transition: color 160ms;

	&:hover {
		color: #dc2626;
	}
	&:focus-visible {
		outline: 2px solid rgba(220, 38, 38, 0.35);
		outline-offset: 2px;
		border-radius: 10px;
	}

	svg {
		font-size: 20px;
		transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1);
	}
	&:hover svg {
		transform: rotate(180deg);
	}
`

const AddFieldBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	align-self: flex-start;
	margin-top: 4px;
	padding: 10px 16px;
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

