import { AttachFileRounded } from '@mui/icons-material'
import type { AttachmentStatus, MessageAttachment } from '../../../store/chats/apiChatSlice'

const STATUS_LABEL: Record<AttachmentStatus, string> = {
	PENDING: 'Pending…',
	PROCESSING: 'Processing…',
	DONE: '',
	FAILED: 'Failed',
	TIMEOUT: 'Timed out',
}

interface Props {
	attachment: MessageAttachment
	onOpen?: (id: string) => void
}

const AttachmentChip = ({ attachment, onOpen }: Props) => {
	const clickable = attachment.status === 'DONE' && !!onOpen

	return (
		<button
			onClick={() => clickable && onOpen!(attachment.id)}
			title={attachment.fileName}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 4,
				padding: '3px 8px',
				borderRadius: 12,
				border: '1px solid currentColor',
				background: 'transparent',
				color: attachment.status === 'FAILED' || attachment.status === 'TIMEOUT' ? '#ef4444' : 'inherit',
				opacity: attachment.status === 'DONE' ? 1 : 0.6,
				cursor: clickable ? 'pointer' : 'default',
				fontSize: 11,
				maxWidth: 200,
			}}
		>
			<AttachFileRounded style={{ fontSize: 12, flexShrink: 0 }} />
			<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
				{attachment.fileName}
			</span>
			{STATUS_LABEL[attachment.status] && (
				<span style={{ flexShrink: 0, opacity: 0.7 }}>· {STATUS_LABEL[attachment.status]}</span>
			)}
		</button>
	)
}

export default AttachmentChip
