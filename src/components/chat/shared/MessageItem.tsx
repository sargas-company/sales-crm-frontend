import { useRef, useState } from 'react'
import styled from 'styled-components'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'
import { Text } from '../../../ui'
import MsgBox from '../chat-content/MsgBox'
import AttachmentChip from './AttachmentChip'
import MessageFailedBadge from './MessageFailedBadge'
import MessageActions from './MessageActions'
import { ChatMessage } from '../../../store/chats/apiChatSlice'

interface Props {
	msg: ChatMessage
	onOpenAttachment: (attachmentId: string) => void
}

const MessageItem = ({ msg, onOpenAttachment }: Props) => {
	const [translatedContent, setTranslatedContent] = useState<string | null>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const isUser = msg.role === 'user'
	const displayContent = translatedContent ?? msg.content

	return (
		<ItemWrapper
			className='msg-item'
			display='flex'
			px={16}
			flexDirection={isUser ? 'row-reverse' : 'row'}
			space={0.8}
			mb={8}
		>
			<Box
				space={0.4}
				display='flex'
				flexDirection='column'
				align={isUser ? 'flex-end' : 'flex-start'}
				flex={1}
			>
				{msg.role === 'assistant' && msg.decision && (
					<ColorBox
						transparency={100}
						px={10}
						py={4}
						mb={15}
						borderRadius='6px'
						style={{ display: 'inline-flex', gap: 8 }}
						color={'transparent'}
					>
						<Text varient='caption' weight='bold' color='black'>
							{msg.decision.toUpperCase()}
						</Text>
						{msg.reasoning && (
							<Text varient='caption' secondary>
								{msg.reasoning}
							</Text>
						)}
					</ColorBox>
				)}

				<div ref={contentRef} style={{ display: 'contents' }}>
					<MsgBox msg={displayContent} from={isUser ? 'me' : 'other'} />
				</div>

				{msg.attachments && msg.attachments.length > 0 && (
					<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
						{msg.attachments.map((a) => (
							<AttachmentChip key={a.id} attachment={a} onOpen={onOpenAttachment} />
						))}
					</div>
				)}

				{msg.status === 'FAILED' && <MessageFailedBadge />}

				<ActionsAndTime>
					<Text varient='caption' secondary styles={{ marginTop: 0 }}>
						{new Date(msg.createdAt).toLocaleTimeString([], {
							hour: '2-digit',
							minute: '2-digit',
						})}
					</Text>
					{!isUser && (
						<MessageActions
							messageId={msg.id}
							content={msg.content}
							contentRef={contentRef}
							translatedContent={translatedContent}
							onTranslated={setTranslatedContent}
						/>
					)}
				</ActionsAndTime>
			</Box>
		</ItemWrapper>
	)
}

export default MessageItem

const ItemWrapper = styled(Box)`
	&:hover .msg-item {
		/* propagate hover class upward via CSS — children listen */
	}
`

const ActionsAndTime = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	margin-top: 2px;
`
