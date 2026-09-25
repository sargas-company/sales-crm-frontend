import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField, Button, Select, SelectItem } from '../../../ui'
import {
	useGetAccountByIdQuery,
	useCreateAccountMutation,
	useUpdateAccountMutation,
} from '../../../store/accounts/accountsApi'
import { useGetPlatformsQuery } from '../../../store/platforms/platformsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface AccountFormProps {
	id?: string
}

interface FormFields {
	firstName: string
	lastName: string
	platformId: string
}

interface FormErrors {
	firstName?: string
	lastName?: string
	platformId?: string
}

const empty: FormFields = { firstName: '', lastName: '', platformId: '' }

const UserIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<circle cx='12' cy='7' r='4' stroke='currentColor' strokeWidth='1.8' />
	</svg>
)

const AccountFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createAccount, { isLoading: creating }] = useCreateAccountMutation()
	const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation()
	const { data: platforms = [], isLoading: platformsLoading } = useGetPlatformsQuery()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.firstName.trim()) next.firstName = 'First name is required'
		if (!fields.lastName.trim()) next.lastName = 'Last name is required'
		if (!fields.platformId) next.platformId = 'Select a platform'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		try {
			if (isEdit) {
				await updateAccount({
					id: id!,
					body: {
						firstName: fields.firstName || undefined,
						lastName: fields.lastName || undefined,
						platformId: fields.platformId || undefined,
					},
				}).unwrap()
				showToast('Account updated successfully', 'success')
			} else {
				await createAccount({
					firstName: fields.firstName,
					lastName: fields.lastName,
					platformId: fields.platformId,
				}).unwrap()
				showToast('Account created successfully', 'success')
			}
			navigate('/accounts/list/')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/accounts/list/'
					backLabel='Back to accounts'
					icon={<UserIcon />}
					title={isEdit ? 'Edit account' : 'New account'}
					subtitle={
						isEdit
							? 'Update the developer account details below'
							: 'Fill in the details to add a new developer account'
					}
					badgeLabel={isEdit ? 'Editing' : 'New'}
					badgeTone={isEdit ? 'edit' : 'new'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='The developer’s full name — used across proposals and platforms'
						/>
						<FieldGrid>
							<Field label='First name' required error={errors.firstName}>
								<TextField
									name='firstName'
									placeholder='e.g. Dmytro'
									value={fields.firstName}
									onChange={(e) => setField('firstName', e.target.value)}
									error={!!errors.firstName}
									width='100%'
								/>
							</Field>
							<Field label='Last name' required error={errors.lastName}>
								<TextField
									name='lastName'
									placeholder='e.g. Sarafaniuk'
									value={fields.lastName}
									onChange={(e) => setField('lastName', e.target.value)}
									error={!!errors.lastName}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Platform'
							hint='Where this account exists — proposals will be attributed here'
						/>
						<FieldGrid>
							<Field label='Platform' required error={errors.platformId} span='full'>
								<Select
									label={platformsLoading ? 'Loading…' : 'Select platform'}
									defaultValue={fields.platformId}
									onChange={(value) => setField('platformId', value)}
									width='100%'
									sizes='normal'
								>
									{platforms.map((p) => (
										<SelectItem key={p.id} label={p.title} value={p.id} />
									))}
								</Select>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit
								? 'Changes are saved when you press Save'
								: 'Account will be added to the list right away'}
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/accounts/list/')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create account'}
							</Button>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const AccountForm = ({ id }: AccountFormProps) => {
	const { data, isLoading } = useGetAccountByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading account…' />
	if (id && !data) return <FormNotFound label='Account not found' />

	const initial: FormFields = data
		? { firstName: data.firstName, lastName: data.lastName, platformId: data.platformId }
		: empty

	return <AccountFormInner id={id} initial={initial} />
}

export default AccountForm
