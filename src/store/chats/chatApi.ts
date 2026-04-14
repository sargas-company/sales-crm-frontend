import { baseApi } from '../../api/baseApi'

export interface GptMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GptResponse {
  message: string
  timestamp: string
}

export const chatApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GPT chat endpoint — wire up to your backend proxy to OpenAI
    sendGptMessage: builder.mutation<GptResponse, GptMessage[]>({
      query: (messages) => ({
        url: '/chat/completions',
        method: 'POST',
        body: { messages, model: 'gpt-4o' },
      }),
    }),
  }),
})

export const { useSendGptMessageMutation } = chatApi
