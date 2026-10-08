import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import { useCreateLeadMutation } from '../../../store/leads/leadsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import styled from 'styled-components'
import {
	countryToFlag,
	formatPhoneDisplay,
	isLikelyValidEmail,
	isLikelyValidPhone,
	normalisePhoneToE164,
	phoneCountryIso,
} from '../../../utils/phone'
import { T } from '../../sales-analytics/_shared/tokens'
import type { ApiClientType, CreateLeadBody } from '../../../store/leads/types/definition'
import { Field, FormHeader, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface FormFields {
	firstName: string
	lastName: string
	companyName: string
	email: string
	phone: string
	clientType: ApiClientType | ''
	rate: string
	location: string
}

interface FieldErrors {
	name?: string
	email?: string
	phone?: string
}

const empty: FormFields = {
	firstName: '',
	lastName: '',
	companyName: '',
	email: '',
	phone: '',
	clientType: '',
	rate: '',
	location: '',
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

const LeadCreateForm = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const [fields, setFields] = useState<FormFields>(empty)
	const [errors, setErrors] = useState<FieldErrors>({})
	const [createLead, { isLoading }] = useCreateLeadMutation()

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (key === 'firstName' || key === 'lastName' || key === 'companyName')
			setErrors((prev) => ({ ...prev, name: undefined }))
		if (key === 'email') setErrors((prev) => ({ ...prev, email: undefined }))
		if (key === 'phone') setErrors((prev) => ({ ...prev, phone: undefined }))
	}

	const hasName =
		!!fields.firstName.trim() ||
		!!fields.lastName.trim() ||
		(fields.clientType === 'company' && !!fields.companyName.trim())

	const validate = (): FieldErrors => {
		const next: FieldErrors = {}
		if (!hasName) next.name = 'Provide at least a first name, last name or company name'
		if (fields.email && !isLikelyValidEmail(fields.email))
			next.email = 'Enter a valid email address'
		if (fields.phone && !isLikelyValidPhone(fields.phone))
			next.phone = 'Use international format, e.g. +14155550123'
		return next
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const validationErrors = validate()
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors)
			return
		}
		try {
			const trimmedEmail = fields.email.trim()
			const normalisedPhone = normalisePhoneToE164(fields.phone)
			const body: CreateLeadBody = {
				firstName: fields.firstName.trim() || undefined,
				lastName: fields.lastName.trim() || undefined,
				companyName:
					fields.clientType === 'company' ? fields.companyName.trim() || undefined : undefined,
				email: trimmedEmail ? trimmedEmail.toLowerCase() : undefined,
				phone: normalisedPhone ?? undefined,
				clientType: (fields.clientType || undefined) as ApiClientType | undefined,
				rate: fields.rate !== '' ? Number(fields.rate) : undefined,
				location: fields.location.trim() || undefined,
			}
			const result = await createLead(body).unwrap()
			showToast('Lead created successfully', 'success')
			navigate(`/leads/preview/${result.id}`)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/leads/list/'
					backLabel='Back to leads'
					icon={<LeadIcon />}
					title='New lead'
					subtitle='Add a lead manually and start tracking the deal'
					badgeLabel='New'
					badgeTone='new'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Contact'
							hint='Who this lead is and how to reach them'
						/>
						<FieldGrid>
							<Field label='First name' error={errors.name}>
								<TextField
									name='firstName'
									placeholder='e.g. John'
									value={fields.firstName}
									onChange={(e) => setField('firstName', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Last name'>
								<TextField
									name='lastName'
									placeholder='e.g. Doe'
									value={fields.lastName}
									onChange={(e) => setField('lastName', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Email' error={errors.email}>
								<TextField
									name='email'
									type='email'
									placeholder='e.g. john@acme.com'
									value={fields.email}
									onChange={(e) => setField('email', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field
								label='Phone'
								error={errors.phone}
								hint='International format, e.g. +14155550123'
							>
								<TextField
									name='phone'
									type='tel'
									placeholder='+1 415 555 0123'
									value={fields.phone}
									onChange={(e) => setField('phone', e.target.value)}
									width='100%'
								/>
								<PhonePreview phone={fields.phone} />
							</Field>
							<Field label='Location' span='full'>
								<TextField
									name='location'
									placeholder='e.g. United States'
									value={fields.location}
									onChange={(e) => setField('location', e.target.value)}
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
									label='Select client type'
									defaultValue={fields.clientType}
									onChange={(value) => setField('clientType', value as ApiClientType | '')}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Individual' value='individual' />
									<SelectItem label='Company' value='company' />
								</Select>
							</Field>
							{fields.clientType === 'company' && (
								<Field label='Company name'>
									<TextField
										name='companyName'
										placeholder='e.g. Acme Corp'
										value={fields.companyName}
										onChange={(e) => setField('companyName', e.target.value)}
										width='100%'
									/>
								</Field>
							)}
						</FieldGrid>
					</Section>

					<Section $delay={240}>
						<SectionHead
							num='03'
							title='Financial'
							hint='Hourly rate agreed with the client, in USD'
						/>
						<FieldGrid>
							<Field label='Hourly rate ($)' span='third'>
								<TextField
									name='rate'
									type='number'
									placeholder='e.g. 50'
									value={fields.rate}
									onChange={(e) => setField('rate', e.target.value)}
									width='100%'
									minValue={0}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Lead will be added to the list right away
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/leads/list/')}
							>
								Cancel
							</Button>
							<PrimarySolidButton type='submit' disabled={isLoading}>
								{isLoading ? 'Creating…' : 'Create lead'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default LeadCreateForm

/* Live country-flag + formatted preview under the Phone input —
   mirrors the Client Request list cell. Shows the ISO-2 country
   that libphonenumber inferred from the typed `+country` prefix,
   and renders the number in its canonical international grouping.
   Hidden while the field is empty or unparseable. */
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
