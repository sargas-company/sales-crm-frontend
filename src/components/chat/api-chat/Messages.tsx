import { useEffect, useLayoutEffect, useRef } from 'react'
import styled from 'styled-components'
import { useAppSelector } from '../../../hooks'
import Box from '../../box/Box'
import ColorBox from '../../box/ColorBox'
import { Text } from '../../../ui'
import MsgBox from '../chat-content/MsgBox'

const Messages = () => {
  const chatHistory = useAppSelector((state) => state.apiChat.chatHistory)
  const streamingContent = useAppSelector((state) => state.apiChat.streamingContent)
  const streamingAnalysis = useAppSelector((state) => state.apiChat.streamingAnalysis)
  const isStreaming = useAppSelector((state) => state.apiChat.isStreaming)
  const loadingHistory = useAppSelector((state) => state.apiChat.loadingHistory)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Instant scroll on first render
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  // Smooth scroll when new message added or streaming finishes
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [chatHistory.length, isStreaming])

  // Follow streaming content as it comes in
  useEffect(() => {
    const el = scrollRef.current
    if (!el || !isStreaming) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }, [streamingContent, isStreaming])

  if (loadingHistory) {
    return (
      <Box display="flex" align="center" justify="center" style={{ height: '100%' }}>
        <Text varient="body2" secondary>
          Loading messages…
        </Text>
      </Box>
    )
  }

  return (
    <MessagesScroll ref={scrollRef}>
      {chatHistory.map((msg) => (
        <Box
          key={msg.id}
          display="flex"
          px={16}
          flexDirection={msg.role === 'user' ? 'row-reverse' : 'row'}
          space={0.8}
          mb={8}
        >
          <Box
            space={0.4}
            display="flex"
            flexDirection="column"
            align={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            flex={1}
          >
            {msg.role === 'assistant' && msg.decision && (
              <ColorBox
                transparency={100}
                px={10}
                py={4}
                mb={15}
                borderRadius="6px"
                style={{ display: 'inline-flex', gap: 8 }}
                color={'transparent'}
              >
                <Text varient="caption" weight="bold" color="black">
                  {msg.decision.toUpperCase()}
                </Text>
                {msg.reasoning && (
                  <Text varient="caption" secondary>
                    {msg.reasoning}
                  </Text>
                )}
              </ColorBox>
            )}
            <MsgBox msg={msg.content} from={msg.role === 'user' ? 'me' : 'other'} />
            <Text varient="caption" secondary styles={{ marginTop: 2 }}>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </Box>
        </Box>
      ))}

      {isStreaming && (
        <Box display="flex" px={16} flexDirection="row" space={0.8} mb={8}>
          <Box
            space={0.4}
            display="flex"
            flexDirection="column"
            align="flex-start"
            flex={1}
          >
            {streamingAnalysis && (
              <ColorBox
                transparency={3}
                px={10}
                py={4}
                mb={4}
                borderRadius="6px"
                style={{ display: 'inline-flex', gap: 8 }}
              >
                <Text varient="caption" weight="bold" color="primary">
                  {streamingAnalysis.decision.toUpperCase()}
                </Text>
                <Text varient="caption" secondary>
                  {streamingAnalysis.reasoning}
                </Text>
              </ColorBox>
            )}
            {streamingContent ? (
              <MsgBox msg={streamingContent} from="other" />
            ) : (
              <Box px={16} py={8}>
                <Text varient="caption" secondary>
                  Thinking…
                </Text>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </MessagesScroll>
  )
}

export default Messages

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
