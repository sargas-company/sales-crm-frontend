import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

type Mime = string

interface Props {
	url: string
	name: string
	mime: Mime
}

type Kind =
	| 'image'
	| 'pdf'
	| 'video'
	| 'audio'
	| 'docx'
	| 'xlsx'
	| 'md'
	| 'text'
	| 'code'
	| 'unknown'

const extOf = (name: string): string => {
	const dot = name.lastIndexOf('.')
	return dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
}

const CODE_EXTS = new Set([
	'json',
	'xml',
	'yaml',
	'yml',
	'js',
	'ts',
	'tsx',
	'jsx',
	'css',
	'scss',
	'less',
	'html',
	'py',
	'rb',
	'go',
	'rs',
	'java',
	'kt',
	'sh',
	'sql',
	'php',
	'c',
	'cpp',
	'h',
	'swift',
])

const TEXT_EXTS = new Set(['txt', 'log', 'csv', 'tsv', 'env', 'ini', 'cfg'])

/** Resolve the viewer kind from MIME first, falling back to the file
 *  extension — some B2 uploads carry `application/octet-stream` and we
 *  need to still show a decent preview. */
const resolveKind = (mime: Mime, name: string): Kind => {
	const m = mime.toLowerCase()
	if (m.startsWith('image/')) return 'image'
	if (m === 'application/pdf') return 'pdf'
	if (m.startsWith('video/')) return 'video'
	if (m.startsWith('audio/')) return 'audio'
	if (m.includes('officedocument.wordprocessingml') || m === 'application/msword')
		return 'docx'
	if (m.includes('spreadsheetml') || m.includes('ms-excel')) return 'xlsx'
	if (m === 'text/markdown') return 'md'
	const ext = extOf(name)
	if (ext === 'docx' || ext === 'doc') return 'docx'
	if (ext === 'xlsx' || ext === 'xls') return 'xlsx'
	if (ext === 'md' || ext === 'markdown') return 'md'
	if (CODE_EXTS.has(ext)) return 'code'
	if (TEXT_EXTS.has(ext)) return 'text'
	if (m.startsWith('text/')) return 'text'
	return 'unknown'
}

export const FilePreview = ({ url, name, mime }: Props) => {
	const kind = useMemo(() => resolveKind(mime, name), [mime, name])

	if (kind === 'image') return <img src={url} alt={name} style={imgStyle} />
	if (kind === 'pdf')
		return <iframe src={url} title={name} style={iframeStyle} />
	if (kind === 'video')
		return (
			<video src={url} controls style={mediaStyle} controlsList='nodownload'>
				Your browser doesn't support video playback.
			</video>
		)
	if (kind === 'audio')
		return (
			<AudioWrap>
				<audio src={url} controls style={{ width: '100%' }}>
					Your browser doesn't support audio playback.
				</audio>
			</AudioWrap>
		)
	if (kind === 'docx') return <DocxView url={url} name={name} />
	if (kind === 'xlsx') return <XlsxView url={url} name={name} />
	if (kind === 'md') return <TextView url={url} as='md' />
	if (kind === 'code') return <TextView url={url} as='code' ext={extOf(name)} />
	/* Plain text: render via iframe so the browser handles it as a
	 *  native text/plain document — no fetch, no CORS. Previously
	 *  we fetched the URL and dumped the body into <pre>, but B2
	 *  signed URLs don't carry CORS headers so the fetch failed
	 *  with "Failed to fetch". Iframe doesn't go through CORS. */
	if (kind === 'text')
		return (
			<iframe
				src={url}
				style={iframeStyle}
				title={name}
				sandbox=''
			/>
		)

	return (
		<FallbackWrap>
			<FallbackIcon>?</FallbackIcon>
			<FallbackTitle>Can't preview this file</FallbackTitle>
			<FallbackHint>
				Use the Download button to open <code>{name}</code> in a native app.
			</FallbackHint>
		</FallbackWrap>
	)
}

/* ─── DOCX viewer ─────────────────────────────────────────────────── */

const DocxView = ({ url, name }: { url: string; name: string }) => {
	const ref = useRef<HTMLDivElement | null>(null)
	const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
	const [errorMsg, setErrorMsg] = useState('')

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const [{ renderAsync }, buffer] = await Promise.all([
					import('docx-preview'),
					fetch(url).then((r) => r.arrayBuffer()),
				])
				if (cancelled || !ref.current) return
				ref.current.innerHTML = ''
				await renderAsync(buffer, ref.current, undefined, {
					className: 'docx-content',
					inWrapper: true,
					ignoreWidth: false,
					ignoreHeight: false,
					breakPages: true,
				})
				if (!cancelled) setState('ok')
			} catch (e) {
				if (!cancelled) {
					setState('error')
					setErrorMsg(e instanceof Error ? e.message : String(e))
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [url])

	return (
		<DocxWrap>
			{state === 'loading' && <Spinner>Loading {name}…</Spinner>}
			{state === 'error' && (
				<ErrorNote>Failed to render document — {errorMsg}</ErrorNote>
			)}
			<DocxTarget ref={ref} style={{ display: state === 'ok' ? 'block' : 'none' }} />
		</DocxWrap>
	)
}

/* ─── XLSX viewer ─────────────────────────────────────────────────── */

type SheetTable = { name: string; html: string }

const XlsxView = ({ url, name }: { url: string; name: string }) => {
	const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
	const [sheets, setSheets] = useState<SheetTable[]>([])
	const [active, setActive] = useState(0)
	const [errorMsg, setErrorMsg] = useState('')

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const [XLSX, buffer] = await Promise.all([
					import('xlsx'),
					fetch(url).then((r) => r.arrayBuffer()),
				])
				if (cancelled) return
				const wb = XLSX.read(buffer, { type: 'array' })
				const out: SheetTable[] = wb.SheetNames.map((n) => ({
					name: n,
					html: XLSX.utils.sheet_to_html(wb.Sheets[n], { editable: false }),
				}))
				if (!cancelled) {
					setSheets(out)
					setState('ok')
				}
			} catch (e) {
				if (!cancelled) {
					setState('error')
					setErrorMsg(e instanceof Error ? e.message : String(e))
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [url])

	if (state === 'loading') return <Spinner>Loading {name}…</Spinner>
	if (state === 'error')
		return <ErrorNote>Failed to parse spreadsheet — {errorMsg}</ErrorNote>

	return (
		<XlsxWrap>
			{sheets.length > 1 && (
				<SheetTabs>
					{sheets.map((s, i) => (
						<SheetTab
							key={s.name}
							type='button'
							$active={i === active}
							onClick={() => setActive(i)}
						>
							{s.name}
						</SheetTab>
					))}
				</SheetTabs>
			)}
			<XlsxBody dangerouslySetInnerHTML={{ __html: sheets[active]?.html ?? '' }} />
		</XlsxWrap>
	)
}

/* ─── Text / Markdown / Code viewer ──────────────────────────────── */

type TextMode = 'text' | 'md' | 'code'

const TextView = ({
	url,
	as,
	ext,
}: {
	url: string
	as: TextMode
	ext?: string
}) => {
	const [body, setBody] = useState<string>('')
	const [html, setHtml] = useState<string>('')
	const [state, setState] = useState<'loading' | 'ok' | 'error'>('loading')
	const [errorMsg, setErrorMsg] = useState('')

	useEffect(() => {
		let cancelled = false
		;(async () => {
			try {
				const text = await fetch(url).then((r) => r.text())
				if (cancelled) return
				if (as === 'md') {
					const rendered = await marked.parse(text, { breaks: true })
					if (!cancelled)
						setHtml(DOMPurify.sanitize(rendered as string))
				} else if (as === 'code') {
					const hljs = (await import('highlight.js/lib/common')).default
					const highlighted = ext
						? hljs.getLanguage(ext)
							? hljs.highlight(text, { language: ext }).value
							: hljs.highlightAuto(text).value
						: hljs.highlightAuto(text).value
					if (!cancelled) setHtml(highlighted)
					if (!cancelled) {
						await import('highlight.js/styles/github.css' as string).catch(() => {})
					}
				} else {
					setBody(text)
				}
				if (!cancelled) setState('ok')
			} catch (e) {
				if (!cancelled) {
					setState('error')
					setErrorMsg(e instanceof Error ? e.message : String(e))
				}
			}
		})()
		return () => {
			cancelled = true
		}
	}, [url, as, ext])

	if (state === 'loading') return <Spinner>Loading…</Spinner>
	if (state === 'error')
		return <ErrorNote>Failed to load text — {errorMsg}</ErrorNote>

	if (as === 'md') return <MdBody dangerouslySetInnerHTML={{ __html: html }} />
	if (as === 'code')
		return (
			<CodeBlock>
				<code
					className={ext ? `language-${ext}` : ''}
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</CodeBlock>
		)
	return <TextBlock>{body}</TextBlock>
}

/* ─── Styles ──────────────────────────────────────────────────────── */

const imgStyle = {
	maxWidth: '100%',
	maxHeight: '80vh',
	display: 'block',
	margin: '0 auto',
	borderRadius: 8,
}
const iframeStyle = {
	width: '100%',
	height: '80vh',
	border: 'none',
	background: '#f8fafc',
}
const mediaStyle = {
	maxWidth: '100%',
	maxHeight: '80vh',
	display: 'block',
	margin: '0 auto',
	background: '#000',
	borderRadius: 8,
}

const spin = keyframes`
	to { transform: rotate(360deg); }
`

const Spinner = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: #64748b;
	font-size: 13px;
	&::before {
		content: '';
		display: inline-block;
		width: 16px;
		height: 16px;
		margin-right: 10px;
		border: 2px solid rgba(15, 23, 42, 0.14);
		border-top-color: #0f172a;
		border-radius: 50%;
		vertical-align: -3px;
		animation: ${spin} 760ms linear infinite;
	}
`

const ErrorNote = styled.div`
	padding: 40px 20px;
	text-align: center;
	color: #b91c1c;
	font-size: 13px;
`

const AudioWrap = styled.div`
	padding: 60px 40px;
	background: #f8fafc;
	border-radius: 8px;
`

const DocxWrap = styled.div`
	max-height: 80vh;
	overflow: auto;
	padding: 20px;
	background: #f8fafc;
`

const DocxTarget = styled.div`
	.docx-wrapper {
		background: transparent;
		padding: 0;
	}
	.docx-content section {
		background: #ffffff;
		box-shadow: 0 2px 10px -4px rgba(15, 23, 42, 0.14);
		margin: 0 auto 16px;
	}
`

const XlsxWrap = styled.div`
	display: flex;
	flex-direction: column;
	max-height: 80vh;
`

const SheetTabs = styled.div`
	display: flex;
	gap: 2px;
	padding: 8px 12px 0;
	background: #f8fafc;
	border-bottom: 1px solid rgba(15, 23, 42, 0.06);
	overflow-x: auto;
`

const SheetTab = styled.button<{ $active: boolean }>`
	border: none;
	background: ${({ $active }) =>
		$active ? '#ffffff' : 'transparent'};
	padding: 8px 14px;
	border-radius: 6px 6px 0 0;
	font: inherit;
	font-size: 12px;
	font-weight: ${({ $active }) => ($active ? 700 : 500)};
	color: ${({ $active }) => ($active ? '#0f172a' : '#64748b')};
	cursor: pointer;
	white-space: nowrap;
	border-top: 1px solid
		${({ $active }) => ($active ? 'rgba(15, 23, 42, 0.06)' : 'transparent')};
	border-left: 1px solid
		${({ $active }) => ($active ? 'rgba(15, 23, 42, 0.06)' : 'transparent')};
	border-right: 1px solid
		${({ $active }) => ($active ? 'rgba(15, 23, 42, 0.06)' : 'transparent')};
	&:hover { color: #0f172a; }
`

const XlsxBody = styled.div`
	flex: 1;
	overflow: auto;
	padding: 10px 14px;
	background: #ffffff;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 12.5px;
	table {
		border-collapse: collapse;
		width: 100%;
	}
	td, th {
		border: 1px solid rgba(15, 23, 42, 0.08);
		padding: 4px 8px;
		min-width: 60px;
	}
	th {
		background: #f1f5f9;
		font-weight: 700;
	}
`

const MdBody = styled.div`
	max-height: 80vh;
	overflow: auto;
	padding: 24px 32px;
	background: #ffffff;
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 14.5px;
	line-height: 1.65;
	color: #0f172a;
	h1, h2, h3 { font-weight: 700; letter-spacing: -0.2px; margin: 1.2em 0 0.4em; }
	h1 { font-size: 24px; }
	h2 { font-size: 20px; }
	h3 { font-size: 17px; }
	p { margin: 0 0 1em; }
	code { background: rgba(15, 23, 42, 0.05); padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
	pre { background: #0f172a; color: #e2e8f0; padding: 12px 14px; border-radius: 8px; overflow-x: auto; }
	pre code { background: transparent; padding: 0; color: inherit; }
	ul, ol { padding-left: 1.4em; }
	blockquote { border-left: 3px solid #cbd5e1; padding-left: 12px; color: #64748b; margin: 1em 0; }
	a { color: #0369a1; }
	table { border-collapse: collapse; width: 100%; }
	th, td { border: 1px solid rgba(15, 23, 42, 0.08); padding: 6px 10px; }
	img { max-width: 100%; }
`

const CodeBlock = styled.pre`
	max-height: 80vh;
	overflow: auto;
	margin: 0;
	padding: 16px 20px;
	background: #0f172a;
	color: #e2e8f0;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	line-height: 1.55;
	tab-size: 2;
	code { color: inherit; }
`

const TextBlock = styled.pre`
	max-height: 80vh;
	overflow: auto;
	margin: 0;
	padding: 20px;
	background: #ffffff;
	color: #0f172a;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	line-height: 1.6;
	white-space: pre-wrap;
	word-break: break-word;
`

const FallbackWrap = styled.div`
	padding: 80px 20px;
	text-align: center;
	color: #64748b;
`
const FallbackIcon = styled.div`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	border-radius: 50%;
	background: rgba(15, 23, 42, 0.06);
	color: #0f172a;
	font-size: 28px;
	font-weight: 700;
	margin-bottom: 16px;
`
const FallbackTitle = styled.div`
	font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
	font-weight: 700;
	font-size: 16px;
	color: #0f172a;
	margin-bottom: 6px;
`
const FallbackHint = styled.div`
	font-size: 13px;
	code {
		background: rgba(15, 23, 42, 0.05);
		padding: 1px 6px;
		border-radius: 4px;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
	}
`
