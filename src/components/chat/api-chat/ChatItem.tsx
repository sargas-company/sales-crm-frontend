import { ChatItem } from '../../../store/chats/apiChatSlice'
import Box from '../../box/Box'
import { Text } from '../../../ui'
import TimeStamp from '../TimeStamp'
import ChatItemWrapper from './ChatItemWrapper'

interface Props {
  chat: ChatItem
  onSelect: (id: string) => void
}

const ChatListItem = ({ chat, onSelect }: Props) => {
  const lastMsg = chat.messages[0]
  const title = chat.proposal?.title ?? chat.lead?.leadName ?? 'Untitled'
  const subtitle = chat.proposal?.user?.email ?? chat.lead?.user?.email

  return (
    <ChatItemWrapper uid={chat.id} onClick={() => onSelect(chat.id)}>
      <Box
        display="flex"
        flexDirection="column"
        flex={'1 1 auto'}
        style={{ minWidth: 0 }}
        ml={8}
        mr={12}
      >
        <Text varient="body2" weight="light" textOverflow="ellipsis">
          {title}
        </Text>
        {/*<Text varient="body2" textOverflow="ellipsis" secondary>*/}
        {/*  {lastMsg?.content*/}
        {/*    ? lastMsg.content.length > 60*/}
        {/*      ? lastMsg.content.slice(0, 60) + '…'*/}
        {/*      : lastMsg.content*/}
        {/*    : subtitle ?? 'No messages yet'}*/}
        {/*</Text>*/}
      </Box>
      <Box display="flex" flexDirection="column" align="flex-end" space={0.4}>
        <TimeStamp timeStamp={chat.createdAt} />
        {/*<Text varient="caption" secondary>*/}
        {/*  {chat._count.messages}*/}
        {/*</Text>*/}
      </Box>
    </ChatItemWrapper>
  )
}

export default ChatListItem
