import { useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import {
	Button,
	Chip,
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
import { Add, Delete } from '@mui/icons-material'

import {
	UPWORK_CHANGELOG_SECTIONS,
	useDeleteUpworkChangeLogMutation,
	useListUpworkChangeLogQuery,
	useListUpworkProfilesQuery,
	type UpworkChangeLogSection,
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
const Filters = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
	flex-wrap: wrap;
`

const UpworkChangeLogPage = () => {
	const [profileId, setProfileId] = useState<string>('')
	const [section, setSection] = useState<UpworkChangeLogSection | ''>('')
	const [from, setFrom] = useState<string>('')
	const [to, setTo] = useState<string>('')

	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const { data: rows = [], isLoading } = useListUpworkChangeLogQuery({
		profileId: profileId || undefined,
		section: section || undefined,
		from: from || undefined,
		to: to || undefined,
	})
	const [del] = useDeleteUpworkChangeLogMutation()

	const remove = async (id: string) => {
		if (!confirm('Delete this change-log entry?')) return
		await del(id).unwrap()
	}

	return (
		<PageWrap>
			<Header>
				<Title>Change Log</Title>
				<Button
					variant='contained'
					startIcon={<Add />}
					component={Link}
					to='/upwork/change-log/new'
				>
					New entry
				</Button>
			</Header>

			<Filters>
				<FormControl size='small' sx={{ minWidth: 180 }}>
					<InputLabel>Profile</InputLabel>
					<Select
						label='Profile'
						value={profileId}
						onChange={(e) => setProfileId(e.target.value)}
					>
						<MenuItem value=''>All</MenuItem>
						{profiles.map((p) => (
							<MenuItem key={p.id} value={p.id}>
								{p.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormControl size='small' sx={{ minWidth: 180 }}>
					<InputLabel>Section</InputLabel>
					<Select
						label='Section'
						value={section}
						onChange={(e) => setSection(e.target.value as UpworkChangeLogSection)}
					>
						<MenuItem value=''>All</MenuItem>
						{UPWORK_CHANGELOG_SECTIONS.map((s) => (
							<MenuItem key={s} value={s}>
								{s}
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

			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell>Date</TableCell>
						<TableCell>Profile</TableCell>
						<TableCell>Section</TableCell>
						<TableCell>Summary</TableCell>
						<TableCell>Refs</TableCell>
						<TableCell align='right'>Actions</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{isLoading && (
						<TableRow>
							<TableCell colSpan={6}>Loading…</TableCell>
						</TableRow>
					)}
					{!isLoading && rows.length === 0 && (
						<TableRow>
							<TableCell colSpan={6}>No entries.</TableCell>
						</TableRow>
					)}
					{rows.map((r) => (
						<TableRow key={r.id} hover>
							<TableCell>{r.date.slice(0, 10)}</TableCell>
							<TableCell>{r.profile.name}</TableCell>
							<TableCell>
								<Chip label={r.section} size='small' />
							</TableCell>
							<TableCell>
								<Link to={`/upwork/change-log/${r.id}`}>{r.summary}</Link>
							</TableCell>
							<TableCell>{r.references.length}</TableCell>
							<TableCell align='right'>
								<IconButton
									size='small'
									color='error'
									onClick={() => remove(r.id)}
								>
									<Delete fontSize='small' />
								</IconButton>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</PageWrap>
	)
}

export default UpworkChangeLogPage
