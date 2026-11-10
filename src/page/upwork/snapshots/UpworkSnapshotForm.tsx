import { CSSProperties, FormEvent, useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import styled, { createGlobalStyle } from 'styled-components'
import {
	AddRounded,
	CameraAltOutlined,
	DeleteOutline,
	StarOutlineRounded,
	StarRounded,
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
	useCreateUpworkKeywordMutation,
	useCreateUpworkSnapshotMutation,
	useListUpworkKeywordsQuery,
	useGetUpworkSnapshotQuery,
	useListUpworkProfilesQuery,
	useUpdateUpworkKeywordMutation,
	useUpdateUpworkSnapshotMutation,
	type UpworkKeyword,
} from '../../../store/upwork/upworkApi'

interface Props {
	mode: 'create' | 'edit'
}

const todayIso = () => new Date().toISOString().slice(0, 10)
const normalize = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

interface PositionRow {
	keywordId: string
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

/* ─── Positions-section layout ──────────────────────────────────────
 * One grid for the whole list — not one grid per row. Keeps the
 * delete button column aligned, labels appear once at the top, and
 * mobile stacking is predictable. Explicit font-size on every cell:
 * the TextField and raw-text children otherwise inherit the page
 * default which reads as oversized next to the form's other labels. */
const PositionsBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`
/* Header row — static three columns matching the row grid so Phrase
 * and Position labels line up above their inputs. */
const PositionsHeaderRow = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px auto;
	column-gap: 10px;
	align-items: center;
	margin-bottom: 2px;

	@media (max-width: 640px) {
		grid-template-columns: minmax(0, 1fr) 90px auto;
	}
`
/* One grid row per position. A single DOM element per row is what
 * makes View Transitions work — each row carries its own
 * viewTransitionName so adding / removing / reordering animates
 * via the browser's root transition. */
const PositionRowGrid = styled.div`
	display: grid;
	grid-template-columns: minmax(0, 1fr) 110px auto;
	column-gap: 10px;
	align-items: center;

	@media (max-width: 640px) {
		grid-template-columns: minmax(0, 1fr) 90px auto;
	}
`
const PositionsHeader = styled.div`
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #64748b;
	opacity: 0.8;
`
const PhraseCell = styled.div`
	display: flex;
	align-items: center;
	gap: 6px;
	min-width: 0;
	font-size: 13.5px;
	line-height: 1.3;
	color: inherit;
	.text {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.archived {
		margin-left: 2px;
		font-size: 10.5px;
		color: #92400e;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}
`
const StarBtn = styled.button<{ $on: boolean }>`
	appearance: none;
	background: transparent;
	border: none;
	padding: 2px;
	cursor: pointer;
	display: inline-flex;
	color: ${({ $on }) => ($on ? '#eab308' : '#cbd5e1')};
	&:hover {
		color: ${({ $on }) => ($on ? '#ca8a04' : '#64748b')};
	}
	svg {
		font-size: 17px;
	}
`
const DeleteBtn = styled.button`
	appearance: none;
	background: transparent;
	border: 1px solid #e2e8f0;
	border-radius: 7px;
	/* Symmetric box: 28×28 with 16 px icon centered — padding was
	 * reading asymmetric before because grid cell was wider than the
	 * inline-flex button and the leftover strip looked like extra
	 * right-side padding. */
	width: 28px;
	height: 28px;
	padding: 0;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: #94a3b8;
	&:hover {
		background: #f8fafc;
		color: #64748b;
	}
	svg {
		font-size: 16px;
	}
`
/* Scope a smaller font-size to the Position input only inside the
 * Positions section — the TextField has no built-in font-size,
 * inheriting the page default (~16-18 px) that reads as oversized
 * next to the compact row layout. */
const CompactInputCell = styled.div`
	input {
		font-size: 13.5px;
		padding-top: 0.5rem;
		padding-bottom: 0.5rem;
	}
`
const Empty = styled.div`
	font-size: 12.5px;
	color: #a5a1b0;
	padding: 4px 0 2px;
`
const AddRow = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;
	margin-top: 14px;
	padding-top: 12px;
	border-top: 1px dashed #e2e8f0;
	flex-wrap: wrap;

	input,
	.select-button {
		font-size: 13.5px;
	}
`
/* Scoped font override for the Select's dropdown items. The portal
 * list is rendered to document.body, so styles on AddRow can't reach
 * it directly — this styled wrapper mounts a tiny GlobalStyle sibling
 * that applies only while the form is on screen. Narrow enough to
 * survive: it targets the generic .select-portal selector shipped by
 * the UI kit, but does nothing besides font-size + padding on the
 * option items. */
const AddSelectCell = styled.div`
	width: 220px;
`
const CompactSelectDropdownStyle = createGlobalStyle`
  .select-portal .select-option-item {
    font-size: 13.5px;
    padding: 6px 12px;
  }
`
/* Starts at placeholder width, grows with the typed text up to the
 * 480 px cap. field-sizing: content is the native hook — Chromium
 * sizes the input to its current value, falling back to the
 * placeholder when empty. Two gotchas:
 *   - the wrapper has to drop its min-width so the inner input's
 *     intrinsic size can win;
 *   - the base TextField input carries `width: 100%` from the UI
 *     kit, which overrides field-sizing — override back to auto.
 * Height is pinned to 46 px so the input matches the Select next to
 * it (Select with sizes='small' → 46 px); otherwise the UI-kit's
 * default input padding renders ~56 px tall and the row reads lumpy. */
const NewPhraseInput = styled(TextField)`
	flex: 0 0 auto;
	min-width: 0;
	max-width: 100%;

	input {
		/* Static width ~2.5× the previous min, enough for the usual
		 * 25-35-character phrase without ever needing to grow.
		 * Height matches the Select next to it (sizes='small' → 46 px).
		 * !important: the UI-kit's own Input rule (padding: 1rem …)
		 * otherwise beats on specificity-tie and renders ~56 px tall. */
		height: 46px !important;
		padding: 0 14px !important;
		box-sizing: border-box !important;
	}
`

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
	const [submitError, setSubmitError] = useState<string | null>(null)
	/* Keeps the last error text mounted while the box fades out — if
	 * we yanked `submitError` from the DOM on clear, the exit
	 * animation would have nothing to interpolate against. */
	const [displayError, setDisplayError] = useState<string | null>(null)
	useEffect(() => {
		if (submitError) setDisplayError(submitError)
		else {
			const t = setTimeout(() => setDisplayError(null), 220)
			return () => clearTimeout(t)
		}
	}, [submitError])

	/* Submit-button hold state — bound to isLoading further down. */
	const [buttonLocked, setButtonLocked] = useState(false)
	const [loadedExisting, setLoadedExisting] = useState(false)
	const [notFound, setNotFound] = useState(false)
	const [prefillAppliedFor, setPrefillAppliedFor] = useState<string | null>(null)
	const [newKwText, setNewKwText] = useState('')
	const [kwError, setKwError] = useState<string | null>(null)

	/* Pre-select profile from ?profile= (coming from the list page)
	 * or default to the first active profile. Only on create. */
	useEffect(() => {
		if (!isEdit && !fields.profileId) {
			const p = sp.get('profile') ?? activeProfiles[0]?.id ?? ''
			if (p) setFields((prev) => ({ ...prev, profileId: p }))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeProfiles])

	/* Edit mode: fetch the exact snapshot by id. Unblocks the flow
	 * when the URL is `/upwork/snapshots/:id/edit` with no profile
	 * hint (we'd otherwise be stuck in a chicken-and-egg with the
	 * list query that requires profileId). */
	const {
		data: editSnapshot,
		isLoading: editLoading,
		isError: editError,
	} = useGetUpworkSnapshotQuery(id!, { skip: !isEdit || !id })

	/* All keywords on the selected profile — the picker source.
	 * Archived ones stay in the list so historical snapshots still
	 * resolve, but are filtered out of the "available for a new row"
	 * dropdown below. */
	const { data: keywords = [] } = useListUpworkKeywordsQuery(fields.profileId, {
		skip: !fields.profileId,
	})
	const keywordById = useMemo(
		() => new Map(keywords.map((k) => [k.id, k])),
		[keywords],
	)

	const [createKeyword, { isLoading: creatingKw }] = useCreateUpworkKeywordMutation()
	const [updateKeyword] = useUpdateUpworkKeywordMutation()

	/* Edit mode: once the by-id fetch resolves, populate the form
	 * with its data — including profileId, which then unlocks the
	 * keywords query. The server returns 404 → RTK sets isError →
	 * flip notFound so the view shows the NotFound card. */
	useEffect(() => {
		if (!isEdit || loadedExisting || notFound) return
		if (editError) {
			setNotFound(true)
			return
		}
		if (editSnapshot) {
			setFields({
				profileId: editSnapshot.profileId,
				date: editSnapshot.date.slice(0, 10),
				views: String(editSnapshot.views),
				invites: String(editSnapshot.invites),
				directMessages: String(editSnapshot.directMessages),
				positions: editSnapshot.positions.map((p) => ({
					keywordId: p.keyword.id,
					position: String(p.position),
				})),
			})
			setLoadedExisting(true)
		}
	}, [isEdit, editSnapshot, editError, loadedExisting, notFound])

	/* Create mode: when the user picks a profile, pre-fill the
	 * positions block with every active keyword (positions empty —
	 * owner types the new rank). This surfaces the whole catalogue
	 * so nothing silently falls off because it was forgotten in the
	 * last snapshot. */
	useEffect(() => {
		if (isEdit || !fields.profileId) return
		if (prefillAppliedFor === fields.profileId) return
		if (keywords.length === 0) {
			setPrefillAppliedFor(fields.profileId)
			return
		}
		setFields((prev) => ({
			...prev,
			positions:
				prev.positions.length > 0
					? prev.positions
					: keywords
							.filter((k) => k.isActive)
							.map((k) => ({ keywordId: k.id, position: '0' })),
		}))
		setPrefillAppliedFor(fields.profileId)
	}, [isEdit, fields.profileId, keywords, prefillAppliedFor])

	const [create, { isLoading: creating }] = useCreateUpworkSnapshotMutation()
	const [update, { isLoading: updating }] = useUpdateUpworkSnapshotMutation()
	const isLoading = creating || updating

	/* Keep the button locked for ~280 ms after isLoading flips back
	 * to false — on a fast local response the disabled → enabled
	 * transition would otherwise snap too quickly to read as
	 * animated. Fits with the opacity transition on the button. */
	useEffect(() => {
		if (isLoading) {
			setButtonLocked(true)
			return
		}
		const t = setTimeout(() => setButtonLocked(false), 280)
		return () => clearTimeout(t)
	}, [isLoading])

	const setField = <K extends keyof FormState>(k: K, v: FormState[K]) =>
		setFields((p) => ({ ...p, [k]: v }))

	/* Wrap list-mutating state updates so the browser's root
	 * view-transition plays a crossfade + reflow animation on the
	 * Positions grid. Each row carries its own viewTransitionName,
	 * so Chromium interpolates its position in/out instead of
	 * snapping. Other browsers fall back to an instant update. */
	const withViewTransition = (fn: () => void) => {
		type DocWithVT = Document & {
			startViewTransition?: (cb: () => void) => void
		}
		const d = document as DocWithVT
		if (typeof d.startViewTransition === 'function') {
			d.startViewTransition(() => flushSync(fn))
		} else {
			fn()
		}
	}

	const setPositionAt = (i: number, patch: Partial<PositionRow>) =>
		setFields((p) => ({
			...p,
			positions: p.positions.map((row, idx) =>
				idx === i ? { ...row, ...patch } : row,
			),
		}))

	const removePositionRow = (i: number) =>
		withViewTransition(() =>
			setFields((p) => ({
				...p,
				positions: p.positions.filter((_, idx) => idx !== i),
			})),
		)

	const usedKeywordIds = useMemo(
		() => new Set(fields.positions.map((r) => r.keywordId).filter(Boolean)),
		[fields.positions],
	)
	const availableKeywords = useMemo(
		() => keywords.filter((k) => k.isActive && !usedKeywordIds.has(k.id)),
		[keywords, usedKeywordIds],
	)

	const addExistingKeyword = (keywordId: string) => {
		if (!keywordId) return
		withViewTransition(() =>
			setFields((p) => ({
				...p,
				positions: [...p.positions, { keywordId, position: '0' }],
			})),
		)
	}

	const addNewKeyword = async () => {
		const text = normalize(newKwText)
		if (!text) {
			setKwError('phrase is empty')
			return
		}
		if (!fields.profileId) {
			setKwError('pick a profile first')
			return
		}
		const existing = keywords.find((k) => k.text === text)
		if (existing) {
			if (!existing.isActive) {
				await updateKeyword({
					id: existing.id,
					profileId: fields.profileId,
					patch: { isActive: true },
				}).unwrap()
			}
			addExistingKeyword(existing.id)
			setNewKwText('')
			setKwError(null)
			return
		}
		try {
			const kw = await createKeyword({
				profileId: fields.profileId,
				text,
			}).unwrap()
			addExistingKeyword(kw.id)
			setNewKwText('')
			setKwError(null)
		} catch (err: unknown) {
			const data = (err as { data?: { message?: string } }).data
			setKwError(data?.message ?? 'failed to create keyword')
		}
	}

	const togglePrimary = async (kw: UpworkKeyword) => {
		await updateKeyword({
			id: kw.id,
			profileId: fields.profileId,
			patch: { isPrimary: !kw.isPrimary },
		}).unwrap()
	}

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

		/* Rows with empty position are skipped per spec. Dedupe
		 * keywordIds client-side so the UI feedback matches server. */
		const seen = new Set<string>()
		const positions = fields.positions
			.map((r) => ({
				keywordId: r.keywordId,
				position: Number(r.position),
			}))
			.filter(
				(r) =>
					r.keywordId &&
					Number.isFinite(r.position) &&
					r.position > 0 &&
					!seen.has(r.keywordId) &&
					(seen.add(r.keywordId), true),
			)

		const payload = {
			date: fields.date,
			views: Number(fields.views) || 0,
			invites: Number(fields.invites) || 0,
			directMessages: Number(fields.directMessages) || 0,
			positions,
		}
		setSubmitError(null)
		try {
			if (isEdit && id) {
				await update({ id, patch: payload }).unwrap()
				nav(`/upwork/snapshots/${id}`)
			} else {
				const created = await create({
					profileId: fields.profileId,
					...payload,
				}).unwrap()
				nav(`/upwork/snapshots/${created.id}`)
			}
		} catch (err: unknown) {
			type MaybeErr = {
				status?: number
				data?: { message?: string | string[] }
			}
			const e = err as MaybeErr
			const raw = Array.isArray(e.data?.message)
				? e.data.message.join('; ')
				: e.data?.message ?? ''
			if (e.status === 409) {
				setSubmitError('Snapshot already exists for this date.')
			} else if (raw) {
				setSubmitError(raw)
			} else {
				setSubmitError(
					'Something went wrong saving the snapshot. Try again.',
				)
			}
			return
		}
	}

	const selectedProfile =
		profiles.find((p) => p.id === fields.profileId) ?? null
	const isSecondary = selectedProfile?.tier === 'secondary'

	if (isEdit && !loadedExisting && !notFound && editLoading) {
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

					{fields.profileId && (
						<Section $delay={240}>
							<SectionHead
								num='03'
								title='Positions'
								hint='Pick from the profile keywords, or type a new phrase and hit Add. Star marks the primary.'
							/>

							{fields.positions.length === 0 ? (
								<Empty>
									No rows yet — add an existing keyword below, or create a new
									one.
								</Empty>
							) : (
								<PositionsBlock>
									<PositionsHeaderRow>
										<PositionsHeader>Phrase</PositionsHeader>
										<PositionsHeader>Position</PositionsHeader>
										<span />
									</PositionsHeaderRow>
									{fields.positions.map((row, i) => {
										const kw = keywordById.get(row.keywordId)
										const vtName = `pos-row-${row.keywordId || `new-${i}`}`
										return (
											<PositionRowGrid
												key={row.keywordId || `new-${i}`}
												style={
													{ viewTransitionName: vtName } as CSSProperties
												}
											>
												<PhraseCell>
													<span className='text'>
														{kw ? (
															kw.text
														) : (
															<em style={{ color: '#ef4444' }}>
																unknown keyword
															</em>
														)}
													</span>
													{kw && !kw.isActive && (
														<span className='archived'>archived</span>
													)}
													{kw && (
														<StarBtn
															type='button'
															$on={kw.isPrimary}
															title={
																kw.isPrimary
																	? 'Primary keyword'
																	: 'Mark as primary'
															}
															onClick={() => togglePrimary(kw)}
														>
															{kw.isPrimary ? (
																<StarRounded fontSize='small' />
															) : (
																<StarOutlineRounded fontSize='small' />
															)}
														</StarBtn>
													)}
												</PhraseCell>
												<CompactInputCell>
													<TextField
														name={`pos-${i}`}
														type='number'
														minValue={0}
														value={row.position}
														onChange={(e) => {
															const v = e.target.value
															/* Allow 0 (default — treated as "skip on
															 * save") and any positive integer; block
															 * negatives. */
															if (v !== '' && Number(v) < 0) return
															setPositionAt(i, { position: v })
														}}
														width='100%'
														placeholder='0'
													/>
												</CompactInputCell>
												<DeleteBtn
													type='button'
													onClick={() => removePositionRow(i)}
													title='Remove row'
												>
													<DeleteOutline fontSize='small' />
												</DeleteBtn>
											</PositionRowGrid>
										)
									})}
								</PositionsBlock>
							)}

							<AddRow>
								<CompactSelectDropdownStyle />
								{availableKeywords.length > 0 && (
									<AddSelectCell>
										<Select
											label=''
											value=''
											placeholder='+ add existing'
											sizes='small'
											onChange={(v) => addExistingKeyword(String(v ?? ''))}
											width='100%'
										>
											{availableKeywords.map((k) => (
												<SelectItem
													key={k.id}
													label={k.isPrimary ? `★ ${k.text}` : k.text}
													value={k.id}
												/>
											))}
										</Select>
									</AddSelectCell>
								)}
								<NewPhraseInput
									name='new-kw'
									value={newKwText}
									onChange={(e) => {
										setNewKwText(e.target.value)
										setKwError(null)
									}}
									onKeyDown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault()
											void addNewKeyword()
										}
									}}
									placeholder='full stack developer sass'
									style={{
										height: 46,
										boxSizing: 'border-box',
										paddingTop: 0,
										paddingBottom: 0,
										paddingLeft: 14,
										paddingRight: 14,
										/* Width = sample phrase ("full stack developer SASS",
										 * ~25 chars) + 20 % buffer ≈ 30ch, plus 28 px of
										 * horizontal padding. */
										width: 'calc(30ch + 28px)',
										maxWidth: '100%',
									}}
								/>
								<PrimaryGhostButton
									type='button'
									onClick={() => void addNewKeyword()}
									disabled={creatingKw || !newKwText.trim()}
								>
									<AddRounded fontSize='small' />
									Add phrase
								</PrimaryGhostButton>
							</AddRow>
							{kwError && (
								<div style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>
									{kwError}
								</div>
							)}
						</Section>
					)}

					<div style={{ position: 'relative', paddingTop: 40 }}>
						{/* Error floats above the FootBar in a 40 px reserved gap —
						 * the paddingTop on this wrapper keeps the error well below
						 * whatever block ends above (AddRow / Positions / whatever)
						 * so it never visually overlaps with a border or dashed
						 * divider. Absolute positioning means no layout shift on
						 * fade in / out. */}
						<div
							style={{
								position: 'absolute',
								top: 12,
								left: 32,
								right: 32,
								color: '#dc2626',
								fontSize: 13,
								lineHeight: 1.4,
								opacity: submitError ? 1 : 0,
								transition: 'opacity 200ms ease',
								pointerEvents: submitError ? 'auto' : 'none',
							}}
							role={submitError ? 'alert' : undefined}
							aria-hidden={!submitError}
						>
							{displayError}
						</div>
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
							<PrimarySolidButton
								type='submit'
								disabled={buttonLocked}
								/* - minWidth 170: just enough for "Create snapshot" at
								 *   14 px/600 weight with the base 18 px side padding —
								 *   no wide empty gutters inside the button.
								 * - Only opacity is transitioned (300 ms) so the
								 *   disabled → enabled crossfade reads smoothly, no
								 *   strobe on a fast response. transform: none pins
								 *   the button at translateY(0) so the hover lift
								 *   can't jiggle it vertically when the disabled flip
								 *   races with mouse state. */
								style={{
									minWidth: 170,
									transform: 'none',
									transition: 'opacity 300ms ease',
									whiteSpace: 'nowrap',
									flexShrink: 0,
								}}
							>
								{isEdit ? 'Save changes' : 'Create snapshot'}
							</PrimarySolidButton>
						</FootActions>
					</FootBar>
					</div>
				</form>
			</Surface>
		</Shell>
	)
}

export default UpworkSnapshotForm
