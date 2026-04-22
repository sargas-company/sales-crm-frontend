import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../card/Card'
import Box from '../../box/Box'
import { GridInnerContainer, GridItem } from '../../layout'
import { Text, TextField, Button, Divider, Select, SelectItem } from '../../../ui'
import {
	useGetCounterpartyByIdQuery,
	useCreateCounterpartyMutation,
	useUpdateCounterpartyMutation,
	type CounterpartyType,
} from '../../../store/counterparties/counterpartiesApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

interface CounterpartyFormProps {
	id?: string
}

const SectionLabel = ({ children }: { children: string }) => (
	<Text
		varient='caption'
		weight='medium'
		secondary
		styles={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
	>
		{children}
	</Text>
)

interface FormFields {
	firstName: string
	lastName: string
	type: CounterpartyType
	info: string
}

const empty: FormFields = { firstName: '', lastName: '', type: 'client', info: '' }

const CounterpartyFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [fields, setFields] = useState<FormFields>(initial)
	const [createCounterparty, { isLoading: creating }] = useCreateCounterpartyMutation()
	const [updateCounterparty, { isLoading: updating }] = useUpdateCounterpartyMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
		setFields((prev) => ({ ...prev, [key]: value }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
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
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 720, margin: '0 auto' }}>
				<Box mb={5}>
					<Text heading='h5'>{isEdit ? 'Edit Counterparty' : 'Create Counterparty'}</Text>
					<Box mt={1}>
						<Text varient='body2' secondary>
							{isEdit
								? 'Update the counterparty details below'
								: 'Fill in the details to add a new counterparty'}
						</Text>
					</Box>
				</Box>

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={5}>
						<Box display='flex' flexDirection='column' space={3}>
							<SectionLabel>Counterparty Info</SectionLabel>
							<GridInnerContainer spacing={2}>
								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											First Name *
										</Text>
										<TextField
											name='firstName'
											placeholder='e.g. John'
											value={fields.firstName}
											onChange={(e) => setField('firstName', e.target.value)}
											width='100%'
											required
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Last Name *
										</Text>
										<TextField
											name='lastName'
											placeholder='e.g. Doe'
											value={fields.lastName}
											onChange={(e) => setField('lastName', e.target.value)}
											width='100%'
											required
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Type *
										</Text>
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
									</Box>
								</GridItem>

								<GridItem xs={12}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Info
										</Text>
										<TextField
											name='info'
											placeholder='CEO at Acme Corp. Based in New York.'
											value={fields.info}
											onChange={(e) => setField('info', e.target.value)}
											width='100%'
											multiRow
										/>
									</Box>
								</GridItem>
							</GridInnerContainer>
						</Box>

						<Divider />

						<Box display='flex' justify='flex-end' space={1}>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/counterparties/list/')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Counterparty'}
							</Button>
						</Box>
					</Box>
				</form>
			</Box>
		</Card>
	)
}

const CounterpartyForm = ({ id }: CounterpartyFormProps) => {
	const { data, isLoading } = useGetCounterpartyByIdQuery(id!, { skip: !id })

	if (id && isLoading) {
		return (
			<Card py='2rem' px='2rem'>
				<Box style={{ maxWidth: 720, margin: '0 auto' }}>
					<Text varient='body2' secondary>
						Loading…
					</Text>
				</Box>
			</Card>
		)
	}

	if (id && !data) {
		return (
			<Card py='2rem' px='2rem'>
				<Box style={{ maxWidth: 720, margin: '0 auto' }}>
					<Text varient='body2' secondary>
						Counterparty not found
					</Text>
				</Box>
			</Card>
		)
	}

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
