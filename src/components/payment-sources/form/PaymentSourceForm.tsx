import { ChangeEvent, FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountBalanceWalletOutlined } from '@mui/icons-material'
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
	useGetPaymentSourceByIdQuery,
	useCreatePaymentSourceMutation,
	useUpdatePaymentSourceMutation,
} from '../../../store/payment-sources/paymentSourcesApi'

const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'UAH', 'PLN', 'CZK', 'CHF', 'CAD']

interface FormFields {
	name: string
	description: string
	currency: string
	isActive: 'active' | 'inactive'
}

interface FormErrors {
	name?: string
}

const empty: FormFields = {
	name: '',
	description: '',
	currency: 'USD',
	isActive: 'active',
}

const PaymentSourceFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [create, { isLoading: creating }] = useCreatePaymentSourceMutation()
	const [update, { isLoading: updating }] = useUpdatePaymentSourceMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!fields.name.trim()) next.name = 'Name is required'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const body = {
			name: fields.name.trim(),
			description: fields.description.trim() || undefined,
			currency: fields.currency.toUpperCase(),
			isActive: fields.isActive === 'active',
		}
		try {
			if (isEdit) {
				await update({ id: id!, body }).unwrap()
				showToast('Payment source updated', 'success')
			} else {
				await create(body).unwrap()
				showToast('Payment source created', 'success')
			}
			navigate('/finances/payment-source')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/finances/payment-source'
					backLabel='Back to payment sources'
					icon={<AccountBalanceWalletOutlined />}
					title={isEdit ? 'Edit payment source' : 'New payment source'}
					subtitle={
						isEdit
							? 'Update the record.'
							: 'Add a new account or wallet the business uses to collect payments.'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Identity' hint='Name and short description' />
						<FieldGrid>
							<Field label='Name' required error={errors.name} span='full'>
								<TextField
									name='name'
									placeholder='e.g. Payoneer USD'
									value={fields.name}
									onChange={(e: ChangeEvent<HTMLInputElement>) => setField('name', e.target.value)}
									width='100%'
									error={!!errors.name}
								/>
							</Field>
							<Field label='Description' hint='Optional — free-form note' span='full'>
								<TextField
									name='description'
									placeholder='e.g. Primary USD receiving account'
									value={fields.description}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('description', e.target.value)
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead num='02' title='Configuration' hint='Currency and availability' />
						<FieldGrid>
							<Field label='Currency'>
								<Select
									label='Currency'
									defaultValue={fields.currency}
									onChange={(value) => setField('currency', value as string)}
									width='100%'
									sizes='normal'
								>
									{CURRENCY_OPTIONS.map((c) => (
										<SelectItem key={c} label={c} value={c} />
									))}
								</Select>
							</Field>
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.isActive}
									onChange={(value) => setField('isActive', value as 'active' | 'inactive')}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Active' value='active' />
									<SelectItem label='Inactive' value='inactive' />
								</Select>
							</Field>
						</FieldGrid>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Editing payment source' : 'Source will be created immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/finances/payment-source')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={isEdit ? 'payment_sources:update' : 'payment_sources:create'}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create source'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const PaymentSourceForm = ({ id }: { id?: string }) => {
	const { data, isLoading, isError } = useGetPaymentSourceByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading payment source…' />
	if (id && (isError || !data)) return <FormNotFound label='Payment source not found' />

	const initial: FormFields = data
		? {
				name: data.name,
				description: data.description ?? '',
				currency: data.currency,
				isActive: data.isActive ? 'active' : 'inactive',
			}
		: empty

	return <PaymentSourceFormInner id={id} initial={initial} />
}

export default PaymentSourceForm
