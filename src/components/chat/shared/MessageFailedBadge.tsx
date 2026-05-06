import { ErrorRounded } from '@mui/icons-material'

const MessageFailedBadge = () => (
	<div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
		<ErrorRounded style={{ fontSize: 14, color: '#ef4444' }} />
		<span style={{ fontSize: 11, color: '#ef4444', lineHeight: 1 }}>Processing failed</span>
	</div>
)

export default MessageFailedBadge
