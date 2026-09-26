import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import Modal from './Modal'
import Button from '../buttons/Button'

/**
 * Small dialog for a destructive-or-confirming user decision:
 * title, message, cancel + confirm buttons. Reads tokens for
 * surface, spacing, radius, shadow and typography. Uses `Modal`
 * for portal + `#root-modal` portal target.
 *
 * `tone: 'default' | 'danger'` picks the confirm button colour.
 */
export type ConfirmationTone = 'default' | 'danger'

interface ConfirmationDialogProps {
	open: boolean
	title: ReactNode
	message?: ReactNode
	confirmLabel?: ReactNode
	cancelLabel?: ReactNode
	tone?: ConfirmationTone
	onConfirm: () => void
	onCancel: () => void
	className?: string
}

const Card = styled.div`
	background: ${({ theme }) => theme.colors!.bg.surface};
	border: 1px solid ${({ theme }) => theme.colors!.border.subtle};
	border-radius: ${({ theme }) => theme.radius!.lg}px;
	box-shadow: ${({ theme }) => theme.shadow!.lg};
	padding: ${({ theme }) => theme.spacing!.xl}px;
	max-width: 420px;
	width: min(420px, calc(100vw - ${({ theme }) => theme.spacing!.xl * 2}px));
	display: flex;
	flex-direction: column;
	gap: ${({ theme }) => theme.spacing!.md}px;
`

const Title = styled.h2`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.primary};
	font-family: ${({ theme }) => theme.typography!.h2.fontFamily};
	font-size: ${({ theme }) => theme.typography!.h2.fontSize};
	line-height: ${({ theme }) => theme.typography!.h2.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.h2.fontWeight};
	letter-spacing: ${({ theme }) => theme.typography!.h2.letterSpacing};
`

const Message = styled.p`
	margin: 0;
	color: ${({ theme }) => theme.colors!.text.secondary};
	font-family: ${({ theme }) => theme.typography!.body.fontFamily};
	font-size: ${({ theme }) => theme.typography!.body.fontSize};
	line-height: ${({ theme }) => theme.typography!.body.lineHeight};
	font-weight: ${({ theme }) => theme.typography!.body.fontWeight};
`

const Actions = styled.div`
	display: flex;
	justify-content: flex-end;
	gap: ${({ theme }) => theme.spacing!.sm}px;
	margin-top: ${({ theme }) => theme.spacing!.sm}px;
`

const ConfirmationDialog: FC<ConfirmationDialogProps> = ({
	open,
	title,
	message,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	tone = 'default',
	onConfirm,
	onCancel,
	className,
}) => {
	if (!open) return null
	return (
		<Modal handleOutClick={onCancel}>
			<Card className={className} role='alertdialog' aria-modal='true'>
				<Title>{title}</Title>
				{message && <Message>{message}</Message>}
				<Actions>
					<Button varient='text' onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button
						varient='contained'
						color={tone === 'danger' ? 'error' : undefined}
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</Actions>
			</Card>
		</Modal>
	)
}

export default ConfirmationDialog
