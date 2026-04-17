import React, { memo, useState } from 'react'
import { SendRounded } from '@mui/icons-material'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'
import { TextField } from '../../../ui'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { addUserMessage } from '../../../store/chats/apiChatSlice'

interface Props {
  onSend: (proposalId: string, content: string) => void
}

const ChatFooter = ({ onSend }: Props) => {
  const dispatch = useAppDispatch()
  const selectedProposalId = useAppSelector((state) => state.apiChat.selectedProposalId)
  const isStreaming = useAppSelector((state) => state.apiChat.isStreaming)
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!message.trim() || !selectedProposalId || isStreaming) return
    dispatch(addUserMessage({ content: message }))
    onSend(selectedProposalId, message)
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && message.trim()) {
      handleSend()
    }
  }

  return (
    <Box display="flex" align="center" justify="space-between" space={0.8} px={12}>
      <ColorBox
        display="flex"
        transparency={3}
        borderRadius="26px"
        className="overflow-hidden"
        flex={1}
      >
        <TextField
          type="text"
          name="chat-message"
          value={message}
          placeholder={isStreaming ? 'Waiting for response…' : !selectedProposalId ? 'Chat unavailable' : 'Type your message here...'}
          endAdornment={
            <Box mr={16} onClick={handleSend} className="cursor-pointer">
              <SendRounded />
            </Box>
          }
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          width="100%"
          style={{
            padding: '12px 40px 12px 20px',
            border: 0,
            outline: 0,
          }}
          disable={isStreaming || !selectedProposalId}
        />
      </ColorBox>
    </Box>
  )
}

export default memo(ChatFooter)
