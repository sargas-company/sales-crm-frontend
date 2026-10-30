import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlaylistAddOutlined } from '@mui/icons-material'

import { Select, SelectItem, TextField } from '../../../ui'
import useTheme from '../../../theme/useTheme'
import { useToast } from '../../../context/toast/ToastContext'
import {
	Field,
	FormHeader,
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
	useBulkAddUpworkReferencesMutation,
	upworkProfileName,
	useListUpworkProfilesQuery,
	type UpworkReferenceCategory,
} from '../../../store/upwork/upworkApi'

const todayIso = () => new Date().toISOString().slice(0, 10)

const UpworkReferenceBulkAdd = () => {
	const nav = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const [bulkAdd, { isLoading }] = useBulkAddUpworkReferencesMutation()

	const [profileId, setProfileId] = useState('')
	const [category, setCategory] = useState<UpworkReferenceCategory>('title_phrase')
	const [collectedDate, setCollectedDate] = useState(todayIso())
	const [text, setText] = useState('')
	const [error, setError] = useState<string | null>(null)

	const values = text
		.split('\n')
		.map((l) => l.trim())
		.filter(Boolean)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (values.length === 0) {
			setError('Add at least one non-empty line.')
			return
		}
		setError(null)
		const res = await bulkAdd({
			profileId: profileId || undefined,
			category,
			collectedDate,
			values,
		}).unwrap()
		showToast(`Added ${res.added} entries`, 'success')
		nav('/upwork/reference-data')
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/upwork/reference-data'
					backLabel='Back to reference data'
					icon={<PlaylistAddOutlined />}
					title='Bulk add reference entries'
					subtitle='Add many values at once under one shared category, profile and collection date.'
					badgeLabel='Bulk'
					badgeTone='new'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Shared properties'
							hint='These apply to every value entered below.'
						/>
						<FieldGrid>
							<Field label='Profile' hint='Leave empty for shared.'>
								<Select
									label=''
									value={profileId}
									onChange={(v) => setProfileId(String(v ?? ''))}
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
									value={category}
									onChange={(v) =>
										setCategory((v as UpworkReferenceCategory) ?? 'title_phrase')
									}
									width='100%'
								>
									{UPWORK_REFERENCE_CATEGORIES.map((c) => (
										<SelectItem key={c} label={c} value={c} />
									))}
								</Select>
							</Field>
							<Field label='Collected date' required>
								<TextField
									name='collectedDate'
									type='date'
									value={collectedDate}
									onChange={(e) => setCollectedDate(e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Values'
							hint={`One value per line. ${values.length ? `${values.length} will be added.` : 'Empty lines are ignored.'}`}
						/>
						<FieldGrid>
							<Field label='Values' span='full' required error={error ?? undefined}>
								<TextField
									name='values'
									value={text}
									onChange={(e) => setText(e.target.value)}
									multiline
									multiRow
									width='100%'
									placeholder={'react developer\ntypescript\nnode.js'}
									style={{ minHeight: 260, resize: 'vertical' }}
									error={!!error}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{values.length
								? `${values.length} entries will be created.`
								: 'Each non-empty line becomes one new entry.'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => nav('/upwork/reference-data')}
							>
								Cancel
							</PrimaryGhostButton>
							<PrimarySolidButton
								type='submit'
								disabled={isLoading || values.length === 0}
							>
								{isLoading ? 'Adding…' : `Add ${values.length || ''} entries`}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default UpworkReferenceBulkAdd
