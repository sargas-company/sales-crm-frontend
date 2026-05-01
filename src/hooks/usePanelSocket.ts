import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppSelector } from './index'
import axiosInstance from '../api/axiosInstance'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3001'

interface Handlers {
	onAnalysis: (data: { decision: string; reasoning: string }) => void
	onChunk: (text: string) => void
	onDone: () => void
	onError?: (message: string) => void
}

export const usePanelSocket = (handlers: Handlers) => {
	const accessToken = useAppSelector((state) => state.auth.accessToken)
	const socketRef = useRef<Socket | null>(null)
	// Keep handlers ref up-to-date so socket listeners always call the latest version
	const handlersRef = useRef(handlers)
	handlersRef.current = handlers

	useEffect(() => {
		if (!accessToken) return

		const socket = io(WS_URL, { auth: { token: accessToken } })

		socket.on('analysis', (data: { decision: string; reasoning: string }) => {
			handlersRef.current.onAnalysis(data)
		})
		socket.on('chunk', ({ text }: { text: string }) => {
			handlersRef.current.onChunk(text)
		})
		socket.on('done', () => {
			handlersRef.current.onDone()
		})
		socket.on('error', ({ message }: { message: string }) => {
			handlersRef.current.onError?.(message)
		})

		socketRef.current = socket

		return () => {
			socket.disconnect()
			socketRef.current = null
		}
	}, [accessToken])

	const sendMessage = useCallback(async (proposalId: string, content: string, model?: string, files?: File[]) => {
		const formData = new FormData()
		formData.append('content', content)
		if (model) formData.append('model', model)
		if (socketRef.current?.id) formData.append('socketId', socketRef.current.id)
		files?.forEach((f) => formData.append('files', f))

		await axiosInstance.post(`/proposals/${proposalId}/chat`, formData, {
			headers: { 'Content-Type': undefined },
		})
	}, [])

	return { sendMessage }
}
