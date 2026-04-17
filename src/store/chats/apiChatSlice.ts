import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

export interface ChatUser {
  id: string
  email: string
}

export interface ChatProposal {
  id: string
  title: string
  status: string
  user: ChatUser
}

export interface ChatLead {
  id: string
  number: number
  status: string
  leadName: string | null
  user?: ChatUser
}

export interface ChatLastMessage {
  id: string
  chatId: string
  role: 'user' | 'assistant'
  content: string
  decision: string | null
  reasoning: string | null
  createdAt: string
}

export interface ChatItem {
  id: string
  proposalId: string | null
  leadId: string | null
  createdAt: string
  proposal: ChatProposal | null
  lead: ChatLead | null
  _count: { messages: number }
  messages: ChatLastMessage[]
}

export interface ChatMessage {
  id: string
  chatId: string | null
  role: 'user' | 'assistant'
  content: string
  decision: string | null
  reasoning: string | null
  createdAt: string
}

export type ChatTabType = 'proposal' | 'lead'

interface ChatState {
  chatList: ChatItem[]
  nextCursor: string | null
  loadingList: boolean
  loadingMore: boolean
  activeTab: ChatTabType

  selectedChatId: string | null
  selectedProposalId: string | null
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
  activeTab: 'proposal',

  selectedChatId: null,
  selectedProposalId: null,
  chatHistory: [],
  loadingHistory: false,

  streamingContent: '',
  streamingAnalysis: null,
  isStreaming: false,
}

export const fetchChats = createAsyncThunk(
  'apiChat/fetchChats',
  async (arg: { cursor?: string; type?: ChatTabType } = {}) => {
    const { cursor, type } = arg
    const params: Record<string, string> = { limit: '20' }
    if (cursor) params.cursor = cursor
    if (type) params.type = type
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

export const fetchLeadHistory = createAsyncThunk(
  'apiChat/fetchLeadHistory',
  async (leadId: string) => {
    const { data } = await axiosInstance.get<ChatMessage[]>(`/leads/${leadId}/chat`)
    return data
  }
)

const apiChatSlice = createSlice({
  name: 'apiChat',
  initialState,
  reducers: {
    setActiveTab: (state, action: PayloadAction<ChatTabType>) => {
      state.activeTab = action.payload
      state.chatList = []
      state.nextCursor = null
      state.selectedChatId = null
      state.selectedProposalId = null
      state.chatHistory = []
      state.streamingContent = ''
      state.streamingAnalysis = null
      state.isStreaming = false
    },
    selectChat: (state, action: PayloadAction<{ chatId: string; proposalId: string | null }>) => {
      state.selectedChatId = action.payload.chatId
      state.selectedProposalId = action.payload.proposalId
      state.chatHistory = []
      state.streamingContent = ''
      state.streamingAnalysis = null
      state.isStreaming = false
    },
    addUserMessage: (state, action: PayloadAction<{ content: string }>) => {
      const msg: ChatMessage = {
        id: `temp-${Date.now()}`,
        chatId: null,
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
          chatId: null,
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
        if (action.meta.arg?.cursor) {
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
        if (action.meta.arg?.cursor) {
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
      .addCase(fetchLeadHistory.pending, (state) => {
        state.loadingHistory = true
        state.chatHistory = []
      })
      .addCase(fetchLeadHistory.fulfilled, (state, action) => {
        state.chatHistory = action.payload
        state.loadingHistory = false
      })
      .addCase(fetchLeadHistory.rejected, (state) => {
        state.loadingHistory = false
      })
  },
})

export const {
  setActiveTab,
  selectChat,
  addUserMessage,
  setStreamingAnalysis,
  appendStreamingChunk,
  streamingDone,
} = apiChatSlice.actions

export default apiChatSlice.reducer
