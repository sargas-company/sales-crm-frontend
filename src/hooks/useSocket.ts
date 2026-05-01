import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppDispatch, useAppSelector } from './index'
import {
	appendStreamingChunk,
	setStreamingAnalysis,
	streamingDone,
} from '../store/chats/apiChatSlice'
import axiosInstance from '../api/axiosInstance'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

export const useSocket = () => {
	const dispatch = useAppDispatch()
	const accessToken = useAppSelector((state) => state.auth.accessToken)
	const socketRef = useRef<Socket | null>(null)

	useEffect(() => {
		if (!accessToken) return

		const socket = io(WS_URL, {
			auth: { token: accessToken },
		})

		socket.on('analysis', ({ decision, reasoning }: { decision: string; reasoning: string }) => {
			dispatch(setStreamingAnalysis({ decision, reasoning }))
		})

		socket.on('chunk', ({ text }: { text: string }) => {
			dispatch(appendStreamingChunk(text))
		})

		socket.on('done', () => {
			dispatch(streamingDone())
		})

		socket.on('error', ({ message }: { message: string }) => {
			console.error('Socket error:', message)
			dispatch(streamingDone())
		})

		socketRef.current = socket

		return () => {
			socket.disconnect()
			socketRef.current = null
		}
	}, [accessToken, dispatch])

	const sendMessage = useCallback(async (proposalId: string, content: string, model?: string, files?: File[]) => {
		if (files?.length) {
			const formData = new FormData()
			formData.append('content', content)
			if (model) formData.append('model', model)
			if (socketRef.current?.id) formData.append('socketId', socketRef.current.id)
			files.forEach((f) => formData.append('files', f))
			await axiosInstance.post(`/proposals/${proposalId}/chat`, formData, {
				headers: { 'Content-Type': undefined },
			})
		} else {
			socketRef.current?.emit('send_message', { proposalId, content, ...(model ? { model } : {}) })
		}
	}, [])

	return { sendMessage }
}
