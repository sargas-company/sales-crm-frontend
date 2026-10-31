import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EditNoteOutlined } from '@mui/icons-material'

import { Select, SelectItem, TextField } from '../../../ui'
import useTheme from '../../../theme/useTheme'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../../components/_shared/FormShell'
import {
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	DotMini,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../../components/_shared/formShell.styled'
import {
	UPWORK_CHANGELOG_SECTIONS,
	UPWORK_SECTION_LABEL,
	useCreateUpworkChangeLogMutation,
	useGetUpworkChangeLogQuery,
	upworkProfileName,
	useListUpworkProfilesQuery,
	useUpdateUpworkChangeLogMutation,
	type UpworkChangeLogSection,
} from '../../../store/upwork/upworkApi'

interface Props {
	mode: 'create' | 'edit'
}

const todayIso = () => new Date().toISOString().slice(0, 10)

interface FormState {
	date: string
	profileId: string
	section: UpworkChangeLogSection
	item: string
	summary: string
	reason: string
	before: string
	after: string
}

const empty: FormState = {
	date: todayIso(),
	profileId: '',
	section: 'title',
	item: '',
	summary: '',
	reason: '',
	before: '',
	after: '',
}

const UpworkChangeLogForm = ({ mode }: Props) => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const {
		data: existing,
		isLoading: loadingExisting,
		isError: notFound,
	} = useGetUpworkChangeLogQuery(id ?? '', { skip: !isEdit || !id })

	const [create, { isLoading: creating }] = useCreateUpworkChangeLogMutation()
	const [update, { isLoading: updating }] = useUpdateUpworkChangeLogMutation()
	const isLoading = creating || updating

	const [fields, setFields] = useState<FormState>(empty)
	const [errors, setErrors] = useState<{ profileId?: string; summary?: string }>({})

	useEffect(() => {
		if (isEdit && existing) {
			setFields({
				date: existing.date.slice(0, 10),
				profileId: existing.profileId,
				section: existing.section,
				item: existing.item ?? '',
				summary: existing.summary,
				reason: existing.reason ?? '',
				before: existing.before,
				after: existing.after,
			})
		}
	}, [isEdit, existing])

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const next: typeof errors = {}
		if (!fields.profileId) next.profileId = 'Pick a profile'
		if (!fields.summary.trim()) next.summary = 'Summary is required'
		if (Object.keys(next).length) {
			setErrors(next)
			return
		}
		setErrors({})
		const payload = {
			date: fields.date,
			profileId: fields.profileId,
			section: fields.section,
			item: fields.item.trim() || undefined,
			summary: fields.summary.trim(),
			reason: fields.reason.trim() || undefined,
			before: fields.before,
			after: fields.after,
		}
		if (isEdit && id) {
			await update({ id, patch: payload }).unwrap()
			nav(`/upwork/change-log/${id}`)
		} else {
			const created = await create(payload).unwrap()
			nav(`/upwork/change-log/${created.id}`)
		}
	}

	if (isEdit && loadingExisting) return <FormLoading label='Loading entry…' />
	if (isEdit && notFound) return <FormNotFound label='Entry not found' />

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo={isEdit && id ? `/upwork/change-log/${id}` : '/upwork/change-log'}
					backLabel={isEdit ? 'Back to entry' : 'Back to change log'}
					icon={<EditNoteOutlined />}
					title={isEdit ? 'Edit change-log entry' : 'New change-log entry'}
					subtitle={
						isEdit
							? 'Update entry details.'
							: 'Record a profile edit with before / after text and the reference entries that drove it.'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='When & where'
							hint='Pick the profile, section and date for this edit.'
						/>
						<FieldGrid>
							<Field label='Date' required>
								<TextField
									name='date'
									type='date'
									value={fields.date}
									onChange={(e) => setField('date', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Profile' required error={errors.profileId}>
								<Select
									label=''
									value={fields.profileId}
									onChange={(v) => setField('profileId', String(v ?? ''))}
									width='100%'
								>
									<SelectItem label='— pick a profile' value='' />
									{profiles.map((p) => (
										<SelectItem key={p.id} label={upworkProfileName(p)} value={p.id} />
									))}
								</Select>
							</Field>
							<Field label='Section' required>
								<Select
									label=''
									value={fields.section}
									onChange={(v) =>
										setField('section', (v as UpworkChangeLogSection) ?? 'title')
									}
									width='100%'
								>
									{UPWORK_CHANGELOG_SECTIONS.map((s) => (
										<SelectItem key={s} label={UPWORK_SECTION_LABEL[s]} value={s} />
									))}
								</Select>
							</Field>
							<Field label='Item' hint='Optional, e.g. the portfolio case title.'>
								<TextField
									name='item'
									value={fields.item}
									onChange={(e) => setField('item', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Narrative'
							hint='A one-line summary and optional long reason.'
						/>
						<FieldGrid>
							<Field label='Summary' required span='full' error={errors.summary}>
								<TextField
									name='summary'
									value={fields.summary}
									onChange={(e) => setField('summary', e.target.value)}
									error={!!errors.summary}
									width='100%'
								/>
							</Field>
							<Field label='Reason' span='full'>
								<TextField
									name='reason'
									value={fields.reason}
									onChange={(e) => setField('reason', e.target.value)}
									multiline
									multiRow
									width='100%'
									style={{ minHeight: 100, resize: 'vertical' }}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={240}>
						<SectionHead
							num='03'
							title='Before / After'
							hint={
								fields.section === 'job_analysis'
									? 'Optional for job post analysis — leave empty if this is pure research.'
									: 'Full text before and after the change.'
							}
						/>
						<FieldGrid>
							<Field label='Before' span='full'>
								<TextField
									name='before'
									value={fields.before}
									onChange={(e) => setField('before', e.target.value)}
									multiline
									multiRow
									width='100%'
									style={{ minHeight: 220, resize: 'vertical' }}
								/>
							</Field>
							<Field label='After' span='full'>
								<TextField
									name='after'
									value={fields.after}
									onChange={(e) => setField('after', e.target.value)}
									multiline
									multiRow
									width='100%'
									style={{ minHeight: 220, resize: 'vertical' }}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Changes save on submit.' : 'The entry appears in the list immediately.'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => nav(isEdit && id ? `/upwork/change-log/${id}` : '/upwork/change-log')}
							>
								Cancel
							</PrimaryGhostButton>
							<PrimarySolidButton type='submit' disabled={isLoading}>
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create entry'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default UpworkChangeLogForm
