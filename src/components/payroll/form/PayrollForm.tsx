import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AttachMoneyOutlined } from '@mui/icons-material'
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
import { useGetEmployeesQuery } from '../../../store/employees/employeesApi'
import {
	useGetPayrollByIdQuery,
	useCreatePayrollMutation,
	useUpdatePayrollMutation,
	type RateType,
} from '../../../store/payroll/payrollApi'
import styled from 'styled-components'
import { T } from '../../sales-analytics/_shared/tokens'

const MONTHS = [
	'January', 'February', 'March', 'April', 'May', 'June',
	'July', 'August', 'September', 'October', 'November', 'December',
] as const

const currentYear = () => new Date().getUTCFullYear()
const currentMonth = () => new Date().getUTCMonth() + 1

interface FormFields {
	employeeId: string
	year: number
	month: number
	rateType: RateType
	rate: string
	hours: string
	bonusPercent: string
	fixedBonus: string
	advance: string
	note: string
}

interface FormErrors {
	employeeId?: string
	rate?: string
	hours?: string
}

const emptyFields = (year: number, month: number): FormFields => ({
	employeeId: '',
	year,
	month,
	rateType: 'HOURLY',
	rate: '',
	hours: '',
	bonusPercent: '0',
	fixedBonus: '0',
	advance: '0',
	note: '',
})

const fmt = (n: number) =>
	n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PayrollFormInner = ({
	id,
	initial,
	lockPeriod,
}: {
	id?: string
	initial: FormFields
	lockPeriod: boolean
}) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createPayroll, { isLoading: creating }] = useCreatePayrollMutation()
	const [updatePayroll, { isLoading: updating }] = useUpdatePayrollMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 500 })
	const employees = employeesPage?.data ?? []

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	// Live preview of the derived formula values.
	const preview = useMemo(() => {
		const r = parseFloat(fields.rate) || 0
		const h = parseFloat(fields.hours) || 0
		const bp = parseFloat(fields.bonusPercent) || 0
		const fb = parseFloat(fields.fixedBonus) || 0
		const adv = parseFloat(fields.advance) || 0
		const base = fields.rateType === 'HOURLY' ? r * h : r
		const tax = 42.5 + base * 0.06
		const swt = base + tax
		const bonusAmt = (swt * bp) / 100 + fb
		const total = swt + bonusAmt
		const remain = Math.max(0, total - adv)
		const fee = total * 0.03
		const cost = total + fee
		return { base, tax, swt, bonusAmt, total, remain, fee, cost }
	}, [fields])

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.employeeId) next.employeeId = 'Select an employee'
		if (!fields.rate || parseFloat(fields.rate) < 0) next.rate = 'Enter a valid rate'
		if (fields.rateType === 'HOURLY' && (!fields.hours || parseFloat(fields.hours) < 0)) {
			next.hours = 'Enter hours for hourly rate'
		}
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const body = {
			rateType: fields.rateType,
			rate: parseFloat(fields.rate) || 0,
			hours: fields.rateType === 'HOURLY' ? parseFloat(fields.hours) || 0 : undefined,
			bonusPercent: parseFloat(fields.bonusPercent) || 0,
			fixedBonus: parseFloat(fields.fixedBonus) || 0,
			advance: parseFloat(fields.advance) || 0,
			note: fields.note.trim() || undefined,
		}
		try {
			if (isEdit) {
				await updatePayroll({ id: id!, body }).unwrap()
				showToast('Payroll entry updated', 'success')
			} else {
				await createPayroll({
					employeeId: fields.employeeId,
					year: fields.year,
					month: fields.month,
					...body,
				}).unwrap()
				showToast('Payroll entry created', 'success')
			}
			navigate('/finances/salaries')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const monthOptions = MONTHS.map((m, i) => ({ label: m, value: String(i + 1) }))
	const yearOptions = [
		String(currentYear() - 1),
		String(currentYear()),
		String(currentYear() + 1),
	]

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/finances/salaries'
					backLabel='Back to salaries'
					icon={<AttachMoneyOutlined />}
					title={isEdit ? 'Edit payroll entry' : 'New payroll entry'}
					subtitle={
						isEdit
							? `${MONTHS[fields.month - 1]} ${fields.year} — draft entry`
							: 'Add a payroll record for the selected month'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Period & employee' hint='Who and which month this entry covers' />
						<FieldGrid>
							{lockPeriod ? (
								<Field label='Employee' span='full'>
									<StaticValue>
										{(() => {
											const emp = employees.find((e) => e.id === fields.employeeId)
											return emp
												? `${emp.firstName} ${emp.lastName}${
														emp.positions.length > 0 ? ` — ${emp.positions[0]}` : ''
													}`
												: '—'
										})()}
									</StaticValue>
								</Field>
							) : (
								<Field label='Employee' required error={errors.employeeId} span='full'>
									<Select
										label='Employee'
										defaultValue={fields.employeeId || ''}
										onChange={(value) => setField('employeeId', String(value))}
										width='100%'
										sizes='normal'
									>
										{employees.map((e) => (
											<SelectItem
												key={e.id}
												label={`${e.firstName} ${e.lastName}${
													e.positions.length > 0 ? ` — ${e.positions[0]}` : ''
												}`}
												value={e.id}
											/>
										))}
									</Select>
								</Field>
							)}
							{lockPeriod ? (
								<Field label='Period'>
									<StaticValue>
										{MONTHS[fields.month - 1]} {fields.year}
									</StaticValue>
								</Field>
							) : (
								<>
									<Field label='Year'>
										<Select
											label='Year'
											defaultValue={String(fields.year)}
											onChange={(value) => setField('year', Number(value))}
											width='100%'
											sizes='normal'
										>
											{yearOptions.map((y) => (
												<SelectItem key={y} label={y} value={y} />
											))}
										</Select>
									</Field>
									<Field label='Month'>
										<Select
											label='Month'
											defaultValue={String(fields.month)}
											onChange={(value) => setField('month', Number(value))}
											width='100%'
											sizes='normal'
										>
											{monthOptions.map((m) => (
												<SelectItem key={m.value} label={m.label} value={m.value} />
											))}
										</Select>
									</Field>
								</>
							)}
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead num='02' title='Compensation' hint='Rate type, rate and hours (for hourly)' />
						<FieldGrid>
							<Field label='Rate type'>
								<Select
									label='Rate type'
									defaultValue={fields.rateType}
									onChange={(value) => setField('rateType', value as RateType)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Hourly' value='HOURLY' />
									<SelectItem label='Monthly' value='MONTHLY' />
								</Select>
							</Field>
							<Field
								label={`Rate (${fields.rateType === 'HOURLY' ? '$/h' : '$/month'})`}
								required
								error={errors.rate}
							>
								<TextField
									name='rate'
									type='number'
									placeholder='0.00'
									value={fields.rate}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setField('rate', e.target.value)}
									width='100%'
									error={!!errors.rate}
								/>
							</Field>
							{fields.rateType === 'HOURLY' && (
								<Field label='Hours' required error={errors.hours}>
									<TextField
										name='hours'
										type='number'
										placeholder='0.00'
										value={fields.hours}
										onChange={(e: ChangeEvent<HTMLInputElement>) => setField('hours', e.target.value)}
										width='100%'
										error={!!errors.hours}
									/>
								</Field>
							)}
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead num='03' title='Bonuses & advance' hint='Optional adjustments applied to the accrual' />
						<FieldGrid>
							<Field label='Bonus %' hint='Percent of salary + tax'>
								<TextField
									name='bonusPercent'
									type='number'
									placeholder='0'
									value={fields.bonusPercent}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('bonusPercent', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Fixed bonus'>
								<TextField
									name='fixedBonus'
									type='number'
									placeholder='0.00'
									value={fields.fixedBonus}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('fixedBonus', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Advance' hint='Reduces remaining-to-pay only'>
								<TextField
									name='advance'
									type='number'
									placeholder='0.00'
									value={fields.advance}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('advance', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Note' span='full'>
								<TextField
									name='note'
									placeholder='Optional note'
									value={fields.note}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setField('note', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={260}>
						<SectionHead num='04' title='Preview' hint='Computed from the formulas — read only' />
						<PreviewGrid>
							<PreviewRow>
								<span>Base</span>
								<Mono>${fmt(preview.base)}</Mono>
							</PreviewRow>
							<PreviewRow>
								<span>Tax (42.5 + 6%)</span>
								<Mono>${fmt(preview.tax)}</Mono>
							</PreviewRow>
							<PreviewRow>
								<span>Salary + tax</span>
								<Mono>${fmt(preview.swt)}</Mono>
							</PreviewRow>
							<PreviewRow>
								<span>Bonus</span>
								<Mono>${fmt(preview.bonusAmt)}</Mono>
							</PreviewRow>
							<PreviewRow>
								<span>Total accrued</span>
								<MonoStrong>${fmt(preview.total)}</MonoStrong>
							</PreviewRow>
							<PreviewRow>
								<span>Remaining to pay</span>
								<Mono>${fmt(preview.remain)}</Mono>
							</PreviewRow>
							<PreviewRow>
								<span>Payoneer fee (3%)</span>
								<Mono>${fmt(preview.fee)}</Mono>
							</PreviewRow>
							<PreviewRow>
								<span>Company cost</span>
								<MonoAccent>${fmt(preview.cost)}</MonoAccent>
							</PreviewRow>
						</PreviewGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Editing draft entry' : 'Entry will be created as a Draft'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton type='button' onClick={() => navigate('/finances/salaries')}>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate permission={isEdit ? 'salaries:update' : 'salaries:create'}>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create entry'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

interface PayrollFormProps {
	id?: string
	defaultYear?: number
	defaultMonth?: number
}

const PayrollForm = ({ id, defaultYear, defaultMonth }: PayrollFormProps) => {
	const { data, isLoading, isError } = useGetPayrollByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading payroll entry…' />
	if (id && (isError || !data)) return <FormNotFound label='Payroll entry not found' />

	const initial: FormFields = data
		? {
				employeeId: data.employeeId,
				year: data.year,
				month: data.month,
				rateType: data.rateType,
				rate: data.rate,
				hours: data.hours ?? '',
				bonusPercent: data.bonusPercent,
				fixedBonus: data.fixedBonus,
				advance: data.advance,
				note: data.note ?? '',
			}
		: emptyFields(defaultYear ?? currentYear(), defaultMonth ?? currentMonth())

	return <PayrollFormInner id={id} initial={initial} lockPeriod={Boolean(id)} />
}

export default PayrollForm

/* ── Preview grid ─────────────────────────────────────────────────────── */

const PreviewGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 8px 24px;
	padding: 16px 18px;
	border-radius: 14px;
	background: ${T.primaryTint};
	border: 1px solid #d5e5f3;

	@media (max-width: 560px) {
		grid-template-columns: 1fr;
	}
`

const PreviewRow = styled.div`
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 10px;
	font-size: 13px;
	color: ${T.textStrong};
`

const Mono = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-variant-numeric: tabular-nums;
	color: ${T.textStrong};
`

const MonoStrong = styled(Mono)`
	font-weight: 700;
`

const MonoAccent = styled(Mono)`
	font-weight: 700;
	color: ${T.primary};
`

const StaticValue = styled.div`
	padding: 10px 12px;
	border-radius: 10px;
	background: ${T.subtleBg};
	border: 1px solid ${T.border};
	font-size: 13.5px;
	color: ${T.textStrong};
`
