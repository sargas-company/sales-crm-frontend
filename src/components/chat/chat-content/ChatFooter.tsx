import { AttachmentRounded, MicRounded, SendRounded } from '@mui/icons-material'
import React, { memo, useRef, useState } from 'react'
import { shallowEqual } from 'react-redux'
import { sendMessage } from '../../../store/chats/chatSlice'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { RootState } from '../../../store/store'
import { IconButton } from '../../../ui'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'

const selectCurrentUid = (state: RootState) => state.chat.currentUser.uid

const MAX_HEIGHT = 220

const ChatFooter = () => {
	const dispatch = useAppDispatch()
	const currentUid = useAppSelector(selectCurrentUid, shallowEqual)
	const [message, setMessage] = useState('')
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	const resetHeight = () => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.overflowY = 'hidden'
		}
	}

	const handleSend = () => {
		if (!message.trim()) return
		dispatch(sendMessage(currentUid, message))
		setMessage('')
		resetHeight()
	}

	const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value)
		e.target.style.height = 'auto'
		const newHeight = Math.min(e.target.scrollHeight, MAX_HEIGHT)
		e.target.style.height = `${newHeight}px`
		e.target.style.overflowY = e.target.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden'
	}

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
			e.preventDefault()
			handleSend()
		}
	}

	return (
		<Box display='flex' align='center' justify='space-between' space={0.8} px={12}>
			<ColorBox
				display='flex'
				transparency={3}
				borderRadius={'26px'}
				className='overflow-hidden'
				flex={1}
				style={{ alignItems: 'flex-end' }}
			>
				<div
					style={{
						flex: 1,
						maskImage: 'linear-gradient(to bottom, transparent 0, black 10px, black calc(100% - 10px), transparent 100%)',
						WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, black 10px, black calc(100% - 10px), transparent 100%)',
					}}
				>
					<textarea
						ref={textareaRef}
						name='message-write-box'
						value={message}
						rows={1}
						placeholder='Type your message here...'
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						style={{
							width: '100%',
							padding: '12px 0 12px 20px',
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
						}}
					/>
				</div>
				<Box mb={8} mr={16} onClick={handleSend} className='cursor-pointer' style={{ flexShrink: 0 }}>
					<SendRounded />
				</Box>
			</ColorBox>
			<ColorBox
				display='flex'
				borderRadius={'26px'}
				className='overflow-hidden'
				padding={6}
				transparency={4}
				space={0.4}
			>
				<IconButton varient='text' size={30} fontSize={21}>
					<MicRounded />
				</IconButton>
				<IconButton varient='text' size={30} fontSize={21}>
					<AttachmentRounded />
				</IconButton>
			</ColorBox>
		</Box>
	)
}
export default memo(ChatFooter)
