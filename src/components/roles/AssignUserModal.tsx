import { FormEvent, useState } from 'react'
import styled from 'styled-components'
import Modal from '../../ui/overlay/Modal'
import Input from '../../ui/form/Input'
import { Button } from '../../ui'
import { PrimarySolidButton } from '../_shared/formShell.styled'
import { useAssignUserRoleMutation } from '../../store/roles/rolesApi'
import type { Role } from '../../store/roles/types'
import { extractRoleErrorMessage } from './errorMessage'
import { useToast } from '../../context/toast/ToastContext'

interface Props {
	role: Role
	onClose: () => void
	onAssigned?: () => void
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const AssignUserModal = ({ role, onClose, onAssigned }: Props) => {
	const [userId, setUserId] = useState('')
	const [touched, setTouched] = useState(false)
	const [assignUserRole, { isLoading }] = useAssignUserRoleMutation()
	const toast = useToast()

	const trimmed = userId.trim()
	const error =
		trimmed.length === 0
			? 'User UUID is required.'
			: UUID_REGEX.test(trimmed)
				? undefined
				: 'Must be a valid UUID.'
	const showError = touched ? error : undefined

	const handleBlur = () => {
		if (userId !== trimmed) setUserId(trimmed)
		setTouched(true)
	}

	const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		setTouched(true)
		if (error) return
		try {
			await assignUserRole({ userId: trimmed, roleId: role.id }).unwrap()
			toast.showToast('User assigned to role', 'success')
			onAssigned?.()
			onClose()
		} catch (err) {
			toast.showToast(extractRoleErrorMessage(err), 'error')
		}
	}

	return (
		<Modal handleOutClick={onClose}>
			<Shell role='dialog' aria-labelledby='assign-user-title'>
				<Header>
					<Title id='assign-user-title'>Assign user to role</Title>
					<Subtitle>
						Move a user to <strong>{role.label}</strong> ({role.name}). Reassigning the only
						Owner returns <code>LAST_OWNER_LOCK</code>.
					</Subtitle>
				</Header>

				<Form onSubmit={handleSubmit} noValidate>
					<Body>
						<Field>
							<FieldLabel htmlFor='assign-user-id'>User UUID</FieldLabel>
							<Input
								type='text'
								name='assign-user-id'
								id='assign-user-id'
								placeholder='00000000-0000-0000-0000-000000000000'
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								onBlur={handleBlur}
								sizes='small'
							/>
							<Helper $error={Boolean(showError)}>
								{showError ??
									'Paste user UUID; a users picker will land in a future feature.'}
							</Helper>
						</Field>
					</Body>

					<Actions>
						<Button type='button' varient='outlined' onClick={onClose}>
							Cancel
						</Button>
						<PrimarySolidButton
							type='submit'
							disabled={isLoading || (touched && Boolean(error))}
						>
							{isLoading ? 'Assigning…' : 'Assign'}
						</PrimarySolidButton>
					</Actions>
				</Form>
			</Shell>
		</Modal>
	)
}

export default AssignUserModal

const Shell = styled.div`
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	box-shadow: ${({ theme }) => theme.shadow!.lg};
	width: min(520px, calc(100vw - 32px));
	display: flex;
	flex-direction: column;
	overflow: hidden;
`

const Header = styled.div`
	padding: ${({ theme }) => theme.spacing!.lg}px ${({ theme }) => theme.spacing!.xl}px
		${({ theme }) => theme.spacing!.md}px;
	border-bottom: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
`

const Title = styled.h3`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.primary};
	font: ${({ theme }) => theme.typography!.h3.fontWeight}
		${({ theme }) => theme.typography!.h3.fontSize} /
		${({ theme }) => theme.typography!.h3.lineHeight}
		${({ theme }) => theme.typography!.h3.fontFamily};
`

const Subtitle = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.bodySm.fontSize};
	line-height: 1.5;

	code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 0.92em;
		padding: 1px 4px;
		border-radius: 3px;
		background: color-mix(
			in srgb,
			${({ theme }) => theme.colors!.border.subtle} 60%,
			transparent
		);
	}
`

const Form = styled.form`
	display: flex;
	flex-direction: column;
`

const Body = styled.div`
	padding: ${({ theme }) => theme.spacing!.lg}px ${({ theme }) => theme.spacing!.xl}px;
`

const Field = styled.div`
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.xs}px;
`

const FieldLabel = styled.label`
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	text-transform: uppercase;
	letter-spacing: ${({ theme }) => theme.typography!.caption.letterSpacing};
	font-weight: 600;
`

const Helper = styled.span<{ $error?: boolean }>`
	font-size: ${({ theme }) => theme.typography!.caption.fontSize};
	color: ${({ theme, $error }) =>
		$error ? theme.colors!.status.danger : theme.colors!.text.secondary};
`

const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	padding: ${({ theme }) => theme.spacing!.md}px ${({ theme }) => theme.spacing!.xl}px
		${({ theme }) => theme.spacing!.lg}px;
	border-top: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	background: ${({ theme }) => theme.colors!.bg.canvas};
`
