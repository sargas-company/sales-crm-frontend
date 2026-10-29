import { useState } from 'react'
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
	Checkbox,
	FormControlLabel,
	Chip,
} from '@mui/material'
import { Add, Archive, Delete, PlaylistAdd } from '@mui/icons-material'

import {
	UPWORK_REFERENCE_CATEGORIES,
	useArchiveUpworkReferenceMutation,
	useBulkAddUpworkReferencesMutation,
	useBulkDeleteUpworkReferencesMutation,
	useCreateUpworkReferenceMutation,
	useListUpworkProfilesQuery,
	useListUpworkReferencesQuery,
	type UpworkReferenceCategory,
} from '../../../store/upwork/upworkApi'

const PageWrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;
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
	align-items: center;
	flex-wrap: wrap;
`

const todayIso = () => new Date().toISOString().slice(0, 10)

const UpworkReferenceDataPage = () => {
	const [profileFilter, setProfileFilter] = useState<string>('')
	const [categoryFilter, setCategoryFilter] = useState<UpworkReferenceCategory | ''>(
		'',
	)
	const [sortByFrequency, setSortByFrequency] = useState(false)
	const [selected, setSelected] = useState<Set<string>>(new Set())

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const { data: rows = [], isLoading } = useListUpworkReferencesQuery({
		profileId: profileFilter || undefined,
		category: categoryFilter || undefined,
		sortByFrequency,
	})
	const [createRef] = useCreateUpworkReferenceMutation()
	const [bulkAdd] = useBulkAddUpworkReferencesMutation()
	const [archive] = useArchiveUpworkReferenceMutation()
	const [bulkDelete] = useBulkDeleteUpworkReferencesMutation()

	const [createOpen, setCreateOpen] = useState(false)
	const [bulkOpen, setBulkOpen] = useState(false)

	// Create modal state
	const [newProfileId, setNewProfileId] = useState<string>('')
	const [newCategory, setNewCategory] = useState<UpworkReferenceCategory>(
		'title_phrase',
	)
	const [newValue, setNewValue] = useState('')
	const [newNote, setNewNote] = useState('')
	const [newDate, setNewDate] = useState(todayIso())

	// Bulk-add modal state
	const [bulkProfileId, setBulkProfileId] = useState<string>('')
	const [bulkCategory, setBulkCategory] = useState<UpworkReferenceCategory>(
		'title_phrase',
	)
	const [bulkText, setBulkText] = useState('')
	const [bulkDate, setBulkDate] = useState(todayIso())

	const toggle = (id: string) => {
		const next = new Set(selected)
		if (next.has(id)) next.delete(id)
		else next.add(id)
		setSelected(next)
	}

	const submitCreate = async () => {
		if (!newValue.trim()) return
		await createRef({
			profileId: newProfileId || undefined,
			category: newCategory,
			value: newValue.trim(),
			note: newNote.trim() || undefined,
			collectedDate: newDate,
		}).unwrap()
		setCreateOpen(false)
		setNewValue('')
		setNewNote('')
	}

	const submitBulk = async () => {
		const values = bulkText
			.split('\n')
			.map((l) => l.trim())
			.filter(Boolean)
		if (values.length === 0) return
		await bulkAdd({
			profileId: bulkProfileId || undefined,
			category: bulkCategory,
			collectedDate: bulkDate,
			values,
		}).unwrap()
		setBulkOpen(false)
		setBulkText('')
	}

	const doBulkDelete = async () => {
		if (selected.size === 0) return
		if (!confirm(`Delete ${selected.size} entries?`)) return
		await bulkDelete({ ids: Array.from(selected) }).unwrap()
		setSelected(new Set())
	}

	return (
		<PageWrap>
			<Header>
				<Title>Reference Data</Title>
				<div style={{ display: 'flex', gap: 8 }}>
					<Button
						variant='outlined'
						startIcon={<PlaylistAdd />}
						onClick={() => setBulkOpen(true)}
					>
						Bulk add
					</Button>
					<Button
						variant='contained'
						startIcon={<Add />}
						onClick={() => setCreateOpen(true)}
					>
						New entry
					</Button>
				</div>
			</Header>

			<Filters>
				<FormControl size='small' sx={{ minWidth: 180 }}>
					<InputLabel>Profile</InputLabel>
					<Select
						label='Profile'
						value={profileFilter}
						onChange={(e) => setProfileFilter(e.target.value)}
					>
						<MenuItem value=''>All (incl. shared)</MenuItem>
						{profiles.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size='small' sx={{ minWidth: 180 }}>
					<InputLabel>Category</InputLabel>
					<Select
						label='Category'
						value={categoryFilter}
						onChange={(e) =>
							setCategoryFilter(e.target.value as UpworkReferenceCategory)
						}
					>
						<MenuItem value=''>All</MenuItem>
						{UPWORK_REFERENCE_CATEGORIES.map((c) => (
							<MenuItem key={c} value={c}>
								{c}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControlLabel
					control={
						<Checkbox
							checked={sortByFrequency}
							onChange={(e) => setSortByFrequency(e.target.checked)}
						/>
					}
					label='Sort by frequency'
				/>
				{selected.size > 0 && (
					<Button
						color='error'
						variant='outlined'
						startIcon={<Delete />}
						onClick={doBulkDelete}
					>
						Delete {selected.size}
					</Button>
				)}
			</Filters>

			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell padding='checkbox' />
						<TableCell>Value</TableCell>
						<TableCell>Category</TableCell>
						<TableCell>Profile</TableCell>
						<TableCell>Frequency</TableCell>
						<TableCell>Collected</TableCell>
						<TableCell>Active</TableCell>
						<TableCell align='right'>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{isLoading && (
						<TableRow>
							<TableCell colSpan={8}>Loading…</TableCell>
						</TableRow>
					)}
					{!isLoading && rows.length === 0 && (
						<TableRow>
							<TableCell colSpan={8}>No entries yet.</TableCell>
						</TableRow>
					)}
					{rows.map((r) => (
						<TableRow key={r.id} selected={selected.has(r.id)}>
							<TableCell padding='checkbox'>
								<Checkbox
									checked={selected.has(r.id)}
									onChange={() => toggle(r.id)}
								/>
							</TableCell>
							<TableCell>{r.value}</TableCell>
							<TableCell>
								<Chip label={r.category} size='small' />
							</TableCell>
							<TableCell>{r.profile?.name ?? '— shared'}</TableCell>
							<TableCell>{r.frequency ?? '—'}</TableCell>
							<TableCell>{r.collectedDate.slice(0, 10)}</TableCell>
							<TableCell>{r.active ? 'Yes' : 'No'}</TableCell>
							<TableCell align='right'>
								{r.active && (
									<IconButton
										size='small'
										onClick={() => archive(r.id)}
										title='Archive'
									>
										<Archive fontSize='small' />
									</IconButton>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{/* Create modal */}
			<Dialog
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				fullWidth
				maxWidth='sm'
			>
				<DialogTitle>New reference entry</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
					<FormControl size='small' fullWidth>
						<InputLabel>Profile</InputLabel>
						<Select
							label='Profile'
							value={newProfileId}
							onChange={(e) => setNewProfileId(e.target.value)}
						>
							<MenuItem value=''>— shared (all profiles)</MenuItem>
							{profiles.map((p) => (
								<MenuItem key={p.id} value={p.id}>
									{p.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size='small' fullWidth>
						<InputLabel>Category</InputLabel>
						<Select
							label='Category'
							value={newCategory}
							onChange={(e) =>
								setNewCategory(e.target.value as UpworkReferenceCategory)
							}
						>
							{UPWORK_REFERENCE_CATEGORIES.map((c) => (
								<MenuItem key={c} value={c}>
									{c}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<TextField
						label='Value'
						value={newValue}
						onChange={(e) => setNewValue(e.target.value)}
						required
					/>
					<TextField
						label='Note'
						value={newNote}
						onChange={(e) => setNewNote(e.target.value)}
						multiline
						rows={2}
					/>
					<TextField
						label='Collected date'
						type='date'
						value={newDate}
						onChange={(e) => setNewDate(e.target.value)}
						slotProps={{ inputLabel: { shrink: true } }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setCreateOpen(false)}>Cancel</Button>
					<Button variant='contained' onClick={submitCreate}>
						Create
					</Button>
				</DialogActions>
			</Dialog>

			{/* Bulk-add modal */}
			<Dialog
				open={bulkOpen}
				onClose={() => setBulkOpen(false)}
				fullWidth
				maxWidth='sm'
			>
				<DialogTitle>Bulk add reference entries</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
					<FormControl size='small' fullWidth>
						<InputLabel>Profile</InputLabel>
						<Select
							label='Profile'
							value={bulkProfileId}
							onChange={(e) => setBulkProfileId(e.target.value)}
						>
							<MenuItem value=''>— shared (all profiles)</MenuItem>
							{profiles.map((p) => (
								<MenuItem key={p.id} value={p.id}>
									{p.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<FormControl size='small' fullWidth>
						<InputLabel>Category</InputLabel>
						<Select
							label='Category'
							value={bulkCategory}
							onChange={(e) =>
								setBulkCategory(e.target.value as UpworkReferenceCategory)
							}
						>
							{UPWORK_REFERENCE_CATEGORIES.map((c) => (
								<MenuItem key={c} value={c}>
									{c}
								</MenuItem>
							))}
						</Select>
					</FormControl>
					<TextField
						label='Values (one per line)'
						value={bulkText}
						onChange={(e) => setBulkText(e.target.value)}
						multiline
						rows={10}
						placeholder={'react developer\ntypescript\nnode.js'}
					/>
					<TextField
						label='Collected date'
						type='date'
						value={bulkDate}
						onChange={(e) => setBulkDate(e.target.value)}
						slotProps={{ inputLabel: { shrink: true } }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setBulkOpen(false)}>Cancel</Button>
					<Button variant='contained' onClick={submitBulk}>
						Add
					</Button>
				</DialogActions>
			</Dialog>
		</PageWrap>
	)
}

export default UpworkReferenceDataPage
