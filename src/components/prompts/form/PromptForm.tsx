import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import { useCreatePromptMutation } from '../../../store/prompts/promptsApi'
import type { PromptType } from '../../../store/prompts/types/definition'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import PermissionGate from '../../auth/PermissionGate'
import { Field, FormHeader, SectionHead } from '../../_shared/FormShell'
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

const PROMPT_TYPES: { value: PromptType; label: string }[] = [
	{ value: 'JOB_GATEKEEPER', label: 'Job Gatekeeper' },
	{ value: 'JOB_EVALUATION', label: 'Job Evaluation' },
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

const validate = (fields: FormFields): FormErrors => {
	const errors: FormErrors = {}
	if (!fields.type) errors.type = 'Type is required'
	if (!fields.title.trim()) errors.title = 'Title is required'
	else if (fields.title.trim().length < 2) errors.title = 'Title must be at least 2 characters'
	if (!fields.content.trim()) errors.content = 'Content is required'
	else if (fields.content.trim().length < 10)
		errors.content = 'Content must be at least 10 characters'
	return errors
}

const PromptIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M4 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M14 3v6h6M9 14l-1.5 1.5L9 17M13 14l1.5 1.5L13 17'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

const PromptForm = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
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
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/prompts/list'
					backLabel='Back to prompts'
					icon={<PromptIcon />}
					title='New prompt'
					subtitle='Fill in the details to add a new AI prompt template'
					badgeLabel='Draft'
					badgeTone='draft'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Prompt info'
							hint='Where this prompt lives in the system and how it will be called'
						/>
						<FieldGrid>
							<Field label='Type' required error={errors.type}>
								<Select
									label='Select type'
									defaultValue={fields.type}
									onChange={(value) => setField('type', value as PromptType)}
									width='100%'
									sizes='normal'
								>
									{PROMPT_TYPES.map(({ value, label }) => (
										<SelectItem key={value} label={label} value={value} />
									))}
								</Select>
							</Field>
							<Field label='Title' required error={errors.title}>
								<TextField
									name='title'
									placeholder='e.g. Chat System v2'
									value={fields.title}
									onChange={(e) => setField('title', e.target.value)}
									width='100%'
									error={!!errors.title}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Prompt body'
							hint='The actual text that will be sent to the model — variables can be added later'
						/>
						<FieldStack>
							<Field
								label='Content'
								required
								error={errors.content}
								hint={`${fields.content.length} characters`}
							>
								<TextField
									name='content'
									placeholder='Enter the prompt text…'
									value={fields.content}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('content', e.target.value)
									}
									width='100%'
									multiRow
									error={!!errors.content}
									style={{
										minHeight: 260,
										resize: 'vertical',
										fontFamily:
											"'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
										fontSize: 13,
									}}
								/>
							</Field>
						</FieldStack>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Prompt will be created as a draft
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/prompts/list')}
							>
								Cancel
							</Button>
							<PermissionGate permission='prompts:create'>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Creating…' : 'Create prompt'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default PromptForm
