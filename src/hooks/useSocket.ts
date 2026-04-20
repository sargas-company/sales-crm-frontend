import { useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppDispatch, useAppSelector } from './index'
import {
	appendStreamingChunk,
	setStreamingAnalysis,
	streamingDone,
} from '../store/chats/apiChatSlice'

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

	const sendMessage = useCallback((proposalId: string, content: string) => {
		socketRef.current?.emit('send_message', { proposalId, content })
	}, [])

	return { sendMessage }
}
