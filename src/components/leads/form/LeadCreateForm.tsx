import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import { useCreateLeadMutation } from '../../../store/leads/leadsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import type {
	ApiClientType,
	CreateLeadBody,
} from '../../../store/leads/types/definition'
import { Field, FormHeader, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface FormFields {
	firstName: string
	lastName: string
	companyName: string
	clientType: ApiClientType | ''
	rate: string
	location: string
}

const empty: FormFields = {
	firstName: '',
	lastName: '',
	companyName: '',
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
		<path
			d='M22 11h-6M19 8v6'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
		/>
	</svg>
)

const LeadCreateForm = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const [fields, setFields] = useState<FormFields>(empty)
	const [error, setError] = useState<string | undefined>()
	const [createLead, { isLoading }] = useCreateLeadMutation()

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (key === 'firstName' || key === 'lastName' || key === 'companyName') setError(undefined)
	}

	const hasName =
		!!fields.firstName.trim() ||
		!!fields.lastName.trim() ||
		(fields.clientType === 'company' && !!fields.companyName.trim())

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!hasName) {
			setError('Provide at least a first name, last name or company name')
			return
		}
		try {
			const body: CreateLeadBody = {
				firstName: fields.firstName.trim() || undefined,
				lastName: fields.lastName.trim() || undefined,
				companyName:
					fields.clientType === 'company' ? fields.companyName.trim() || undefined : undefined,
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
							hint='Who this lead is and where they are based'
						/>
						<FieldGrid>
							<Field label='First name' error={error}>
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
									onChange={(value) =>
										setField('clientType', value as ApiClientType | '')
									}
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
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Creating…' : 'Create lead'}
							</Button>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default LeadCreateForm
