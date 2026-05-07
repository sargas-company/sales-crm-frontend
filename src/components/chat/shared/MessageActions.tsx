import { useState, useRef, useEffect, RefObject } from 'react'
import styled from 'styled-components'
import { ContentCopyRounded, GTranslateRounded, CheckRounded } from '@mui/icons-material'
import axiosInstance from '../../../api/axiosInstance'
import useTheme from '../../../theme/useTheme'
import { useToast } from '../../../context/toast/ToastContext'

type Lang = 'RU' | 'UK'

interface Props {
	messageId: string
	content: string
	contentRef: RefObject<HTMLDivElement>
	onTranslated: (text: string | null) => void
	translatedContent: string | null
}

const MessageActions = ({ messageId, contentRef, onTranslated, translatedContent }: Props) => {
	const { theme } = useTheme()
	const { showToast } = useToast()
	const [showLangMenu, setShowLangMenu] = useState(false)
	const [loading, setLoading] = useState(false)
	const [copied, setCopied] = useState(false)
	const [translateError, setTranslateError] = useState(false)
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowLangMenu(false)
			}
		}
		if (showLangMenu) document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [showLangMenu])

	const handleCopy = async () => {
		const el = contentRef.current
		if (!el) return

		const html = el.innerHTML
		const text = el.innerText

		try {
			await navigator.clipboard.write([
				new ClipboardItem({
					'text/html': new Blob([html], { type: 'text/html' }),
					'text/plain': new Blob([text], { type: 'text/plain' }),
				}),
			])
		} catch {
			// Fallback — some browsers block ClipboardItem
			await navigator.clipboard.writeText(text)
		}

		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const translate = async (lang: Lang) => {
		setShowLangMenu(false)
		setLoading(true)
		try {
			const { data } = await axiosInstance.post<{ content: string }>(
				`/chat/messages/${messageId}/translate`,
				{ targetLanguage: lang }
			)
			setTranslateError(false)
			onTranslated(data.content)
		} catch (e: unknown) {
			const message =
				(e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
				'Translation failed'
			setTranslateError(true)
			showToast(message, 'error')
		} finally {
			setLoading(false)
		}
	}

	const handleTranslateClick = () => {
		if (translateError) {
			setTranslateError(false)
			setShowLangMenu(true)
			return
		}
		if (translatedContent) {
			onTranslated(null)
		} else {
			setShowLangMenu((v) => !v)
		}
	}

	return (
		<ActionsRow>
			<IconBtn title='Copy' onClick={handleCopy} success={copied} tabIndex={-1}>
				{copied ? (
					<CheckRounded sx={{ fontSize: 15 }} />
				) : (
					<ContentCopyRounded sx={{ fontSize: 15 }} />
				)}
			</IconBtn>

			<LangMenuWrapper ref={menuRef}>
				<IconBtn
					title={translateError ? 'Reset' : translatedContent ? 'Show original' : 'Translate'}
					onClick={handleTranslateClick}
					active={!!translatedContent}
					error={translateError}
					disabled={loading}
					tabIndex={-1}
				>
					<GTranslateRounded sx={{ fontSize: 15 }} />
				</IconBtn>

				{showLangMenu && (
					<LangMenu borderColor={theme.primaryColor.color}>
						<LangOption onClick={() => translate('UK')} disabled={loading}>
							UA
						</LangOption>
						<LangOption onClick={() => translate('RU')} disabled={loading}>
							RU
						</LangOption>
					</LangMenu>
				)}
			</LangMenuWrapper>
		</ActionsRow>
	)
}

export default MessageActions

const ActionsRow = styled.div`
	display: flex;
	align-items: center;
	gap: 1px;
`

const IconBtn = styled.button<{ active?: boolean; success?: boolean; error?: boolean }>`
	display: flex;
	align-items: center;
	justify-content: center;
	width: auto;
	height: auto;
	border: none;
	background: none;
	border-radius: 3px;
	cursor: pointer;
	padding: 2px 4px;
	min-width: 0;
	line-height: 0;
	color: ${({ active, success, error }) =>
		error ? '#ef4444' : success ? '#22c55e' : active ? '#6366f1' : 'inherit'};
	opacity: ${({ active, success, error }) => (active || success || error ? 1 : 0.5)};
	transition: opacity 0.15s, background 0.15s, color 0.15s;

	&:hover:not(:disabled) {
		opacity: 1;
		background: rgba(0, 0, 0, 0.07);
	}

	&:disabled {
		cursor: default;
		opacity: 0.3;
	}
`

const LangMenuWrapper = styled.div`
	position: relative;
`

const LangMenu = styled.div<{ borderColor: string }>`
	position: absolute;
	bottom: calc(100% + 4px);
	left: 50%;
	transform: translateX(-50%);
	display: flex;
	gap: 4px;
	background: var(--bg, #fff);
	border: 1px solid ${({ borderColor }) => borderColor}33;
	border-radius: 6px;
	padding: 4px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
	z-index: 10;
`

const LangOption = styled.button`
	border: none;
	background: none;
	cursor: pointer;
	font-size: 11px;
	font-weight: 600;
	padding: 3px 8px;
	border-radius: 4px;
	letter-spacing: 0.5px;
	transition: background 0.15s;

	&:hover:not(:disabled) {
		background: rgba(0, 0, 0, 0.07);
	}

	&:disabled {
		opacity: 0.5;
		cursor: default;
	}
`
