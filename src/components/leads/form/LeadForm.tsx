import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import { useGetLeadByIdQuery, useUpdateLeadMutation } from '../../../store/leads/leadsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import {
	formatPhoneDisplay,
	isLikelyValidEmail,
	isLikelyValidPhone,
	normalisePhoneToE164,
} from '../../../utils/phone'
import type { ApiLeadStatus, ApiClientType, LeadItem } from '../../../store/leads/types/definition'
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
	// Prefer the readable international format while editing so the
	// manager sees spaces/grouping; it gets re-normalised on submit.
	phone: data.phone ? formatPhoneDisplay(data.phone) : '',
	status: data.status,
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
									<SelectItem label='Conversation Ongoing' value='conversation_ongoing' />
									<SelectItem label='Trial' value='trial' />
									<SelectItem label='Hold' value='hold' />
									<SelectItem label='Contract Offer' value='contract_offer' />
									<SelectItem label='Accept Contract' value='accept_contract' />
									<SelectItem label='Start Contract' value='start_contract' />
									<SelectItem label='Suspended' value='suspended' />
								</Select>
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
