import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import axiosInstance from '../../api/axiosInstance'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
	firstName: string | null
	lastName: string | null
	companyName: string | null
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

export type AttachmentStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'TIMEOUT'

export interface MessageAttachment {
	id: string
	fileName: string
	mimeType: string | null
	status: AttachmentStatus
	createdAt: string
}

export interface ChatMessage {
	id: string
	chatId: string | null
	role: 'user' | 'assistant'
	content: string
	status?: string
	decision: string | null
	reasoning: string | null
	createdAt: string
	attachments?: MessageAttachment[]
}

export interface ChatContext {
	proposal: {
		title?: string | null
		status?: string | null
		proposalType?: string | null
		boosted?: boolean | null
		connects?: number | null
		boostedConnects?: number | null
		platform?: { id: string; name: string } | null
		vacancy?: string | null
		coverLetter?: string | null
	} | null
	jobPost: {
		title?: string | null
		description?: string | null
		score?: string | number | null
		gigRadarScore?: string | number | null
		budget?: string | null
		source?: string | null
		totalSpent?: string | number | null
		avgRatePaid?: string | number | null
		hireRate?: string | number | null
		location?: string | null
		aiResponse?: {
			short_summary?: string | null
			decision?: string | null
			priority?: string | null
			hard_stop?: boolean | null
			hard_stop_reason?: string | null
			match_score?: number | null
			reasons?: string[]
			red_flags?: string[]
			subscores?: Record<string, number>
		} | null
	} | null
	lead: {
		name?: string | null
		companyName?: string | null
		status?: string | null
		clientType?: string | null
		location?: string | null
	} | null
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
	selectedLeadId: string | null
	chatHistory: ChatMessage[]
	loadingHistory: boolean

	streamingContent: string
	isStreaming: boolean
	selectedModel: string
	chatContext: ChatContext | null
}

const initialState: ChatState = {
	chatList: [],
	nextCursor: null,
	loadingList: false,
	loadingMore: false,
	activeTab: 'proposal',

	selectedChatId: null,
	selectedProposalId: null,
	selectedLeadId: null,
	chatHistory: [],
	loadingHistory: false,

	streamingContent: '',
	isStreaming: false,
	selectedModel: 'claude-sonnet-4-6',
	chatContext: null,
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
		const { data } = await axiosInstance.get<{ messages: ChatMessage[]; context: ChatContext }>(
			`/proposals/${proposalId}/chat/messages`
		)
		return { messages: data.messages, context: data.context }
	}
)

export const fetchLeadHistory = createAsyncThunk(
	'apiChat/fetchLeadHistory',
	async (leadId: string) => {
		const { data } = await axiosInstance.get<{ messages: ChatMessage[]; context: ChatContext }>(
			`/leads/${leadId}/chat`
		)
		return { messages: data.messages, context: data.context }
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
			state.selectedLeadId = null
			state.chatHistory = []
			state.streamingContent = ''
			state.isStreaming = false
		},
		selectChat: (
			state,
			action: PayloadAction<{
				chatId: string
				proposalId: string | null
				leadId?: string | null
			}>
		) => {
			state.selectedChatId = action.payload.chatId
			state.selectedProposalId = action.payload.proposalId
			state.selectedLeadId = action.payload.leadId ?? null
			state.chatHistory = []
			state.chatContext = null
			state.streamingContent = ''
			state.isStreaming = false
		},
		addUserMessage: (state, action: PayloadAction<{ id: string; content: string; attachments?: MessageAttachment[] }>) => {
			const msg: ChatMessage = {
				id: action.payload.id,
				chatId: null,
				role: 'user',
				content: action.payload.content,
				decision: null,
				reasoning: null,
				createdAt: new Date().toISOString(),
				attachments: action.payload.attachments ?? [],
			}
			state.chatHistory.push(msg)
			state.isStreaming = true
			state.streamingContent = ''
		},
		replaceMessageId: (state, action: PayloadAction<{ tempId: string; realId: string }>) => {
			const msg = state.chatHistory.find((m) => m.id === action.payload.tempId)
			if (msg) msg.id = action.payload.realId
		},
		appendStreamingChunk: (state, action: PayloadAction<string>) => {
			state.isStreaming = true
			state.streamingContent += action.payload
		},
		setSelectedModel: (state, action: PayloadAction<string>) => {
			state.selectedModel = action.payload
		},
		streamingStart: (state) => {
			state.isStreaming = true
			state.streamingContent = ''
		},
		streamingDone: (state) => {
			state.isStreaming = false
			state.streamingContent = ''
		},
		updateMessageStatus: (
			state,
			action: PayloadAction<{ messageId: string; status: string }>
		) => {
			const msg = state.chatHistory.find((m) => m.id === action.payload.messageId)
			if (msg) msg.status = action.payload.status
		},
		updateAttachmentStatus: (
			state,
			action: PayloadAction<{
				messageId: string
				attachmentId: string
				status: AttachmentStatus
			}>
		) => {
			const msg = state.chatHistory.find((m) => m.id === action.payload.messageId)
			if (!msg?.attachments) return
			const att = msg.attachments.find((a) => a.id === action.payload.attachmentId)
			if (att) {
				att.status = action.payload.status
			} else {
				// Оптимистичное вложение имеет локальный id — присваиваем реальный UUID и обновляем статус
				const tempAtt = msg.attachments.find((a) => !UUID_RE.test(a.id))
				if (tempAtt) {
					tempAtt.id = action.payload.attachmentId
					tempAtt.status = action.payload.status
				}
			}
		},
		setHistory: (
			state,
			action: PayloadAction<{ messages: ChatMessage[]; context: ChatContext | null }>
		) => {
			state.chatHistory = action.payload.messages
			if (action.payload.context !== undefined) state.chatContext = action.payload.context
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
				state.chatHistory = action.payload.messages
				state.chatContext = action.payload.context ?? null
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
				state.chatHistory = action.payload.messages
				state.chatContext = action.payload.context ?? null
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
	replaceMessageId,
	appendStreamingChunk,
	streamingStart,
	streamingDone,
	setSelectedModel,
	updateMessageStatus,
	updateAttachmentStatus,
	setHistory,
} = apiChatSlice.actions

export default apiChatSlice.reducer
