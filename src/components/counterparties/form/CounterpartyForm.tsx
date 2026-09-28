import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import {
	useGetCounterpartyByIdQuery,
	useCreateCounterpartyMutation,
	useUpdateCounterpartyMutation,
	type CounterpartyType,
} from '../../../store/counterparties/counterpartiesApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import { Field, FormHeader, FormLoading, FormNotFound, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FieldStack,
	FootActions,
	FootBar,
	FootLeft,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface CounterpartyFormProps {
	id?: string
}

interface FormFields {
	firstName: string
	lastName: string
	type: CounterpartyType
	info: string
}

interface FormErrors {
	firstName?: string
	lastName?: string
}

const empty: FormFields = { firstName: '', lastName: '', type: 'client', info: '' }

const BuildingIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M4 21h16M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
		/>
	</svg>
)

const CounterpartyFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createCounterparty, { isLoading: creating }] = useCreateCounterpartyMutation()
	const [updateCounterparty, { isLoading: updating }] = useUpdateCounterpartyMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.firstName.trim()) next.firstName = 'First name is required'
		if (!fields.lastName.trim()) next.lastName = 'Last name is required'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		try {
			if (isEdit) {
				await updateCounterparty({
					id: id!,
					body: {
						firstName: fields.firstName || undefined,
						lastName: fields.lastName || undefined,
						type: fields.type || undefined,
						info: fields.info,
					},
				}).unwrap()
				showToast('Counterparty updated successfully', 'success')
			} else {
				await createCounterparty({
					firstName: fields.firstName,
					lastName: fields.lastName,
					type: fields.type,
					info: fields.info || undefined,
				}).unwrap()
				showToast('Counterparty created successfully', 'success')
			}
			navigate('/counterparties/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/counterparties/list/'
					backLabel='Back to counterparties'
					icon={<BuildingIcon />}
					title={isEdit ? 'Edit counterparty' : 'New counterparty'}
					subtitle={
						isEdit
							? 'Update contact info, role and description'
							: 'Fill in the details to add a new counterparty'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='The counterparty’s legal or contact name'
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
							<Field label='Type' required span='full'>
								<Select
									label='Select type'
									defaultValue={fields.type}
									onChange={(value) => setField('type', value as CounterpartyType)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Client' value='client' />
									<SelectItem label='Contractor' value='contractor' />
								</Select>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Details'
							hint='Free-form notes — role, address, tax info, anything useful for invoices'
						/>
						<FieldStack>
							<Field label='Info' hint={`${fields.info.length} characters`}>
								<TextField
									name='info'
									placeholder='CEO at Acme Corp. Based in New York.'
									value={fields.info}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('info', e.target.value)
									}
									multiRow
									width='100%'
									style={{
										minHeight: 96,
										resize: 'none',
										fieldSizing: 'content',
									}}
								/>
							</Field>
						</FieldStack>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Changes are saved when you press Save'
								: 'Counterparty will be added to the list right away'}
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/counterparties/list/')}
							>
								Cancel
							</Button>
							<PrimarySolidButton type='submit' disabled={isLoading}>
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create counterparty'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const CounterpartyForm = ({ id }: CounterpartyFormProps) => {
	const { data, isLoading } = useGetCounterpartyByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading counterparty…' />
	if (id && !data) return <FormNotFound label='Counterparty not found' />

	const initial: FormFields = data
		? {
				firstName: data.firstName,
				lastName: data.lastName,
				type: data.type,
				info: data.info ?? '',
			}
		: empty

	return <CounterpartyFormInner id={id} initial={initial} />
}

export default CounterpartyForm
