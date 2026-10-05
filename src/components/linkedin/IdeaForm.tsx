import { ChangeEvent, FormEvent, KeyboardEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LightbulbOutlined, CloseRounded } from '@mui/icons-material'
import styled from 'styled-components'
import { TextField, Select, SelectItem } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../auth/PermissionGate'
import { T } from '../sales-analytics/_shared/tokens'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import {
	useCreateLinkedInIdeaMutation,
	useGetLinkedInIdeaByIdQuery,
	useUpdateLinkedInIdeaMutation,
	type LinkedInIdeaPriority,
	type LinkedInIdeaStatus,
	type LinkedInPostFormat,
} from '../../store/linkedin-ideas/linkedInIdeasApi'
import { useGetEmployeesQuery } from '../../store/employees/employeesApi'

const FORMAT_OPTIONS: LinkedInPostFormat[] = [
	'TEXT',
	'IMAGE',
	'VIDEO',
	'DOCUMENT',
	'LINK',
	'POLL',
]

interface FormFields {
	title: string
	content: string
	hook: string
	targetAudience: string
	contentPillar: string
	suggestedFormat: LinkedInPostFormat | ''
	language: string
	priority: LinkedInIdeaPriority
	status: LinkedInIdeaStatus
	tags: string[]
	referenceLinks: string[]
	ownerId: string
	plannedDate: string
	note: string
}

interface FormErrors {
	title?: string
	content?: string
}

const empty: FormFields = {
	title: '',
	content: '',
	hook: '',
	targetAudience: '',
	contentPillar: '',
	suggestedFormat: '',
	language: 'en',
	priority: 'MEDIUM',
	status: 'NEW',
	tags: [],
	referenceLinks: [],
	ownerId: '',
	plannedDate: '',
	note: '',
}

const IdeaFormInner = ({
	id,
	initial,
}: {
	id?: string
	initial: FormFields
}) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [tagDraft, setTagDraft] = useState('')
	const [linkDraft, setLinkDraft] = useState('')
	const [create, { isLoading: creating }] = useCreateLinkedInIdeaMutation()
	const [update, { isLoading: updating }] = useUpdateLinkedInIdeaMutation()
	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 200 })

	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const addTag = () => {
		const t = tagDraft.trim().replace(/^#/, '')
		if (!t) return
		if (!fields.tags.includes(t)) setField('tags', [...fields.tags, t])
		setTagDraft('')
	}
	const removeTag = (t: string) =>
		setField('tags', fields.tags.filter((x) => x !== t))

	const addLink = () => {
		const l = linkDraft.trim()
		if (!l) return
		if (!fields.referenceLinks.includes(l))
			setField('referenceLinks', [...fields.referenceLinks, l])
		setLinkDraft('')
	}
	const removeLink = (l: string) =>
		setField(
			'referenceLinks',
			fields.referenceLinks.filter((x) => x !== l),
		)

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.title.trim()) next.title = 'Title is required'
		if (!fields.content.trim()) next.content = 'Content is required'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const body = {
			title: fields.title.trim(),
			content: fields.content,
			hook: fields.hook.trim() || undefined,
			targetAudience: fields.targetAudience.trim() || undefined,
			contentPillar: fields.contentPillar.trim() || undefined,
			suggestedFormat: fields.suggestedFormat || undefined,
			language: fields.language || 'en',
			priority: fields.priority,
			status: fields.status,
			tags: fields.tags,
			referenceLinks: fields.referenceLinks,
			ownerId: fields.ownerId || undefined,
			plannedDate: fields.plannedDate || undefined,
			note: fields.note.trim() || undefined,
		}
		try {
			if (isEdit) {
				await update({ id: id!, body }).unwrap()
				showToast('Idea updated', 'success')
			} else {
				await create(body).unwrap()
				showToast('Idea created', 'success')
			}
			navigate('/linkedin/ideas')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/linkedin/ideas'
					backLabel='Back to ideas'
					icon={<LightbulbOutlined />}
					title={isEdit ? 'Edit LinkedIn idea' : 'New LinkedIn idea'}
					subtitle={
						isEdit
							? 'Update the idea. Convert it into a post from the ideas list.'
							: 'Capture a raw idea now — convert it into a post later.'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Content' hint='Title, hook and body' />
						<FieldGrid>
							<Field label='Title' required error={errors.title} span='full'>
								<TextField
									name='title'
									placeholder='Short internal title for this idea'
									value={fields.title}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('title', e.target.value)
									}
									width='100%'
									error={!!errors.title}
								/>
							</Field>
							<Field label='Hook' hint='Optional — the attention-grabbing first line' span='full'>
								<TextField
									name='hook'
									placeholder='e.g. "We killed 90% of our AI-drafted proposals — replies doubled."'
									value={fields.hook}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('hook', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field
								label='Main content / description'
								required
								error={errors.content}
								span='full'
							>
								<TextArea
									rows={6}
									placeholder='Free-form: main body, outline, or notes for later.'
									value={fields.content}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('content', e.target.value)
									}
									$error={!!errors.content}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead num='02' title='Framing' hint='Audience, pillar and format' />
						<FieldGrid>
							<Field label='Target audience'>
								<TextField
									name='targetAudience'
									placeholder='e.g. Solo founders & tiny outbound teams'
									value={fields.targetAudience}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('targetAudience', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Content pillar'>
								<TextField
									name='contentPillar'
									placeholder='e.g. sales, product, culture'
									value={fields.contentPillar}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('contentPillar', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Suggested format'>
								<Select
									label='Suggested format'
									defaultValue={fields.suggestedFormat}
									onChange={(value) =>
										setField('suggestedFormat', value as LinkedInPostFormat | '')
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— None —' value='' />
									{FORMAT_OPTIONS.map((f) => (
										<SelectItem key={f} label={f.charAt(0) + f.slice(1).toLowerCase()} value={f} />
									))}
								</Select>
							</Field>
							<Field label='Language'>
								<TextField
									name='language'
									placeholder='en'
									value={fields.language}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('language', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Planning & ownership'
							hint='Status, priority, owner, scheduled date'
						/>
						<FieldGrid>
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.status}
									onChange={(value) =>
										setField('status', value as LinkedInIdeaStatus)
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='New' value='NEW' />
									<SelectItem label='In progress' value='IN_PROGRESS' />
									<SelectItem label='Converted' value='CONVERTED' />
									<SelectItem label='Archived' value='ARCHIVED' />
								</Select>
							</Field>
							<Field label='Priority'>
								<Select
									label='Priority'
									defaultValue={fields.priority}
									onChange={(value) =>
										setField('priority', value as LinkedInIdeaPriority)
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Low' value='LOW' />
									<SelectItem label='Medium' value='MEDIUM' />
									<SelectItem label='High' value='HIGH' />
								</Select>
							</Field>
							<Field label='Owner'>
								<Select
									label='Owner'
									defaultValue={fields.ownerId}
									onChange={(value) => setField('ownerId', value as string)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— None —' value='' />
									{(employeesPage?.data ?? []).map((emp) => (
										<SelectItem
											key={emp.id}
											label={`${emp.firstName} ${emp.lastName}`}
											value={emp.id}
										/>
									))}
								</Select>
							</Field>
							<Field label='Planned date' hint='Optional'>
								<TextField
									name='plannedDate'
									type='date'
									value={fields.plannedDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('plannedDate', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={260}>
						<SectionHead
							num='04'
							title='Tags & references'
							hint='Free-form tags and useful links'
						/>
						<FieldGrid>
							<Field label='Tags' hint='Press Enter to add' span='full'>
								<ChipInputWrap>
									<TextField
										name='tag-draft'
										placeholder='Type a tag and press Enter'
										value={tagDraft}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setTagDraft(e.target.value)
										}
										onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addTag()
											}
										}}
										width='100%'
									/>
									{fields.tags.length > 0 && (
										<ChipsList>
											{fields.tags.map((t) => (
												<Chip key={t}>
													#{t}
													<ChipRemove type='button' onClick={() => removeTag(t)}>
														<CloseRounded style={{ fontSize: 12 }} />
													</ChipRemove>
												</Chip>
											))}
										</ChipsList>
									)}
								</ChipInputWrap>
							</Field>
							<Field label='Reference links' hint='Press Enter to add' span='full'>
								<ChipInputWrap>
									<TextField
										name='link-draft'
										placeholder='https://…'
										value={linkDraft}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setLinkDraft(e.target.value)
										}
										onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addLink()
											}
										}}
										width='100%'
									/>
									{fields.referenceLinks.length > 0 && (
										<LinksList>
											{fields.referenceLinks.map((l) => (
												<LinkChip key={l}>
													<a href={l} target='_blank' rel='noreferrer noopener'>
														{l}
													</a>
													<ChipRemove type='button' onClick={() => removeLink(l)}>
														<CloseRounded style={{ fontSize: 12 }} />
													</ChipRemove>
												</LinkChip>
											))}
										</LinksList>
									)}
								</ChipInputWrap>
							</Field>
							<Field label='Note' hint='Optional — internal notes' span='full'>
								<TextArea
									rows={3}
									placeholder='Anything else worth remembering.'
									value={fields.note}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('note', e.target.value)
									}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Editing idea' : 'Idea will be created immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/linkedin/ideas')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={
									isEdit ? 'linkedin_ideas:update' : 'linkedin_ideas:create'
								}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create idea'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const IdeaForm = ({ id }: { id?: string }) => {
	const { data, isLoading, isError } = useGetLinkedInIdeaByIdQuery(id!, {
		skip: !id,
	})

	if (id && isLoading) return <FormLoading label='Loading idea…' />
	if (id && (isError || !data)) return <FormNotFound label='Idea not found' />

	const initial: FormFields = data
		? {
				title: data.title,
				content: data.content,
				hook: data.hook ?? '',
				targetAudience: data.targetAudience ?? '',
				contentPillar: data.contentPillar ?? '',
				suggestedFormat: data.suggestedFormat ?? '',
				language: data.language ?? 'en',
				priority: data.priority,
				status: data.status,
				tags: data.tags ?? [],
				referenceLinks: data.referenceLinks ?? [],
				ownerId: data.ownerId ?? '',
				plannedDate: data.plannedDate ? data.plannedDate.slice(0, 10) : '',
				note: data.note ?? '',
			}
		: empty

	return <IdeaFormInner id={id} initial={initial} />
}

export default IdeaForm

const TextArea = styled.textarea<{ $error?: boolean }>`
	width: 100%;
	padding: 12px 14px;
	border-radius: 10px;
	border: 1.5px solid
		${({ $error }) => ($error ? '#dc2626' : 'rgba(15, 23, 42, 0.12)')};
	background: #ffffff;
	font: inherit;
	font-size: 13.5px;
	color: ${T.textStrong};
	line-height: 1.55;
	resize: vertical;
	min-height: 90px;
	outline: none;
	transition: border-color 160ms ease, box-shadow 160ms ease;
	&:focus {
		border-color: ${T.primary};
		box-shadow: 0 0 0 4px ${T.primaryTint};
	}
`

const ChipInputWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const ChipsList = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
`

const Chip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 4px 4px 4px 10px;
	border-radius: 999px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-size: 12px;
	font-weight: 600;
`

const ChipRemove = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border-radius: 999px;
	background: transparent;
	border: none;
	color: currentColor;
	cursor: pointer;
	padding: 0;
	&:hover {
		background: rgba(0, 0, 0, 0.08);
	}
`

const LinksList = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const LinkChip = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 6px 6px 12px;
	border-radius: 8px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-size: 12.5px;
	font-weight: 500;
	a {
		color: inherit;
		text-decoration: none;
		max-width: 500px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	a:hover {
		text-decoration: underline;
	}
`
