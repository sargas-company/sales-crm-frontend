import Box from '../../box/Box'
import { Divider, Text } from '../../../ui'
import { useAppSelector } from '../../../hooks'

const ChatHeader = () => {
  const selectedId = useAppSelector((state) => state.apiChat.selectedChatId)
  const chat = useAppSelector((state) =>
    state.apiChat.chatList.find((c) => c.id === selectedId)
  )

  return (
    <Box display="flex" flexDirection="column" style={{ zIndex: 900 }}>
      <Box display="flex" align="center" px={16} py={12}>
        <Box display="flex" flexDirection="column">
          <Text varient="body2" weight="bold">
            {chat?.title ?? ''}
          </Text>
          <Text varient="caption" secondary>
            {chat?.user?.email ?? ''}
          </Text>
        </Box>
      </Box>
      <Divider />
    </Box>
  )
}

export default ChatHeader
