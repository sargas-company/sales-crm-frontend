import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LocalOfferOutlined } from '@mui/icons-material'
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
	useGetSalaryReviewByIdQuery,
	useCreateSalaryReviewMutation,
	useUpdateSalaryReviewMutation,
	type SalaryReviewResult,
} from '../../../store/salary-reviews/salaryReviewsApi'
import type { RateType } from '../../../store/payroll/payrollApi'

interface FormFields {
	employeeId: string
	scheduledDate: string
	previousRateType: RateType | ''
	previousRate: string
	newRateType: RateType | ''
	newRate: string
	effectiveDate: string
	result: SalaryReviewResult | ''
	note: string
}

interface FormErrors {
	employeeId?: string
	scheduledDate?: string
	newRate?: string
	newRateType?: string
	effectiveDate?: string
}

const empty: FormFields = {
	employeeId: '',
	scheduledDate: new Date().toISOString().slice(0, 10),
	previousRateType: '',
	previousRate: '',
	newRateType: '',
	newRate: '',
	effectiveDate: '',
	result: '',
	note: '',
}

const SalaryReviewFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [create, { isLoading: creating }] = useCreateSalaryReviewMutation()
	const [update, { isLoading: updating }] = useUpdateSalaryReviewMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 500 })
	const employees = employeesPage?.data ?? []

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.employeeId) next.employeeId = 'Select an employee'
		if (!fields.scheduledDate) next.scheduledDate = 'Scheduled date is required'
		if (fields.result === 'INCREASED') {
			if (!fields.newRateType) next.newRateType = 'New rate type is required'
			if (!fields.newRate) next.newRate = 'New rate is required'
			if (!fields.effectiveDate) next.effectiveDate = 'Effective date is required'
		}
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const body = {
			scheduledDate: fields.scheduledDate,
			previousRateType: fields.previousRateType || undefined,
			previousRate: fields.previousRate ? parseFloat(fields.previousRate) : undefined,
			newRateType: fields.newRateType || undefined,
			newRate: fields.newRate ? parseFloat(fields.newRate) : undefined,
			effectiveDate: fields.effectiveDate || undefined,
			result: fields.result || undefined,
			note: fields.note.trim() || undefined,
		}
		try {
			if (isEdit) {
				await update({ id: id!, body }).unwrap()
				showToast('Salary review updated', 'success')
			} else {
				await create({ employeeId: fields.employeeId, ...body }).unwrap()
				showToast('Salary review created', 'success')
			}
			navigate('/finances/promotions')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const requiresIncreaseFields = fields.result === 'INCREASED'

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/finances/promotions'
					backLabel='Back to salary reviews'
					icon={<LocalOfferOutlined />}
					title={isEdit ? 'Edit salary review' : 'Schedule salary review'}
					subtitle={
						isEdit
							? 'Update the review — completing as INCREASED writes a new effective rate.'
							: 'Record an upcoming or completed rate review.'
					}
					badgeLabel={isEdit ? 'Edit' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Employee & schedule' hint='Who and when' />
						<FieldGrid>
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
							<Field label='Scheduled date' required error={errors.scheduledDate}>
								<TextField
									name='scheduledDate'
									type='date'
									value={fields.scheduledDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('scheduledDate', e.target.value)
									}
									width='100%'
									error={!!errors.scheduledDate}
								/>
							</Field>
							<Field label='Result'>
								<Select
									label='Result'
									defaultValue={fields.result || ''}
									onChange={(value) =>
										setField('result', value as SalaryReviewResult | '')
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Pending (upcoming)' value='' />
									<SelectItem label='Increased' value='INCREASED' />
									<SelectItem label='No change' value='NO_CHANGE' />
									<SelectItem label='Postponed' value='POSTPONED' />
								</Select>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead num='02' title='Previous rate' hint='What the employee was paid before the review' />
						<FieldGrid>
							<Field label='Previous rate type'>
								<Select
									label='Previous rate type'
									defaultValue={fields.previousRateType || ''}
									onChange={(value) => setField('previousRateType', value as RateType | '')}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='—' value='' />
									<SelectItem label='Hourly' value='HOURLY' />
									<SelectItem label='Monthly' value='MONTHLY' />
								</Select>
							</Field>
							<Field label='Previous rate'>
								<TextField
									name='previousRate'
									type='number'
									placeholder='0.00'
									value={fields.previousRate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('previousRate', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={200}>
						<SectionHead
							num='03'
							title='New rate'
							hint={
								requiresIncreaseFields
									? 'Required — result is set to Increased'
									: 'Optional — fill when the review lands on Increased'
							}
						/>
						<FieldGrid>
							<Field
								label='New rate type'
								required={requiresIncreaseFields}
								error={errors.newRateType}
							>
								<Select
									label='New rate type'
									defaultValue={fields.newRateType || ''}
									onChange={(value) => setField('newRateType', value as RateType | '')}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='—' value='' />
									<SelectItem label='Hourly' value='HOURLY' />
									<SelectItem label='Monthly' value='MONTHLY' />
								</Select>
							</Field>
							<Field
								label='New rate'
								required={requiresIncreaseFields}
								error={errors.newRate}
							>
								<TextField
									name='newRate'
									type='number'
									placeholder='0.00'
									value={fields.newRate}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setField('newRate', e.target.value)}
									width='100%'
									error={!!errors.newRate}
								/>
							</Field>
							<Field
								label='Effective date'
								required={requiresIncreaseFields}
								error={errors.effectiveDate}
							>
								<TextField
									name='effectiveDate'
									type='date'
									value={fields.effectiveDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('effectiveDate', e.target.value)
									}
									width='100%'
									error={!!errors.effectiveDate}
								/>
							</Field>
							<Field label='Note' span='full'>
								<TextField
									name='note'
									placeholder='Optional context, e.g. rationale for the change'
									value={fields.note}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setField('note', e.target.value)}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Editing salary review'
								: requiresIncreaseFields
									? 'Increased review creates a new effective rate'
									: 'Review will be created'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/finances/promotions')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={isEdit ? 'compensation_reviews:update' : 'compensation_reviews:create'}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create review'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const SalaryReviewForm = ({ id }: { id?: string }) => {
	const { data, isLoading, isError } = useGetSalaryReviewByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading salary review…' />
	if (id && (isError || !data)) return <FormNotFound label='Salary review not found' />

	const initial: FormFields = data
		? {
				employeeId: data.employeeId,
				scheduledDate: data.scheduledDate,
				previousRateType: data.previousRateType ?? '',
				previousRate: data.previousRate ?? '',
				newRateType: data.newRateType ?? '',
				newRate: data.newRate ?? '',
				effectiveDate: data.effectiveDate ?? '',
				result: data.result ?? '',
				note: data.note ?? '',
			}
		: empty

	return <SalaryReviewFormInner id={id} initial={initial} />
}

export default SalaryReviewForm
