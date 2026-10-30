import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { CameraAltOutlined } from '@mui/icons-material'

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
	upworkProfileName,
	useCreateUpworkSnapshotMutation,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
	useListUpworkSnapshotsQuery,
	useUpdateUpworkSnapshotMutation,
} from '../../../store/upwork/upworkApi'

interface Props {
	mode: 'create' | 'edit'
}

const todayIso = () => new Date().toISOString().slice(0, 10)

interface FormState {
	profileId: string
	date: string
	views: string
	invites: string
	directMessages: string
	positions: Record<string, string>
}

const empty = (): FormState => ({
	profileId: '',
	date: todayIso(),
	views: '0',
	invites: '0',
	directMessages: '0',
	positions: {},
})

const UpworkSnapshotForm = ({ mode }: Props) => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const [sp] = useSearchParams()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = useMemo(() => profiles.filter((p) => p.active), [profiles])

	/* Edit mode: find snapshot in a list query (we don't have a
	 * single-snapshot query hook — tiny dataset per profile). We
	 * iterate every active profile until we find the id. */
	const { data: profileHint, isLoading: hintLoading } =
		useListUpworkSnapshotsQuery(
			{ profileId: activeProfiles[0]?.id ?? '' },
			{ skip: !isEdit || activeProfiles.length === 0 },
		)
	void profileHint

	const [fields, setFields] = useState<FormState>(empty)
	const [errors, setErrors] = useState<{ profileId?: string; date?: string }>({})
	const [loadedExisting, setLoadedExisting] = useState(false)
	const [notFound, setNotFound] = useState(false)

	/* Prefill profile from ?profile= query (coming from the list
	 * page) on create. */
	useEffect(() => {
		if (!isEdit && !fields.profileId) {
			const p = sp.get('profile') ?? activeProfiles[0]?.id ?? ''
			if (p) setFields((prev) => ({ ...prev, profileId: p }))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeProfiles])

	/* Edit mode — search for the snapshot across all active profiles'
	 * snapshot lists via the single-profile hook, lazily. */
	const [existingProbe, setExistingProbe] = useState<number>(0)
	const probeProfileId = activeProfiles[existingProbe]?.id ?? ''
	const { data: probeList = [] } = useListUpworkSnapshotsQuery(
		{ profileId: probeProfileId },
		{ skip: !isEdit || !probeProfileId || loadedExisting || notFound },
	)
	useEffect(() => {
		if (!isEdit || !id || loadedExisting || notFound) return
		if (!probeProfileId) return
		const found = probeList.find((s) => s.id === id)
		if (found) {
			setFields({
				profileId: found.profileId,
				date: found.date.slice(0, 10),
				views: String(found.views),
				invites: String(found.invites),
				directMessages: String(found.directMessages),
				positions: Object.fromEntries(
					found.positions.map((p) => [p.referenceDataId, String(p.position)]),
				),
			})
			setLoadedExisting(true)
			return
		}
		/* Move to next profile; if we've exhausted, mark not found. */
		if (existingProbe + 1 >= activeProfiles.length) setNotFound(true)
		else setExistingProbe((n) => n + 1)
	}, [isEdit, id, probeList, probeProfileId, existingProbe, activeProfiles.length, loadedExisting, notFound])

	const { data: titlePhrases = [] } = useListUpworkReferencesQuery(
		{ profileId: fields.profileId, category: 'title_phrase', active: true },
		{ skip: !fields.profileId },
	)

	const [create, { isLoading: creating }] = useCreateUpworkSnapshotMutation()
	const [update, { isLoading: updating }] = useUpdateUpworkSnapshotMutation()
	const isLoading = creating || updating

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const next: typeof errors = {}
		if (!fields.profileId) next.profileId = 'Pick a profile'
		if (!fields.date) next.date = 'Date is required'
		if (Object.keys(next).length) {
			setErrors(next)
			return
		}
		setErrors({})
		const positions = Object.entries(fields.positions)
			.map(([referenceDataId, v]) => ({
				referenceDataId,
				position: Number(v) || 0,
			}))
			.filter((p) => p.position > 0)
		const payload = {
			date: fields.date,
			views: Number(fields.views) || 0,
			invites: Number(fields.invites) || 0,
			directMessages: Number(fields.directMessages) || 0,
			positions,
		}
		if (isEdit && id) {
			await update({ id, patch: payload }).unwrap()
			nav('/upwork/snapshots')
		} else {
			await create({
				profileId: fields.profileId,
				...payload,
			}).unwrap()
			nav('/upwork/snapshots')
		}
	}

	if (isEdit && !loadedExisting && !notFound && (hintLoading || existingProbe < activeProfiles.length)) {
		return <FormLoading label='Loading snapshot…' />
	}
	if (isEdit && notFound) return <FormNotFound label='Snapshot not found' />

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/upwork/snapshots'
					backLabel='Back to snapshots'
					icon={<CameraAltOutlined />}
					title={isEdit ? 'Edit snapshot' : 'New snapshot'}
					subtitle={
						isEdit
							? 'Update daily metrics.'
							: 'One row per profile per day. Views + invites + DMs. Positions optional.'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='When & where'
							hint='Profile and the day you measured.'
						/>
						<FieldGrid>
							<Field label='Profile' required error={errors.profileId}>
								<Select
									label=''
									value={fields.profileId}
									onChange={(v) => setField('profileId', String(v ?? ''))}
									width='100%'
								>
									<SelectItem label='— pick a profile' value='' />
									{activeProfiles.map((p) => (
										<SelectItem key={p.id} label={upworkProfileName(p)} value={p.id} />
									))}
								</Select>
							</Field>
							<Field label='Date' required error={errors.date}>
								<TextField
									name='date'
									type='date'
									value={fields.date}
									onChange={(e) => setField('date', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Daily metrics'
							hint='Views and invites grow each day; direct messages are per-day too.'
						/>
						<FieldGrid>
							<Field label='Views'>
								<TextField
									name='views'
									type='number'
									value={fields.views}
									onChange={(e) => setField('views', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Invites'>
								<TextField
									name='invites'
									type='number'
									value={fields.invites}
									onChange={(e) => setField('invites', e.target.value)}
									width='100%'
								/>
							</Field>
							<Field label='Direct messages'>
								<TextField
									name='directMessages'
									type='number'
									value={fields.directMessages}
									onChange={(e) => setField('directMessages', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					{fields.profileId && (
						<Section $delay={240}>
							<SectionHead
								num='03'
								title='Positions'
								hint='Search page per title phrase. Leave 0 if not measured today.'
							/>
							{titlePhrases.length === 0 ? (
								<div style={{ fontSize: 13, color: '#a5a1b0', padding: '12px 0' }}>
									No title_phrase reference entries yet for this profile.
								</div>
							) : (
								<FieldGrid>
									{titlePhrases.map((tp) => (
										<Field key={tp.id} label={tp.value}>
											<TextField
												name={`pos-${tp.id}`}
												type='number'
												value={fields.positions[tp.id] ?? ''}
												onChange={(e) =>
													setField('positions', {
														...fields.positions,
														[tp.id]: e.target.value,
													})
												}
												width='100%'
											/>
										</Field>
									))}
								</FieldGrid>
							)}
						</Section>
					)}

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							One snapshot per profile per day.
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => nav('/upwork/snapshots')}
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
										: 'Create snapshot'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default UpworkSnapshotForm
