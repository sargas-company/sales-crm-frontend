import { FormEvent, useEffect, useMemo, useState } from 'react'
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
	useCreateUpworkChangeLogMutation,
	useGetUpworkChangeLogQuery,
	upworkProfileName,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
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
	referenceIds: string[]
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
	referenceIds: [],
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
				referenceIds: existing.references.map((r) => r.referenceData.id),
			})
		}
	}, [isEdit, existing])

	const { data: refOptions = [] } = useListUpworkReferencesQuery(
		{ profileId: fields.profileId || undefined, active: true },
		{ skip: !fields.profileId },
	)

	const refById = useMemo(() => {
		const m = new Map<string, (typeof refOptions)[number]>()
		for (const r of refOptions) m.set(r.id, r)
		return m
	}, [refOptions])

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	const toggleRef = (id: string) => {
		setFields((p) => ({
			...p,
			referenceIds: p.referenceIds.includes(id)
				? p.referenceIds.filter((x) => x !== id)
				: [...p.referenceIds, id],
		}))
	}

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
			referenceIds: fields.referenceIds,
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
										<SelectItem key={s} label={s} value={s} />
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
						<SectionHead num='03' title='Before / After' hint='Full text before and after the change.' />
						<FieldGrid>
							<Field label='Before' span='auto'>
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
							<Field label='After' span='auto'>
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

					<Section $delay={320}>
						<SectionHead
							num='04'
							title='Reference entries used'
							hint={
								fields.profileId
									? 'Pick which reference entries drove this edit.'
									: 'Pick a profile first.'
							}
						/>
						{!fields.profileId ? (
							<div style={{ fontSize: 13, color: '#a5a1b0', padding: '12px 0' }}>
								—
							</div>
						) : refOptions.length === 0 ? (
							<div style={{ fontSize: 13, color: '#a5a1b0', padding: '12px 0' }}>
								No reference entries yet for this profile.
							</div>
						) : (
							<div
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 8,
									padding: '4px 0',
								}}
							>
								{refOptions.map((r) => {
									const on = fields.referenceIds.includes(r.id)
									return (
										<button
											key={r.id}
											type='button'
											onClick={() => toggleRef(r.id)}
											style={{
												display: 'inline-flex',
												alignItems: 'center',
												gap: 6,
												padding: '6px 12px',
												borderRadius: 999,
												border: `1px solid ${on ? '#0369a1' : '#eeecf3'}`,
												background: on ? '#f0f9ff' : '#ffffff',
												color: on ? '#0369a1' : '#3a3541',
												cursor: 'pointer',
												fontSize: 12.5,
												fontWeight: on ? 700 : 500,
												transition: 'all 160ms ease-out',
											}}
										>
											<span style={{ opacity: 0.65 }}>{r.category}:</span>{' '}
											{r.value}
										</button>
									)
								})}
							</div>
						)}
						{fields.referenceIds.length > 0 && (
							<div
								style={{
									marginTop: 10,
									fontSize: 12,
									color: '#7a7686',
								}}
							>
								{fields.referenceIds.length} selected
							</div>
						)}
						{/* refById currently informational; keep for future label expansion */}
						{refById.size > 0 ? null : null}
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
