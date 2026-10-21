import { ChangeEvent, FormEvent, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { CheckRounded, GroupsOutlined, AddRounded } from '@mui/icons-material'
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
	useGetEmployeeByIdQuery,
	useCreateEmployeeMutation,
	useUpdateEmployeeMutation,
	type EmployeeStatus,
} from '../../../store/employees/employeesApi'
import { useGetPositionsQuery } from '../../../store/positions/positionsApi'

interface Props {
	id?: string
}

interface FormFields {
	firstName: string
	lastName: string
	email: string
	phone: string
	positions: string[]
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
	positions: [],
	status: 'ACTIVE',
	hiredAt: '',
	dateOfBirth: '',
}

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
		// Email is optional now; only validate shape when the user
		// actually typed something.
		const trimmedEmail = fields.email.trim()
		if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
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
						email: fields.email.trim() || undefined,
						phone: fields.phone || undefined,
						positions: fields.positions,
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
					email: fields.email.trim() || undefined,
					phone: fields.phone || undefined,
					positions: fields.positions,
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
							<Field label='Email' error={errors.email}>
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
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.status}
									onChange={(value) => setField('status', value as EmployeeStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Active' value='ACTIVE' />
									<SelectItem label='Bench' value='BENCH' />
									<SelectItem label='Terminated' value='TERMINATED' />
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
							<Field
								label='Positions'
								hint='Pick from the Position catalogue — manage the catalogue on the Positions page.'
								span='full'
							>
								<PositionPicker
									selected={fields.positions}
									onChange={(next) => setField('positions', next)}
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
				email: data.email ?? '',
				phone: data.phone ?? '',
				positions: data.positions.map((p) => p.id),
				status: data.status,
				hiredAt: data.hiredAt ? data.hiredAt.slice(0, 10) : '',
				dateOfBirth: data.dateOfBirth ? data.dateOfBirth.slice(0, 10) : '',
			}
		: empty

	return <EmployeeFormInner id={id} initial={initial} />
}

export default EmployeeForm

/** Chip-based multi-select over the Position catalogue. `selected`
 *  carries Position UUIDs; the backend accepts the same shape and
 *  resolves them to junction rows via `positions.set` / `connect`. */
const PositionPicker = ({
	selected,
	onChange,
}: {
	selected: string[]
	onChange: (next: string[]) => void
}) => {
	const { data, isLoading, isError } = useGetPositionsQuery()

	const positions = useMemo(() => data ?? [], [data])
	const selectedSet = useMemo(() => new Set(selected), [selected])

	const toggle = (id: string) => {
		if (selectedSet.has(id)) {
			onChange(selected.filter((p) => p !== id))
		} else {
			onChange([...selected, id])
		}
	}

	if (isLoading) {
		return <PickerHint>Loading catalogue…</PickerHint>
	}
	if (isError) {
		return <PickerHint>Failed to load positions.</PickerHint>
	}
	if (positions.length === 0) {
		return (
			<PickerEmpty>
				<span>No positions in the catalogue yet.</span>
				<PickerAddLink to='/positions/add/'>
					<AddRounded />
					Add first position
				</PickerAddLink>
			</PickerEmpty>
		)
	}

	return (
		<PickerChips>
			{positions.map((p) => {
				const active = selectedSet.has(p.id)
				return (
					<PickerChip
						key={p.id}
						type='button'
						$active={active}
						onClick={() => toggle(p.id)}
					>
						{active && <CheckRounded />}
						{p.title}
					</PickerChip>
				)
			})}
		</PickerChips>
	)
}

const PickerChips = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 10px 0 2px;
`

const PickerChip = styled.button<{ $active: boolean; $legacy?: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.3px;
	white-space: nowrap;
	cursor: pointer;
	border: 1px solid
		${({ $active, $legacy }) =>
			$legacy
				? 'rgba(217, 119, 6, 0.45)'
				: $active
					? 'rgba(3, 105, 161, 0.55)'
					: 'rgba(3, 105, 161, 0.18)'};
	background: ${({ $active, $legacy }) =>
		$legacy
			? 'rgba(217, 119, 6, 0.14)'
			: $active
				? 'rgba(3, 105, 161, 0.14)'
				: 'rgba(3, 105, 161, 0.04)'};
	color: ${({ $legacy }) => ($legacy ? '#92400e' : T.primary)};
	transition:
		background 160ms ease,
		border-color 160ms ease,
		transform 160ms ease;

	svg {
		font-size: 14px;
	}

	&:hover {
		transform: translateY(-1px);
	}
`

const PickerHint = styled.div`
	font-size: 12.5px;
	color: ${T.textSecondary};
	padding: 10px 0 2px;
`

const PickerEmpty = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
	padding: 10px 0 2px;
	font-size: 12.5px;
	color: ${T.textSecondary};
	flex-wrap: wrap;
`

const PickerAddLink = styled(Link)`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	text-decoration: none;
	color: ${T.primary};
	background: ${T.primaryTint};
	border: 1px solid rgba(3, 105, 161, 0.25);

	svg {
		font-size: 15px;
	}

	&:hover {
		background: rgba(3, 105, 161, 0.14);
	}
`
