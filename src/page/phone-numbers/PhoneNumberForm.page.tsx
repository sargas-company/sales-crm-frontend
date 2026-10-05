import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import {
	CloseRounded,
	PhoneAndroidOutlined,
	PowerSettingsNewRounded,
} from '@mui/icons-material'
import { TextField, Select, SelectItem } from '../../ui'
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
	OPERATOR_LABEL,
	STATUS_LABEL,
	useCreatePhoneNumberMutation,
	useDisablePhoneNumberMutation,
	useGetPhoneNumberQuery,
	useUpdatePhoneNumberMutation,
	useCreateBindingMutation,
	useRemoveBindingMutation,
	useUpdateBindingMutation,
	type PhoneBinding,
	type PhoneBindingSummary,
	type PhoneOperator,
	type PhoneStatus,
} from '../../store/phone-numbers/phoneNumbersApi'
import { useListPhoneServicesQuery } from '../../store/phone-numbers/phoneServicesApi'
import { useListProfilesQuery } from '../../store/credentials/credentialsApi'

interface Props {
	mode: 'create' | 'edit' | 'view'
}

/* Progressive +380 XX XXX XX XX mask. Keeps up to 12 digits, auto-
 * prepends "+" and spaces as the user types; also normalises an
 * already-formatted value loaded from the server. */
const maskPhone = (raw: string): string => {
	const digits = raw.replace(/\D/g, '').slice(0, 12)
	if (digits.length === 0) return ''
	const parts: string[] = ['+' + digits.slice(0, 3)]
	if (digits.length > 3) parts.push(digits.slice(3, 5))
	if (digits.length > 5) parts.push(digits.slice(5, 8))
	if (digits.length > 8) parts.push(digits.slice(8, 10))
	if (digits.length > 10) parts.push(digits.slice(10, 12))
	return parts.join(' ')
}

const PhoneNumberForm = ({ mode }: Props) => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const needsExisting = mode === 'edit' || mode === 'view'
	const existingQuery = useGetPhoneNumberQuery(id!, {
		skip: !needsExisting || !id,
	})
	const isEdit = mode === 'edit'
	const isView = mode === 'view'
	const readOnly = isView
	const existing = existingQuery.data

	const [number, setNumber] = useState('')
	const [operator, setOperator] = useState<PhoneOperator | ''>('')
	const [status, setStatus] = useState<PhoneStatus>('ACTIVE')
	const [holderName, setHolderName] = useState('')
	const [maintenanceRequired, setMaintenanceRequired] = useState(true)
	const [nextMaintenanceAt, setNextMaintenanceAt] = useState('')
	const [notes, setNotes] = useState('')

	/* Bindings are saved via their own API calls, but we still want Save
	 * to light up so the user can confirm/exit the edit flow after a
	 * binding change. */
	const [bindingsTouched, setBindingsTouched] = useState(false)

	/* In create mode we accumulate pending bindings locally and only
	 * persist them AFTER the phone number row exists (sequential POST
	 * loop in handleSubmit). Each entry carries a tempId so the UI can
	 * key/remove it before any server id exists. */
	type PendingBinding = {
		tempId: string
		serviceId: string
		serviceName: string
		credentialProfileId: string | null
		credentialProfileName: string | null
		status: PhoneStatus
	}
	const [pendingBindings, setPendingBindings] = useState<PendingBinding[]>(
		[],
	)

	/* Field-level errors keyed by field name. Rendered via Field's
	 * `error` prop (text under the input) + TextField's `error` prop
	 * (red border + red label). Cleared individually on user input. */
	const [errors, setErrors] = useState<Record<string, string>>({})

	const validate = (): Record<string, string> => {
		const next: Record<string, string> = {}
		const digits = number.replace(/\D/g, '')
		if (digits.length === 0) {
			next.number = 'Phone number is required.'
		} else if (digits.length < 10) {
			next.number =
				'Looks too short — need at least 10 digits (country code + number).'
		}
		if (!operator) {
			next.operator = 'Operator is required.'
		}
		if (
			nextMaintenanceAt &&
			!/^\d{4}-\d{2}-\d{2}$/.test(nextMaintenanceAt)
		) {
			next.nextMaintenanceAt = 'Date must be in YYYY-MM-DD format.'
		}
		return next
	}

	const clearError = (field: string) => {
		if (!errors[field]) return
		setErrors((prev) => {
			const next = { ...prev }
			delete next[field]
			return next
		})
	}

	useEffect(() => {
		if (existing) {
			setNumber(maskPhone(existing.number))
			setOperator(existing.operator)
			setStatus(existing.status)
			setHolderName(
				existing.holderName ??
					(existing.holder
						? `${existing.holder.firstName} ${existing.holder.lastName}`.trim()
						: ''),
			)
			setMaintenanceRequired(existing.maintenanceRequired)
			setNextMaintenanceAt(
				existing.nextMaintenanceAt
					? existing.nextMaintenanceAt.slice(0, 10)
					: '',
			)
			setNotes(existing.notes ?? '')
		}
	}, [existing])

	/* Reset scroll on mode change so view→edit doesn't land halfway down. */
	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
	}, [mode, id])

	/* Dirty-check: in edit mode, disable Save unless something actually
	 * differs from the loaded record. Compare normalised shapes so the
	 * phone-mask doesn't make the field look dirty on load. */
	const isDirty = (() => {
		if (!isEdit || !existing) return true
		if (bindingsTouched) return true
		const existingDate = existing.nextMaintenanceAt
			? existing.nextMaintenanceAt.slice(0, 10)
			: ''
		const existingHolder =
			existing.holderName ??
			(existing.holder
				? `${existing.holder.firstName} ${existing.holder.lastName}`.trim()
				: '')
		return (
			number.replace(/\D/g, '') !== existing.number.replace(/\D/g, '') ||
			operator !== existing.operator ||
			status !== existing.status ||
			holderName.trim() !== existingHolder ||
			maintenanceRequired !== existing.maintenanceRequired ||
			nextMaintenanceAt !== existingDate ||
			(notes ?? '') !== (existing.notes ?? '')
		)
	})()

	const [createMut, { isLoading: isCreating }] = useCreatePhoneNumberMutation()
	const [updateMut, { isLoading: isUpdating }] = useUpdatePhoneNumberMutation()
	const [createBindingMut] = useCreateBindingMutation()
	const [disableMut, { isLoading: isDisabling }] =
		useDisablePhoneNumberMutation()
	const [confirmingDisable, setConfirmingDisable] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const found = validate()
		if (Object.keys(found).length) {
			setErrors(found)
			showToast('Please fix the highlighted fields', 'error')
			return
		}
		setErrors({})
		try {
			if (isEdit && existing) {
				await updateMut({
					id: existing.id,
					body: {
						number,
						operator,
						status,
						holderName: holderName.trim() || null,
						maintenanceRequired,
						nextMaintenanceAt: nextMaintenanceAt || null,
						notes,
					} as any,
				}).unwrap()
				showToast('Phone number saved', 'success')
				navigate(`/phone-numbers/view/${existing.id}`)
			} else {
				const created = await createMut({
					number,
					operator,
					status,
					holderName: holderName.trim() || null,
					maintenanceRequired,
					nextMaintenanceAt: nextMaintenanceAt || null,
					notes,
				} as any).unwrap()
				// Persist pending bindings sequentially — if any fails,
				// the number already exists and the user can finish from edit.
				for (const pb of pendingBindings) {
					try {
						await createBindingMut({
							phoneNumberId: created.id,
							serviceId: pb.serviceId,
							credentialProfileId: pb.credentialProfileId,
							status: pb.status,
						} as any).unwrap()
					} catch (err) {
						showToast(
							`Failed to add "${pb.serviceName}": ${parseServerError(err)}`,
							'error',
						)
					}
				}
				showToast('Phone number created', 'success')
				navigate(`/phone-numbers/view/${created.id}`)
			}
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const handleDisable = () => {
		if (!existing) return
		setConfirmingDisable(true)
	}

	const confirmDisable = async () => {
		if (!existing) return
		try {
			await disableMut(existing.id).unwrap()
			showToast('Phone number disabled', 'warning')
			setConfirmingDisable(false)
			navigate('/phone-numbers')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	if (needsExisting && existingQuery.isLoading) return <FormLoading />
	if (needsExisting && !existing) return <FormNotFound label='Phone number' />

	return (
		<Shell $dark={isDark} key={`${mode}-${id ?? 'new'}`}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/phone-numbers'
					backLabel='Back to phone numbers'
					icon={<PhoneAndroidOutlined />}
					title={
						isView
							? 'Phone number'
							: isEdit
								? 'Edit phone number'
								: 'New phone number'
					}
					subtitle={
						isView
							? `Read-only view of ${existing?.number ?? ''} — hit "Edit" to make changes.`
							: isEdit
								? `Update ${existing?.number ?? ''} identity, status and maintenance policy.`
								: 'Register a SIM, assign the holder and set up maintenance cadence.'
					}
					badgeLabel={isView ? 'View' : isEdit ? 'Edit' : 'Draft'}
					badgeTone={isView ? 'view' : isEdit ? 'edit' : 'draft'}
				/>
				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='Number, operator and status'
						/>
						<FieldGrid>
							<Field
								label='Phone number'
								htmlFor='phone-number'
								required
								error={errors.number}
							>
								<TextField
									id='phone-number'
									value={number}
									onChange={(e) => {
										const v = maskPhone(e.target.value)
										setNumber(v)
										if (
											errors.number &&
											v.replace(/\D/g, '').length >= 10
										) {
											clearError('number')
										}
									}}
									placeholder='+380 50 123 45 67'
									required
									disabled={readOnly}
									error={!!errors.number}
								/>
							</Field>
							<Field
								label='Operator'
								htmlFor='phone-operator'
								required
								error={errors.operator}
							>
								{readOnly ? (
									<TextField
										id='phone-operator'
										value={operator ? OPERATOR_LABEL[operator] : '—'}
										disabled
									/>
								) : (
									<OperatorSelectWrap $invalid={!!errors.operator}>
										<Select
											id='phone-operator'
											value={operator || undefined}
											placeholder='Select operator'
											onChange={(v) => {
												setOperator(v as PhoneOperator)
												if (errors.operator) clearError('operator')
											}}
										>
											{(Object.keys(OPERATOR_LABEL) as PhoneOperator[]).map(
												(k) => (
													<SelectItem
														key={k}
														value={k}
														label={OPERATOR_LABEL[k]}
													/>
												),
											)}
										</Select>
									</OperatorSelectWrap>
								)}
							</Field>
							<Field label='Status' htmlFor='phone-status'>
								{readOnly ? (
									<TextField
										id='phone-status'
										value={STATUS_LABEL[status]}
										disabled
									/>
								) : (
									<Select
										id='phone-status'
										defaultValue={status}
										placeholder='Select status'
										onChange={(v) => setStatus(v as PhoneStatus)}
									>
										{(Object.keys(STATUS_LABEL) as PhoneStatus[]).map(
											(k) => (
												<SelectItem
													key={k}
													value={k}
													label={STATUS_LABEL[k]}
												/>
											),
										)}
									</Select>
								)}
							</Field>
							<Field label='Holder' htmlFor='phone-holder'>
								<TextField
									id='phone-holder'
									value={holderName}
									onChange={(e) => setHolderName(e.target.value)}
									placeholder="Who's carrying this SIM"
									disabled={readOnly}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Maintenance'
							hint='Three-month cycle: register + top up'
						/>
						<FieldGrid>
							<Field label='Requires maintenance' htmlFor='phone-mnt-req'>
								<Toggle>
									<input
										id='phone-mnt-req'
										type='checkbox'
										checked={maintenanceRequired}
										onChange={(e) =>
											setMaintenanceRequired(e.target.checked)
										}
										disabled={readOnly}
									/>
									<span>
										{maintenanceRequired ? 'Yes' : 'No'}
									</span>
								</Toggle>
							</Field>
							<Field
								label='Next maintenance date'
								htmlFor='phone-mnt-next'
								hint='Operator can edit when importing existing numbers'
								error={errors.nextMaintenanceAt}
							>
								<TextField
									id='phone-mnt-next'
									type='date'
									value={nextMaintenanceAt}
									onChange={(e) => {
										setNextMaintenanceAt(e.target.value)
										if (errors.nextMaintenanceAt) {
											clearError('nextMaintenanceAt')
										}
									}}
									disabled={readOnly || !maintenanceRequired}
									placeholder='YYYY-MM-DD'
									error={!!errors.nextMaintenanceAt}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Notes'
							hint='Freeform remarks for the team'
						/>
						<TextField
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={
								readOnly
									? '—'
									: 'Freeform notes — stays visible to the team'
							}
							multiline
							rows={3}
							disabled={readOnly}
						/>
					</Section>

					{needsExisting && existing && (
						<Section $delay={260}>
							<SectionHead
								num='04'
								title='Service assignments'
								hint='Which services this SIM is signed up for'
							/>
							<BindingsEditor
								phoneNumberId={existing.id}
								bindings={existing.bindings}
								readOnly={readOnly}
								onChanged={() => setBindingsTouched(true)}
							/>
						</Section>
					)}

					{!isEdit && !isView && (
						<Section $delay={260}>
							<SectionHead
								num='04'
								title='Service assignments'
								hint='Add services now — bindings persist together with the number on Create'
							/>
							<PendingBindingsEditor
								pending={pendingBindings}
								onAdd={(b) =>
									setPendingBindings((prev) => [
										...prev,
										{ ...b, tempId: `tmp-${Date.now()}` },
									])
								}
								onRemove={(tempId) =>
									setPendingBindings((prev) =>
										prev.filter((p) => p.tempId !== tempId),
									)
								}
							/>
						</Section>
					)}

					<FootBar $dark={isDark}>
						<FootLeft>
							{isEdit && existing && (
								<PermissionGate permission='phone_numbers:delete'>
									<PrimaryGhostButton
										type='button'
										onClick={handleDisable}
									>
										Disable number
									</PrimaryGhostButton>
								</PermissionGate>
							)}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/phone-numbers')}
							>
								{isView ? 'Back' : 'Cancel'}
							</PrimaryGhostButton>
							{isView && existing ? (
								<PermissionGate
									key='nav-edit'
									permission='phone_numbers:update'
								>
									<PrimarySolidButton
										key='nav-edit-btn'
										type='button'
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											navigate(
												`/phone-numbers/edit/${existing.id}`,
											)
										}}
									>
										Edit
									</PrimarySolidButton>
								</PermissionGate>
							) : (
								<PermissionGate
									key='submit'
									permission={
										isEdit ? 'phone_numbers:update' : 'phone_numbers:create'
									}
								>
									<PrimarySolidButton
										key='submit-btn'
										type='submit'
										disabled={isCreating || isUpdating || !isDirty}
									>
										{isCreating || isUpdating
											? 'Saving…'
											: isEdit
												? 'Save changes'
												: 'Create'}
									</PrimarySolidButton>
								</PermissionGate>
							)}
						</FootActions>
					</FootBar>
				</form>
			</Surface>
			{confirmingDisable && existing && (
				<ConfirmModal
					icon={<PowerSettingsNewRounded />}
					iconTone='danger'
					confirmColor='error'
					title='Disable phone number?'
					description={
						<>
							This marks <strong>{existing.number}</strong> as{' '}
							<strong>DISABLED</strong> and turns maintenance off. The
							number stays in history and can be re-activated later from
							the edit page.
						</>
					}
					confirmLabel='Disable'
					confirmLoadingLabel='Disabling…'
					cancelLabel='Cancel'
					isLoading={isDisabling}
					onConfirm={confirmDisable}
					onClose={() => {
						if (!isDisabling) setConfirmingDisable(false)
					}}
				/>
			)}
		</Shell>
	)
}

export default PhoneNumberForm

/* Local-only bindings editor shown in create-mode. Pushes rows into a
 * parent-held array; nothing talks to the server until the parent
 * clicks Create. Visual mirrors the edit-mode BindingsEditor (V2 term
 * card + add row) so the UX stays consistent. */
const PendingBindingsEditor = ({
	pending,
	onAdd,
	onRemove,
}: {
	pending: Array<{
		tempId: string
		serviceId: string
		serviceName: string
		credentialProfileId: string | null
		credentialProfileName: string | null
		status: PhoneStatus
	}>
	onAdd: (b: {
		serviceId: string
		serviceName: string
		credentialProfileId: string | null
		credentialProfileName: string | null
		status: PhoneStatus
	}) => void
	onRemove: (tempId: string) => void
}) => {
	const { showToast } = useToast()
	const { data: services } = useListPhoneServicesQuery()
	const { data: profiles } = useListProfilesQuery({
		status: 'ACTIVE',
		limit: 100,
	} as any)
	const [serviceId, setServiceId] = useState('')
	const [profileId, setProfileId] = useState('')
	const [status, setStatus] = useState<PhoneStatus>('ACTIVE')
	const [serviceErr, setServiceErr] = useState(false)

	const assignedIds = new Set(pending.map((p) => p.serviceId))
	const availableServices = (services ?? []).filter(
		(s) => !assignedIds.has(s.id),
	)

	const add = () => {
		if (!serviceId) {
			setServiceErr(true)
			showToast('Pick a service first', 'error')
			return
		}
		const svc = (services ?? []).find((s) => s.id === serviceId)
		if (!svc) return
		const prof =
			profileId &&
			((profiles as any)?.data ?? []).find((p: any) => p.id === profileId)
		onAdd({
			serviceId,
			serviceName: svc.name,
			credentialProfileId: profileId || null,
			credentialProfileName: prof ? prof.name : null,
			status,
		})
		setServiceId('')
		setProfileId('')
		setServiceErr(false)
	}

	return (
		<BindingsWrap>
			<V2Terminal>
				<V2Head>
					<V2Dots>
						<span className='r' />
						<span className='y' />
						<span className='g' />
					</V2Dots>
					<V2Path>phone@sargas:~/bindings (pending)</V2Path>
				</V2Head>
				{pending.length === 0 && (
					<MutedRow>
						No service assignments yet — add some below to persist
						together with the number.
					</MutedRow>
				)}
				{pending.map((b) => (
					<V2Row key={b.tempId}>
						<V2Arrow>→</V2Arrow>
						<V2Name>{b.serviceName}</V2Name>
						<V2Dot>·</V2Dot>
						<V2Profile>{b.credentialProfileName ?? '—'}</V2Profile>
						<V2Spacer />
						<V2StatusPill $status={b.status}>
							{STATUS_LABEL[b.status].toLowerCase()}
						</V2StatusPill>
						<V2Close
							type='button'
							onClick={() => onRemove(b.tempId)}
							aria-label='Remove'
						>
							<CloseRounded style={{ fontSize: 15 }} />
						</V2Close>
					</V2Row>
				))}
			</V2Terminal>

			<AddBindingRow>
				<SmallSelect
					value={serviceId}
					onChange={(e) => {
						const v = e.target.value
						setServiceId(v)
						if (serviceErr && v) setServiceErr(false)
					}}
					data-invalid={serviceErr || undefined}
					aria-invalid={serviceErr}
				>
					<option value=''>
						{availableServices.length === 0
							? '— All services already added —'
							: '— Pick a service —'}
					</option>
					{availableServices.map((s) => (
						<option key={s.id} value={s.id}>
							{s.name}
						</option>
					))}
				</SmallSelect>
				<SmallSelect
					value={profileId}
					onChange={(e) => setProfileId(e.target.value)}
				>
					<option value=''>— No credential profile —</option>
					{((profiles as any)?.data ?? []).map((p: any) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</SmallSelect>
				<SmallSelect
					value={status}
					onChange={(e) => setStatus(e.target.value as PhoneStatus)}
				>
					<option value='ACTIVE'>Active</option>
					<option value='HOLD'>Hold</option>
				</SmallSelect>
				<AddBtn type='button' onClick={add}>
					Add assignment
				</AddBtn>
			</AddBindingRow>
		</BindingsWrap>
	)
}

const LEAVE_MS = 320

const BindingsEditor = ({
	phoneNumberId,
	bindings,
	readOnly = false,
	onChanged,
}: {
	phoneNumberId: string
	bindings: PhoneBindingSummary[]
	readOnly?: boolean
	onChanged?: () => void
}) => {
	const { showToast } = useToast()
	const { data: services } = useListPhoneServicesQuery()
	const { data: profiles } = useListProfilesQuery({ status: 'ACTIVE', limit: 100 } as any)

	/* Hide services already assigned to this number so the dropdown
	 * only shows what can still be added. */
	const assignedIds = new Set(bindings.map((b) => b.serviceId))
	const availableServices = (services ?? []).filter((s) => !assignedIds.has(s.id))
	const [serviceId, setServiceId] = useState('')
	const [profileId, setProfileId] = useState('')
	const [status, setStatus] = useState<PhoneStatus>('ACTIVE')
	const [createMut, { isLoading }] = useCreateBindingMutation()
	const [removeMut] = useRemoveBindingMutation()
	const [updateMut] = useUpdateBindingMutation()

	const [confirmTarget, setConfirmTarget] = useState<PhoneBinding | null>(
		null,
	)
	const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set())
	const [isRemoving, setIsRemoving] = useState(false)

	const [serviceErr, setServiceErr] = useState(false)

	const add = async () => {
		if (!serviceId) {
			setServiceErr(true)
			showToast('Pick a service first', 'error')
			return
		}
		setServiceErr(false)
		try {
			await createMut({
				phoneNumberId,
				serviceId,
				credentialProfileId: profileId || null,
				status,
			} as any).unwrap()
			setServiceId('')
			setProfileId('')
			showToast('Assignment added', 'success')
			onChanged?.()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const askRemove = (b: PhoneBinding) => {
		setConfirmTarget(b)
	}

	const confirmRemove = async () => {
		if (!confirmTarget) return
		const b = confirmTarget
		setIsRemoving(true)
		// Mark row as leaving — triggers the collapse+fade transition.
		setLeavingIds((prev) => {
			const next = new Set(prev)
			next.add(b.id)
			return next
		})
		// Let CSS play out before unmounting via the API call.
		await new Promise((r) => window.setTimeout(r, LEAVE_MS))
		try {
			await removeMut(b.id).unwrap()
			showToast('Assignment removed', 'success')
			onChanged?.()
		} catch (err) {
			showToast(parseServerError(err), 'error')
		} finally {
			setLeavingIds((prev) => {
				const next = new Set(prev)
				next.delete(b.id)
				return next
			})
			setIsRemoving(false)
			setConfirmTarget(null)
		}
	}

	return (
		<BindingsWrap>
			<V2Terminal>
				<V2Head>
					<V2Dots>
						<span className='r' />
						<span className='y' />
						<span className='g' />
					</V2Dots>
					<V2Path>phone@sargas:~/bindings</V2Path>
				</V2Head>
				{bindings.length === 0 && (
					<MutedRow>No service assignments yet.</MutedRow>
				)}
				{bindings.map((b) => (
					<V2Row key={b.id} $leaving={leavingIds.has(b.id)}>
						<V2Arrow>→</V2Arrow>
						<V2Name>
							{b.service?.name ?? (b as any).serviceName ?? '—'}
						</V2Name>
						<V2Dot>·</V2Dot>
						<V2Profile>
							{b.credentialProfile
								? b.credentialProfile.name
								: '—'}
						</V2Profile>
						<V2Spacer />
						<V2StatusPill $status={b.status}>
							{STATUS_LABEL[b.status].toLowerCase()}
						</V2StatusPill>
						{!readOnly && (
							<V2Close
								type='button'
								onClick={() => askRemove(b as PhoneBinding)}
								aria-label='Remove'
								disabled={leavingIds.has(b.id)}
							>
								<CloseRounded style={{ fontSize: 15 }} />
							</V2Close>
						)}
					</V2Row>
				))}
			</V2Terminal>

			{confirmTarget && (
				<ConfirmModal
					icon={<CloseRounded />}
					iconTone='danger'
					confirmColor='error'
					title='Remove service assignment?'
					description={
						<>
							This will unlink{' '}
							<strong>
								{confirmTarget.service?.name ??
									(confirmTarget as any).serviceName ??
									'this service'}
							</strong>{' '}
							from this
							SIM. The credential profile and the service itself stay
							intact.
						</>
					}
					confirmLabel='Remove'
					confirmLoadingLabel='Removing…'
					cancelLabel='Cancel'
					isLoading={isRemoving}
					onConfirm={confirmRemove}
					onClose={() => {
						if (!isRemoving) setConfirmTarget(null)
					}}
				/>
			)}
			{!readOnly && (
				<AddBindingRow>
				<SmallSelect
					value={serviceId}
					onChange={(e) => {
						const v = e.target.value
						setServiceId(v)
						if (serviceErr && v) setServiceErr(false)
					}}
					data-invalid={serviceErr || undefined}
					aria-invalid={serviceErr}
				>
					<option value=''>
						{availableServices.length === 0
							? '— All services already added —'
							: '— Pick a service —'}
					</option>
					{availableServices.map((s) => (
						<option key={s.id} value={s.id}>
							{s.name}
						</option>
					))}
				</SmallSelect>
				<SmallSelect
					value={profileId}
					onChange={(e) => setProfileId(e.target.value)}
				>
					<option value=''>— No credential profile —</option>
					{((profiles as any)?.data ?? []).map((p: any) => (
						<option key={p.id} value={p.id}>
							{p.name}
						</option>
					))}
				</SmallSelect>
				<SmallSelect
					value={status}
					onChange={(e) => setStatus(e.target.value as PhoneStatus)}
				>
					<option value='ACTIVE'>Active</option>
					<option value='HOLD'>Hold</option>
				</SmallSelect>
				<AddBtn type='button' onClick={add} disabled={isLoading}>
					Add assignment
				</AddBtn>
			</AddBindingRow>
			)}

		</BindingsWrap>
	)
}

const OperatorSelectWrap = styled.div<{ $invalid: boolean }>`
	/* Match the TextField's error visual: red border + red label text
	 * on the inner Select button when invalid. */
	${(p) =>
		p.$invalid &&
		`
			.select-button,
			.input-button {
				border-color: #dc2626 !important;
			}
			.input-label.floating-label {
				color: #dc2626 !important;
			}
		`}
`

const Toggle = styled.label`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 13px;
	cursor: pointer;
	input {
		accent-color: #0369a1;
		width: 18px;
		height: 18px;
	}
`
const BindingsWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`
const BindingRows = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`
const BindingRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr auto;
	gap: 10px;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);

	&:last-of-type {
		border-bottom: none;
	}
`
const BindingTitle = styled.strong`
	font-size: 13px;
`
const BindingMeta = styled.span`
	font-size: 11.5px;
	color: #64748b;
`
const RowActions = styled.div`
	display: inline-flex;
	gap: 6px;
`
const MutedRow = styled.div`
	color: #94a3b8;
	font-size: 12.5px;
	padding: 10px 14px;
`

const statusColor = (s: string, kind: 'bg' | 'fg'): string => {
	if (s === 'ACTIVE')
		return kind === 'bg' ? 'rgba(5, 150, 105, 0.1)' : '#047857'
	if (s === 'HOLD')
		return kind === 'bg' ? 'rgba(217, 119, 6, 0.12)' : '#b45309'
	return kind === 'bg' ? 'rgba(100, 116, 139, 0.1)' : '#475569'
}

/* ─── Terminal-style bindings list ──────────────────────────── */

const V2Terminal = styled.div`
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;
	padding: 14px 18px 12px;
	font-family: 'JetBrains Mono', monospace;
	box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
`
const V2Head = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	padding-bottom: 10px;
	border-bottom: 1px dashed rgba(15, 23, 42, 0.08);
`
const V2Dots = styled.div`
	display: inline-flex;
	gap: 6px;
	span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	.r {
		background: #f87171;
	}
	.y {
		background: #fbbf24;
	}
	.g {
		background: #4ade80;
	}
`
const V2Path = styled.span`
	font-size: 11px;
	color: #64748b;
`
const rowEnterKf = keyframes`
	from {
		opacity: 0;
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
		transform: translateY(-6px);
	}
	to {
		opacity: 1;
		max-height: 48px;
		padding-top: 8px;
		padding-bottom: 8px;
		transform: translateY(0);
	}
`

const V2Row = styled.div<{ $leaving?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 8px 0;
	border-bottom: 1px solid rgba(15, 23, 42, 0.04);
	font-size: 13px;
	overflow: hidden;
	animation: ${rowEnterKf} 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
	transition:
		opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
		max-height 300ms cubic-bezier(0.22, 1, 0.36, 1),
		padding 300ms cubic-bezier(0.22, 1, 0.36, 1),
		margin 300ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 220ms cubic-bezier(0.22, 1, 0.36, 1),
		filter 180ms ease;

	&:last-of-type {
		border-bottom: none;
	}

	${(p) =>
		p.$leaving &&
		`
		opacity: 0;
		max-height: 0;
		padding-top: 0;
		padding-bottom: 0;
		border-bottom-color: transparent;
		pointer-events: none;
		filter: blur(1px);
	`}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transition: none;
	}
`
const V2Arrow = styled.span`
	color: #0369a1;
	font-weight: 700;
`
const V2Name = styled.span`
	color: #0369a1;
	font-weight: 700;
`
const V2Dot = styled.span`
	color: #cbd5e1;
`
const V2Profile = styled.span`
	color: #475569;
`
const V2Spacer = styled.span`
	flex: 1;
`
const V2StatusPill = styled.span<{ $status: string }>`
	display: inline-flex;
	padding: 2px 8px;
	border-radius: 999px;
	background: ${(p) => statusColor(p.$status, 'bg')};
	color: ${(p) => statusColor(p.$status, 'fg')};
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
`
const V2Close = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border: 0;
	padding: 0;
	background: transparent;
	color: #94a3b8;
	cursor: pointer;
	border-radius: 50%;
	flex-shrink: 0;
	transition: color 160ms ease;

	svg {
		transition: transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1);
	}

	&:hover {
		color: #b91c1c;
	}
	&:hover svg {
		transform: rotate(180deg);
	}
	&:active svg {
		transform: rotate(180deg) scale(0.9);
	}
`
const shakeKf = keyframes`
	0%, 100% { transform: translateX(0); }
	20%      { transform: translateX(-4px); }
	40%      { transform: translateX(4px); }
	60%      { transform: translateX(-3px); }
	80%      { transform: translateX(2px); }
`

const AddBindingRow = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr auto auto;
	gap: 8px;
	padding: 12px 0 0;
	border-top: 1px dashed rgba(15, 23, 42, 0.1);
	margin-top: 6px;
	align-items: center;

	input {
		box-sizing: border-box;
		padding: 7px 32px 7px 12px;
		border-radius: 8px;
		border: 1.5px solid rgba(15, 23, 42, 0.1);
		font: inherit;
		font-size: 12px;
		color: inherit;
		outline: none;
		background: #ffffff
			url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a7686' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
			no-repeat right 12px center;
		background-size: 12px 12px;
		transition: border-color 160ms ease, box-shadow 160ms ease;
	}

	/* Hide native datalist drop-arrow — we show our own chevron that
	 * matches the SmallSelect right next to it. */
	input::-webkit-calendar-picker-indicator {
		display: none;
		-webkit-appearance: none;
		opacity: 0;
	}

	/* Red-border error state for empty required fields. Shake once on
	 * entering the invalid state so the user sees it. */
	input[data-invalid='true'] {
		border-color: #dc2626;
		animation: ${shakeKf} 360ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
	}

	@media (prefers-reduced-motion: reduce) {
		input[data-invalid='true'] {
			animation: none;
		}
	}
`
const SmallSelect = styled.select`
	appearance: none;
	-webkit-appearance: none;
	-moz-appearance: none;
	padding: 7px 32px 7px 12px;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	font: inherit;
	font-size: 12px;
	color: inherit;
	cursor: pointer;
	background: #ffffff
		url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a7686' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
		no-repeat right 12px center;
	background-size: 12px 12px;
	transition: border-color 160ms ease;

	&::-ms-expand {
		display: none;
	}

	&[data-invalid='true'] {
		border-color: #dc2626;
		animation: ${shakeKf} 360ms cubic-bezier(0.36, 0.07, 0.19, 0.97);
	}
`
const SmallGhost = styled.button`
	padding: 6px 10px;
	border-radius: 8px;
	border: 1.5px solid rgba(220, 38, 38, 0.3);
	background: #ffffff;
	color: #b91c1c;
	font: inherit;
	font-size: 11.5px;
	font-weight: 600;
	cursor: pointer;
`
const AddBtn = styled.button`
	padding: 8px 14px;
	border-radius: 8px;
	border: none;
	background: #e85d2f;
	color: #ffffff;
	font: inherit;
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.2px;
	cursor: pointer;
	transition: filter 160ms ease, transform 160ms ease;

	&:hover:not(:disabled) {
		filter: brightness(1.05);
		transform: translateY(-1px);
	}
	&:active:not(:disabled) {
		transform: translateY(0) scale(0.98);
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

