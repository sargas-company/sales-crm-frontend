import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../card/Card'
import Box from '../../box/Box'
import { GridInnerContainer, GridItem } from '../../layout'
import { Text, TextField, Button, Divider, Select, SelectItem } from '../../../ui'
import {
	useGetAccountByIdQuery,
	useCreateAccountMutation,
	useUpdateAccountMutation,
} from '../../../store/accounts/accountsApi'
import { useGetPlatformsQuery } from '../../../store/platforms/platformsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

interface AccountFormProps {
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
	platformId: string
}

const empty: FormFields = { firstName: '', lastName: '', platformId: '' }

const AccountFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [fields, setFields] = useState<FormFields>(initial)
	const [createAccount, { isLoading: creating }] = useCreateAccountMutation()
	const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation()
	const { data: platforms = [] } = useGetPlatformsQuery()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
		setFields((prev) => ({ ...prev, [key]: value }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		try {
			if (isEdit) {
				await updateAccount({
					id: id!,
					body: {
						firstName: fields.firstName || undefined,
						lastName: fields.lastName || undefined,
						platformId: fields.platformId || undefined,
					},
				}).unwrap()
				showToast('Account updated successfully', 'success')
			} else {
				await createAccount({
					firstName: fields.firstName,
					lastName: fields.lastName,
					platformId: fields.platformId,
				}).unwrap()
				showToast('Account created successfully', 'success')
			}
			navigate('/accounts/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 720, margin: '0 auto' }}>
				<Box mb={5}>
					<Text heading='h5'>{isEdit ? 'Edit Account' : 'Create Account'}</Text>
					<Box mt={1}>
						<Text varient='body2' secondary>
							{isEdit
								? 'Update the account details below'
								: 'Fill in the details to add a new developer account'}
						</Text>
					</Box>
				</Box>

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={5}>
						<Box display='flex' flexDirection='column' space={3}>
							<SectionLabel>Account Info</SectionLabel>
							<GridInnerContainer spacing={2}>
								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											First Name *
										</Text>
										<TextField
											name='firstName'
											placeholder='e.g. Dmytro'
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
											placeholder='e.g. Sarafaniuk'
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
											Platform *
										</Text>
										<Select
											label='Select platform'
											defaultValue={fields.platformId}
											onChange={(value) => setField('platformId', value)}
											width='100%'
											sizes='normal'
										>
											{platforms.map((p) => (
												<SelectItem key={p.id} label={p.title} value={p.id} />
											))}
										</Select>
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
								onClick={() => navigate('/accounts/list/')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading || !fields.platformId}>
								{isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
							</Button>
						</Box>
					</Box>
				</form>
			</Box>
		</Card>
	)
}

const AccountForm = ({ id }: AccountFormProps) => {
	const { data, isLoading } = useGetAccountByIdQuery(id!, { skip: !id })

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
						Account not found
					</Text>
				</Box>
			</Card>
		)
	}

	const initial: FormFields = data
		? { firstName: data.firstName, lastName: data.lastName, platformId: data.platformId }
		: empty

	return <AccountFormInner id={id} initial={initial} />
}

export default AccountForm
