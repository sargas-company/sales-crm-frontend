import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../card/Card'
import Box from '../../box/Box'
import { GridInnerContainer, GridItem } from '../../layout'
import { Text, TextField, Button, Divider } from '../../../ui'
import {
	useGetPlatformByIdQuery,
	useCreatePlatformMutation,
	useUpdatePlatformMutation,
} from '../../../store/platforms/platformsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

interface PlatformFormProps {
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
	title: string
	imageUrl: string
}

const toSlug = (title: string) =>
	title
		.trim()
		.toLowerCase()
		.replace(/\s+/g, '-')
		.replace(/[^a-z0-9-]/g, '')

const empty: FormFields = { title: '', imageUrl: '' }

const PlatformFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [fields, setFields] = useState<FormFields>(initial)
	const [createPlatform, { isLoading: creating }] = useCreatePlatformMutation()
	const [updatePlatform, { isLoading: updating }] = useUpdatePlatformMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
		setFields((prev) => ({ ...prev, [key]: value }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		try {
			if (isEdit) {
				await updatePlatform({
					id: id!,
					body: {
						title: fields.title || undefined,
						slug: fields.title ? toSlug(fields.title) : undefined,
						imageUrl: fields.imageUrl || undefined,
					},
				}).unwrap()
				showToast('Platform updated successfully', 'success')
			} else {
				await createPlatform({
					title: fields.title,
					slug: toSlug(fields.title),
					imageUrl: fields.imageUrl || undefined,
				}).unwrap()
				showToast('Platform created successfully', 'success')
			}
			navigate('/platforms/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 720, margin: '0 auto' }}>
				<Box mb={5}>
					<Text heading='h5'>{isEdit ? 'Edit Platform' : 'Create Platform'}</Text>
					<Box mt={1}>
						<Text varient='body2' secondary>
							{isEdit
								? 'Update the platform details below'
								: 'Fill in the details to add a new platform'}
						</Text>
					</Box>
				</Box>

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={5}>
						<Box display='flex' flexDirection='column' space={3}>
							<SectionLabel>Platform Info</SectionLabel>
							<GridInnerContainer spacing={2}>
								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Title *
										</Text>
										<TextField
											name='title'
											placeholder='e.g. Upwork'
											value={fields.title}
											onChange={(e) => setField('title', e.target.value)}
											width='100%'
											required
										/>
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Image URL
										</Text>
										<TextField
											name='imageUrl'
											placeholder='https://example.com/logo.png'
											value={fields.imageUrl}
											onChange={(e) => setField('imageUrl', e.target.value)}
											width='100%'
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
								onClick={() => navigate('/platforms/list/')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Platform'}
							</Button>
						</Box>
					</Box>
				</form>
			</Box>
		</Card>
	)
}

const PlatformForm = ({ id }: PlatformFormProps) => {
	const { data, isLoading } = useGetPlatformByIdQuery(id!, { skip: !id })

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
						Platform not found
					</Text>
				</Box>
			</Card>
		)
	}

	const initial: FormFields = data ? { title: data.title, imageUrl: data.imageUrl ?? '' } : empty

	return <PlatformFormInner id={id} initial={initial} />
}

export default PlatformForm
