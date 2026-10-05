import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GroupsOutlined } from '@mui/icons-material'
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
import {
	useGetEmployeeByIdQuery,
	useCreateEmployeeMutation,
	useUpdateEmployeeMutation,
	type EmployeeStatus,
} from '../../../store/employees/employeesApi'

interface Props {
	id?: string
}

interface FormFields {
	firstName: string
	lastName: string
	email: string
	phone: string
	positionsText: string
	status: EmployeeStatus
	hiredAt: string
	dateOfBirth: string
}

interface FormErrors {
	firstName?: string
	lastName?: string
	email?: string
}

const empty: FormFields = {
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	positionsText: '',
	status: 'active',
	hiredAt: '',
	dateOfBirth: '',
}

const parsePositions = (text: string): string[] =>
	text
		.split(',')
		.map((p) => p.trim())
		.filter((p) => p.length > 0)

const EmployeeFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation()
	const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.firstName.trim()) next.firstName = 'First name is required'
		if (!fields.lastName.trim()) next.lastName = 'Last name is required'
		if (!fields.email.trim()) next.email = 'Email is required'
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
			next.email = 'Enter a valid email'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		try {
			if (isEdit) {
				await updateEmployee({
					id: id!,
					body: {
						firstName: fields.firstName,
						lastName: fields.lastName,
						email: fields.email,
						phone: fields.phone || undefined,
						positions: parsePositions(fields.positionsText),
						status: fields.status,
						hiredAt: fields.hiredAt || undefined,
						dateOfBirth: fields.dateOfBirth || null,
					},
				}).unwrap()
				showToast('Employee updated', 'success')
			} else {
				await createEmployee({
					firstName: fields.firstName,
					lastName: fields.lastName,
					email: fields.email,
					phone: fields.phone || undefined,
					positions: parsePositions(fields.positionsText),
					status: fields.status,
					hiredAt: fields.hiredAt || undefined,
					dateOfBirth: fields.dateOfBirth || null,
				}).unwrap()
				showToast('Employee created', 'success')
			}
			navigate('/employees/list')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/employees/list'
					backLabel='Back to employees'
					icon={<GroupsOutlined />}
					title={isEdit ? 'Edit employee' : 'New employee'}
					subtitle={isEdit ? 'Update team member details' : 'Add a new team member to the directory'}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Identity' hint='Name and contact info' />
						<FieldGrid>
							<Field label='First name' required error={errors.firstName}>
								<TextField
									name='first-name'
									placeholder='e.g. Alice'
									value={fields.firstName}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('firstName', e.target.value)
									}
									width='100%'
									error={!!errors.firstName}
								/>
							</Field>
							<Field label='Last name' required error={errors.lastName}>
								<TextField
									name='last-name'
									placeholder='e.g. Whitaker'
									value={fields.lastName}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('lastName', e.target.value)
									}
									width='100%'
									error={!!errors.lastName}
								/>
							</Field>
							<Field label='Email' required error={errors.email}>
								<TextField
									name='email'
									placeholder='name@company.com'
									value={fields.email}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('email', e.target.value)
									}
									width='100%'
									error={!!errors.email}
								/>
							</Field>
							<Field label='Phone'>
								<TextField
									name='phone'
									placeholder='+1 415 555 0134'
									value={fields.phone}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('phone', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead num='02' title='Team profile' hint='Roles and hiring info' />
						<FieldGrid>
							<Field
								label='Positions'
								hint='Comma-separated (e.g. "Backend engineer, Team lead")'
								span='full'
							>
								<TextField
									name='positions'
									placeholder='Backend engineer, Team lead'
									value={fields.positionsText}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('positionsText', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.status}
									onChange={(value) => setField('status', value as EmployeeStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Active' value='active' />
									<SelectItem label='Inactive' value='inactive' />
								</Select>
							</Field>
							<Field label='Hired at'>
								<TextField
									name='hiredAt'
									type='date'
									value={fields.hiredAt}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('hiredAt', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Date of birth' hint='Used for the birthday notifier (optional).'>
								<TextField
									name='dateOfBirth'
									type='date'
									value={fields.dateOfBirth}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('dateOfBirth', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Editing employee' : 'Employee will be created immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/employees/list')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate permission={isEdit ? 'employees:update' : 'employees:create'}>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create employee'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const EmployeeForm = ({ id }: Props) => {
	const { data, isLoading, isError } = useGetEmployeeByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading employee…' />
	if (id && (isError || !data)) return <FormNotFound label='Employee not found' />

	const initial: FormFields = data
		? {
				firstName: data.firstName,
				lastName: data.lastName,
				email: data.email,
				phone: data.phone ?? '',
				positionsText: data.positions.join(', '),
				status: data.status,
				hiredAt: data.hiredAt ? data.hiredAt.slice(0, 10) : '',
				dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
			}
		: empty

	return <EmployeeFormInner id={id} initial={initial} />
}

export default EmployeeForm
