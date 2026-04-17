import Box from '../../box/Box'
import { Divider, Text } from '../../../ui'
import { useAppSelector } from '../../../hooks'

const ChatHeader = () => {
  const selectedId = useAppSelector((state) => state.apiChat.selectedChatId)
  const chat = useAppSelector((state) =>
    state.apiChat.chatList.find((c) => c.id === selectedId)
  )

  const title = chat?.proposal?.title ?? chat?.lead?.leadName ?? ''
  const subtitle = chat?.proposal?.user?.email ?? chat?.lead?.user?.email ?? ''

  return (
    <Box display="flex" flexDirection="column" style={{ zIndex: 900 }}>
      <Box display="flex" align="center" px={16} py={12}>
        <Box display="flex" flexDirection="column">
          <Text varient="body2" weight="bold">
            {title}
          </Text>
          {subtitle && (
            <Text varient="caption" secondary>
              {subtitle}
            </Text>
          )}
        </Box>
      </Box>
      <Divider />
    </Box>
  )
}

export default ChatHeader
