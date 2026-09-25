import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button } from '../../../ui'
import { useCreateJobPostMutation } from '../../../store/job-posts/jobPostsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import { Field, FormHeader, SectionHead } from '../../_shared/FormShell'
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
	title: string
	jobUrl: string
	location: string
	budget: string
	rawText: string
}

interface FormErrors {
	title?: string
	jobUrl?: string
}

const empty: FormFields = {
	title: '',
	jobUrl: '',
	location: '',
	budget: '',
	rawText: '',
}

const isValidUrl = (value: string) => {
	if (!value) return true
	try {
		const u = new URL(value)
		return u.protocol === 'http:' || u.protocol === 'https:'
	} catch {
		return false
	}
}

const BriefcaseIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M4 7h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

const JobPostForm = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const [fields, setFields] = useState<FormFields>(empty)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createJobPost, { isLoading }] = useCreateJobPostMutation()

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, string | undefined>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.title.trim()) next.title = 'Title is required'
		if (fields.jobUrl && !isValidUrl(fields.jobUrl))
			next.jobUrl = 'Enter a valid http(s) URL'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		try {
			const result = await createJobPost({
				title: fields.title.trim(),
				jobUrl: fields.jobUrl.trim() || undefined,
				location: fields.location.trim() || undefined,
				budget: fields.budget.trim() || undefined,
				rawText: fields.rawText.trim() || undefined,
			}).unwrap()
			showToast('Job post created successfully', 'success')
			navigate(`/job-posts/preview/${result.id}`)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/job-posts/list/'
					backLabel='Back to job posts'
					icon={<BriefcaseIcon />}
					title='New job post'
					subtitle='Fill in the details to add a job post manually'
					badgeLabel='New'
					badgeTone='new'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Basics'
							hint='A short title and the link where you found the job'
						/>
						<FieldGrid>
							<Field label='Title' required error={errors.title} span='full'>
								<TextField
									name='title'
									placeholder='e.g. React developer for SaaS product'
									value={fields.title}
									onChange={(e) => setField('title', e.target.value)}
									error={!!errors.title}
									width='100%'
								/>
							</Field>

							<Field label='Job URL' error={errors.jobUrl} span='full'>
								<TextField
									name='jobUrl'
									placeholder='https://www.upwork.com/jobs/~...'
									value={fields.jobUrl}
									onChange={(e) => setField('jobUrl', e.target.value)}
									error={!!errors.jobUrl}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Details'
							hint='Where the client is and how much they plan to spend'
						/>
						<FieldGrid>
							<Field label='Location'>
								<TextField
									name='location'
									placeholder='e.g. United States'
									value={fields.location}
									onChange={(e) => setField('location', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Budget'>
								<TextField
									name='budget'
									placeholder='e.g. $2,000 fixed or $40/hr'
									value={fields.budget}
									onChange={(e) => setField('budget', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={240}>
						<SectionHead
							num='03'
							title='Description'
							hint='Paste the full job description as it appears on the platform'
						/>
						<FieldStack>
							<Field label='Job description' hint={`${fields.rawText.length} characters`}>
								<TextField
									name='rawText'
									placeholder='Paste the job description here…'
									value={fields.rawText}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('rawText', e.target.value)
									}
									multiRow
									width='100%'
									style={{ minHeight: 180, resize: 'vertical' }}
								/>
							</Field>
						</FieldStack>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Job post will be added to the list right away
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/job-posts/list/')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading ? 'Creating…' : 'Create job post'}
							</Button>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default JobPostForm
