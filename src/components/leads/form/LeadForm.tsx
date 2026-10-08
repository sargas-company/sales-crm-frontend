import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import { useGetLeadByIdQuery, useUpdateLeadMutation } from '../../../store/leads/leadsApi'
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
import type {
	ApiClientType,
	ApiLeadStatus,
	ApiLeadTemperature,
	LeadItem,
} from '../../../store/leads/types/definition'
import { Field, FormHeader, FormLoading, FormNotFound, SectionHead } from '../../_shared/FormShell'
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

interface LeadFormProps {
	id: string
}

interface FormFields {
	firstName: string
	lastName: string
	companyName: string
	email: string
	phone: string
	status: ApiLeadStatus
	temperature: ApiLeadTemperature | ''
	source: string
	profileUrl: string
	notes: string
	clientType: ApiClientType | ''
	rate: string
	location: string
}

interface FieldErrors {
	email?: string
	phone?: string
}

const toFormValues = (data: LeadItem): FormFields => ({
	firstName: data.firstName ?? '',
	lastName: data.lastName ?? '',
	companyName: data.companyName ?? '',
	email: data.email ?? '',
	phone: data.phone ? formatPhoneDisplay(data.phone) : '',
	status: data.status,
	temperature: data.temperature ?? '',
	source: data.source ?? '',
	profileUrl: data.profileUrl ?? '',
	notes: data.notes ?? '',
	clientType: data.clientType ?? '',
	rate: data.rate != null ? String(data.rate) : '',
	location: data.location ?? '',
})

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

const LeadFormInner = ({ id, initialData }: { id: string; initialData: LeadItem }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(toFormValues(initialData))
	const [errors, setErrors] = useState<FieldErrors>({})
	const [updateLead, { isLoading }] = useUpdateLeadMutation()

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (key === 'email') setErrors((prev) => ({ ...prev, email: undefined }))
		if (key === 'phone') setErrors((prev) => ({ ...prev, phone: undefined }))
	}

	const validate = (): FieldErrors => {
		const next: FieldErrors = {}
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
			const body: Partial<LeadItem> = {
				firstName: fields.firstName || null,
				lastName: fields.lastName || null,
				companyName: fields.clientType === 'company' ? fields.companyName || null : null,
				email: trimmedEmail ? trimmedEmail.toLowerCase() : null,
				phone: normalisedPhone,
				status: fields.status,
				temperature: fields.temperature || null,
				source: fields.source.trim() || null,
				profileUrl: fields.profileUrl.trim() || null,
				notes: fields.notes.trim() || null,
				clientType: fields.clientType || null,
				rate: fields.rate !== '' ? Number(fields.rate) : null,
				location: fields.location || null,
			}
			await updateLead({ id, body }).unwrap()
			showToast('Lead updated successfully', 'success')
			navigate(`/leads/preview/${id}`)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo={`/leads/preview/${id}`}
					backLabel='Back to lead'
					icon={<LeadIcon />}
					title={`Edit lead #${initialData.number}`}
					subtitle='Update contact info, status and financial terms'
					badgeLabel='Editing'
					badgeTone='edit'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Contact'
							hint='Who this lead is and how to reach them'
						/>
						<FieldGrid>
							<Field label='First name'>
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
							title='Pipeline'
							hint='Where the lead sits in the sales funnel'
						/>
						<FieldGrid>
							<Field label='Status'>
								<Select
									label='Select status'
									defaultValue={fields.status}
									onChange={(value) => setField('status', value as ApiLeadStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='New' value='NEW' />
									<SelectItem label='Contacted' value='CONTACTED' />
									<SelectItem label='In Conversation' value='IN_CONVERSATION' />
									<SelectItem label='On Hold' value='ON_HOLD' />
									<SelectItem label='Won' value='WON' />
									<SelectItem label='Lost' value='LOST' />
								</Select>
							</Field>
							<Field label='Temperature'>
								<Select
									label='Temperature'
									defaultValue={fields.temperature}
									onChange={(v) =>
										setField('temperature', v as ApiLeadTemperature | '')
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— unset —' value='' />
									<SelectItem label='Cold' value='COLD' />
									<SelectItem label='Warm' value='WARM' />
									<SelectItem label='Hot' value='HOT' />
								</Select>
							</Field>
							<Field label='Source'>
								<TextField
									name='source'
									placeholder='e.g. Upwork'
									value={fields.source}
									onChange={(e) => setField('source', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Profile URL' span='full'>
								<TextField
									name='profileUrl'
									placeholder='https://…'
									value={fields.profileUrl}
									onChange={(e) => setField('profileUrl', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Notes' span='full'>
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
								/>
							</Field>
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
								<Field label='Company name' span='full'>
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
							Changes are saved when you press Save
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate(`/leads/preview/${id}`)}
							>
								Cancel
							</Button>
							<PrimarySolidButton type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : 'Save changes'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const LeadForm = ({ id }: LeadFormProps) => {
	const { data, isLoading } = useGetLeadByIdQuery(id, { skip: !id })
	if (isLoading) return <FormLoading label='Loading lead…' />
	if (!data) return <FormNotFound label='Lead not found' />
	return <LeadFormInner id={id} initialData={data} />
}

export default LeadForm

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
