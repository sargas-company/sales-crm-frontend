import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { TextField, Select, SelectItem } from '../../../ui'
import {
	useCreateLeadMutation,
	useGetLeadDuplicatesQuery,
	useGetLeadSourcesQuery,
	useUpdateLeadMutation,
} from '../../../store/leads/leadsApi'
import CountryAutocomplete from '../../_shared/CountryAutocomplete'
import { mergeSources } from '../../../constants/sources'
import DuplicatesHint from '../../_shared/DuplicatesHint'
import { ServerErrorBox, focusByName } from '../../_shared/ErrorSummary'
import useDebouncedValue from '../../../hooks/useDebouncedValue'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError, {
	parseServerFieldErrors,
} from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import {
	countryToFlag,
	formatPhoneDisplay,
	isLikelyValidEmail,
	isLikelyValidPhone,
	normalisePhoneToE164,
	phoneCountryIso,
} from '../../../utils/phone'
import { T } from '../../sales-analytics/_shared/tokens'
import type {
	ApiClientType,
	ApiLeadStatus,
	ApiLeadTemperature,
	CreateLeadBody,
	LeadItem,
	UpdateLeadBody,
} from '../../../store/leads/types/definition'
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
	spin,
} from '../../_shared/formShell.styled'

const NOTES_MAX = 4000

interface Props {
	mode: 'create' | 'edit'
	id?: string
	initial?: LeadItem
}

interface FormFields {
	firstName: string
	lastName: string
	companyName: string
	email: string
	phone: string
	status: ApiLeadStatus
	temperature: ApiLeadTemperature
	source: string
	profileUrl: string
	notes: string
	clientType: ApiClientType
	// Location is persisted as one free-text string; the form edits it
	// as Country (required) + optional City and serialises
	// `city, country`.
	country: string
	city: string
}

type ErrorKey =
	| 'firstName'
	| 'lastName'
	| 'companyName'
	| 'country'
	| 'email'
	| 'phone'
	| 'profileUrl'
	| 'notes'
type FieldErrors = Partial<Record<ErrorKey, string>>

/** Submit-order of error anchors; the first present key gets focus. */
const ERROR_ORDER: { key: ErrorKey; inputName: string }[] = [
	{ key: 'firstName', inputName: 'firstName' },
	{ key: 'lastName', inputName: 'lastName' },
	{ key: 'companyName', inputName: 'companyName' },
	{ key: 'country', inputName: 'country' },
	{ key: 'email', inputName: 'email' },
	{ key: 'phone', inputName: 'phone' },
	{ key: 'profileUrl', inputName: 'profileUrl' },
	{ key: 'notes', inputName: 'notes' },
]

/** Backend DTO property → local error slot (class-validator messages
 *  start with the property name, see parseServerFieldErrors). */
const SERVER_FIELDS: Record<string, ErrorKey> = {
	firstName: 'firstName',
	lastName: 'lastName',
	companyName: 'companyName',
	email: 'email',
	phone: 'phone',
	profileUrl: 'profileUrl',
	notes: 'notes',
	location: 'country',
}

const empty: FormFields = {
	firstName: '',
	lastName: '',
	companyName: '',
	email: '',
	phone: '',
	status: 'NEW',
	temperature: 'COLD',
	source: '',
	profileUrl: '',
	notes: '',
	clientType: 'individual',
	country: '',
	city: '',
}

// Parse "City, Country" (last comma = boundary) back into the two
// form fields; one segment is treated as country-only.
const splitLocation = (raw: string | null): { country: string; city: string } => {
	const trimmed = (raw ?? '').trim()
	if (!trimmed) return { country: '', city: '' }
	const idx = trimmed.lastIndexOf(',')
	if (idx === -1) return { country: trimmed, city: '' }
	const city = trimmed.slice(0, idx).trim()
	const country = trimmed.slice(idx + 1).trim()
	return { country: country || trimmed, city }
}

const fromInitial = (data: LeadItem): FormFields => {
	const { country, city } = splitLocation(data.location)
	return {
		firstName: data.firstName ?? '',
		lastName: data.lastName ?? '',
		companyName: data.companyName ?? '',
		email: data.email ?? '',
		phone: data.phone ? formatPhoneDisplay(data.phone) : '',
		status: data.status,
		// Temperature/clientType are required controls with defaults —
		// a legacy null simply lands on the default.
		temperature: data.temperature ?? 'COLD',
		source: data.source ?? '',
		profileUrl: data.profileUrl ?? '',
		notes: data.notes ?? '',
		clientType: data.clientType ?? 'individual',
		country,
		city,
	}
}

const LeadIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='1.8' />
		<path d='M22 11h-6M19 8v6' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
	</svg>
)

const LeadForm = ({ mode, id, initial }: Props) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const [createLead, { isLoading: creating }] = useCreateLeadMutation()
	const [updateLead, { isLoading: updating }] = useUpdateLeadMutation()
	const { data: sources } = useGetLeadSourcesQuery()
	const isLoading = creating || updating

	// Baseline captured once per mount — the dirty-check compares the
	// current `fields` to this snapshot so edit-mode's Save button is
	// disabled while the user hasn't actually changed anything, and
	// re-disables itself if every field is reverted.
	const baseline = useMemo<FormFields>(
		() => (initial ? fromInitial(initial) : empty),
		[initial],
	)
	const [fields, setFields] = useState<FormFields>(baseline)
	const [errors, setErrors] = useState<FieldErrors>({})
	const [serverGeneral, setServerGeneral] = useState<string | null>(null)

	// Shallow compare — FormFields is flat strings; keys and shape are
	// identical in baseline and fields by construction.
	const isDirty = (Object.keys(fields) as (keyof FormFields)[]).some(
		(k) => fields[k] !== baseline[k],
	)
	const canSubmit = !isLoading && (!isEdit || isDirty)

	// Non-blocking duplicate suggestion — queries only once email/phone
	// look complete; never blocks save.
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
	const { data: duplicates } = useGetLeadDuplicatesQuery(
		{
			email: emailForLookup || undefined,
			phone: phoneForLookup || undefined,
			excludeId: id,
		},
		{ skip: !shouldLookup },
	)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key as string])
			setErrors((prev) => ({ ...prev, [key as ErrorKey]: undefined }))
		if (serverGeneral) setServerGeneral(null)
	}

	const validate = (): FieldErrors => {
		// Only first + last name are required (owner rev-6 2026-10-22).
		// Everything else — company, country, email, phone, profile —
		// is optional; still validated for FORMAT when the user fills
		// it in, but a blank field is accepted.
		const next: FieldErrors = {}
		if (!fields.firstName.trim()) next.firstName = 'First name is required'
		if (!fields.lastName.trim()) next.lastName = 'Last name is required'
		if (fields.email && !isLikelyValidEmail(fields.email))
			next.email = 'Enter a valid email address'
		if (fields.phone && !isLikelyValidPhone(fields.phone))
			next.phone = 'Use international format, e.g. +14155550123'
		if (fields.profileUrl && !/^https?:\/\//i.test(fields.profileUrl.trim()))
			next.profileUrl = 'Must start with http:// or https://'
		if (fields.notes.length > NOTES_MAX)
			next.notes = `Notes are limited to ${NOTES_MAX} characters (currently ${fields.notes.length})`
		return next
	}

	const applyErrors = (next: FieldErrors) => {
		setErrors(next)
		const first = ERROR_ORDER.find((e) => next[e.key])
		if (first) focusByName(first.inputName)
	}

	const locationValue = (): string => {
		const country = fields.country.trim()
		const city = fields.city.trim()
		return city ? `${city}, ${country}` : country
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		setServerGeneral(null)
		const v = validate()
		if (Object.keys(v).length > 0) {
			applyErrors(v)
			return
		}
		const trimmedEmail = fields.email.trim()
		const normalisedPhone = normalisePhoneToE164(fields.phone)
		try {
			if (isEdit && id) {
				// Rate is intentionally absent: it left the Lead UI and the
				// stored value must stay untouched.
				const body: UpdateLeadBody = {
					firstName: fields.firstName.trim(),
					lastName: fields.lastName.trim(),
					companyName:
						fields.clientType === 'company'
							? fields.companyName.trim()
							: null,
					email: trimmedEmail ? trimmedEmail.toLowerCase() : null,
					phone: normalisedPhone,
					status: fields.status,
					temperature: fields.temperature,
					source: fields.source.trim() || null,
					profileUrl: fields.profileUrl.trim() || null,
					notes: fields.notes.trim() || null,
					clientType: fields.clientType,
					location: locationValue(),
				}
				await updateLead({ id, body }).unwrap()
				showToast('Lead updated successfully', 'success')
				navigate(`/leads/view/${id}`)
			} else {
				const body: CreateLeadBody = {
					firstName: fields.firstName.trim(),
					lastName: fields.lastName.trim(),
					companyName:
						fields.clientType === 'company'
							? fields.companyName.trim()
							: undefined,
					email: trimmedEmail ? trimmedEmail.toLowerCase() : undefined,
					phone: normalisedPhone ?? undefined,
					status: fields.status,
					temperature: fields.temperature,
					source: fields.source.trim() || null,
					profileUrl: fields.profileUrl.trim() || null,
					notes: fields.notes.trim() || null,
					clientType: fields.clientType,
					location: locationValue(),
				}
				const row = await createLead(body).unwrap()
				showToast('Lead created successfully', 'success')
				navigate(`/leads/view/${row.id}`)
			}
		} catch (err) {
			// Map backend field errors onto the same inline slots; keep
			// the entered values; show unmapped messages as one general
			// block instead of a toast.
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

	const backTarget = isEdit && id ? `/leads/view/${id}` : '/leads/list/'

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo={backTarget}
					backLabel={isEdit ? 'Back to lead' : 'Back to leads'}
					icon={<LeadIcon />}
					title={
						isEdit && initial ? `Edit lead #${initial.number}` : 'New lead'
					}
					subtitle={
						isEdit
							? 'Update contact info, status and classification'
							: 'Add a lead manually and start tracking the deal'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Contact'
							hint='Who this lead is and how to reach them'
						/>
						<FieldGrid>
							<Field label='First name' required error={errors.firstName}>
								<TextField
									name='firstName'
									placeholder='e.g. John'
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
							<Field label='Email' optional error={errors.email}>
								<TextField
									name='email'
									type='email'
									placeholder='e.g. john@acme.com'
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
										entityLabel='lead'
										linkBase='/leads/view'
										matchBasis={matchBasis}
										items={(duplicates ?? []).map((d) => ({
											id: d.id,
											title:
												[d.firstName, d.lastName].filter(Boolean).join(' ') ||
												d.companyName ||
												d.id,
											subtitle: d.email ?? d.phone ?? undefined,
										}))}
									/>
								</FullRow>
							)}
							<Field label='Country' error={errors.country}>
								<CountryAutocomplete
									value={fields.country}
									onChange={(v) => setField('country', v)}
									placeholder='Start typing a country…'
									ariaLabel='Country'
									name='country'
									error={!!errors.country}
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

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Client'
							hint='Individual or company — pick the type that fits'
						/>
						<FieldGrid>
							<Field label='Client type'>
								<Select
									label='Client type'
									value={fields.clientType}
									onChange={(value) =>
										setField('clientType', value as ApiClientType)
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Individual' value='individual' />
									<SelectItem label='Company' value='company' />
								</Select>
							</Field>
							{fields.clientType === 'company' && (
								<Reveal>
									<Field label='Company name' error={errors.companyName}>
										<TextField
											name='companyName'
											placeholder='e.g. Acme Corp'
											value={fields.companyName}
											onChange={(e) => setField('companyName', e.target.value)}
											error={!!errors.companyName}
											width='100%'
										/>
									</Field>
								</Reveal>
							)}
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Classification'
							hint='Status, temperature and where this lead came from'
						/>
						<FieldGrid>
							<Field label='Status'>
								<Select
									label='Status'
									value={fields.status}
									onChange={(v) => setField('status', v as ApiLeadStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='New' value='NEW' />
									<SelectItem label='Contacted' value='CONTACTED' />
									<SelectItem label='In Conversation' value='IN_CONVERSATION' />
									<SelectItem label='On Hold' value='ON_HOLD' />
									<SelectItem label='Won' value='WON' />
									<SelectItem label='Lost' value='LOST' />
									<SelectItem label='Client' value='CLIENT' />
								</Select>
							</Field>
							<Field label='Temperature'>
								<Select
									label='Temperature'
									value={fields.temperature}
									onChange={(v) =>
										setField('temperature', v as ApiLeadTemperature)
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Cold' value='COLD' />
									<SelectItem label='Warm' value='WARM' />
									<SelectItem label='Hot' value='HOT' />
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
									{mergeSources(sources).map((s) => (
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

					<Section $delay={280}>
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
							{isEdit
								? 'Changes are saved when you press Save'
								: 'Lead will be added to the list right away'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate(backTarget)}
							>
								Cancel
							</PrimaryGhostButton>
							<PrimarySolidButton type='submit' disabled={!canSubmit}>
								{isLoading && <ButtonSpinner aria-hidden />}
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create lead'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default LeadForm

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

const revealIn = keyframes`
	from { opacity: 0; transform: translateY(-4px); }
	to   { opacity: 1; transform: translateY(0); }
`

/* Full-width slot inside the 12-col FieldGrid — hosts the duplicate
   notice right under the contact inputs it belongs to. */
const FullRow = styled.div`
	grid-column: span 12;
	min-width: 0;
`

/* Wrapper for the conditional Company field so it eases in instead of
   popping. display: contents keeps the Field a direct grid child. */
const Reveal = styled.div`
	display: contents;
	& > * {
		animation: ${revealIn} 180ms ease-out both;
	}
`

const ButtonSpinner = styled.span`
	width: 14px;
	height: 14px;
	border-radius: 50%;
	border: 2px solid rgba(255, 255, 255, 0.35);
	border-top-color: #ffffff;
	animation: ${spin} 640ms linear infinite;
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
