import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import {
	useGetClientRequestByIdQuery,
	useUpdateClientRequestMutation,
} from '../../../store/clientRequests/clientRequestsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import type {
	ClientRequestItem,
	ClientRequestStatus,
} from '../../../store/clientRequests/types/definition'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FieldStack,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

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

const InboxIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M4 4h16v10a2 2 0 0 1-2 2h-3l-3 3-3-3H6a2 2 0 0 1-2-2V4z'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

const ClientRequestFormInner = ({
	id,
	initialData,
}: {
	id: string
	initialData: ClientRequestItem
}) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
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
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo={`/client-requests/preview/${id}`}
					backLabel='Back to request'
					icon={<InboxIcon />}
					title='Edit client request'
					subtitle='Update contact details, status and the incoming message'
					badgeLabel='Editing'
					badgeTone='edit'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Contact'
							hint='Who reached out and how to get back to them'
						/>
						<FieldGrid>
							<Field label='Name'>
								<TextField
									name='name'
									placeholder='e.g. John Doe'
									value={fields.name}
									onChange={(e) => setField('name', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Company'>
								<TextField
									name='company'
									placeholder='e.g. Acme Corp'
									value={fields.company}
									onChange={(e) => setField('company', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Email'>
								<TextField
									name='email'
									type='email'
									placeholder='e.g. john@acme.com'
									value={fields.email}
									onChange={(e) => setField('email', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Phone'>
								<TextField
									name='phone'
									placeholder='e.g. 5551234567'
									value={fields.phone}
									onChange={(e) => setField('phone', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Pipeline'
							hint='Track how far this request has progressed'
						/>
						<FieldGrid>
							<Field label='Status' span='full'>
								<Select
									label='Select status'
									defaultValue={fields.status}
									onChange={(value) => setField('status', value as ClientRequestStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='On Review' value='on_review' />
									<SelectItem label='Conversation Ongoing' value='conversation_ongoing' />
									<SelectItem label='Archived' value='archived' />
								</Select>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={240}>
						<SectionHead
							num='03'
							title='Message'
							hint='The message they sent, editable in case of clean-up'
						/>
						<FieldStack>
							<Field label='Message' hint={`${fields.message.length} characters`}>
								<TextField
									name='message'
									placeholder='Client message…'
									value={fields.message}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('message', e.target.value)
									}
									multiRow
									width='100%'
									style={{ minHeight: 140, resize: 'vertical' }}
								/>
							</Field>
						</FieldStack>
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
								onClick={() => navigate(`/client-requests/preview/${id}`)}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : 'Save changes'}
							</Button>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const ClientRequestForm = ({ id }: { id: string }) => {
	const { data, isLoading } = useGetClientRequestByIdQuery(id, { skip: !id })
	if (isLoading) return <FormLoading label='Loading request…' />
	if (!data) return <FormNotFound label='Client request not found' />
	return <ClientRequestFormInner id={id} initialData={data} />
}

export default ClientRequestForm
