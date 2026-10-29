import { useState } from 'react'
import styled from 'styled-components'
import {
	Button,
	Checkbox,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	IconButton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
} from '@mui/material'
import { Add, Delete, Edit } from '@mui/icons-material'

import {
	useCreateUpworkProfileMutation,
	useDeleteUpworkProfileMutation,
	useListUpworkProfilesQuery,
	useUpdateUpworkProfileMutation,
	type UpworkProfile,
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
`
const Title = styled.h1`
	font-size: 24px;
	font-weight: 700;
	color: #0f172a;
	margin: 0;
`

interface FormState {
	name: string
	url: string
	note: string
	active: boolean
}

const emptyForm: FormState = { name: '', url: '', note: '', active: true }

const UpworkProfilesPage = () => {
	const { data: profiles = [], isLoading } = useListUpworkProfilesQuery()
	const [create] = useCreateUpworkProfileMutation()
	const [update] = useUpdateUpworkProfileMutation()
	const [remove] = useDeleteUpworkProfileMutation()

	const [open, setOpen] = useState(false)
	const [editing, setEditing] = useState<UpworkProfile | null>(null)
	const [form, setForm] = useState<FormState>(emptyForm)

	const openCreate = () => {
		setEditing(null)
		setForm(emptyForm)
		setOpen(true)
	}
	const openEdit = (p: UpworkProfile) => {
		setEditing(p)
		setForm({
			name: p.name,
			url: p.url ?? '',
			note: p.note ?? '',
			active: p.active,
		})
		setOpen(true)
	}
	const close = () => setOpen(false)

	const save = async () => {
		const payload = {
			name: form.name.trim(),
			url: form.url.trim() || null,
			note: form.note.trim() || null,
			active: form.active,
		}
		if (!payload.name) return
		if (editing) {
			await update({ id: editing.id, patch: payload }).unwrap()
		} else {
			await create({
				...payload,
				url: payload.url ?? undefined,
				note: payload.note ?? undefined,
			} as never).unwrap()
		}
		close()
	}

	const del = async (id: string) => {
		if (!confirm('Delete this profile? Change log and snapshots will be removed too.')) return
		await remove(id).unwrap()
	}

	return (
		<PageWrap>
			<Header>
				<Title>Upwork Profiles</Title>
				<Button
					variant='contained'
					startIcon={<Add />}
					onClick={openCreate}
				>
					New profile
				</Button>
			</Header>

			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Name</TableCell>
						<TableCell>URL</TableCell>
						<TableCell>Active</TableCell>
						<TableCell>Updated</TableCell>
						<TableCell align='right'>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{isLoading && (
						<TableRow>
							<TableCell colSpan={5}>Loading…</TableCell>
						</TableRow>
					)}
					{!isLoading && profiles.length === 0 && (
						<TableRow>
							<TableCell colSpan={5}>No profiles yet.</TableCell>
						</TableRow>
					)}
					{profiles.map((p) => (
						<TableRow key={p.id}>
							<TableCell>{p.name}</TableCell>
							<TableCell>
								{p.url ? (
									<a href={p.url} target='_blank' rel='noreferrer'>
										{p.url}
									</a>
								) : (
									'—'
								)}
							</TableCell>
							<TableCell>{p.active ? 'Yes' : 'No'}</TableCell>
							<TableCell>
								{new Date(p.updatedAt).toLocaleDateString()}
							</TableCell>
							<TableCell align='right'>
								<IconButton onClick={() => openEdit(p)} size='small'>
									<Edit fontSize='small' />
								</IconButton>
								<IconButton
									onClick={() => del(p.id)}
									size='small'
									color='error'
								>
									<Delete fontSize='small' />
								</IconButton>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<Dialog open={open} onClose={close} fullWidth maxWidth='sm'>
				<DialogTitle>{editing ? 'Edit profile' : 'New profile'}</DialogTitle>
				<DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
					<TextField
						label='Name'
						value={form.name}
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						required
						fullWidth
					/>
					<TextField
						label='URL'
						value={form.url}
						onChange={(e) => setForm({ ...form, url: e.target.value })}
						fullWidth
					/>
					<TextField
						label='Note'
						value={form.note}
						onChange={(e) => setForm({ ...form, note: e.target.value })}
						multiline
						rows={3}
						fullWidth
					/>
					<FormControlLabel
						control={
							<Checkbox
								checked={form.active}
								onChange={(e) =>
									setForm({ ...form, active: e.target.checked })
								}
							/>
						}
						label='Active'
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={close}>Cancel</Button>
					<Button variant='contained' onClick={save}>
						Save
					</Button>
				</DialogActions>
			</Dialog>
		</PageWrap>
	)
}

export default UpworkProfilesPage
