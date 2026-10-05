import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountCircleOutlined } from '@mui/icons-material'
import { TextField, Select, SelectItem } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../auth/PermissionGate'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../_shared/FormShell'
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
} from '../_shared/formShell.styled'
import {
	useCreateLinkedInAccountMutation,
	useGetLinkedInAccountByIdQuery,
	useUpdateLinkedInAccountMutation,
	type LinkedInAccountType,
} from '../../store/linkedin-accounts/linkedInAccountsApi'
import { useGetEmployeesQuery } from '../../store/employees/employeesApi'

interface FormFields {
	displayName: string
	type: LinkedInAccountType
	profileUrl: string
	employeeId: string
	avatarUrl: string
	isActive: 'active' | 'inactive'
	note: string
}

interface FormErrors {
	displayName?: string
	profileUrl?: string
	type?: string
}

const empty: FormFields = {
	displayName: '',
	type: 'PERSONAL',
	profileUrl: '',
	employeeId: '',
	avatarUrl: '',
	isActive: 'active',
	note: '',
}

const AccountFormInner = ({
	id,
	initial,
}: {
	id?: string
	initial: FormFields
}) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [create, { isLoading: creating }] = useCreateLinkedInAccountMutation()
	const [update, { isLoading: updating }] = useUpdateLinkedInAccountMutation()
	const { data: employeesPage } = useGetEmployeesQuery({ page: 1, limit: 200 })

	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.displayName.trim()) next.displayName = 'Display name is required'
		if (!fields.profileUrl.trim()) next.profileUrl = 'Profile URL is required'
		else if (!/^https?:\/\//i.test(fields.profileUrl.trim()))
			next.profileUrl = 'Must start with http(s)://'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const body = {
			displayName: fields.displayName.trim(),
			type: fields.type,
			profileUrl: fields.profileUrl.trim(),
			employeeId: fields.employeeId || undefined,
			avatarUrl: fields.avatarUrl.trim() || undefined,
			isActive: fields.isActive === 'active',
			note: fields.note.trim() || undefined,
		}
		try {
			if (isEdit) {
				await update({ id: id!, body }).unwrap()
				showToast('LinkedIn account updated', 'success')
			} else {
				await create(body).unwrap()
				showToast('LinkedIn account created', 'success')
			}
			navigate('/linkedin/accounts')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/linkedin/accounts'
					backLabel='Back to accounts'
					icon={<AccountCircleOutlined />}
					title={isEdit ? 'Edit LinkedIn account' : 'New LinkedIn account'}
					subtitle={
						isEdit
							? 'Update the profile or page used for posting.'
							: 'Add a profile or company page you publish content from.'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='Display name, type and public URL'
						/>
						<FieldGrid>
							<Field label='Display name' required error={errors.displayName} span='full'>
								<TextField
									name='displayName'
									placeholder='e.g. Sargas Consulting or Alice Whitaker'
									value={fields.displayName}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('displayName', e.target.value)
									}
									width='100%'
									error={!!errors.displayName}
								/>
							</Field>
							<Field label='Type' required>
								<Select
									label='Type'
									defaultValue={fields.type}
									onChange={(value) => setField('type', value as LinkedInAccountType)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Personal profile' value='PERSONAL' />
									<SelectItem label='Company page' value='COMPANY' />
								</Select>
							</Field>
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.isActive}
									onChange={(value) =>
										setField('isActive', value as 'active' | 'inactive')
									}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Active' value='active' />
									<SelectItem label='Inactive' value='inactive' />
								</Select>
							</Field>
							<Field
								label='LinkedIn URL'
								required
								error={errors.profileUrl}
								span='full'
							>
								<TextField
									name='profileUrl'
									placeholder='https://www.linkedin.com/in/alice-whitaker/'
									value={fields.profileUrl}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('profileUrl', e.target.value)
									}
									width='100%'
									error={!!errors.profileUrl}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Ownership & media'
							hint='Linked employee, avatar URL, and note'
						/>
						<FieldGrid>
							<Field label='Linked employee' hint='Optional — for personal profiles'>
								<Select
									label='Employee'
									defaultValue={fields.employeeId}
									onChange={(value) => setField('employeeId', value as string)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='— None —' value='' />
									{(employeesPage?.data ?? []).map((emp) => (
										<SelectItem
											key={emp.id}
											label={`${emp.firstName} ${emp.lastName}`}
											value={emp.id}
										/>
									))}
								</Select>
							</Field>
							<Field label='Avatar / logo URL' hint='Optional'>
								<TextField
									name='avatarUrl'
									placeholder='https://…'
									value={fields.avatarUrl}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('avatarUrl', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='Note' hint='Optional — internal-only context' span='full'>
								<TextField
									name='note'
									placeholder='e.g. Owner profile — thought leadership only'
									value={fields.note}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('note', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Editing LinkedIn account' : 'Account will be created immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/linkedin/accounts')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={
									isEdit ? 'linkedin_accounts:update' : 'linkedin_accounts:create'
								}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create account'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const AccountForm = ({ id }: { id?: string }) => {
	const { data, isLoading, isError } = useGetLinkedInAccountByIdQuery(id!, {
		skip: !id,
	})

	if (id && isLoading) return <FormLoading label='Loading account…' />
	if (id && (isError || !data))
		return <FormNotFound label='LinkedIn account not found' />

	const initial: FormFields = data
		? {
				displayName: data.displayName,
				type: data.type,
				profileUrl: data.profileUrl,
				employeeId: data.employeeId ?? '',
				avatarUrl: data.avatarUrl ?? '',
				isActive: data.isActive ? 'active' : 'inactive',
				note: data.note ?? '',
			}
		: empty

	return <AccountFormInner id={id} initial={initial} />
}

export default AccountForm
