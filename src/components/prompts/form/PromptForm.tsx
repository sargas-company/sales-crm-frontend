import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../card/Card'
import Box from '../../box/Box'
import { GridInnerContainer, GridItem } from '../../layout'
import { Text, TextField, Button, Divider, Select, SelectItem } from '../../../ui'
import { useCreatePromptMutation } from '../../../store/prompts/promptsApi'
import type { PromptType } from '../../../store/prompts/types/definition'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

const PROMPT_TYPES: { value: PromptType; label: string }[] = [
	{ value: 'JOB_GATEKEEPER', label: 'Job Gatekeeper' },
	{ value: 'JOB_EVALUATION', label: 'Job Evaluation' },
	{ value: 'CHAT_SYSTEM', label: 'Chat System' },
	{ value: 'CHAT_FALLBACK', label: 'Chat Fallback' },
]

interface FormFields {
	type: PromptType | ''
	title: string
	content: string
}

interface FormErrors {
	type?: string
	title?: string
	content?: string
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

const FieldError = ({ message }: { message?: string }) => {
	if (!message) return null
	return (
		<Text varient='caption' styles={{ color: '#ff4d4f', marginTop: 4 }}>
			{message}
		</Text>
	)
}

const validate = (fields: FormFields): FormErrors => {
	const errors: FormErrors = {}
	if (!fields.type) errors.type = 'Type is required'
	if (!fields.title.trim()) errors.title = 'Title is required'
	else if (fields.title.trim().length < 2) errors.title = 'Title must be at least 2 characters'
	if (!fields.content.trim()) errors.content = 'Content is required'
	else if (fields.content.trim().length < 10) errors.content = 'Content must be at least 10 characters'
	return errors
}

const PromptForm = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [createPrompt, { isLoading }] = useCreatePromptMutation()

	const [fields, setFields] = useState<FormFields>({ type: '', title: '', content: '' })
	const [errors, setErrors] = useState<FormErrors>({})

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const validationErrors = validate(fields)
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors)
			return
		}
		try {
			await createPrompt({
				type: fields.type as PromptType,
				title: fields.title.trim(),
				content: fields.content.trim(),
			}).unwrap()
			showToast('Prompt created successfully', 'success')
			navigate('/prompts/list')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Card py='2rem' px='2rem'>
			<Box style={{ maxWidth: 800, margin: '0 auto' }}>
				<Box mb={5}>
					<Text heading='h5'>Create Prompt</Text>
					<Box mt={1}>
						<Text varient='body2' secondary>
							Fill in the details to add a new AI prompt
						</Text>
					</Box>
				</Box>

				<form onSubmit={handleSubmit}>
					<Box display='flex' flexDirection='column' space={5}>
						<Box display='flex' flexDirection='column' space={3}>
							<SectionLabel>Prompt Info</SectionLabel>
							<GridInnerContainer spacing={2}>
								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Type *
										</Text>
										<Select
											defaultValue={fields.type}
											onChange={(value) => setField('type', value as PromptType)}
											width='100%'
										>
											{PROMPT_TYPES.map(({ value, label }) => (
												<SelectItem key={value} label={label} value={value} />
											))}
										</Select>
										<FieldError message={errors.type} />
									</Box>
								</GridItem>

								<GridItem xs={12} md={6}>
									<Box display='flex' flexDirection='column' space={1}>
										<Text varient='body2' weight='medium'>
											Title *
										</Text>
										<TextField
											name='title'
											placeholder='e.g. Chat System v2'
											value={fields.title}
											onChange={(e) => setField('title', e.target.value)}
											width='100%'
											error={!!errors.title}
										/>
										<FieldError message={errors.title} />
									</Box>
								</GridItem>
							</GridInnerContainer>
						</Box>

						<Box display='flex' flexDirection='column' space={1}>
							<Text varient='body2' weight='medium'>
								Content *
							</Text>
							<TextField
								name='content'
								placeholder='Enter the prompt text…'
								value={fields.content}
								onChange={(e) => setField('content', e.target.value)}
								width='100%'
								multiRow
								error={!!errors.content}
								style={{ minHeight: 220, resize: 'vertical' }}
							/>
							<FieldError message={errors.content} />
						</Box>

						<Divider />

						<Box display='flex' justify='flex-end' space={1}>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/prompts/list')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Creating…' : 'Create Prompt'}
							</Button>
						</Box>
					</Box>
				</form>
			</Box>
		</Card>
	)
}

export default PromptForm
