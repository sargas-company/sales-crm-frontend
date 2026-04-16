import Box from '../../box/Box'
import { Divider, Text } from '../../../ui'
import ScrollContainer from '../../scroll-container/ScrollContainer'
import ChatList from './ChatList'
import ChatSectionHeading from '../ChatSectionHeading'

const ChatNav = () => {
  return (
    <Box display="flex" flexDirection="column">
      <Box display="flex" align="center" py={16} px={18}>
        <Text heading="h6" weight="bold">
          Chats
        </Text>
      </Box>
      <Divider />
      <Box pl={12}>
        <ScrollContainer maxHeight="74vh">
          <ChatSectionHeading title="Recent" />
          <ChatList />
        </ScrollContainer>
      </Box>
    </Box>
  )
}

export default ChatNav
