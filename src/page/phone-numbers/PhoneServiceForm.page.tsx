import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { AppsRounded, DeleteOutline } from '@mui/icons-material'
import { TextField } from '../../ui'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../../components/auth/PermissionGate'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../components/_shared/FormShell'
import {
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../components/_shared/formShell.styled'
import {
	slugifyServiceName,
	useCreatePhoneServiceMutation,
	useGetPhoneServiceQuery,
	useRemovePhoneServiceMutation,
	useUpdatePhoneServiceMutation,
} from '../../store/phone-numbers/phoneServicesApi'

interface Props {
	mode: 'create' | 'edit' | 'view'
}

const PhoneServiceForm = ({ mode }: Props) => {
	const { id } = useParams()
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const needsExisting = mode === 'edit' || mode === 'view'
	const existingQuery = useGetPhoneServiceQuery(id!, {
		skip: !needsExisting || !id,
	})
	const isEdit = mode === 'edit'
	const isView = mode === 'view'
	const readOnly = isView
	const existing = existingQuery.data

	const [name, setName] = useState('')
	const [nameError, setNameError] = useState<string | null>(null)

	/* Slug is always derived from name — no manual override. Edits to
	 * the name produce a new slug (lower-case, "_" between words). The
	 * server is the one that enforces slug uniqueness. */
	const effectiveSlug = useMemo(() => slugifyServiceName(name), [name])

	useEffect(() => {
		if (existing) {
			setName(existing.name)
		}
	}, [existing])

	/* Reset scroll on mode change so view→edit doesn't land halfway down. */
	useEffect(() => {
		window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
	}, [mode, id])

	/* Dirty check: in edit mode, disable Save unless name actually
	 * changed. Slug is auto-derived from name so comparing name alone
	 * is enough. */
	const isDirty = (() => {
		if (!isEdit || !existing) return true
		return name.trim() !== existing.name
	})()

	const [createMut, { isLoading: isCreating }] = useCreatePhoneServiceMutation()
	const [updateMut, { isLoading: isUpdating }] = useUpdatePhoneServiceMutation()
	const [removeMut, { isLoading: isRemovingMut }] =
		useRemovePhoneServiceMutation()

	const [confirmingRemove, setConfirmingRemove] = useState(false)

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const trimmedName = name.trim()
		const trimmedSlug = effectiveSlug.trim()
		if (!trimmedName || !trimmedSlug) {
			setNameError(
				!trimmedName
					? 'Name is required'
					: 'Could not derive a valid slug from the name',
			)
			const el = document.getElementById('service-name') as
				| HTMLInputElement
				| null
			el?.focus()
			el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
			return
		}
		setNameError(null)
		try {
			if (isEdit && existing) {
				await updateMut({
					id: existing.id,
					body: { name: trimmedName, slug: trimmedSlug },
				}).unwrap()
				showToast('Service saved', 'success')
				navigate(`/phone-numbers/services/${existing.id}`)
			} else {
				const created = await createMut({
					name: trimmedName,
					slug: trimmedSlug,
				}).unwrap()
				showToast('Service created', 'success')
				navigate(`/phone-numbers/services/${created.id}`)
			}
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const handleRemove = async () => {
		if (!existing) return
		try {
			await removeMut(existing.id).unwrap()
			showToast('Service removed', 'success')
			navigate('/phone-numbers/services')
		} catch (err) {
			showToast(parseServerError(err), 'error')
			setConfirmingRemove(false)
		}
	}

	if (needsExisting && existingQuery.isLoading) return <FormLoading />
	if (needsExisting && !existing) return <FormNotFound label='Phone service' />

	const bindingsCount = existing?.bindingsCount ?? 0

	return (
		<Shell $dark={isDark} key={`${mode}-${id ?? 'new'}`}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/phone-numbers/services'
					backLabel='Back to services'
					icon={<AppsRounded />}
					title={
						isView
							? 'Phone service'
							: isEdit
								? 'Edit phone service'
								: 'New phone service'
					}
					subtitle={
						isView
							? `Read-only view of "${existing?.name ?? ''}" — hit "Edit" to make changes.`
							: isEdit
								? `Rename or re-slug "${existing?.name ?? ''}" — bindings follow automatically.`
								: 'Add a service that phone numbers can be assigned to.'
					}
					badgeLabel={isView ? 'View' : isEdit ? 'Edit' : 'Draft'}
					badgeTone={isView ? 'view' : isEdit ? 'edit' : 'draft'}
				/>
				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Identity'
							hint='Display name and URL-safe slug. Slug fills in from the name automatically.'
						/>
						<FieldGrid>
							<Field
								label='Name'
								htmlFor='service-name'
								required
								error={nameError ?? undefined}
							>
								<TextField
									id='service-name'
									value={name}
									onChange={(e) => {
										setName(e.target.value)
										if (nameError && e.target.value.trim())
											setNameError(null)
									}}
									placeholder='WhatsApp'
									required
									disabled={readOnly}
									error={!!nameError}
								/>
							</Field>
							<Field label='Slug' hint='auto-generated'>
								<SlugBox $dark={isDark}>
									<span className='slug-prefix'>/</span>
									<span className='slug-value'>
										{effectiveSlug || 'service-slug'}
									</span>
								</SlugBox>
							</Field>
						</FieldGrid>
					</Section>

					{needsExisting && existing && (
						<Section $delay={140}>
							<SectionHead
								num='02'
								title='Usage'
								hint='How many phone bindings currently reference this service.'
							/>
							<UsageRow>
								<UsageCount $muted={bindingsCount === 0}>
									{bindingsCount}
								</UsageCount>
								<UsageLabel>
									{bindingsCount === 0
										? 'No phone bindings use this service yet.'
										: `${bindingsCount} phone binding${bindingsCount === 1 ? '' : 's'} currently reference this service.`}
								</UsageLabel>
							</UsageRow>
						</Section>
					)}

					<FootBar $dark={isDark}>
						<FootLeft>
							{isEdit && existing && bindingsCount === 0 && (
								<PermissionGate permission='phone_numbers:update'>
									<PrimaryGhostButton
										type='button'
										onClick={() => setConfirmingRemove(true)}
									>
										Delete service
									</PrimaryGhostButton>
								</PermissionGate>
							)}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/phone-numbers/services')}
							>
								{isView ? 'Back' : 'Cancel'}
							</PrimaryGhostButton>
							{isView && existing ? (
								<PermissionGate
									key='nav-edit'
									permission='phone_numbers:update'
								>
									<PrimarySolidButton
										key='nav-edit-btn'
										type='button'
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											navigate(
												`/phone-numbers/services/${existing.id}/edit`,
											)
										}}
									>
										Edit
									</PrimarySolidButton>
								</PermissionGate>
							) : (
								<PermissionGate
									key='submit'
									permission='phone_numbers:update'
								>
									<PrimarySolidButton
										key='submit-btn'
										type='submit'
										disabled={isCreating || isUpdating || !isDirty}
									>
										{isCreating || isUpdating
											? 'Saving…'
											: isEdit
												? 'Save changes'
												: 'Create'}
									</PrimarySolidButton>
								</PermissionGate>
							)}
						</FootActions>
					</FootBar>
				</form>
			</Surface>

			{confirmingRemove && existing && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					confirmColor='error'
					title='Delete service?'
					description={
						<>
							This permanently deletes <strong>{existing.name}</strong>.
							The delete fails if any phone binding still references it.
						</>
					}
					confirmLabel='Delete'
					confirmLoadingLabel='Deleting…'
					cancelLabel='Cancel'
					isLoading={isRemovingMut}
					onConfirm={handleRemove}
					onClose={() => {
						if (!isRemovingMut) setConfirmingRemove(false)
					}}
				/>
			)}
		</Shell>
	)
}

export default PhoneServiceForm

const UsageRow = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 14px;
	padding: 12px 16px;
	border-radius: 12px;
	background: rgba(15, 23, 42, 0.03);
	border: 1px solid rgba(15, 23, 42, 0.06);
`
const UsageCount = styled.span<{ $muted?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 44px;
	height: 44px;
	padding: 0 14px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 20px;
	font-weight: 700;
	background: ${(p) =>
		p.$muted ? 'rgba(100, 116, 139, 0.1)' : 'rgba(3, 105, 161, 0.1)'};
	color: ${(p) => (p.$muted ? '#64748b' : '#0369a1')};
`
const UsageLabel = styled.span`
	font-size: 13.5px;
	color: #475569;
	line-height: 1.4;
`

const SlugBox = styled.div<{ $dark: boolean }>`
	display: flex;
	align-items: center;
	gap: 4px;
	box-sizing: border-box;
	padding: 1rem 0.8rem;
	border-radius: 8px;
	background: ${({ $dark }) => ($dark ? 'rgba(255, 255, 255, 0.03)' : '#faf9fd')};
	border: 1.5px dashed ${({ $dark }) => ($dark ? '#3a4252' : '#dedaee')};
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13px;
	line-height: 1.4;
	overflow: hidden;

	.slug-prefix {
		color: ${({ $dark }) => ($dark ? '#5a6070' : '#a29fb5')};
	}
	.slug-value {
		color: ${({ $dark }) => ($dark ? '#c7c9d3' : '#5a5476')};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
`
