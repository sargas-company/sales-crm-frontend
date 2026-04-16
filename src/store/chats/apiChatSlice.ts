import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

export interface ChatUser {
  id: string
  email: string
}

export interface ChatLastMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  decision: string | null
  reasoning: string | null
  createdAt: string
}

export interface ChatItem {
  id: string
  title: string
  vacancy: string | null
  comment: string | null
  context: string | null
  userId: string
  createdAt: string
  updatedAt: string
  user: ChatUser
  _count: { messages: number }
  messages: ChatLastMessage[]
}

export interface ChatMessage {
  id: string
  proposalId: string | null
  leadId: string | null
  role: 'user' | 'assistant'
  content: string
  decision: string | null
  reasoning: string | null
  createdAt: string
}

interface ChatState {
  chatList: ChatItem[]
  nextCursor: string | null
  loadingList: boolean
  loadingMore: boolean

  selectedChatId: string | null
  chatHistory: ChatMessage[]
  loadingHistory: boolean

  streamingContent: string
  streamingAnalysis: { decision: string; reasoning: string } | null
  isStreaming: boolean
}

const initialState: ChatState = {
  chatList: [],
  nextCursor: null,
  loadingList: false,
  loadingMore: false,

  selectedChatId: null,
  chatHistory: [],
  loadingHistory: false,

  streamingContent: '',
  streamingAnalysis: null,
  isStreaming: false,
}

export const fetchChats = createAsyncThunk(
  'apiChat/fetchChats',
  async (cursor: string | undefined = undefined) => {
    const params: Record<string, string> = { limit: '20' }
    if (cursor) params.cursor = cursor
    const { data } = await axiosInstance.get<{ data: ChatItem[]; nextCursor: string | null }>(
      '/chats',
      { params }
    )
    return { ...data, isLoadMore: !!cursor }
  }
)

export const fetchProposalHistory = createAsyncThunk(
  'apiChat/fetchHistory',
  async (proposalId: string) => {
    const { data } = await axiosInstance.get<ChatMessage[]>(`/proposals/${proposalId}/chat`)
    return data
  }
)

const apiChatSlice = createSlice({
  name: 'apiChat',
  initialState,
  reducers: {
    selectChat: (state, action: PayloadAction<string>) => {
      state.selectedChatId = action.payload
      state.chatHistory = []
      state.streamingContent = ''
      state.streamingAnalysis = null
      state.isStreaming = false
    },
    addUserMessage: (state, action: PayloadAction<{ proposalId: string; content: string }>) => {
      const msg: ChatMessage = {
        id: `temp-${Date.now()}`,
        proposalId: action.payload.proposalId,
        leadId: null,
        role: 'user',
        content: action.payload.content,
        decision: null,
        reasoning: null,
        createdAt: new Date().toISOString(),
      }
      state.chatHistory.push(msg)
      state.isStreaming = true
      state.streamingContent = ''
      state.streamingAnalysis = null
    },
    setStreamingAnalysis: (
      state,
      action: PayloadAction<{ decision: string; reasoning: string }>
    ) => {
      state.streamingAnalysis = action.payload
    },
    appendStreamingChunk: (state, action: PayloadAction<string>) => {
      state.streamingContent += action.payload
    },
    streamingDone: (state) => {
      if (state.streamingContent) {
        const msg: ChatMessage = {
          id: `stream-${Date.now()}`,
          proposalId: state.selectedChatId,
          leadId: null,
          role: 'assistant',
          content: state.streamingContent,
          decision: state.streamingAnalysis?.decision ?? null,
          reasoning: state.streamingAnalysis?.reasoning ?? null,
          createdAt: new Date().toISOString(),
        }
        state.chatHistory.push(msg)
      }
      state.streamingContent = ''
      state.isStreaming = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state, action) => {
        if (action.meta.arg) {
          state.loadingMore = true
        } else {
          state.loadingList = true
        }
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        if (action.payload.isLoadMore) {
          state.chatList = [...state.chatList, ...action.payload.data]
          state.loadingMore = false
        } else {
          state.chatList = action.payload.data
          state.loadingList = false
        }
        state.nextCursor = action.payload.nextCursor
      })
      .addCase(fetchChats.rejected, (state, action) => {
        if (action.meta.arg) {
          state.loadingMore = false
        } else {
          state.loadingList = false
        }
      })
      .addCase(fetchProposalHistory.pending, (state) => {
        state.loadingHistory = true
        state.chatHistory = []
      })
      .addCase(fetchProposalHistory.fulfilled, (state, action) => {
        state.chatHistory = action.payload
        state.loadingHistory = false
      })
      .addCase(fetchProposalHistory.rejected, (state) => {
        state.loadingHistory = false
      })
  },
})

export const {
  selectChat,
  addUserMessage,
  setStreamingAnalysis,
  appendStreamingChunk,
  streamingDone,
} = apiChatSlice.actions

export default apiChatSlice.reducer
