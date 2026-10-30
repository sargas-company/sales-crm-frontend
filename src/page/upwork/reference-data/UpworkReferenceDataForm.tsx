import { FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MenuBookOutlined } from '@mui/icons-material'

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
	UPWORK_REFERENCE_CATEGORIES,
	useCreateUpworkReferenceMutation,
	upworkProfileName,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
	useUpdateUpworkReferenceMutation,
	type UpworkReferenceCategory,
} from '../../../store/upwork/upworkApi'

interface Props {
	mode: 'create' | 'edit'
}

const todayIso = () => new Date().toISOString().slice(0, 10)

interface FormState {
	profileId: string
	category: UpworkReferenceCategory
	value: string
	note: string
	collectedDate: string
	frequency: string
	active: boolean
}

const empty: FormState = {
	profileId: '',
	category: 'title_phrase',
	value: '',
	note: '',
	collectedDate: todayIso(),
	frequency: '',
	active: true,
}

const UpworkReferenceDataForm = ({ mode }: Props) => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const { data: refList = [], isLoading: refLoading } = useListUpworkReferencesQuery(
		{},
		{ skip: !isEdit },
	)
	const existing = isEdit && id ? refList.find((r) => r.id === id) ?? null : null
	const notFound = isEdit && !refLoading && !existing

	const [create, { isLoading: creating }] = useCreateUpworkReferenceMutation()
	const [update, { isLoading: updating }] = useUpdateUpworkReferenceMutation()
	const isLoading = creating || updating

	const [fields, setFields] = useState<FormState>(empty)
	const [errors, setErrors] = useState<{ value?: string }>({})

	useEffect(() => {
		if (isEdit && existing) {
			setFields({
				profileId: existing.profileId ?? '',
				category: existing.category,
				value: existing.value,
				note: existing.note ?? '',
				collectedDate: existing.collectedDate.slice(0, 10),
				frequency: existing.frequency != null ? String(existing.frequency) : '',
				active: existing.active,
			})
		}
	}, [isEdit, existing])

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const value = fields.value.trim()
		if (!value) {
			setErrors({ value: 'Value is required' })
			return
		}
		setErrors({})
		const payload = {
			profileId: fields.profileId || undefined,
			category: fields.category,
			value,
			note: fields.note.trim() || undefined,
			collectedDate: fields.collectedDate,
			frequency: fields.frequency ? Number(fields.frequency) : undefined,
			active: fields.active,
		}
		if (isEdit && id) {
			await update({ id, patch: payload }).unwrap()
			nav('/upwork/reference-data')
		} else {
			await create(payload).unwrap()
			nav('/upwork/reference-data')
		}
	}

	if (isEdit && refLoading) return <FormLoading label='Loading entry…' />
	if (notFound) return <FormNotFound label='Reference entry not found' />

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/upwork/reference-data'
					backLabel='Back to reference data'
					icon={<MenuBookOutlined />}
					title={isEdit ? 'Edit reference entry' : 'New reference entry'}
					subtitle={
						isEdit
							? 'Update the entry.'
							: 'Add one new entry. For many at once use Bulk add.'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Classification'
							hint='Which profile does this belong to and what kind of entry is it.'
						/>
						<FieldGrid>
							<Field label='Profile' hint='Leave empty for shared.'>
								<Select
									label=''
									value={fields.profileId}
									onChange={(v) => setField('profileId', String(v ?? ''))}
									width='100%'
								>
									<SelectItem label='— shared (all profiles)' value='' />
									{profiles.map((p) => (
										<SelectItem key={p.id} label={upworkProfileName(p)} value={p.id} />
									))}
								</Select>
							</Field>
							<Field label='Category' required>
								<Select
									label=''
									value={fields.category}
									onChange={(v) =>
										setField('category', (v as UpworkReferenceCategory) ?? 'title_phrase')
									}
									width='100%'
								>
									{UPWORK_REFERENCE_CATEGORIES.map((c) => (
										<SelectItem key={c} label={c} value={c} />
									))}
								</Select>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Content'
							hint='The entry value and optional context.'
						/>
						<FieldGrid>
							<Field label='Value' required span='full' error={errors.value}>
								<TextField
									name='value'
									value={fields.value}
									onChange={(e) => setField('value', e.target.value)}
									error={!!errors.value}
									width='100%'
								/>
							</Field>
							<Field label='Note' span='full'>
								<TextField
									name='note'
									value={fields.note}
									onChange={(e) => setField('note', e.target.value)}
									multiline
									multiRow
									width='100%'
									style={{ minHeight: 100, resize: 'vertical' }}
								/>
							</Field>
							<Field label='Collected date' required>
								<TextField
									name='collectedDate'
									type='date'
									value={fields.collectedDate}
									onChange={(e) => setField('collectedDate', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Frequency' hint='Optional count, used for sort.'>
								<TextField
									name='frequency'
									type='number'
									value={fields.frequency}
									onChange={(e) => setField('frequency', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Changes save on submit.' : 'Appears in the list immediately.'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => nav('/upwork/reference-data')}
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

export default UpworkReferenceDataForm
