import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
	AddRounded,
	CameraAltOutlined,
	DeleteOutline,
} from '@mui/icons-material'

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
	useListUpworkSnapshotsQuery,
	useUpdateUpworkSnapshotMutation,
} from '../../../store/upwork/upworkApi'

interface Props {
	mode: 'create' | 'edit'
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

interface PositionRow {
	phrase: string
	position: string // empty string = "skip on save"
}

interface FormState {
	profileId: string
	date: string
	views: string
	invites: string
	directMessages: string
	positions: PositionRow[]
}

const empty = (): FormState => ({
	profileId: '',
	date: todayIso(),
	views: '0',
	invites: '0',
	directMessages: '0',
	positions: [],
})

const UpworkSnapshotForm = ({ mode }: Props) => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()
	const [sp] = useSearchParams()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const isEdit = mode === 'edit'

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = useMemo(
		() => profiles.filter((p) => p.active),
		[profiles],
	)

	const [fields, setFields] = useState<FormState>(empty)
	const [errors, setErrors] = useState<{ profileId?: string; date?: string }>({})
	const [loadedExisting, setLoadedExisting] = useState(false)
	const [notFound, setNotFound] = useState(false)
	const [prefillAppliedFor, setPrefillAppliedFor] = useState<string | null>(null)

	/* Pre-select profile from ?profile= (coming from the list page)
	 * or default to the first active profile. Only on create. */
	useEffect(() => {
		if (!isEdit && !fields.profileId) {
			const p = sp.get('profile') ?? activeProfiles[0]?.id ?? ''
			if (p) setFields((prev) => ({ ...prev, profileId: p }))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeProfiles])

	/* Snapshots for the selected profile — used both to find the
	 * record being edited and to pre-fill phrase rows on create. */
	const { data: profileSnapshots = [], isLoading: snapshotsLoading } =
		useListUpworkSnapshotsQuery(
			{ profileId: fields.profileId },
			{ skip: !fields.profileId },
		)

	/* Edit mode: find the snapshot being edited in the loaded list. */
	useEffect(() => {
		if (!isEdit || !id || loadedExisting || notFound || snapshotsLoading) return
		if (!fields.profileId) return
		const found = profileSnapshots.find((s) => s.id === id)
		if (found) {
			setFields({
				profileId: found.profileId,
				date: found.date.slice(0, 10),
				views: String(found.views),
				invites: String(found.invites),
				directMessages: String(found.directMessages),
				positions: found.positions.map((p) => ({
					phrase: p.phrase,
					position: String(p.position),
				})),
			})
			setLoadedExisting(true)
			return
		}
		if (profileSnapshots.length > 0) setNotFound(true)
	}, [
		isEdit,
		id,
		fields.profileId,
		profileSnapshots,
		snapshotsLoading,
		loadedExisting,
		notFound,
	])

	/* Create mode: when the user picks a profile, pre-fill the
	 * positions block with phrases from that profile's latest
	 * snapshot (positions empty — owner types the new rank). */
	useEffect(() => {
		if (isEdit || !fields.profileId || snapshotsLoading) return
		if (prefillAppliedFor === fields.profileId) return
		const latest = profileSnapshots[0] // backend orders desc
		if (!latest) {
			setPrefillAppliedFor(fields.profileId)
			return
		}
		setFields((prev) => ({
			...prev,
			positions:
				prev.positions.length > 0
					? prev.positions
					: latest.positions.map((p) => ({ phrase: p.phrase, position: '' })),
		}))
		setPrefillAppliedFor(fields.profileId)
	}, [
		isEdit,
		fields.profileId,
		profileSnapshots,
		snapshotsLoading,
		prefillAppliedFor,
	])

	const [create, { isLoading: creating }] = useCreateUpworkSnapshotMutation()
	const [update, { isLoading: updating }] = useUpdateUpworkSnapshotMutation()
	const isLoading = creating || updating

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	const setPositionAt = (i: number, patch: Partial<PositionRow>) =>
		setFields((p) => ({
			...p,
			positions: p.positions.map((row, idx) =>
				idx === i ? { ...row, ...patch } : row,
			),
		}))
	const addPositionRow = () =>
		setFields((p) => ({
			...p,
			positions: [...p.positions, { phrase: '', position: '' }],
		}))
	const removePositionRow = (i: number) =>
		setFields((p) => ({
			...p,
			positions: p.positions.filter((_, idx) => idx !== i),
		}))

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

		/* Rows with empty position are skipped per spec. Normalize +
		 * dedupe client-side so the UI feedback matches the server. */
		const seen = new Set<string>()
		const positions = fields.positions
			.map((r) => ({
				phrase: normalize(r.phrase),
				position: Number(r.position),
			}))
			.filter(
				(r) =>
					r.phrase &&
					Number.isFinite(r.position) &&
					r.position > 0 &&
					!seen.has(r.phrase) &&
					(seen.add(r.phrase), true),
			)

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
			await create({ profileId: fields.profileId, ...payload }).unwrap()
			nav('/upwork/snapshots')
		}
	}

	const selectedProfile =
		profiles.find((p) => p.id === fields.profileId) ?? null
	const isSecondary = selectedProfile?.tier === 'secondary'

	if (isEdit && !loadedExisting && !notFound && snapshotsLoading) {
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
							? isSecondary
								? 'Update monthly totals.'
								: 'Update daily metrics.'
							: isSecondary
								? 'Monthly totals: views + invites + DMs for the past 30 days.'
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
										<SelectItem
											key={p.id}
											label={upworkProfileName(p)}
											value={p.id}
										/>
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
							title={isSecondary ? 'Monthly totals' : 'Daily metrics'}
							hint={
								isSecondary
									? 'Totals for the past ~30 days. One snapshot per month is the norm.'
									: 'Views and invites grow each day; direct messages are per-day too.'
							}
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

					{fields.profileId && !isSecondary && (
						<Section $delay={240}>
							<SectionHead
								num='03'
								title='Positions'
								hint='Phrases pre-filled from your last snapshot. Rows with an empty position are not saved.'
							/>
							{fields.positions.length === 0 && (
								<div style={{ fontSize: 13, color: '#a5a1b0', padding: '12px 0' }}>
									No phrases yet — click “Add phrase” to start tracking a title.
								</div>
							)}
							{fields.positions.map((row, i) => (
								<FieldGrid key={i}>
									<Field label={i === 0 ? 'Phrase' : ''} span='two-thirds'>
										<TextField
											name={`phrase-${i}`}
											value={row.phrase}
											onChange={(e) => setPositionAt(i, { phrase: e.target.value })}
											width='100%'
											placeholder='e.g. senior react developer'
										/>
									</Field>
									<Field label={i === 0 ? 'Position' : ''} span='third'>
										<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
											<TextField
												name={`pos-${i}`}
												type='number'
												value={row.position}
												onChange={(e) =>
													setPositionAt(i, { position: e.target.value })
												}
												width='100%'
												placeholder='empty = skip'
											/>
											<button
												type='button'
												onClick={() => removePositionRow(i)}
												title='Remove row'
												style={{
													appearance: 'none',
													border: '1px solid #e2e8f0',
													background: '#fff',
													borderRadius: 8,
													padding: 6,
													cursor: 'pointer',
													display: 'inline-flex',
													color: '#64748b',
												}}
											>
												<DeleteOutline fontSize='small' />
											</button>
										</div>
									</Field>
								</FieldGrid>
							))}
							<div style={{ marginTop: 10 }}>
								<PrimaryGhostButton type='button' onClick={addPositionRow}>
									<AddRounded fontSize='small' />
									Add phrase
								</PrimaryGhostButton>
							</div>
						</Section>
					)}

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isSecondary
								? 'One snapshot per profile per month.'
								: 'One snapshot per profile per day. Empty-position rows are skipped.'}
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
