import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../card/Card'
import Box from '../../box/Box'
import { GridInnerContainer, GridItem } from '../../layout'
import { Text, TextField, Button, Divider, Select, SelectItem } from '../../../ui'
import {
	useGetClientRequestByIdQuery,
	useUpdateClientRequestMutation,
} from '../../../store/clientRequests/clientRequestsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import type {
	ClientRequestItem,
	ClientRequestStatus,
} from '../../../store/clientRequests/types/definition'

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
	name: string
	company: string
	email: string
	phone: string
	message: string
	status: ClientRequestStatus
}

const toFormValues = (data: ClientRequestItem): FormFields => ({
	name: data.name ?? '',
	company: data.company ?? '',
	email: data.email ?? '',
	phone: data.phone ?? '',
	message: data.message ?? '',
	status: data.status,
})

const ClientRequestFormInner = ({
	id,
	initialData,
}: {
	id: string
	initialData: ClientRequestItem
}) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [fields, setFields] = useState<FormFields>(toFormValues(initialData))
	const [updateClientRequest, { isLoading }] = useUpdateClientRequestMutation()

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
		setFields((prev) => ({ ...prev, [key]: value }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		try {
			await updateClientRequest({ id, body: fields }).unwrap()
			showToast('Client request updated successfully', 'success')
			navigate(`/client-requests/preview/${id}`)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 720, margin: '0 auto' }}>
				<Box mb={5}>
					<Text heading='h5'>Edit Client Request</Text>
					<Box mt={1}>
						<Text varient='body2' secondary>
							Update the request details below
						</Text>
					</Box>
				</Box>

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={2}>
						<Box display='flex' flexDirection='column' space={3}>
							<SectionLabel>Contact Info</SectionLabel>
							<GridInnerContainer spacing={2}>
								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Name
										</Text>
										<TextField
											name='name'
											placeholder='e.g. John Doe'
											value={fields.name}
											onChange={(e) => setField('name', e.target.value)}
											width='100%'
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Company
										</Text>
										<TextField
											name='company'
											placeholder='e.g. Acme Corp'
											value={fields.company}
											onChange={(e) => setField('company', e.target.value)}
											width='100%'
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Email
										</Text>
										<TextField
											name='email'
											type='email'
											placeholder='e.g. john@acme.com'
											value={fields.email}
											onChange={(e) => setField('email', e.target.value)}
											width='100%'
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Phone
										</Text>
										<TextField
											name='phone'
											placeholder='e.g. 5551234567'
											value={fields.phone}
											onChange={(e) => setField('phone', e.target.value)}
											width='100%'
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Status
										</Text>
										<Select
											label='Select status'
											defaultValue={fields.status}
											onChange={(value) =>
												setField('status', value as ClientRequestStatus)
											}
											width='100%'
											sizes='normal'
										>
											<SelectItem label='On Review' value='on_review' />
											<SelectItem
												label='Conversation Ongoing'
												value='conversation_ongoing'
											/>
											<SelectItem label='Archived' value='archived' />
										</Select>
									</Box>
								</GridItem>
							</GridInnerContainer>
						</Box>

						<Divider />

						<Box display='flex' flexDirection='column' space={3}>
							<SectionLabel>Message</SectionLabel>
							<TextField
								name='message'
								placeholder='Client message…'
								value={fields.message}
								onChange={(e) => setField('message', e.target.value)}
								width='100%'
								multiline
								rows={4}
							/>
						</Box>

						<Box display='flex' justify='flex-end' space={1}>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate(`/client-requests/preview/${id}`)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : 'Save Changes'}
							</Button>
						</Box>
					</Box>
				</form>
			</Box>
		</Card>
	)
}

const ClientRequestForm = ({ id }: { id: string }) => {
	const { data, isLoading } = useGetClientRequestByIdQuery(id, { skip: !id })

	if (isLoading) {
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

	if (!data) {
		return (
			<Card py='2rem' px='2rem'>
				<Box style={{ maxWidth: 720, margin: '0 auto' }}>
					<Text varient='body2' secondary>
						Client request not found
					</Text>
				</Box>
			</Card>
		)
	}

	return <ClientRequestFormInner id={id} initialData={data} />
}

export default ClientRequestForm
