import { useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import {
  fetchChats,
  fetchProposalHistory,
  fetchLeadHistory,
  selectChat,
} from '../../../store/chats/apiChatSlice'
import Box from '../../box/Box'
import ChatListItem from './ChatItem'
import { Text } from '../../../ui'

const ChatList = () => {
  const dispatch = useAppDispatch()
  const chatList = useAppSelector((state) => state.apiChat.chatList)
  const nextCursor = useAppSelector((state) => state.apiChat.nextCursor)
  const loadingMore = useAppSelector((state) => state.apiChat.loadingMore)
  const loadingList = useAppSelector((state) => state.apiChat.loadingList)
  const activeTab = useAppSelector((state) => state.apiChat.activeTab)

  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!nextCursor) return
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor && !loadingMore) {
          dispatch(fetchChats({ cursor: nextCursor, type: activeTab }))
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [nextCursor, loadingMore, activeTab, dispatch])

  const handleSelect = (chatId: string) => {
    const chat = chatList.find((c) => c.id === chatId)
    const proposalId = chat?.proposal?.id ?? null
    dispatch(selectChat({ chatId, proposalId }))
    if (proposalId) {
      dispatch(fetchProposalHistory(proposalId))
    } else if (chat?.lead?.id) {
      dispatch(fetchLeadHistory(chat.lead.id))
    }
  }

  if (loadingList) {
    return (
      <Box px={12} py={16}>
        <Text varient="body2" secondary>
          Loading chats…
        </Text>
      </Box>
    )
  }

  if (!loadingList && chatList.length === 0) {
    return (
      <Box px={12} py={16}>
        <Text varient="body2" secondary>
          No chats yet
        </Text>
      </Box>
    )
  }

  return (
    <Box>
      {chatList.map((chat) => (
        <ChatListItem key={chat.id} chat={chat} onSelect={handleSelect} />
      ))}
      <div ref={sentinelRef} style={{ height: 1 }} />
      {loadingMore && (
        <Box px={12} py={8}>
          <Text varient="caption" secondary>
            Loading more…
          </Text>
        </Box>
      )}
    </Box>
  )
}

export default ChatList
