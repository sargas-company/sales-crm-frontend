import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { TextField, Select, SelectItem } from '../../../ui'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError, {
	parseServerFieldErrors,
} from '../../../utils/parseServerError'
import { ServerErrorBox, focusByName } from '../../_shared/ErrorSummary'
import DuplicatesHint from '../../_shared/DuplicatesHint'
import useTheme from '../../../theme/useTheme'
import {
	useCreateClientMutation,
	useGetClientDuplicatesQuery,
	useGetClientSourcesQuery,
	useUpdateClientMutation,
	type ApiClientStatus,
	type ClientItem,
	type CreateClientBody,
} from '../../../store/clients/clientsApi'
import CountryAutocomplete from '../../_shared/CountryAutocomplete'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import {
	countryToFlag,
	formatPhoneDisplay,
	isLikelyValidEmail,
	isLikelyValidPhone,
	normalisePhoneToE164,
	phoneCountryIso,
} from '../../../utils/phone'
import { T } from '../../sales-analytics/_shared/tokens'
import { Field, FormHeader, SectionHead } from '../../_shared/FormShell'
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
} from '../../_shared/formShell.styled'

interface Props {
	mode: 'create' | 'edit'
	id?: string
	initial?: ClientItem
}

interface FormFields {
	firstName: string
	lastName: string
	company: string
	email: string
	phone: string
	source: string
	profileUrl: string
	status: ApiClientStatus
	notes: string
	// Country + optional city — joined server-side into Client.location
	// as `city, country` (or just country when city is empty). Same
	// serialisation as LeadForm.
	country: string
	city: string
}

interface FieldErrors {
	firstName?: string
	lastName?: string
	company?: string
	email?: string
	phone?: string
	profileUrl?: string
	notes?: string
}

const NOTES_MAX = 4000

/** Submit-order of error anchors; first present key gets focus. */
const ERROR_ORDER: { key: keyof FieldErrors; inputName: string }[] = [
	{ key: 'firstName', inputName: 'firstName' },
	{ key: 'lastName', inputName: 'lastName' },
	{ key: 'company', inputName: 'company' },
	{ key: 'email', inputName: 'email' },
	{ key: 'phone', inputName: 'phone' },
	{ key: 'profileUrl', inputName: 'profileUrl' },
	{ key: 'notes', inputName: 'notes' },
]

/** Backend DTO property → local error slot (class-validator messages
 *  start with the property name, see parseServerFieldErrors). */
const SERVER_FIELDS: Record<string, keyof FieldErrors> = {
	firstName: 'firstName',
	lastName: 'lastName',
	company: 'company',
	email: 'email',
	phone: 'phone',
	profileUrl: 'profileUrl',
	notes: 'notes',
}

const emptyFields: FormFields = {
	firstName: '',
	lastName: '',
	company: '',
	email: '',
	phone: '',
	source: '',
	profileUrl: '',
	status: 'ACTIVE',
	notes: '',
	country: '',
	city: '',
}

const splitLocation = (raw: string | null): { country: string; city: string } => {
	const trimmed = (raw ?? '').trim()
	if (!trimmed) return { country: '', city: '' }
	const idx = trimmed.lastIndexOf(',')
	if (idx === -1) return { country: trimmed, city: '' }
	const city = trimmed.slice(0, idx).trim()
	const country = trimmed.slice(idx + 1).trim()
	return { country: country || trimmed, city }
}

const fromInitial = (c: ClientItem): FormFields => {
	const { country, city } = splitLocation(c.location)
	return {
		firstName: c.firstName ?? '',
		lastName: c.lastName ?? '',
		company: c.company ?? '',
		email: c.email ?? '',
		phone: c.phone ? formatPhoneDisplay(c.phone) : '',
		source: c.source ?? '',
		profileUrl: c.profileUrl ?? '',
		status: c.status,
		notes: c.notes ?? '',
		country,
		city,
	}
}

const ClientIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-8 2-8 6v2h16v-2c0-4-4-6-8-6Z'
			stroke='currentColor'
			strokeWidth='1.6'
			strokeLinejoin='round'
		/>
	</svg>
)

const ClientForm = ({ mode, id, initial }: Props) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [createClient, { isLoading: creating }] = useCreateClientMutation()
	const [updateClient, { isLoading: updating }] = useUpdateClientMutation()
	const { data: sources } = useGetClientSourcesQuery()
	const isLoading = creating || updating
	const isEdit = mode === 'edit'
	const [fields, setFields] = useState<FormFields>(
		initial ? fromInitial(initial) : emptyFields,
	)
	const [errors, setErrors] = useState<FieldErrors>({})
	const [serverGeneral, setServerGeneral] = useState<string | null>(null)

	// Non-blocking duplicate suggestion — same contract as LeadForm.
	const debouncedEmail = useDebouncedValue(fields.email.trim(), 400)
	const debouncedPhone = useDebouncedValue(fields.phone.trim(), 400)
	const emailForLookup =
		debouncedEmail && isLikelyValidEmail(debouncedEmail)
			? debouncedEmail.toLowerCase()
			: ''
	const phoneForLookup = isLikelyValidPhone(debouncedPhone)
		? normalisePhoneToE164(debouncedPhone) ?? ''
		: ''
	const shouldLookup = Boolean(emailForLookup || phoneForLookup)
	const matchBasis =
		emailForLookup && phoneForLookup
			? ('email or phone' as const)
			: emailForLookup
				? ('email' as const)
				: ('phone' as const)
	const { data: duplicates } = useGetClientDuplicatesQuery(
		{
			email: emailForLookup || undefined,
			phone: phoneForLookup || undefined,
			excludeId: id,
		},
		{ skip: !shouldLookup },
	)

	const setField = <K extends keyof FormFields>(k: K, v: FormFields[K]) => {
		setFields((p) => ({ ...p, [k]: v }))
		if ((errors as Record<string, unknown>)[k])
			setErrors((p) => ({ ...p, [k]: undefined }))
		if (serverGeneral) setServerGeneral(null)
	}

	const applyErrors = (next: FieldErrors) => {
		setErrors(next)
		const first = ERROR_ORDER.find((e) => next[e.key])
		if (first) focusByName(first.inputName)
	}

	const validate = (): FieldErrors => {
		const next: FieldErrors = {}
		if (!fields.firstName.trim()) next.firstName = 'First name is required'
		if (!fields.lastName.trim()) next.lastName = 'Last name is required'
		if (!fields.company.trim()) next.company = 'Company is required'
		if (!fields.email.trim()) next.email = 'Email is required'
		else if (!isLikelyValidEmail(fields.email))
			next.email = 'Enter a valid email address'
		if (fields.phone && !isLikelyValidPhone(fields.phone))
			next.phone = 'Use international format, e.g. +14155550123'
		if (fields.profileUrl && !/^https?:\/\//i.test(fields.profileUrl.trim()))
			next.profileUrl = 'Must start with http:// or https://'
		if (fields.notes.length > NOTES_MAX)
			next.notes = `Notes are limited to ${NOTES_MAX} characters (currently ${fields.notes.length})`
		return next
	}

	const locationValue = (): string | null => {
		const country = fields.country.trim()
		const city = fields.city.trim()
		if (!country && !city) return null
		if (country && city) return `${city}, ${country}`
		return country || city || null
	}

	// Payload intentionally excludes `platformId`, `clientSince`, and
	// `rate` (owner rev-5 2026-10-12): those UI inputs are gone; the
	// backend columns stay to preserve existing data but new writes
	// never touch them.
	const buildPayload = (): CreateClientBody => {
		const trimmedEmail = fields.email.trim()
		const normalisedPhone = normalisePhoneToE164(fields.phone)
		return {
			firstName: fields.firstName.trim(),
			lastName: fields.lastName.trim(),
			company: fields.company.trim(),
			email: trimmedEmail.toLowerCase(),
			phone: normalisedPhone,
			source: fields.source.trim() || null,
			profileUrl: fields.profileUrl.trim() || null,
			status: fields.status,
			notes: fields.notes.trim() || null,
			location: locationValue(),
		}
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setServerGeneral(null)
		const v = validate()
		if (Object.keys(v).length > 0) {
			applyErrors(v)
			return
		}
		try {
			const payload = buildPayload()
			if (isEdit && id) {
				await updateClient({ id, body: payload }).unwrap()
				showToast('Client updated', 'success')
				navigate(`/clients/${id}`)
			} else {
				const row = await createClient(payload).unwrap()
				showToast('Client created', 'success')
				navigate(`/clients/${row.id}`)
			}
		} catch (err) {
			// Same contract as LeadForm: backend field errors land in the
			// matching inline slots, values stay, unmapped messages show
			// as one general block.
			const { fieldErrors, general } = parseServerFieldErrors(
				err,
				Object.keys(SERVER_FIELDS),
			)
			const mapped: FieldErrors = {}
			for (const [prop, msg] of Object.entries(fieldErrors)) {
				const slot = SERVER_FIELDS[prop]
				if (slot && !mapped[slot]) mapped[slot] = msg
			}
			if (Object.keys(mapped).length > 0) applyErrors(mapped)
			const generalText =
				general.length > 0
					? general.join('\n')
					: Object.keys(mapped).length === 0
						? parseServerError(err)
						: null
			if (generalText) setServerGeneral(generalText)
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo={isEdit && id ? `/clients/${id}` : '/clients/list/'}
					backLabel={isEdit ? 'Back to client' : 'Back to clients'}
					icon={<ClientIcon />}
					title={isEdit ? 'Edit client' : 'New client'}
					subtitle={
						isEdit
							? 'Update client details, status, and notes'
							: 'Add a client manually to the CRM'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Basic information'
							hint='Who this client is'
						/>
						<FieldGrid>
							<Field label='First name' required error={errors.firstName}>
								<TextField
									name='firstName'
									placeholder='e.g. Jane'
									value={fields.firstName}
									onChange={(e) => setField('firstName', e.target.value)}
									error={!!errors.firstName}
									width='100%'
								/>
							</Field>
							<Field label='Last name' required error={errors.lastName}>
								<TextField
									name='lastName'
									placeholder='e.g. Doe'
									value={fields.lastName}
									onChange={(e) => setField('lastName', e.target.value)}
									error={!!errors.lastName}
									width='100%'
								/>
							</Field>
							<Field
								label='Company'
								required
								span='full'
								error={errors.company}
							>
								<TextField
									name='company'
									placeholder='e.g. Acme Corp'
									value={fields.company}
									onChange={(e) => setField('company', e.target.value)}
									error={!!errors.company}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Contact details'
							hint='How to reach them'
						/>
						<FieldGrid>
							<Field label='Email' required error={errors.email}>
								<TextField
									name='email'
									type='email'
									placeholder='e.g. jane@example.com'
									value={fields.email}
									onChange={(e) => setField('email', e.target.value)}
									error={!!errors.email}
									width='100%'
								/>
							</Field>
							<Field
								label='Phone'
								optional
								error={errors.phone}
								hint='e.g. +14155550123'
							>
								<TextField
									name='phone'
									type='tel'
									placeholder='+1 415 555 0123'
									value={fields.phone}
									onChange={(e) => setField('phone', e.target.value)}
									error={!!errors.phone}
									width='100%'
								/>
								<PhonePreview phone={fields.phone} />
							</Field>
							{(duplicates?.length ?? 0) > 0 && (
								<FullRow>
									<DuplicatesHint
										entityLabel='client'
										linkBase='/clients'
										matchBasis={matchBasis}
										items={(duplicates ?? []).map((d) => {
											const name =
												[d.firstName, d.lastName].filter(Boolean).join(' ') ||
												d.company ||
												d.id
											const extra = [
												d.company && name !== d.company ? d.company : null,
												d.email ?? null,
											]
												.filter(Boolean)
												.join(' · ')
											return {
												id: d.id,
												title: name,
												subtitle: extra || undefined,
											}
										})}
									/>
								</FullRow>
							)}
							<Field label='Country' optional>
								<CountryAutocomplete
									value={fields.country}
									onChange={(v) => setField('country', v)}
									placeholder='Start typing a country…'
									ariaLabel='Country'
									name='country'
								/>
							</Field>
							<Field label='City' optional>
								<TextField
									name='city'
									placeholder='e.g. Berlin'
									value={fields.city}
									onChange={(e) => setField('city', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={240}>
						<SectionHead
							num='03'
							title='Classification'
							hint='Status, source, profile'
						/>
						<FieldGrid>
							<Field label='Status' required>
								<Select
									label='Status'
									value={fields.status}
									onChange={(v) => setField('status', v as ApiClientStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Active' value='ACTIVE' />
									<SelectItem label='On hold' value='ON_HOLD' />
									<SelectItem label='Former' value='FORMER' />
								</Select>
							</Field>
							<Field label='Source' optional>
								<Select
									label='Source'
									value={fields.source}
									onChange={(v) => setField('source', v as string)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Not specified' value='' />
									{(sources ?? []).map((s) => (
										<SelectItem key={s} label={s} value={s} />
									))}
								</Select>
							</Field>
							<Field
								label='Profile URL'
								optional
								error={errors.profileUrl}
								span='full'
							>
								<TextField
									name='profileUrl'
									placeholder='https://www.upwork.com/freelancers/~0123abcd…'
									value={fields.profileUrl}
									onChange={(e) => setField('profileUrl', e.target.value)}
									error={!!errors.profileUrl}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={320}>
						<SectionHead num='04' title='Notes' hint='Free-form internal notes' />
						<FieldGrid>
							<Field
								label='Notes'
								optional
								span='full'
								error={errors.notes}
								hint={`Up to ${NOTES_MAX} characters`}
							>
								<TextField
									name='notes'
									placeholder='Anything internal worth remembering…'
									value={fields.notes}
									onChange={(e) =>
										setField('notes', (e.target as HTMLTextAreaElement).value)
									}
									width='100%'
									multiline
									multiRow
									style={{ minHeight: 160, resize: 'vertical' }}
									error={!!errors.notes}
								/>
							</Field>
						</FieldGrid>
					</Section>

					{serverGeneral && (
						<ServerErrorBox role='alert'>{serverGeneral}</ServerErrorBox>
					)}

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Changes save on submit' : 'Client appears in the list immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() =>
									navigate(isEdit && id ? `/clients/${id}` : '/clients/list/')
								}
							>
								Cancel
							</PrimaryGhostButton>
							<PrimarySolidButton type='submit' disabled={isLoading}>
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create client'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default ClientForm

/* Live country-flag + formatted preview under the Phone input. */
const PhonePreview = ({ phone }: { phone: string }) => {
	const trimmed = phone.trim()
	if (!trimmed) return null
	const iso = phoneCountryIso(trimmed)
	const flag = countryToFlag(iso)
	const pretty = formatPhoneDisplay(trimmed)
	if (!iso && pretty === trimmed) return null
	return (
		<PhonePreviewRow>
			{flag && <PreviewFlag title={iso ?? undefined}>{flag}</PreviewFlag>}
			<PreviewText>{pretty}</PreviewText>
			{iso && <PreviewCountry>{iso}</PreviewCountry>}
		</PhonePreviewRow>
	)
}

/* Full-width slot inside the 12-col FieldGrid — hosts the duplicate
   notice right under the contact inputs it belongs to. */
const FullRow = styled.div`
	grid-column: span 12;
	min-width: 0;
`

const PhonePreviewRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	margin-top: 6px;
	padding: 4px 8px;
	border-radius: 8px;
	background: rgba(15, 23, 42, 0.03);
	font-size: 12.5px;
`

const PreviewFlag = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 24px;
	height: 24px;
	border-radius: 5px;
	background: rgba(15, 23, 42, 0.04);
	font-size: 18px;
	line-height: 1;
`

const PreviewText = styled.span`
	color: ${T.textStrong};
	font-weight: 500;
	font-variant-numeric: tabular-nums;
`

const PreviewCountry = styled.span`
	color: ${T.textSecondary};
	font-weight: 600;
	letter-spacing: 0.3px;
	font-size: 11px;
	text-transform: uppercase;
`
