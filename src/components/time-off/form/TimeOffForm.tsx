import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { BeachAccessOutlined } from '@mui/icons-material'
import { TextField, Select, SelectItem } from '../../../ui'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import PermissionGate from '../../auth/PermissionGate'
import { Field, FormHeader, FormLoading, FormNotFound, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'
import { T } from '../../sales-analytics/_shared/tokens'
import {
	useGetTimeOffByIdQuery,
	useCreateTimeOffMutation,
	useUpdateTimeOffMutation,
	type TimeOffType,
} from '../../../store/time-off/timeOffApi'
import { useGetEmployeesQuery } from '../../../store/employees/employeesApi'

interface Props {
	id?: string
}

interface FormFields {
	employeeId: string
	type: TimeOffType
	startDate: string
	endDate: string
	note: string
}

const today = () => new Date().toISOString().slice(0, 10)

const empty: FormFields = {
	employeeId: '',
	type: 'VACATION',
	startDate: today(),
	endDate: today(),
	note: '',
}

interface FormErrors {
	employeeId?: string
	startDate?: string
	endDate?: string
	note?: string
}

const TimeOffFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createTimeOff, { isLoading: creating }] = useCreateTimeOffMutation()
	const [updateTimeOff, { isLoading: updating }] = useUpdateTimeOffMutation()
	const isEdit = Boolean(id)
	const isLoading = creating || updating

	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 500 })
	const employees = employeesPage?.data ?? []

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const workingDaysPreview = useMemo(() => {
		if (!fields.startDate || !fields.endDate) return 0
		const s = new Date(fields.startDate + 'T00:00:00Z')
		const e = new Date(fields.endDate + 'T00:00:00Z')
		if (e < s) return 0
		let count = 0
		const cur = new Date(s)
		while (cur.getTime() <= e.getTime()) {
			const dow = cur.getUTCDay()
			if (dow !== 0 && dow !== 6) count++
			cur.setUTCDate(cur.getUTCDate() + 1)
		}
		return count
	}, [fields.startDate, fields.endDate])

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.employeeId) next.employeeId = 'Employee is required'
		if (!fields.startDate) next.startDate = 'Start date is required'
		if (!fields.endDate) next.endDate = 'End date is required'
		if (fields.startDate && fields.endDate && fields.endDate < fields.startDate)
			next.endDate = 'End date must be on or after start date'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const payload = {
			employeeId: fields.employeeId,
			type: fields.type,
			startDate: fields.startDate,
			endDate: fields.endDate,
			note: fields.note || undefined,
		}
		try {
			if (isEdit) {
				await updateTimeOff({ id: id!, body: payload }).unwrap()
				showToast('Time off updated', 'success')
			} else {
				await createTimeOff(payload).unwrap()
				showToast('Time off created', 'success')
			}
			navigate('/employees/time-off')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/employees/time-off'
					backLabel='Back to time off'
					icon={<BeachAccessOutlined />}
					title={isEdit ? 'Edit time off' : 'Add time off'}
					subtitle={isEdit ? 'Update an existing absence' : 'Log a new employee absence'}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Absence' hint='Who, what and when' />
						<FieldGrid>
							<Field label='Employee' required error={errors.employeeId}>
								<Select
									label='Employee'
									defaultValue={fields.employeeId}
									onChange={(v) => setField('employeeId', v as string)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— Pick an employee —' value='' />
									{employees.map((e) => (
										<SelectItem
											key={e.id}
											label={`${e.firstName} ${e.lastName}`}
											value={e.id}
										/>
									))}
								</Select>
							</Field>
							<Field label='Type' required>
								<Select
									label='Type'
									defaultValue={fields.type}
									onChange={(v) => setField('type', v as TimeOffType)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Vacation' value='VACATION' />
									<SelectItem label='Sick leave' value='SICK_LEAVE' />
									<SelectItem label='Unpaid leave' value='UNPAID_LEAVE' />
								</Select>
							</Field>
							<Field label='Start date' required error={errors.startDate}>
								<TextField
									name='startDate'
									type='date'
									placeholder='YYYY-MM-DD'
									value={fields.startDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('startDate', e.target.value)
									}
									width='100%'
									error={!!errors.startDate}
								/>
							</Field>
							<Field label='End date' required error={errors.endDate} hint='Inclusive'>
								<TextField
									name='endDate'
									type='date'
									placeholder='YYYY-MM-DD'
									value={fields.endDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('endDate', e.target.value)
									}
									width='100%'
									error={!!errors.endDate}
								/>
							</Field>
						</FieldGrid>
						<WorkingBox>
							<WorkingTopRow>
								<CountUpNum target={workingDaysPreview} />
								<WorkingBody>
									<WorkingTitle>working days scheduled</WorkingTitle>
									<WorkingSub>
										{workingDaysPreview > 21
											? `${workingDaysPreview - 21} days over the 21-day vacation cap`
											: `${Math.max(
													0,
													21 - workingDaysPreview,
												)} of 21 vacation days remaining`}
									</WorkingSub>
								</WorkingBody>
							</WorkingTopRow>
							<ProgressLine>
								<ProgressLineFill
									style={{
										width: `${Math.min(100, (workingDaysPreview / 21) * 100)}%`,
									}}
								>
									<ProgressShimmer />
								</ProgressLineFill>
								<ProgressCursor
									style={{
										left: `${Math.min(100, (workingDaysPreview / 21) * 100)}%`,
									}}
								/>
							</ProgressLine>
						</WorkingBox>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Details'
							hint='Optional context — visible to Owner and Admin Manager'
						/>
						<Field label='Note'>
							<TextField
								name='note'
								placeholder='Reason, coverage, links — anything worth remembering'
								value={fields.note}
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									setField('note', e.target.value)
								}
								width='100%'
								multiRow
								style={{ minHeight: 120, resize: 'vertical' }}
							/>
						</Field>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Vacation 21 days · Sick 5 days / year · Unpaid unlimited
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/employees/time-off')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate permission={isEdit ? 'time_off:update' : 'time_off:create'}>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create time off'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const TimeOffForm = ({ id }: Props) => {
	const { data, isLoading, isError } = useGetTimeOffByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading time off…' />
	if (id && (isError || !data)) return <FormNotFound label='Time off not found' />

	const initial: FormFields = data
		? {
				employeeId: data.employeeId,
				type: data.type,
				startDate: data.startDate.slice(0, 10),
				endDate: data.endDate.slice(0, 10),
				note: data.note ?? '',
			}
		: empty

	return <TimeOffFormInner id={id} initial={initial} />
}

export default TimeOffForm

const MONO = `'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`

/** Count-up hook — tweens display from previous to target with ease-out. */
function useCountUp(target: number, duration = 400): number {
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
	margin-top: 18px;
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

/* ── Progress-line with animated fill, shimmer sweep + leading cursor ──── */

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

