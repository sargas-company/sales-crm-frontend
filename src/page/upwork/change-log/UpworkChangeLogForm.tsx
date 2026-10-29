import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
	Autocomplete,
	Button,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	TextField,
} from '@mui/material'

import {
	UPWORK_CHANGELOG_SECTIONS,
	useCreateUpworkChangeLogMutation,
	useGetUpworkChangeLogQuery,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
	useUpdateUpworkChangeLogMutation,
	type UpworkChangeLogSection,
} from '../../../store/upwork/upworkApi'

const PageWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
`
const Title = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: #0f172a;
	margin: 0;
`
const Grid2 = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 16px;
	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`
const Footer = styled.div`
	display: flex;
	gap: 12px;
	justify-content: flex-end;
`

interface Props {
	mode: 'create' | 'edit'
}

const todayIso = () => new Date().toISOString().slice(0, 10)

const UpworkChangeLogForm = ({ mode }: Props) => {
	const nav = useNavigate()
	const { id } = useParams<{ id: string }>()

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const { data: existing } = useGetUpworkChangeLogQuery(id ?? '', {
		skip: mode !== 'edit' || !id,
	})
	const [create] = useCreateUpworkChangeLogMutation()
	const [update] = useUpdateUpworkChangeLogMutation()

	const [date, setDate] = useState(todayIso())
	const [profileId, setProfileId] = useState('')
	const [section, setSection] = useState<UpworkChangeLogSection>('title')
	const [item, setItem] = useState('')
	const [summary, setSummary] = useState('')
	const [reason, setReason] = useState('')
	const [before, setBefore] = useState('')
	const [after, setAfter] = useState('')
	const [referenceIds, setReferenceIds] = useState<string[]>([])

	useEffect(() => {
		if (mode === 'edit' && existing) {
			setDate(existing.date.slice(0, 10))
			setProfileId(existing.profileId)
			setSection(existing.section)
			setItem(existing.item ?? '')
			setSummary(existing.summary)
			setReason(existing.reason ?? '')
			setBefore(existing.before)
			setAfter(existing.after)
			setReferenceIds(existing.references.map((r) => r.referenceData.id))
		}
	}, [mode, existing])

	const { data: refOptions = [] } = useListUpworkReferencesQuery(
		{ profileId: profileId || undefined, active: true },
		{ skip: !profileId },
	)
	const refById = useMemo(() => {
		const m = new Map<string, (typeof refOptions)[number]>()
		for (const r of refOptions) m.set(r.id, r)
		return m
	}, [refOptions])

	const submit = async () => {
		if (!profileId || !summary.trim() || !before || !after) return
		const payload = {
			date,
			profileId,
			section,
			item: item.trim() || undefined,
			summary: summary.trim(),
			reason: reason.trim() || undefined,
			before,
			after,
			referenceIds,
		}
		if (mode === 'create') {
			const created = await create(payload).unwrap()
			nav(`/upwork/change-log/${created.id}`)
		} else if (id) {
			await update({ id, patch: payload }).unwrap()
			nav(`/upwork/change-log/${id}`)
		}
	}

	return (
		<PageWrap>
			<Title>{mode === 'create' ? 'New change-log entry' : 'Edit entry'}</Title>

			<Grid2>
				<TextField
					label='Date'
					type='date'
					value={date}
					onChange={(e) => setDate(e.target.value)}
					slotProps={{ inputLabel: { shrink: true } }}
				/>
				<FormControl>
					<InputLabel>Profile</InputLabel>
					<Select
						label='Profile'
						value={profileId}
						onChange={(e) => setProfileId(e.target.value)}
					>
						{profiles.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl>
					<InputLabel>Section</InputLabel>
					<Select
						label='Section'
						value={section}
						onChange={(e) => setSection(e.target.value as UpworkChangeLogSection)}
					>
						{UPWORK_CHANGELOG_SECTIONS.map((s) => (
							<MenuItem key={s} value={s}>
								{s}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<TextField
					label='Item (optional)'
					value={item}
					onChange={(e) => setItem(e.target.value)}
				/>
			</Grid2>

			<TextField
				label='Summary'
				value={summary}
				onChange={(e) => setSummary(e.target.value)}
				required
			/>
			<TextField
				label='Reason (optional)'
				value={reason}
				onChange={(e) => setReason(e.target.value)}
				multiline
				rows={2}
			/>

			<Grid2>
				<TextField
					label='Before'
					value={before}
					onChange={(e) => setBefore(e.target.value)}
					multiline
					minRows={8}
				/>
				<TextField
					label='After'
					value={after}
					onChange={(e) => setAfter(e.target.value)}
					multiline
					minRows={8}
				/>
			</Grid2>

			<Autocomplete
				multiple
				disabled={!profileId}
				options={refOptions.map((r) => r.id)}
				value={referenceIds}
				onChange={(_, v) => setReferenceIds(v)}
				getOptionLabel={(id) => {
					const r = refById.get(id)
					return r ? `${r.category}: ${r.value}` : id
				}}
				renderInput={(params) => (
					<TextField
						{...params}
						label={
							profileId
								? 'Reference entries used'
								: 'Pick a profile first to attach references'
						}
					/>
				)}
			/>

			<Footer>
				<Button onClick={() => nav(-1)}>Cancel</Button>
				<Button variant='contained' onClick={submit}>
					{mode === 'create' ? 'Create' : 'Save'}
				</Button>
			</Footer>
		</PageWrap>
	)
}

export default UpworkChangeLogForm
