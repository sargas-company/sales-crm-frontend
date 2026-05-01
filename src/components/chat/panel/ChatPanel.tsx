import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import styled from 'styled-components'
import { ChatBubbleOutlineRounded, SendRounded } from '@mui/icons-material'
import axiosInstance from '../../../api/axiosInstance'
import { usePanelSocket } from '../../../hooks/usePanelSocket'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'
import { CustomAvatar, Text } from '../../../ui'
import MsgBox from '../chat-content/MsgBox'

const MAX_HEIGHT = 220

interface Message {
	id: string
	role: 'user' | 'assistant'
	content: string
	decision: string | null
	reasoning: string | null
	createdAt: string
}

interface StreamingState {
	content: string
	analysis: { decision: string; reasoning: string } | null
	active: boolean
}

interface Props {
	historyUrl: string
	proposalId: string | null
	model?: string
}

const ChatPanel = ({ historyUrl, proposalId, model }: Props) => {
	const [messages, setMessages] = useState<Message[]>([])
	const [loading, setLoading] = useState(true)
	const [inputValue, setInputValue] = useState('')
	const [streaming, setStreaming] = useState<StreamingState>({
		content: '',
		analysis: null,
		active: false,
	})
	const scrollRef = useRef<HTMLDivElement | null>(null)
	const textareaRef = useRef<HTMLTextAreaElement | null>(null)

	// Load history whenever historyUrl changes (tab opened / different entity)
	useEffect(() => {
		let cancelled = false
		setLoading(true)
		setMessages([])
		axiosInstance
			.get<{ messages: Message[]; context: unknown }>(historyUrl)
			.then(({ data }) => {
				if (!cancelled) setMessages(data.messages)
			})
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false)
			})
		return () => {
			cancelled = true
		}
	}, [historyUrl])

	// WebSocket handlers
	const { sendMessage } = usePanelSocket({
		onAnalysis: (data) => setStreaming((s) => ({ ...s, analysis: data, active: true })),
		onChunk: (text) => setStreaming((s) => ({ ...s, content: s.content + text })),
		onDone: () => {
			setStreaming((prev) => {
				if (prev.content) {
					const msg: Message = {
						id: `stream-${Date.now()}`,
						role: 'assistant',
						content: prev.content,
						decision: prev.analysis?.decision ?? null,
						reasoning: prev.analysis?.reasoning ?? null,
						createdAt: new Date().toISOString(),
					}
					setMessages((m) => [...m, msg])
				}
				return { content: '', analysis: null, active: false }
			})
		},
		onError: () => setStreaming({ content: '', analysis: null, active: false }),
	})

	// Auto-scroll to bottom on new messages / streaming chunks
	useLayoutEffect(() => {
		const el = scrollRef.current
		if (el) el.scrollTop = el.scrollHeight
	}, [messages, streaming.content])

	const resetTextareaHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.overflowY = 'hidden'
		}
	}

	const handleSend = () => {
		if (!inputValue.trim() || !proposalId || streaming.active) return
		const msg: Message = {
			id: `temp-${Date.now()}`,
			role: 'user',
			content: inputValue,
			decision: null,
			reasoning: null,
			createdAt: new Date().toISOString(),
		}
		setMessages((m) => [...m, msg])
		setStreaming({ content: '', analysis: null, active: true })
		sendMessage(proposalId, inputValue, model)
		setInputValue('')
		resetTextareaHeight()
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
				{messages.length === 0 && !streaming.active && (
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
							<Text varient='caption' secondary styles={{ marginTop: 2 }}>
								{new Date(msg.createdAt).toLocaleTimeString([], {
									hour: '2-digit',
									minute: '2-digit',
								})}
							</Text>
						</Box>
					</Box>
				))}

				{streaming.active && (
					<Box display='flex' px={16} flexDirection='row' space={0.8} mb={8}>
						<Box
							space={0.4}
							display='flex'
							flexDirection='column'
							align='flex-start'
							flex={1}
						>
							{streaming.analysis && (
								<ColorBox
									transparency={3}
									px={10}
									py={4}
									mb={4}
									borderRadius='6px'
									style={{ display: 'inline-flex', gap: 8 }}
								>
									<Text varient='caption' weight='bold' color='primary'>
										{streaming.analysis.decision.toUpperCase()}
									</Text>
									<Text varient='caption' secondary>
										{streaming.analysis.reasoning}
									</Text>
								</ColorBox>
							)}
							{streaming.content ? (
								<MsgBox msg={streaming.content} from='other' />
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
					backgroundTheme='foreground'
					transparency={3}
					borderRadius='26px'
					border={{ show: true, size: '1px', radius: '26px' }}
					className='overflow-hidden'
					flex={1}
					style={{ alignItems: 'flex-end' }}
				>
					<textarea
						ref={textareaRef}
						name='panel-chat-message'
						value={inputValue}
						rows={1}
						placeholder={
							streaming.active
								? 'Waiting for response…'
								: !proposalId
									? 'Chat unavailable'
									: 'Type your message here...'
						}
						disabled={streaming.active || !proposalId}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						style={{
							flex: 1,
							width: '100%',
							padding: '12px 0 12px 25px',
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
							opacity: streaming.active || !proposalId ? 0.5 : 1,
						}}
					/>
					<Box mb={8} mr={16} onClick={handleSend} className='cursor-pointer' style={{ flexShrink: 0 }}>
						<SendRounded />
					</Box>
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
