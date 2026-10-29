import { useMemo, useState } from 'react'
import styled from 'styled-components'
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ReferenceLine,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts'

import {
	useCreateUpworkSnapshotMutation,
	useDeleteUpworkSnapshotMutation,
	useGetUpworkAnalyticsQuery,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
	useListUpworkSnapshotsQuery,
	useUpdateUpworkSnapshotMutation,
	type UpworkSnapshot,
} from '../../../store/upwork/upworkApi'

const PageWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 24px;
`
const Header = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	flex-wrap: wrap;
	gap: 12px;
`
const Title = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: #0f172a;
	margin: 0;
`
const Filters = styled.div`
	display: flex;
	gap: 12px;
	flex-wrap: wrap;
`
const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 10px;
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	padding: 18px 20px;
`
const SectionTitle = styled.h2`
	font-size: 15px;
	font-weight: 700;
	color: #334155;
	margin: 0;
	letter-spacing: -0.1px;
`
const VpiCard = styled.div<{ $warn: boolean }>`
	display: flex;
	align-items: baseline;
	gap: 14px;
	padding: 16px 20px;
	border-radius: 12px;
	border: 1px solid ${(p) => (p.$warn ? '#fecaca' : '#e2e8f0')};
	background: ${(p) => (p.$warn ? '#fef2f2' : '#f8fafc')};
`
const BigNumber = styled.div<{ $warn: boolean }>`
	font-size: 36px;
	font-weight: 800;
	color: ${(p) => (p.$warn ? '#b91c1c' : '#0f172a')};
	line-height: 1;
`
const VpiLabel = styled.div`
	color: #64748b;
	font-size: 13px;
	line-height: 1.4;
`

const todayIso = () => new Date().toISOString().slice(0, 10)
const CHART_COLORS = [
	'#6366f1',
	'#14b8a6',
	'#f97316',
	'#e11d48',
	'#a855f7',
	'#0ea5e9',
	'#eab308',
	'#059669',
]

interface SnapshotFormState {
	id?: string
	date: string
	views: number
	invites: number
	directMessages: number
	positions: Record<string, number>
}

const emptyForm = (): SnapshotFormState => ({
	date: todayIso(),
	views: 0,
	invites: 0,
	directMessages: 0,
	positions: {},
})

const UpworkAnalyticsPage = () => {
	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = profiles.filter((p) => p.active)
	const [profileId, setProfileId] = useState<string>('')
	const [from, setFrom] = useState<string>('')
	const [to, setTo] = useState<string>('')

	const { data: analytics } = useGetUpworkAnalyticsQuery(
		{ profileId, from: from || undefined, to: to || undefined },
		{ skip: !profileId },
	)
	const { data: snapshots = [] } = useListUpworkSnapshotsQuery(
		{ profileId, from: from || undefined, to: to || undefined },
		{ skip: !profileId },
	)
	const { data: titlePhrases = [] } = useListUpworkReferencesQuery(
		{ profileId, category: 'title_phrase', active: true },
		{ skip: !profileId },
	)
	const [createSnap] = useCreateUpworkSnapshotMutation()
	const [updateSnap] = useUpdateUpworkSnapshotMutation()
	const [deleteSnap] = useDeleteUpworkSnapshotMutation()

	const [open, setOpen] = useState(false)
	const [form, setForm] = useState<SnapshotFormState>(emptyForm())

	const openCreate = () => {
		setForm(emptyForm())
		setOpen(true)
	}
	const openEdit = (s: UpworkSnapshot) => {
		setForm({
			id: s.id,
			date: s.date.slice(0, 10),
			views: s.views,
			invites: s.invites,
			directMessages: s.directMessages,
			positions: Object.fromEntries(
				s.positions.map((p) => [p.referenceDataId, p.position]),
			),
		})
		setOpen(true)
	}

	const saveSnapshot = async () => {
		const positions = Object.entries(form.positions)
			.filter(([, v]) => v > 0)
			.map(([referenceDataId, position]) => ({ referenceDataId, position }))
		if (form.id) {
			await updateSnap({
				id: form.id,
				patch: {
					date: form.date,
					views: form.views,
					invites: form.invites,
					directMessages: form.directMessages,
					positions,
				},
			}).unwrap()
		} else {
			await createSnap({
				profileId,
				date: form.date,
				views: form.views,
				invites: form.invites,
				directMessages: form.directMessages,
				positions,
			}).unwrap()
		}
		setOpen(false)
	}

	const delSnap = async (id: string) => {
		if (!confirm('Delete this snapshot?')) return
		await deleteSnap(id).unwrap()
	}

	/* Position chart data — one row per week, one column per
	 * title_phrase (keyed by its label). */
	const positionsData = useMemo(() => {
		if (!analytics) return []
		return analytics.positionsWeekly.map((w) => {
			const row: Record<string, string | number> = { weekStart: w.weekStart }
			for (const tp of analytics.titlePhrases) {
				const v = w.byReferenceId[tp.id]
				if (v !== undefined) row[tp.value] = v
			}
			return row
		})
	}, [analytics])

	const vpi = analytics?.viewsPerInvite4w

	return (
		<PageWrap>
			<Header>
				<Title>Upwork analytics</Title>
				<Button
					variant='contained'
					startIcon={<Add />}
					onClick={openCreate}
					disabled={!profileId}
				>
					Add snapshot
				</Button>
			</Header>

			<Filters>
				<FormControl size='small' sx={{ minWidth: 240 }}>
					<InputLabel>Profile</InputLabel>
					<Select
						label='Profile'
						value={profileId}
						onChange={(e) => setProfileId(e.target.value)}
					>
						{activeProfiles.length === 0 && (
							<MenuItem disabled value=''>
								No active profiles
							</MenuItem>
						)}
						{activeProfiles.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<TextField
					label='From'
					type='date'
					size='small'
					value={from}
					onChange={(e) => setFrom(e.target.value)}
					slotProps={{ inputLabel: { shrink: true } }}
				/>
				<TextField
					label='To'
					type='date'
					size='small'
					value={to}
					onChange={(e) => setTo(e.target.value)}
					slotProps={{ inputLabel: { shrink: true } }}
				/>
			</Filters>

			{!profileId && (
				<Section>
					<SectionTitle>Pick a profile to see analytics</SectionTitle>
				</Section>
			)}

			{profileId && vpi && (
				<VpiCard $warn={vpi.warn}>
					<BigNumber $warn={vpi.warn}>
						{vpi.value === null ? '—' : vpi.value.toFixed(1)}
					</BigNumber>
					<VpiLabel>
						views per invite · last 4 weeks ({vpi.views} views /{' '}
						{vpi.invites} invites) · threshold {vpi.threshold}
						{vpi.warn ? ' · above threshold' : ''}
					</VpiLabel>
				</VpiCard>
			)}

			{profileId && analytics && (
				<>
					<Section>
						<SectionTitle>Views and invites (weekly)</SectionTitle>
						<div style={{ width: '100%', height: 320 }}>
							<ResponsiveContainer>
								<LineChart data={analytics.weekly}>
									<CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
									<XAxis dataKey='weekStart' />
									<YAxis />
									<Tooltip />
									<Legend />
									<Line
										type='monotone'
										dataKey='views'
										stroke='#6366f1'
										strokeWidth={2}
										dot={false}
									/>
									<Line
										type='monotone'
										dataKey='invites'
										stroke='#f97316'
										strokeWidth={2}
										dot={false}
									/>
									{analytics.changeLogMarkers.map((m, i) => (
										<ReferenceLine
											key={`${m.date}-${i}`}
											x={weekStartOf(m.date)}
											stroke='#64748b'
											strokeDasharray='4 4'
											label={{
												value: `${m.section}: ${m.summary.slice(0, 24)}`,
												angle: -90,
												position: 'insideTopLeft',
												fontSize: 10,
												fill: '#64748b',
											}}
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</div>
					</Section>

					<Section>
						<SectionTitle>Positions per title phrase (weekly, lower is better)</SectionTitle>
						<div style={{ width: '100%', height: 320 }}>
							<ResponsiveContainer>
								<LineChart data={positionsData}>
									<CartesianGrid strokeDasharray='3 3' stroke='#e2e8f0' />
									<XAxis dataKey='weekStart' />
									<YAxis reversed allowDecimals={false} />
									<Tooltip />
									<Legend />
									{analytics.titlePhrases.map((tp, i) => (
										<Line
											key={tp.id}
											type='monotone'
											dataKey={tp.value}
											stroke={CHART_COLORS[i % CHART_COLORS.length]}
											strokeWidth={2}
											dot={false}
											connectNulls
										/>
									))}
								</LineChart>
							</ResponsiveContainer>
						</div>
					</Section>
				</>
			)}

			{profileId && (
				<Section>
					<SectionTitle>Snapshots</SectionTitle>
					<Table size='small'>
						<TableHead>
							<TableRow>
								<TableCell>Date</TableCell>
								<TableCell>Views</TableCell>
								<TableCell>Invites</TableCell>
								<TableCell>Direct msgs</TableCell>
								<TableCell>Positions</TableCell>
								<TableCell align='right'>Actions</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{snapshots.length === 0 && (
								<TableRow>
									<TableCell colSpan={6}>No snapshots yet.</TableCell>
								</TableRow>
							)}
							{snapshots.map((s) => (
								<TableRow key={s.id} hover>
									<TableCell>{s.date.slice(0, 10)}</TableCell>
									<TableCell>{s.views}</TableCell>
									<TableCell>{s.invites}</TableCell>
									<TableCell>{s.directMessages}</TableCell>
									<TableCell>{s.positions.length}</TableCell>
									<TableCell align='right'>
										<IconButton size='small' onClick={() => openEdit(s)}>
											<Edit fontSize='small' />
										</IconButton>
										<IconButton
											size='small'
											color='error'
											onClick={() => delSnap(s.id)}
										>
											<Delete fontSize='small' />
										</IconButton>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Section>
			)}

			<Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
				<DialogTitle>{form.id ? 'Edit snapshot' : 'New snapshot'}</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
					<TextField
						label='Date'
						type='date'
						value={form.date}
						onChange={(e) => setForm({ ...form, date: e.target.value })}
						slotProps={{ inputLabel: { shrink: true } }}
					/>
					<TextField
						label='Views'
						type='number'
						value={form.views}
						onChange={(e) =>
							setForm({ ...form, views: Number(e.target.value) || 0 })
						}
					/>
					<TextField
						label='Invites'
						type='number'
						value={form.invites}
						onChange={(e) =>
							setForm({ ...form, invites: Number(e.target.value) || 0 })
						}
					/>
					<TextField
						label='Direct messages'
						type='number'
						value={form.directMessages}
						onChange={(e) =>
							setForm({
								...form,
								directMessages: Number(e.target.value) || 0,
							})
						}
					/>
					{titlePhrases.length > 0 && (
						<div
							style={{
								borderTop: '1px solid #e2e8f0',
								paddingTop: 12,
								display: 'flex',
								flexDirection: 'column',
								gap: 8,
							}}
						>
							<div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
								POSITIONS (search page per title phrase)
							</div>
							{titlePhrases.map((tp) => (
								<TextField
									key={tp.id}
									label={tp.value}
									type='number'
									size='small'
									value={form.positions[tp.id] ?? ''}
									onChange={(e) =>
										setForm({
											...form,
											positions: {
												...form.positions,
												[tp.id]: Number(e.target.value) || 0,
											},
										})
									}
								/>
							))}
						</div>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpen(false)}>Cancel</Button>
					<Button variant='contained' onClick={saveSnapshot}>
						Save
					</Button>
				</DialogActions>
			</Dialog>
		</PageWrap>
	)
}

/* Monday-start week for a yyyy-mm-dd ISO date. Keeps change-log
 * markers aligned with the weekly aggregation on the backend. */
function weekStartOf(iso: string): string {
	const d = new Date(iso + 'T00:00:00Z')
	const dow = d.getUTCDay()
	const diff = dow === 0 ? -6 : 1 - dow
	d.setUTCDate(d.getUTCDate() + diff)
	return d.toISOString().slice(0, 10)
}

export default UpworkAnalyticsPage
