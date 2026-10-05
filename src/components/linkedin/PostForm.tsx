import { ChangeEvent, FormEvent, KeyboardEvent, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import { ArticleOutlined, CloseRounded } from '@mui/icons-material'
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
	useCreateLinkedInPostMutation,
	useGetLinkedInPostByIdQuery,
	useUpdateLinkedInPostMutation,
	type LinkedInPostStatus,
} from '../../store/linkedin-posts/linkedInPostsApi'
import { useGetLinkedInAccountsQuery } from '../../store/linkedin-accounts/linkedInAccountsApi'
import {
	useGetLinkedInIdeaByIdQuery,
	useGetLinkedInIdeasQuery,
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
	internalTitle: string
	accountId: string
	ideaId: string
	authorId: string
	body: string
	hook: string
	firstComment: string
	hashtags: string[]
	format: LinkedInPostFormat
	language: string
	targetAudience: string
	contentPillar: string
	externalLink: string
	status: LinkedInPostStatus
	scheduledAt: string
	publishedAt: string
	linkedInUrl: string
	note: string
	impressions: string
	reactions: string
	comments: string
	reposts: string
	clicks: string
	followersGained: string
	leadsGenerated: string
}

interface FormErrors {
	internalTitle?: string
	accountId?: string
	body?: string
	scheduledAt?: string
	publishedAt?: string
}

const empty: FormFields = {
	internalTitle: '',
	accountId: '',
	ideaId: '',
	authorId: '',
	body: '',
	hook: '',
	firstComment: '',
	hashtags: [],
	format: 'TEXT',
	language: 'en',
	targetAudience: '',
	contentPillar: '',
	externalLink: '',
	status: 'DRAFT',
	scheduledAt: '',
	publishedAt: '',
	linkedInUrl: '',
	note: '',
	impressions: '0',
	reactions: '0',
	comments: '0',
	reposts: '0',
	clicks: '0',
	followersGained: '0',
	leadsGenerated: '0',
}

const toISO = (v: string): string | undefined => {
	if (!v) return undefined
	const d = new Date(v)
	return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

const fromISO = (iso: string | null): string => {
	if (!iso) return ''
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return ''
	// Convert to input-friendly "YYYY-MM-DDTHH:mm" (local-ish).
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const parseInt0 = (v: string): number => {
	const n = parseInt(v, 10)
	return Number.isFinite(n) && n >= 0 ? n : 0
}

const PostFormInner = ({
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
	const [hashtagDraft, setHashtagDraft] = useState('')
	const [create, { isLoading: creating }] = useCreateLinkedInPostMutation()
	const [update, { isLoading: updating }] = useUpdateLinkedInPostMutation()
	const { data: accountsData } = useGetLinkedInAccountsQuery({
		page: 1,
		limit: 100,
		status: 'all',
	})
	const { data: ideasData } = useGetLinkedInIdeasQuery({ page: 1, limit: 200 })
	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 200 })

	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const addHashtag = () => {
		const t = hashtagDraft.trim().replace(/^#/, '')
		if (!t) return
		if (!fields.hashtags.includes(t))
			setField('hashtags', [...fields.hashtags, t])
		setHashtagDraft('')
	}
	const removeHashtag = (t: string) =>
		setField('hashtags', fields.hashtags.filter((x) => x !== t))

	const engagement = useMemo(() => {
		const imp = parseInt0(fields.impressions)
		if (imp === 0) return 0
		const sum =
			parseInt0(fields.reactions) +
			parseInt0(fields.comments) +
			parseInt0(fields.reposts) +
			parseInt0(fields.clicks)
		return (sum / imp) * 100
	}, [
		fields.impressions,
		fields.reactions,
		fields.comments,
		fields.reposts,
		fields.clicks,
	])

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.internalTitle.trim()) next.internalTitle = 'Title is required'
		if (!fields.accountId) next.accountId = 'Account is required'
		if (!fields.body.trim()) next.body = 'Body is required'
		if (fields.status === 'SCHEDULED' && !fields.scheduledAt)
			next.scheduledAt = 'Scheduled date is required for status SCHEDULED'
		if (fields.status === 'PUBLISHED' && !fields.publishedAt)
			next.publishedAt = 'Published date is required for status PUBLISHED'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const body = {
			internalTitle: fields.internalTitle.trim(),
			accountId: fields.accountId,
			ideaId: fields.ideaId || undefined,
			authorId: fields.authorId || undefined,
			body: fields.body,
			hook: fields.hook.trim() || undefined,
			firstComment: fields.firstComment.trim() || undefined,
			hashtags: fields.hashtags,
			format: fields.format,
			language: fields.language || 'en',
			targetAudience: fields.targetAudience.trim() || undefined,
			contentPillar: fields.contentPillar.trim() || undefined,
			externalLink: fields.externalLink.trim() || undefined,
			status: fields.status,
			scheduledAt: toISO(fields.scheduledAt),
			publishedAt: toISO(fields.publishedAt),
			linkedInUrl: fields.linkedInUrl.trim() || undefined,
			note: fields.note.trim() || undefined,
			impressions: parseInt0(fields.impressions),
			reactions: parseInt0(fields.reactions),
			comments: parseInt0(fields.comments),
			reposts: parseInt0(fields.reposts),
			clicks: parseInt0(fields.clicks),
			followersGained: parseInt0(fields.followersGained),
			leadsGenerated: parseInt0(fields.leadsGenerated),
		}
		try {
			if (isEdit) {
				await update({ id: id!, body }).unwrap()
				showToast('Post updated', 'success')
			} else {
				await create(body).unwrap()
				showToast('Post created', 'success')
			}
			navigate('/linkedin/posts')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/linkedin/posts'
					backLabel='Back to posts'
					icon={<ArticleOutlined />}
					title={isEdit ? 'Edit LinkedIn post' : 'New LinkedIn post'}
					subtitle={
						isEdit
							? 'Update the draft, schedule or metrics.'
							: 'Manual post workspace — publishing on LinkedIn stays manual.'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Content'
							hint='Title, body, hook, first comment'
						/>
						<FieldGrid>
							<Field
								label='Internal title'
								required
								error={errors.internalTitle}
								span='full'
							>
								<TextField
									name='internalTitle'
									placeholder='Short internal name — not shown on LinkedIn'
									value={fields.internalTitle}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('internalTitle', e.target.value)
									}
									width='100%'
									error={!!errors.internalTitle}
								/>
							</Field>
							<Field label='Hook' hint='Optional first line' span='full'>
								<TextField
									name='hook'
									placeholder='Attention-grabbing first line…'
									value={fields.hook}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('hook', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Post body' required error={errors.body} span='full'>
								<TextArea
									rows={8}
									placeholder='The actual copy you plan to paste into LinkedIn.'
									value={fields.body}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('body', e.target.value)
									}
									$error={!!errors.body}
								/>
							</Field>
							<Field label='First comment' hint='Optional' span='full'>
								<TextArea
									rows={3}
									placeholder='e.g. link to the resource, related article, or CTA'
									value={fields.firstComment}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('firstComment', e.target.value)
									}
								/>
							</Field>
							<Field label='Hashtags' hint='Press Enter to add' span='full'>
								<ChipInputWrap>
									<TextField
										name='hashtag-draft'
										placeholder='e.g. SalesOps'
										value={hashtagDraft}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setHashtagDraft(e.target.value)
										}
										onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addHashtag()
											}
										}}
										width='100%'
									/>
									{fields.hashtags.length > 0 && (
										<ChipsList>
											{fields.hashtags.map((t) => (
												<Chip key={t}>
													#{t}
													<ChipRemove
														type='button'
														onClick={() => removeHashtag(t)}
													>
														<CloseRounded style={{ fontSize: 12 }} />
													</ChipRemove>
												</Chip>
											))}
										</ChipsList>
									)}
								</ChipInputWrap>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Attribution'
							hint='Account, idea, author, format'
						/>
						<FieldGrid>
							<Field
								label='LinkedIn account'
								required
								error={errors.accountId}
							>
								<Select
									label='Account'
									defaultValue={fields.accountId}
									onChange={(value) => setField('accountId', value as string)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— Choose account —' value='' />
									{(accountsData?.data ?? []).map((a) => (
										<SelectItem
											key={a.id}
											label={`${a.displayName} (${a.type === 'COMPANY' ? 'Company' : 'Personal'})`}
											value={a.id}
										/>
									))}
								</Select>
							</Field>
							<Field label='Format'>
								<Select
									label='Format'
									defaultValue={fields.format}
									onChange={(value) => setField('format', value as LinkedInPostFormat)}
									width='100%'
									sizes='normal'
								>
									{FORMAT_OPTIONS.map((f) => (
										<SelectItem
											key={f}
											label={f.charAt(0) + f.slice(1).toLowerCase()}
											value={f}
										/>
									))}
								</Select>
							</Field>
							<Field label='Source idea' hint='Optional'>
								<Select
									label='Idea'
									defaultValue={fields.ideaId}
									onChange={(value) => setField('ideaId', value as string)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— None —' value='' />
									{(ideasData?.data ?? []).map((i) => (
										<SelectItem key={i.id} label={i.title} value={i.id} />
									))}
								</Select>
							</Field>
							<Field label='Author'>
								<Select
									label='Author'
									defaultValue={fields.authorId}
									onChange={(value) => setField('authorId', value as string)}
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
							<Field label='Target audience'>
								<TextField
									name='targetAudience'
									placeholder='e.g. B2B founders'
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
									placeholder='e.g. sales, product…'
									value={fields.contentPillar}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('contentPillar', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='External link' hint='Optional'>
								<TextField
									name='externalLink'
									placeholder='https://…'
									value={fields.externalLink}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('externalLink', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='Publishing'
							hint='Status, schedule and the live LinkedIn URL'
						/>
						<FieldGrid>
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.status}
									onChange={(value) =>
										setField('status', value as LinkedInPostStatus)
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Draft' value='DRAFT' />
									<SelectItem label='Ready' value='READY' />
									<SelectItem label='Scheduled' value='SCHEDULED' />
									<SelectItem label='Published' value='PUBLISHED' />
									<SelectItem label='Archived' value='ARCHIVED' />
								</Select>
							</Field>
							<Field
								label='Scheduled at'
								hint='Required if status = Scheduled'
								error={errors.scheduledAt}
							>
								<TextField
									name='scheduledAt'
									type='datetime-local'
									value={fields.scheduledAt}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('scheduledAt', e.target.value)
									}
									width='100%'
									error={!!errors.scheduledAt}
								/>
							</Field>
							<Field
								label='Published at'
								hint='Required if status = Published'
								error={errors.publishedAt}
							>
								<TextField
									name='publishedAt'
									type='datetime-local'
									value={fields.publishedAt}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('publishedAt', e.target.value)
									}
									width='100%'
									error={!!errors.publishedAt}
								/>
							</Field>
							<Field label='LinkedIn URL' hint='Optional but recommended once live' span='full'>
								<TextField
									name='linkedInUrl'
									placeholder='https://www.linkedin.com/posts/…'
									value={fields.linkedInUrl}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('linkedInUrl', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={260}>
						<SectionHead
							num='04'
							title='Performance'
							hint='Manual metrics — edit after publishing'
						/>
						<FieldGrid>
							{METRIC_FIELDS.map((m) => (
								<Field key={m.key} label={m.label}>
									<TextField
										name={m.key}
										type='number'
										value={fields[m.key]}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											setField(m.key, e.target.value)
										}
										width='100%'
									/>
								</Field>
							))}
							<Field label='Engagement rate' hint='Calculated' span='full'>
								<EngagementRate>
									{parseInt0(fields.impressions) > 0
										? `${engagement.toFixed(2)}%`
										: 'Needs impressions'}
									<EngagementFormula>
										(reactions + comments + reposts + clicks) / impressions × 100
									</EngagementFormula>
								</EngagementRate>
							</Field>
							<Field label='Internal note' hint='Optional' span='full'>
								<TextArea
									rows={3}
									placeholder='Any internal reminders about this post.'
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
							{isEdit ? 'Editing post' : 'Post will be created immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/linkedin/posts')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={
									isEdit ? 'linkedin_posts:update' : 'linkedin_posts:create'
								}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create post'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const METRIC_FIELDS: Array<{
	key: keyof Pick<
		FormFields,
		| 'impressions'
		| 'reactions'
		| 'comments'
		| 'reposts'
		| 'clicks'
		| 'followersGained'
		| 'leadsGenerated'
	>
	label: string
}> = [
	{ key: 'impressions', label: 'Impressions' },
	{ key: 'reactions', label: 'Reactions' },
	{ key: 'comments', label: 'Comments' },
	{ key: 'reposts', label: 'Reposts' },
	{ key: 'clicks', label: 'Clicks' },
	{ key: 'followersGained', label: 'Followers gained' },
	{ key: 'leadsGenerated', label: 'Leads generated' },
]

const PostForm = ({ id }: { id?: string }) => {
	const [params] = useSearchParams()
	const prefilledIdeaId = params.get('ideaId') ?? ''
	const { data: prefilledIdea } = useGetLinkedInIdeaByIdQuery(prefilledIdeaId, {
		skip: !prefilledIdeaId || Boolean(id),
	})
	const { data, isLoading, isError } = useGetLinkedInPostByIdQuery(id!, {
		skip: !id,
	})

	if (id && isLoading) return <FormLoading label='Loading post…' />
	if (id && (isError || !data)) return <FormNotFound label='Post not found' />

	let initial: FormFields
	if (data) {
		initial = {
			internalTitle: data.internalTitle,
			accountId: data.accountId,
			ideaId: data.ideaId ?? '',
			authorId: data.authorId ?? '',
			body: data.body,
			hook: data.hook ?? '',
			firstComment: data.firstComment ?? '',
			hashtags: data.hashtags ?? [],
			format: data.format,
			language: data.language,
			targetAudience: data.targetAudience ?? '',
			contentPillar: data.contentPillar ?? '',
			externalLink: data.externalLink ?? '',
			status: data.status,
			scheduledAt: fromISO(data.scheduledAt),
			publishedAt: fromISO(data.publishedAt),
			linkedInUrl: data.linkedInUrl ?? '',
			note: data.note ?? '',
			impressions: String(data.impressions),
			reactions: String(data.reactions),
			comments: String(data.comments),
			reposts: String(data.reposts),
			clicks: String(data.clicks),
			followersGained: String(data.followersGained),
			leadsGenerated: String(data.leadsGenerated),
		}
	} else if (prefilledIdea) {
		initial = {
			...empty,
			internalTitle: prefilledIdea.title,
			ideaId: prefilledIdea.id,
			body: prefilledIdea.content,
			hook: prefilledIdea.hook ?? '',
			hashtags: prefilledIdea.tags ?? [],
			format: prefilledIdea.suggestedFormat ?? 'TEXT',
			language: prefilledIdea.language,
			targetAudience: prefilledIdea.targetAudience ?? '',
			contentPillar: prefilledIdea.contentPillar ?? '',
		}
	} else {
		initial = empty
	}

	return <PostFormInner id={id} initial={initial} />
}

export default PostForm

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

const EngagementRate = styled.div`
	display: flex;
	align-items: baseline;
	gap: 12px;
	padding: 12px 14px;
	border-radius: 10px;
	background: ${T.primaryTint};
	color: ${T.primary};
	font-family: 'JetBrains Mono', monospace;
	font-size: 15px;
	font-weight: 700;
	letter-spacing: -0.3px;
`

const EngagementFormula = styled.span`
	font-family: 'Inter', sans-serif;
	font-size: 11px;
	font-weight: 500;
	color: ${T.textSecondary};
	letter-spacing: 0;
`
