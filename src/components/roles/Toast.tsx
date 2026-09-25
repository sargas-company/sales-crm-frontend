import { createContext, FC, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircleOutline } from '@mui/icons-material'
import { ToastEl } from './roles.styled'

interface ToastMsg {
	id: number
	text: string
	leaving?: boolean
}

interface ToastCtx {
	push: (text: string) => void
}

const Context = createContext<ToastCtx | null>(null)

export const ToastProvider: FC<{ children: ReactNode }> = ({ children }) => {
	const [msgs, setMsgs] = useState<ToastMsg[]>([])
	const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({})

	const remove = useCallback((id: number) => {
		setMsgs((prev) => prev.map((m) => (m.id === id ? { ...m, leaving: true } : m)))
		setTimeout(() => setMsgs((prev) => prev.filter((m) => m.id !== id)), 240)
	}, [])

	const push = useCallback(
		(text: string) => {
			const id = Date.now() + Math.random()
			setMsgs((prev) => [...prev, { id, text }])
			timers.current[id] = setTimeout(() => remove(id), 2200)
		},
		[remove]
	)

	useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), [])

	return (
		<Context.Provider value={{ push }}>
			{children}
			{msgs.map((m) => (
				<ToastEl key={m.id} leaving={m.leaving}>
					<CheckCircleOutline fontSize='small' />
					<span>{m.text}</span>
				</ToastEl>
			))}
		</Context.Provider>
	)
}

export const useToast = () => {
	const ctx = useContext(Context)
	if (!ctx) throw new Error('useToast must be used within ToastProvider')
	return ctx
}
