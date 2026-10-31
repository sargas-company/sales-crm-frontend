import { useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	CheckCircleOutline,
	NotificationsActiveOutlined,
} from '@mui/icons-material'

import { ListPageShell } from '../../../components/_shared/ListPageShell'
import {
	BottomSlot,
	FreshFiltersWrap as BaseFreshFiltersWrap,
	InlineField,
	InlineSelect,
} from '../../../components/_shared/filters/freshPaperFilters'
import { T } from '../../../components/sales-analytics/_shared/tokens'
import { StatusPill } from '../_shared/cells'
import {
	UPWORK_PROFILE_TIER_LABEL,
	upworkProfileName,
	useGetUpworkRemindersQuery,
	useListUpworkProfilesQuery,
	type UpworkProfile,
	type UpworkReminder,
} from '../../../store/upwork/upworkApi'

const FreshFiltersWrap = styled(BaseFreshFiltersWrap)`
	width: 100%;
	box-sizing: border-box;
`

/* ─── Decorative accents ─────────────────────────────────────── */

const HeadAccent = styled.div`
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 2px;
	margin-left: auto;
	.line {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 32px;
		line-height: 1;
		color: ${T.primary};
		transform: rotate(-2deg);
		letter-spacing: 0.3px;
	}
	.flourish {
		color: ${T.primary};
		opacity: 0.75;
	}
	@media (max-width: 900px) {
		display: none;
	}
`

const FilterAccent = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	pointer-events: none;
	.k {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 24px;
		font-weight: 700;
		line-height: 1;
		color: #241e16;
		transform: rotate(-2deg);
	}
	.o {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 26px;
		font-weight: 700;
		line-height: 1;
		color: #e85d2f;
		transform: rotate(1.5deg);
	}
	.star {
		color: #e85d2f;
		font-size: 14px;
	}
	@media (max-width: 760px) {
		display: none;
	}
`

/* ─── Headline + feed layout ─────────────────────────────────── */

const fadeIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Block = styled.section<{ $delay: number }>`
	animation: ${fadeIn} 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${(p) => p.$delay}ms;
	padding: 22px 24px 26px;
	border: 1px solid ${T.border};
	border-radius: 16px;
	background: ${T.cardBg};
	display: flex;
	flex-direction: column;
	gap: 14px;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const BlockHead = styled.header`
	display: flex;
	align-items: center;
	gap: 10px;
	padding-bottom: 10px;
	border-bottom: 1px dashed ${T.border};
	.name {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-size: 18px;
		font-weight: 700;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
	}
	.n {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: ${T.textStrong};
		background: ${T.cardBg};
		border: 1px solid ${T.border};
		border-radius: 999px;
		padding: 3px 11px;
		letter-spacing: 0.2px;
	}
`

const TierPill = ({ tier }: { tier: 'primary' | 'secondary' }) => (
	<StatusPill $tone={tier === 'primary' ? 'warn' : 'muted'}>
		{UPWORK_PROFILE_TIER_LABEL[tier]}
	</StatusPill>
)

const HeadlineRow = styled.div`
	display: grid;
	grid-template-columns: minmax(180px, 240px) 1fr;
	gap: 28px;
	align-items: center;
	@media (max-width: 760px) {
		grid-template-columns: 1fr;
	}
`
const BigNumber = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	.n {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-size: 54px;
		font-weight: 800;
		line-height: 1;
		color: ${T.textStrong};
		letter-spacing: -2px;
		font-variant-numeric: tabular-nums;
	}
	.sub {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 24px;
		color: #d97706;
		margin-top: 6px;
		letter-spacing: 0.5px;
		transform: rotate(-1.5deg);
		transform-origin: left center;
	}
	.cap {
		font-size: 12px;
		color: ${T.textSecondary};
		margin-top: 10px;
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.5px;
	}
`
const FeedList = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 4px;
`
const rowIn = keyframes`
	from { opacity: 0; transform: translateX(-6px); }
	to   { opacity: 1; transform: translateX(0); }
`
const FeedRow = styled.li<{ $warn: boolean; $i: number }>`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 10px 2px;
	border-bottom: 1px dashed ${T.border};
	animation: ${rowIn} 280ms cubic-bezier(0.22, 1, 0.36, 1) both;
	animation-delay: ${(p) => 80 + p.$i * 55}ms;
	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
	&:last-child {
		border-bottom: none;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 999px;
		background: ${(p) => (p.$warn ? '#dc2626' : '#d97706')};
		flex: 0 0 auto;
	}
	.lbl {
		font-size: 14.5px;
		font-weight: 500;
		color: ${T.textStrong};
		flex: 1;
	}
	.d {
		font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
		font-weight: 700;
		font-size: 20px;
		letter-spacing: -0.4px;
		font-variant-numeric: tabular-nums;
		color: ${(p) => (p.$warn ? '#b91c1c' : '#a26608')};
		sup {
			font-size: 11px;
			color: ${T.textMuted};
			font-weight: 600;
			margin-left: 3px;
			vertical-align: top;
		}
	}
`

/* ─── Profile reminders — one block per profile ──────────────── */

const ProfileReminders = ({
	profile,
	index,
}: {
	profile: UpworkProfile
	index: number
}) => {
	const { data: reminders = [], isLoading, isFetching } =
		useGetUpworkRemindersQuery(profile.id)

	const critical = reminders.filter((r) => r.severity === 'warn').length
	const info = reminders.length - critical
	const delay = index * 140

	if (isLoading || isFetching) {
		return (
			<Block $delay={delay}>
				<BlockHead>
					<span className='name'>{upworkProfileName(profile)}</span>
					<TierPill tier={profile.tier} />
				</BlockHead>
				<Hint>Loading…</Hint>
			</Block>
		)
	}

	if (reminders.length === 0) {
		return (
			<Block $delay={delay}>
				<BlockHead>
					<span className='name'>{upworkProfileName(profile)}</span>
					<TierPill tier={profile.tier} />
					<span className='n'>0 reminders</span>
				</BlockHead>
				<Clean>
					<CheckCircleOutline fontSize='small' />
					All caught up.
				</Clean>
			</Block>
		)
	}

	return (
		<Block $delay={delay}>
			<BlockHead>
				<span className='name'>{upworkProfileName(profile)}</span>
				<TierPill tier={profile.tier} />
				<span className='n'>{reminders.length} reminders</span>
			</BlockHead>
			<HeadlineRow>
				<BigNumber>
					<span className='n'>{reminders.length}</span>
					<span className='sub'>need attention</span>
					<span className='cap'>
						{critical} critical · {info} info
					</span>
				</BigNumber>
				<FeedList>
					{reminders.map((r: UpworkReminder, i: number) => (
						<FeedRow key={r.key} $warn={r.severity === 'warn'} $i={i}>
							<span className='dot' />
							<span className='lbl'>{r.label}</span>
							<span className='d'>
								{r.days}
								<sup>d</sup>
							</span>
						</FeedRow>
					))}
				</FeedList>
			</HeadlineRow>
		</Block>
	)
}

/* ─── Shell ──────────────────────────────────────────────────── */

const Hint = styled.div`
	display: flex;
	gap: 10px;
	align-items: center;
	padding: 20px 24px;
	border: 1px dashed ${T.border};
	border-radius: 12px;
	color: ${T.textSecondary};
	font-size: 14px;
`
const Clean = styled.div`
	display: flex;
	gap: 12px;
	align-items: center;
	padding: 16px 20px;
	border: 1px solid ${T.border};
	border-radius: 12px;
	background: ${T.cardBg};
	color: ${T.textSecondary};
	font-size: 14px;
	font-weight: 600;
	svg {
		color: ${T.textMuted};
	}
`

const Stack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;
`

const UpworkRemindersPage = () => {
	const { data: profiles = [] } = useListUpworkProfilesQuery()
	const activeProfiles = useMemo(
		() =>
			profiles
				.filter((p) => p.active)
				.slice()
				.sort((a, b) => {
					const ta = a.tier === 'primary' ? 0 : 1
					const tb = b.tier === 'primary' ? 0 : 1
					if (ta !== tb) return ta - tb
					return upworkProfileName(a).localeCompare(upworkProfileName(b))
				}),
		[profiles],
	)
	const [selection, setSelection] = useState<string>('')

	/* First render → default to All. */
	useEffect(() => {
		if (!selection && activeProfiles.length) setSelection('__all__')
	}, [selection, activeProfiles])

	const chosen: UpworkProfile[] =
		selection === '__all__'
			? activeProfiles
			: activeProfiles.filter((p) => p.id === selection)

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Upwork', href: '/upwork/reminders' },
				{ label: 'Reminders', current: true },
			]}
			icon={<NotificationsActiveOutlined />}
			title='Reminders'
			subtitle='Freshness checks across your Upwork profiles.'
			middle={
				<HeadAccent aria-hidden='true'>
					<span className='line'>spot the drift</span>
					<svg
						className='flourish'
						viewBox='0 0 120 10'
						width='120'
						height='10'
					>
						<path
							d='M2 5 C 30 1, 60 9, 118 3'
							fill='none'
							stroke='currentColor'
							strokeWidth='2'
							strokeLinecap='round'
						/>
					</svg>
				</HeadAccent>
			}
			filters={
				<FreshFiltersWrap role='region' aria-label='Reminders filters'>
					<BottomSlot>
						<InlineField>
							<span className='l'>Profile</span>
							<InlineSelect
								value={selection}
								onChange={(e) => setSelection(e.target.value)}
								disabled={activeProfiles.length === 0}
								style={{ minWidth: 260 }}
							>
								{activeProfiles.length === 0 && (
									<option value=''>No active profiles</option>
								)}
								{activeProfiles.length > 0 && (
									<option value='__all__'>All profiles</option>
								)}
								{activeProfiles.map((p) => (
									<option key={p.id} value={p.id}>
										{upworkProfileName(p)}
									</option>
								))}
							</InlineSelect>
						</InlineField>
					</BottomSlot>

					<div style={{ flex: 1 }} />

					<FilterAccent aria-hidden='true'>
						<span className='k'>keep profiles</span>
						<span className='o'>fresh</span>
						<span className='star'>★</span>
					</FilterAccent>
				</FreshFiltersWrap>
			}
		>
			{activeProfiles.length === 0 && (
				<Hint>Create an active profile first — reminders are computed per profile.</Hint>
			)}

			{chosen.length > 0 && (
				<Stack>
					{chosen.map((p, i) => (
						<ProfileReminders key={p.id} profile={p} index={i} />
					))}
				</Stack>
			)}
		</ListPageShell>
	)
}

export default UpworkRemindersPage
