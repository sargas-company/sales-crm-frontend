import { useState } from 'react'
import styled from 'styled-components'
import {
	Alert,
	Chip,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
} from '@mui/material'

import {
	useGetUpworkRemindersQuery,
	useListUpworkProfilesQuery,
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
const Row = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
`
const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`
const Card = styled.div<{ $warn: boolean }>`
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 12px 16px;
	border-radius: 10px;
	border: 1px solid ${(p) => (p.$warn ? '#fecaca' : '#e2e8f0')};
	background: ${(p) => (p.$warn ? '#fef2f2' : '#ffffff')};
`
const Label = styled.div`
	font-size: 14px;
	font-weight: 600;
	color: #0f172a;
`

const UpworkRemindersPage = () => {
	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = profiles.filter((p) => p.active)
	const [profileId, setProfileId] = useState<string>('')
	const { data: reminders = [], isLoading } = useGetUpworkRemindersQuery(
		profileId,
		{ skip: !profileId },
	)

	return (
		<PageWrap>
			<Title>Reminders</Title>
			<Row>
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
			</Row>

			{profileId && isLoading && <div>Loading…</div>}
			{profileId && !isLoading && reminders.length === 0 && (
				<Alert severity='success'>All caught up for this profile.</Alert>
			)}
			<List>
				{reminders.map((r) => (
					<Card key={r.key} $warn={r.severity === 'warn'}>
						<Label>{r.label}</Label>
						<Chip
							size='small'
							color={r.severity === 'warn' ? 'error' : 'default'}
							label={`${r.days}d threshold`}
						/>
					</Card>
				))}
			</List>
		</PageWrap>
	)
}

export default UpworkRemindersPage
