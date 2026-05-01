import React, { memo, useRef, useState } from 'react'
import { SendRounded } from '@mui/icons-material'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { addUserMessage } from '../../../store/chats/apiChatSlice'
import AttachMenuButton from '../shared/AttachMenuButton'
import FileAttachmentBar from '../shared/FileAttachmentBar'
import { useFileAttachment } from '../shared/useFileAttachment'

interface Props {
	onSend: (proposalId: string, content: string, model: string, files?: File[]) => void
}

const MAX_HEIGHT = 220

const ChatFooter = ({ onSend }: Props) => {
	const dispatch = useAppDispatch()
	const selectedProposalId = useAppSelector((state) => state.apiChat.selectedProposalId)
	const isStreaming = useAppSelector((state) => state.apiChat.isStreaming)
	const selectedModel = useAppSelector((state) => state.apiChat.selectedModel)
	const [message, setMessage] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const { attachedFiles, fileErrors, validateAndAdd, removeFile, clearFiles } = useFileAttachment()

	const resetHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.overflowY = 'hidden'
		}
	}

	const handleSend = () => {
		if (!message.trim() || !selectedProposalId || isStreaming) return
		dispatch(addUserMessage({ content: message }))
		onSend(selectedProposalId, message, selectedModel, attachedFiles.map((f) => f.file))
		setMessage('')
		clearFiles()
		resetHeight()
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
			e.preventDefault()
			handleSend()
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value)
		e.target.style.height = 'auto'
		const newHeight = Math.min(e.target.scrollHeight, MAX_HEIGHT)
		e.target.style.height = `${newHeight}px`
		e.target.style.overflowY = e.target.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
	}

	const isDisabled = isStreaming || !selectedProposalId

	return (
		<Box display='flex' align='center' justify='space-between' space={0.8} px={12}>
			<ColorBox
				display='flex'
				flexDirection='column'
				backgroundTheme='foreground'
				transparency={3}
				borderRadius='26px'
				border={{ show: true, size: '1px', radius: '26px' }}
				className='overflow-hidden'
				mb={20}
				flex={1}
			>
				<FileAttachmentBar files={attachedFiles} onRemove={removeFile} />

				{fileErrors.length > 0 && (
					<div style={{ padding: '4px 14px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
						{fileErrors.map((err, i) => (
							<span key={i} style={{ fontSize: 11, color: '#ef4444', lineHeight: 1.4 }}>
								{err}
							</span>
						))}
					</div>
				)}

				<div style={{ display: 'flex', alignItems: 'flex-end' }}>
					<AttachMenuButton disabled={isDisabled} onFilesSelected={validateAndAdd} />

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
							name='chat-message'
							value={message}
							rows={1}
							placeholder={
								isStreaming
									? 'Waiting for response…'
									: !selectedProposalId
										? 'Chat unavailable'
										: 'Type your message here...'
							}
							disabled={isDisabled}
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
								opacity: isDisabled ? 0.5 : 1,
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
	)
}

export default memo(ChatFooter)
