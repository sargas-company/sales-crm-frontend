import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppDispatch, useAppSelector } from './index'
import {
	appendStreamingChunk,
	streamingStart,
	streamingDone,
	updateMessageStatus,
	updateAttachmentStatus,
	setHistory,
	type AttachmentStatus,
} from '../store/chats/apiChatSlice'
import axiosInstance from '../api/axiosInstance'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

export const useSocket = (proposalId: string | null = null) => {
	const dispatch = useAppDispatch()

	const accessToken = useAppSelector((state) => state.auth.accessToken)
	const selectedLeadId = useAppSelector((state) => state.apiChat.selectedLeadId)
	const activeTab = useAppSelector((state) => state.apiChat.activeTab)

	const socketRef = useRef<Socket | null>(null)
	const reloadHistoryRef = useRef<() => Promise<void>>()

	useEffect(() => {
		reloadHistoryRef.current = async () => {
			if (activeTab === 'proposal' && proposalId) {
				const { data } = await axiosInstance.get<{ messages: any[]; context: any }>(
					`/proposals/${proposalId}/chat/messages`
				)
				dispatch(setHistory({ messages: data.messages ?? [], context: data.context ?? null }))
			} else if (activeTab === 'lead' && selectedLeadId) {
				const { data } = await axiosInstance.get<any>(`/leads/${selectedLeadId}/chat`)
				const messages = Array.isArray(data) ? data : (data.messages ?? [])
				dispatch(setHistory({ messages, context: null }))
			}
		}
	}, [activeTab, proposalId, selectedLeadId, dispatch])

	// CREATE SOCKET ONLY ONCE
	useEffect(() => {
		if (!accessToken) return

		const socket = io(WS_URL, { auth: { token: accessToken } })
		socketRef.current = socket

		socket.on('connect', () => {
			if (proposalId) {
				socket.emit('join_proposal', { proposalId })
			}
		})

		socket.on('connect_error', (err) => {
			console.error('[socket] connect_error', err.message)
		})

		socket.on('message_updated', ({ messageId, status }) => {
			dispatch(updateMessageStatus({ messageId, status }))
			if (status === 'DONE' || status === 'FAILED') {
				dispatch(streamingDone())
				reloadHistoryRef.current?.()
			}
		})

		socket.on('attachment_updated', ({ attachmentId, messageId, status }: {
			attachmentId: string
			messageId: string
			status: AttachmentStatus
		}) => {
			dispatch(updateAttachmentStatus({ messageId, attachmentId, status }))
		})

		socket.on('thinking', () => {
			dispatch(streamingStart())
		})

		socket.on('chunk', ({ text }: { messageId: string; text: string }) => {
			dispatch(appendStreamingChunk(text))
		})

		socket.on('done', () => {
			dispatch(streamingDone())
		})

		socket.on('error', async (payload: unknown) => {
			console.error('[socket] error', payload)
			dispatch(streamingDone())
			await reloadHistoryRef.current?.()
		})

		return () => {
			socket.disconnect()
			socketRef.current = null
		}
	}, [accessToken, dispatch])

	// JOIN ROOM WHEN PROPOSAL CHANGES
	useEffect(() => {
		if (!proposalId || !socketRef.current?.connected) return
		socketRef.current.emit('join_proposal', { proposalId })
	}, [proposalId])

	const sendMessage = useCallback(
		async (proposalId: string, content: string, model?: string, files?: File[]): Promise<string | undefined> => {
			const formData = new FormData()
			formData.append('content', content)
			if (model) formData.append('model', model)
			files?.forEach((f) => formData.append('files', f))
			const { data } = await axiosInstance.post<{ status: string; messageId: string }>(
				`/proposals/${proposalId}/chat`,
				formData,
				{ headers: { 'Content-Type': undefined } },
			)
			return data.messageId
		},
		[]
	)

	return { sendMessage }
}
