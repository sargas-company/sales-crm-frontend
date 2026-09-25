import { useEffect, useState } from 'react'
import styled from 'styled-components'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import {
	useGetEmergingAlertConfigQuery,
	useSetEmergingAlertConfigMutation,
} from '../../../store/sales-analytics/salesAnalyticsApi'
import type { EmergingAlertConfig as Cfg } from '../../../store/sales-analytics/types/candidates'

const Grid = styled('div')`
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	gap: 12px;

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.label {
		font-size: 11px;
		font-weight: 700;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.4px;
	}
	.hint {
		font-size: 11px;
		color: #94a3b8;
	}
	input {
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 6px 8px;
		font-size: 13px;
		color: #1f2937;
		background: #ffffff;
	}
	input:focus {
		outline: 2px solid rgba(3, 105, 161, 1);
		outline-offset: 1px;
	}
`

const Save = styled('button')`
	background: rgba(3, 105, 161, 1);
	color: #ffffff;
	border: none;
	border-radius: 8px;
	padding: 8px 16px;
	font-weight: 700;
	font-size: 12.5px;
	cursor: pointer;

	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	&:focus-visible {
		outline: 2px solid #93c5fd;
		outline-offset: 2px;
	}
`

const EmergingAlertConfig = () => {
	const { data, isLoading, isError, refetch } = useGetEmergingAlertConfigQuery()
	const [save, { isLoading: isSaving }] = useSetEmergingAlertConfigMutation()
	const [local, setLocal] = useState<Cfg | null>(null)

	useEffect(() => {
		if (data) setLocal(data)
	}, [data])

	if (isLoading || !data || !local)
		return (
			<SectionCard title='Emerging alert configuration'>
				<SkeletonBlock height={160} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Emerging alert configuration'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)

	const dirty = JSON.stringify(local) !== JSON.stringify(data)

	const patch = (k: keyof Cfg, v: number) => setLocal({ ...local, [k]: v })

	return (
		<SectionCard
			title='Emerging alert configuration'
			hint='Configuration only — no delivery is triggered from this UI'
			action={
				<Save disabled={!dirty || isSaving} onClick={() => save(local)}>
					{isSaving ? 'Saving…' : 'Save changes'}
				</Save>
			}
		>
			<Grid>
				<Field label='Minimum posts' hint='Alert only after this many posts.'>
					<input
						type='number'
						min={1}
						value={local.minPosts}
						onChange={(e) => patch('minPosts', Number(e.target.value))}
						aria-label='Minimum posts'
					/>
				</Field>
				<Field label='Minimum unique clients' hint='Requires client-identity signal.'>
					<input
						type='number'
						min={0}
						value={local.minUniqueClients}
						onChange={(e) => patch('minUniqueClients', Number(e.target.value))}
					/>
				</Field>
				<Field label='Minimum average score' hint='Post quality threshold (0–100).'>
					<input
						type='number'
						min={0}
						max={100}
						value={local.minAverageScore}
						onChange={(e) => patch('minAverageScore', Number(e.target.value))}
					/>
				</Field>
				<Field label='Observation period (days)' hint='Sliding window analyzed.'>
					<input
						type='number'
						min={1}
						max={90}
						value={local.observationDays}
						onChange={(e) => patch('observationDays', Number(e.target.value))}
					/>
				</Field>
				<Field label='Minimum Sargas fit' hint='0–100.'>
					<input
						type='number'
						min={0}
						max={100}
						value={local.minSargasFit}
						onChange={(e) => patch('minSargasFit', Number(e.target.value))}
					/>
				</Field>
				<Field label='Cooldown (days)' hint='Deduplication between similar alerts.'>
					<input
						type='number'
						min={0}
						max={30}
						value={local.cooldownDays}
						onChange={(e) => patch('cooldownDays', Number(e.target.value))}
					/>
				</Field>
			</Grid>
			<div style={{ marginTop: 10, fontSize: 12, color: '#94a3b8' }}>
				Delivery pipeline (Discord, etc.) is intentionally not wired from the frontend.
			</div>
		</SectionCard>
	)
}

const Field = ({
	label,
	hint,
	children,
}: {
	label: string
	hint: string
	children: React.ReactNode
}) => (
	<div className='field'>
		<span className='label'>{label}</span>
		{children}
		<span className='hint'>{hint}</span>
	</div>
)

export default EmergingAlertConfig
