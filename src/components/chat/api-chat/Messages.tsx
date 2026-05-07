import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { useAppSelector } from '../../../hooks'
import Box from '../../box/Box'
import { CustomAvatar, Text } from '../../../ui'
import MsgBox from '../chat-content/MsgBox'
import { ChatBubbleOutlineRounded } from '@mui/icons-material'
import axiosInstance from '../../../api/axiosInstance'
import MessageItem from '../shared/MessageItem'

const Messages = () => {
	const chatHistory = useAppSelector((state) => state.apiChat.chatHistory)
	const streamingContent = useAppSelector((state) => state.apiChat.streamingContent)
	const isStreaming = useAppSelector((state) => state.apiChat.isStreaming)
	const loadingHistory = useAppSelector((state) => state.apiChat.loadingHistory)
	const selectedProposalId = useAppSelector((state) => state.apiChat.selectedProposalId)

	const scrollRef = useRef<HTMLDivElement | null>(null)

	const openAttachment = useCallback(async (attachmentId: string) => {
		if (!selectedProposalId) return
		const { data } = await axiosInstance.get<{ url: string }>(
			`/proposals/${selectedProposalId}/chat/attachments/${attachmentId}/url`
		)
		window.open(data.url, '_blank')
	}, [selectedProposalId])

	// Instant scroll on first render
	useLayoutEffect(() => {
		const el = scrollRef.current
		if (el) el.scrollTop = el.scrollHeight
	}, [])

	// Smooth scroll when new message added or streaming finishes
	useEffect(() => {
		const el = scrollRef.current
		if (!el) return
		el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
	}, [chatHistory.length, isStreaming])

	// Follow streaming content as it comes in
	useEffect(() => {
		const el = scrollRef.current
		if (!el || !isStreaming) return
		const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
		if (isNearBottom) el.scrollTop = el.scrollHeight
	}, [streamingContent, isStreaming])

	if (loadingHistory) {
		return (
			<Box display='flex' align='center' justify='center' style={{ height: '100%' }}>
				<Text varient='body2' secondary>
					Loading messages…
				</Text>
			</Box>
		)
	}

	return (
		<MessagesScroll ref={scrollRef}>
			{chatHistory.length === 0 && !isStreaming && (
				<Box
					display='flex'
					flexDirection={'column'}
					align='center'
					justify='center'
					height={'100%'}
				>
					<CustomAvatar size={100} color='info' skin='light'>
						<ChatBubbleOutlineRounded />
					</CustomAvatar>
					<Text heading='h6' skinColor>
						No messages yet
					</Text>
				</Box>
			)}

			{chatHistory.map((msg) => (
				<MessageItem key={msg.id} msg={msg} onOpenAttachment={openAttachment} />
			))}

			{isStreaming && (
				<Box display='flex' px={16} flexDirection='row' space={0.8} mb={8}>
					<Box space={0.4} display='flex' flexDirection='column' align='flex-start' flex={1}>
						{streamingContent ? (
							<MsgBox msg={streamingContent} from='other' />
						) : (
							<Box px={16} py={8}>
								<Text varient='caption' secondary>
									Thinking…
								</Text>
							</Box>
						)}
					</Box>
				</Box>
			)}
		</MessagesScroll>
	)
}

export default Messages

const MessagesScroll = styled.div`
	flex: 1;
	min-height: 0;
	overflow-y: auto;
	padding-top: 16px;

	&::-webkit-scrollbar {
		width: 8px;
	}
	&::-webkit-scrollbar-thumb {
		background: transparent;
		border-radius: 6px;
	}
	&:hover::-webkit-scrollbar-thumb {
		background: #9f9f9f45;
	}
`
