import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import styled from 'styled-components'
import { ChatBubbleOutlineRounded, SendRounded } from '@mui/icons-material'
import { useSocket } from '../../../hooks/useSocket'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { fetchProposalHistory, addUserMessage, replaceMessageId } from '../../../store/chats/apiChatSlice'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'
import { CustomAvatar, Text } from '../../../ui'
import MsgBox from '../chat-content/MsgBox'
import AttachMenuButton from '../shared/AttachMenuButton'
import FileAttachmentBar from '../shared/FileAttachmentBar'
import { useFileAttachment } from '../shared/useFileAttachment'
import AttachmentChip from '../shared/AttachmentChip'
import MessageFailedBadge from '../shared/MessageFailedBadge'
import axiosInstance from '../../../api/axiosInstance'
import type { MessageAttachment } from '../../../store/chats/apiChatSlice'

const MAX_HEIGHT = 220

interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	decision: string | null
	reasoning: string | null
	createdAt: string
	attachments?: MessageAttachment[]
}

interface Props {
	historyUrl: string
	proposalId: string | null
	model?: string
}

const ChatPanel = ({ proposalId, model }: Props) => {
	const dispatch = useAppDispatch()

	const [inputValue, setInputValue] = useState('')

	const messages = useAppSelector((state) => state.apiChat.chatHistory)
	const streamingContent = useAppSelector((state) => state.apiChat.streamingContent)
	const isStreaming = useAppSelector((state) => state.apiChat.isStreaming)
	const loading = useAppSelector((state) => state.apiChat.loadingHistory)

	const scrollRef = useRef<HTMLDivElement | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	const { attachedFiles, fileErrors, validateAndAdd, removeFile, clearFiles } = useFileAttachment()

	const { sendMessage } = useSocket(proposalId)

	// Load history
	useEffect(() => {
		if (!proposalId) return

		dispatch(fetchProposalHistory(proposalId))
	}, [proposalId, dispatch])

	// Auto-scroll
	useLayoutEffect(() => {
		const el = scrollRef.current
		if (el) el.scrollTop = el.scrollHeight
	}, [messages, streamingContent])

	const resetTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.overflowY = 'hidden'
		}
	}

	const openAttachment = async (attachmentId: string) => {
		if (!proposalId) return

		const { data } = await axiosInstance.get<{ url: string }>(
			`/proposals/${proposalId}/chat/attachments/${attachmentId}/url`
		)

		window.open(data.url, '_blank')
	}

	const handleSend = async () => {
		if (!inputValue.trim() || !proposalId || isStreaming) return

		const tempId = `temp-${Date.now()}`
		const content = inputValue
		const files = attachedFiles.map((f) => f.file)

		setInputValue('')
		clearFiles()
		resetTextareaHeight()

		dispatch(addUserMessage({
			id: tempId,
			content,
			attachments: attachedFiles.map((f) => ({
				id: f.id,
				fileName: f.name,
				mimeType: null,
				status: 'PENDING' as const,
				createdAt: new Date().toISOString(),
			})),
		}))

		try {
			const realId = await sendMessage(proposalId, content, model, files)
			if (realId) dispatch(replaceMessageId({ tempId, realId }))
		} catch {
			// ошибка отправки — пользователь увидит FAILED статус через сокет
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey && inputValue.trim()) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value)

		e.target.style.height = 'auto'

		const newHeight = Math.min(e.target.scrollHeight, MAX_HEIGHT)

		e.target.style.height = `${newHeight}px`
		e.target.style.overflowY = e.target.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
	}

	if (loading) {
		return (
			<Box display='flex' align='center' justify='center' style={{ minHeight: '60vh' }}>
				<Text varient='body2' secondary>
					Loading messages…
				</Text>
			</Box>
		)
	}

	return (
		<Box display='flex' flexDirection='column' style={{ height: '65vh', overflow: 'hidden' }}>
			<MessagesScroll ref={scrollRef}>
				{messages.length === 0 && !isStreaming && (
					<Box
						display='flex'
						flexDirection='column'
						align='center'
						justify='center'
						height='100%'
					>
						<CustomAvatar size={100} color='info' skin='light'>
							<ChatBubbleOutlineRounded />
						</CustomAvatar>

						<Text heading='h6' skinColor>
							No messages yet
						</Text>
					</Box>
				)}

				{messages.map((msg) => (
					<Box
						key={msg.id}
						display='flex'
						px={16}
						flexDirection={msg.role === 'user' ? 'row-reverse' : 'row'}
						space={0.8}
						mb={8}
					>
						<Box
							space={0.4}
							display='flex'
							flexDirection='column'
							align={msg.role === 'user' ? 'flex-end' : 'flex-start'}
							flex={1}
						>
							{msg.role === 'assistant' && msg.decision && (
								<ColorBox
									transparency={3}
									px={10}
									py={4}
									mb={4}
									borderRadius='6px'
									style={{ display: 'inline-flex', gap: 8 }}
								>
									<Text varient='caption' weight='bold' color='primary'>
										{msg.decision.toUpperCase()}
									</Text>

									{msg.reasoning && (
										<Text varient='caption' secondary>
											{msg.reasoning}
										</Text>
									)}
								</ColorBox>
							)}

							<MsgBox msg={msg.content} from={msg.role === 'user' ? 'me' : 'other'} />

							{msg.attachments && msg.attachments.length > 0 && (
								<div
									style={{
										display: 'flex',
										flexWrap: 'wrap',
										gap: 4,
										marginTop: 4,
									}}
								>
									{msg.attachments.map((a) => (
										<AttachmentChip key={a.id} attachment={a} onOpen={openAttachment} />
									))}
								</div>
							)}

							{msg.status === 'FAILED' && <MessageFailedBadge />}

							<Text varient='caption' secondary styles={{ marginTop: 2 }}>
								{new Date(msg.createdAt).toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit',
								})}
							</Text>
						</Box>
					</Box>
				))}

				{isStreaming && (
					<Box display='flex' px={16} flexDirection='row' space={0.8} mb={8}>
						<Box
							space={0.4}
							display='flex'
							flexDirection='column'
							align='flex-start'
							flex={1}
						>
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

			<Box display='flex' align='center' space={0.8} px={12} py={8} mb={20}>
				<ColorBox
					display='flex'
					flexDirection='column'
					backgroundTheme='foreground'
					transparency={3}
					borderRadius='26px'
					border={{
						show: true,
						size: '1px',
						radius: '26px',
					}}
					className='overflow-hidden'
					flex={1}
				>
					<FileAttachmentBar files={attachedFiles} onRemove={removeFile} />

					{fileErrors.length > 0 && (
						<div
							style={{
								padding: '4px 14px 10px',
								display: 'flex',
								flexDirection: 'column',
								gap: 2,
							}}
						>
							{fileErrors.map((err, i) => (
								<span
									key={i}
									style={{
										fontSize: 11,
										color: '#ef4444',
										lineHeight: 1.4,
									}}
								>
									{err}
								</span>
							))}
						</div>
					)}

					<div
						style={{
							display: 'flex',
							alignItems: 'flex-end',
						}}
					>
						<AttachMenuButton
							disabled={isStreaming || !proposalId}
							onFilesSelected={validateAndAdd}
						/>

						<div
							style={{
								flex: 1,
								maskImage:
									'linear-gradient(to bottom, transparent 0, black 10px, black calc(100% - 10px), transparent 100%)',
								WebkitMaskImage:
									'linear-gradient(to bottom, transparent 0, black 10px, black calc(100% - 10px), transparent 100%)',
							}}
						>
							<textarea
								ref={textareaRef}
								name='panel-chat-message'
								value={inputValue}
								rows={1}
								placeholder={
									isStreaming
										? 'Waiting for response…'
										: !proposalId
											? 'Chat unavailable'
											: 'Type your message here...'
								}
								disabled={isStreaming || !proposalId}
								onChange={handleChange}
								onKeyDown={handleKeyDown}
								style={{
									width: '100%',
									padding: '12px 5px 12px 4px',
									border: 0,
									outline: 0,
									resize: 'none',
									background: 'transparent',
									color: 'inherit',
									fontFamily: 'inherit',
									fontSize: 'inherit',
									lineHeight: '1.5',
									minHeight: '44px',
									maxHeight: `${MAX_HEIGHT}px`,
									overflowY: 'hidden',
									display: 'block',
									opacity: isStreaming || !proposalId ? 0.5 : 1,
								}}
							/>
						</div>

						<Box
							mb={8}
							mr={16}
							onClick={handleSend}
							className='cursor-pointer'
							style={{ flexShrink: 0 }}
						>
							<SendRounded />
						</Box>
					</div>
				</ColorBox>
			</Box>
		</Box>
	)
}

export default ChatPanel

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
