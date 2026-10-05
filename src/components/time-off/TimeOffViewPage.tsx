import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	BeachAccessOutlined,
	EditOutlined,
	ArrowBackRounded,
	ArrowOutwardOutlined,
} from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../auth/PermissionGate'
import { Field, FormHeader, SectionHead } from '../_shared/FormShell'
import {
	BackGhostButton,
	DotMini,
	EditSolidButton,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import { useGetTimeOffByIdQuery } from '../../store/time-off/timeOffApi'
import { formatDate } from '../../utils/format'
import { T } from '../sales-analytics/_shared/tokens'

const TYPE_META: Record<string, { label: string; tint: string; fg: string }> = {
	VACATION: { label: 'Vacation', tint: 'rgba(3, 105, 161, 0.14)', fg: '#0369a1' },
	SICK_LEAVE: { label: 'Sick leave', tint: 'rgba(220, 38, 38, 0.14)', fg: '#b91c1c' },
	UNPAID_LEAVE: { label: 'Unpaid leave', tint: 'rgba(100, 116, 139, 0.16)', fg: '#475569' },
}

const derivedState = (start: string, end: string): 'upcoming' | 'away' | 'past' => {
	const today = new Date().toISOString().slice(0, 10)
	if (end < today) return 'past'
	if (start > today) return 'upcoming'
	return 'away'
}

const STATE_META: Record<'upcoming' | 'away' | 'past', { label: string; bg: string; fg: string }> = {
	upcoming: { label: 'Upcoming', bg: 'rgba(3, 105, 161, 0.10)', fg: '#0369a1' },
	away: { label: 'Away now', bg: 'rgba(245, 158, 11, 0.16)', fg: '#a26608' },
	past: { label: 'Past', bg: 'rgba(15, 23, 42, 0.06)', fg: '#64748b' },
}

const TimeOffViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: item, isLoading, isError } = useGetTimeOffByIdQuery(id, { skip: !id })

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<Loading label='Loading time off…' />
					</Center>
				</Surface>
			</Shell>
		)
	}

	if (isError || !item) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<ErrorState
							title='Time off not available'
							description='Could not load the record.'
							action={
								<Button onClick={() => navigate('/employees/time-off')}>Back to list</Button>
							}
						/>
					</Center>
				</Surface>
			</Shell>
		)
	}

	const st = derivedState(item.startDate, item.endDate)
	const typeMeta = TYPE_META[item.type]

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/employees/time-off'
					backLabel='Back to time off'
					icon={<BeachAccessOutlined />}
					title={`${item.employee.firstName} ${item.employee.lastName}`}
					subtitle={`${formatDate(item.startDate, 'short')} — ${formatDate(item.endDate, 'short')}`}
					badgeLabel={typeMeta.label}
					badgeTone={item.type === 'VACATION' ? 'edit' : item.type === 'SICK_LEAVE' ? 'draft' : 'new'}
				/>

				<Section $delay={80}>
					<SectionHead num='01' title='Overview' hint='Dates and totals' />
					<HeroRow>
						<WorkingBox>
							<WorkingTopRow>
								<CountUpNum target={item.workingDays} />
								<WorkingBody>
									<WorkingTitle>working days scheduled</WorkingTitle>
									<WorkingSub>
										{item.workingDays > 21
											? `${item.workingDays - 21} days over the 21-day vacation cap`
											: `${Math.max(
													0,
													21 - item.workingDays,
												)} of 21 vacation days remaining`}
									</WorkingSub>
								</WorkingBody>
							</WorkingTopRow>
							<ProgressLine>
								<ProgressLineFill
									style={{
										width: `${Math.min(100, (item.workingDays / 21) * 100)}%`,
									}}
								>
									<ProgressShimmer />
								</ProgressLineFill>
								<ProgressCursor
									style={{
										left: `${Math.min(100, (item.workingDays / 21) * 100)}%`,
									}}
								/>
							</ProgressLine>
						</WorkingBox>
						<HeroChips>
							<TypeChip $tint={typeMeta.tint} $fg={typeMeta.fg}>
								{typeMeta.label}
							</TypeChip>
							<StateChip $bg={STATE_META[st].bg} $fg={STATE_META[st].fg}>
								{STATE_META[st].label}
							</StateChip>
						</HeroChips>
					</HeroRow>
					<Grid>
						<Field label='Start date'>
							<TextField
								name='sd'
								value={formatDate(item.startDate, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='End date'>
							<TextField
								name='ed'
								value={formatDate(item.endDate, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</Grid>
				</Section>

				<Section $delay={140}>
					<SectionHead num='02' title='Employee' hint='Whose absence this is' />
					<EmployeeCard
						onClick={() => navigate(`/employees/${item.employee.id}`)}
						type='button'
					>
						<EmpBody>
							<EmpName>
								{item.employee.firstName} {item.employee.lastName}
							</EmpName>
							{item.employee.positions.length > 0 && (
								<EmpPos>{item.employee.positions.join(' · ')}</EmpPos>
							)}
						</EmpBody>
						<ArrowOutwardOutlined style={{ fontSize: 18, color: T.primary }} />
					</EmployeeCard>
				</Section>

				<Section $delay={200}>
					<SectionHead num='03' title='Notes' hint='Optional context' />
					<NoteBlock>
						{item.note ? item.note : <NoteEmpty>No note provided.</NoteEmpty>}
					</NoteBlock>
				</Section>

				<Section $delay={240}>
					<SectionHead
						num='04'
						title='Meta'
						hint={`Created ${formatDate(item.createdAt, 'short')}`}
					/>
					<Grid>
						<Field label='Created by'>
							<TextField
								name='cb'
								value={`${item.createdBy.firstName} ${item.createdBy.lastName}`}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Updated at'>
							<TextField
								name='ua'
								value={formatDate(item.updatedAt, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</Grid>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing time off in read-only mode.
					</FootLeft>
					<FootActions>
						<BackGhostButton
							type='button'
							onClick={() => navigate('/employees/time-off')}
						>
							<ArrowBackRounded />
							Back to list
						</BackGhostButton>
						<PermissionGate permission='time_off:update'>
							<EditSolidButton
								type='button'
								onClick={() => navigate(`/employees/time-off/edit/${item.id}`)}
							>
								<EditOutlined />
								Edit
							</EditSolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default TimeOffViewPage

const Center = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const HeroRow = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 24px;
	margin-bottom: 22px;
`

const MONO = `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

/** Tween an integer from previous value to target with ease-out cubic. */
function useCountUp(target: number, duration = 500): number {
	const [display, setDisplay] = useState(target)
	const prev = useRef(target)
	useEffect(() => {
		const from = prev.current
		const to = target
		if (from === to) return
		let raf = 0
		const start = performance.now()
		const step = (now: number) => {
			const t = Math.min(1, (now - start) / duration)
			const eased = 1 - Math.pow(1 - t, 3)
			const cur = Math.round(from + (to - from) * eased)
			setDisplay(cur)
			if (t < 1) raf = requestAnimationFrame(step)
			else prev.current = to
		}
		raf = requestAnimationFrame(step)
		return () => cancelAnimationFrame(raf)
	}, [target, duration])
	return display
}

const CountUpNum = ({ target }: { target: number }) => {
	const value = useCountUp(target)
	return <WorkingNum>{value}</WorkingNum>
}

const WorkingBox = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	max-width: 320px;
`

const WorkingTopRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
`

const WorkingNum = styled.span`
	font-family: ${MONO};
	font-size: 56px;
	font-weight: 700;
	color: ${T.primary};
	font-variant-numeric: tabular-nums;
	letter-spacing: -1.4px;
	line-height: 0.95;
`

const WorkingBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
`

const WorkingTitle = styled.span`
	font-size: 15px;
	font-weight: 700;
	color: ${T.textStrong};
	letter-spacing: -0.1px;
`

const WorkingSub = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
`

const ProgressLine = styled.div`
	position: relative;
	width: 100%;
	height: 4px;
	border-radius: 2px;
	background: rgba(15, 23, 42, 0.08);
	overflow: visible;
`

const shimmerKF = keyframes`
	0%   { transform: translateX(-120%); }
	100% { transform: translateX(220%); }
`

const ProgressLineFill = styled.div`
	position: relative;
	height: 100%;
	background: ${T.primary};
	border-radius: 2px;
	transition: width 480ms cubic-bezier(0.22, 1, 0.36, 1);
	overflow: hidden;
`

const ProgressShimmer = styled.span`
	position: absolute;
	top: 0;
	left: 0;
	width: 60%;
	height: 100%;
	background: linear-gradient(
		90deg,
		transparent 0%,
		rgba(255, 255, 255, 0.55) 50%,
		transparent 100%
	);
	animation: ${shimmerKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		display: none;
	}
`

const cursorPulseKF = keyframes`
	0%, 100% { box-shadow: 0 0 0 0 rgba(3, 105, 161, 0.45); transform: translate(-50%, -50%) scale(1); }
	50%      { box-shadow: 0 0 0 6px rgba(3, 105, 161, 0);    transform: translate(-50%, -50%) scale(1.15); }
`

const ProgressCursor = styled.span`
	position: absolute;
	top: 50%;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: ${T.primary};
	border: 2px solid #ffffff;
	transform: translate(-50%, -50%);
	transition: left 480ms cubic-bezier(0.22, 1, 0.36, 1);
	animation: ${cursorPulseKF} 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HeroChips = styled.div`
	display: inline-flex;
	gap: 8px;
	flex-wrap: wrap;
`

const TypeChip = styled.span<{ $tint: string; $fg: string }>`
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12.5px;
	font-weight: 700;
	background: ${({ $tint }) => $tint};
	color: ${({ $fg }) => $fg};
`

const StateChip = styled.span<{ $bg: string; $fg: string }>`
	display: inline-flex;
	align-items: center;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 11.5px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.5px;
	background: ${({ $bg }) => $bg};
	color: ${({ $fg }) => $fg};
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;
	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const EmployeeCard = styled.button`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 14px;
	width: 100%;
	padding: 14px 16px;
	border-radius: 12px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.08);
	font-family: inherit;
	text-align: left;
	cursor: pointer;
	text-transform: none;
	letter-spacing: normal;
	min-width: 0;
	transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 200ms ease;

	&:hover {
		transform: translateY(-1px);
		border-color: rgba(3, 105, 161, 0.35);
	}
`

const EmpBody = styled.span`
	display: flex;
	flex-direction: column;
	gap: 4px;
	min-width: 0;
`

const EmpName = styled.span`
	font-size: 15px;
	font-weight: 600;
	color: ${T.textStrong};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const EmpPos = styled.span`
	font-size: 12.5px;
	color: ${T.textSecondary};
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
`

const NoteBlock = styled.div`
	white-space: pre-wrap;
	font-size: 14px;
	line-height: 1.55;
	color: ${T.textStrong};
	padding: 14px 16px;
	border-radius: 12px;
	background: ${T.subtleBg};
	border: 1px solid ${T.border};
	margin-bottom: 14px;
`

const NoteEmpty = styled.div`
	font-size: 13px;
	color: ${T.textSecondary};
	font-style: italic;
`

