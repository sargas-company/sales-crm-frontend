import { ChangeEvent, FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import styled from 'styled-components'
import { Button } from '../../../ui'
import { useGetPromptByIdQuery, useUpdatePromptMutation } from '../../../store/prompts/promptsApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import PermissionGate from '../../auth/PermissionGate'
import { Field, FormHeader, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldStack,
	FootActions,
	FootBar,
	FootLeft,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'
import { AnimatedSegmented, type AnimatedSegmentedItem } from '../../_shared/AnimatedSegmented'
import Loading from '../../../ui/state/Loading'
import ErrorState from '../../../ui/state/ErrorState'
import { T } from '../../sales-analytics/_shared/tokens'

const PromptIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M4 5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M14 3v6h6M9 14l-1.5 1.5L9 17M13 14l1.5 1.5L13 17'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

type EditorMode = 'plain' | 'markdown'

const MODE_ITEMS: AnimatedSegmentedItem<EditorMode>[] = [
	{ value: 'plain', label: 'Plain text' },
	{ value: 'markdown', label: 'Markdown' },
]

interface Props {
	id: string
}

const PromptEditForm = ({ id }: Props) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: prompt, isLoading, isError, refetch } = useGetPromptByIdQuery(id, { skip: !id })
	const [updatePrompt, { isLoading: isSaving }] = useUpdatePromptMutation()

	const [content, setContent] = useState('')
	const [error, setError] = useState<string | undefined>()
	const [mode, setMode] = useState<EditorMode>('plain')
	const textareaRef = useRef<HTMLTextAreaElement>(null)

	useEffect(() => {
		if (prompt) setContent(prompt.content)
	}, [prompt])

	/* Auto-grow the Plain textarea so there is no inner scroll — the
	 * element always matches its content height. The `+ 4` offset
	 * covers the border (1.5px top + 1.5px bottom) under border-box
	 * so the last line keeps its full bottom padding instead of
	 * being clipped by a few pixels. */
	useLayoutEffect(() => {
		const el = textareaRef.current
		if (!el || mode !== 'plain') return
		el.style.height = 'auto'
		el.style.height = `${el.scrollHeight + 4}px`
	}, [content, mode])

	if (isLoading && !prompt) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Loading label='Loading prompt…' />
				</Surface>
			</Shell>
		)
	}
	if (isError || !prompt) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<ErrorState
						title='Prompt not found'
						description='Could not load prompt.'
						action={
							<Button varient='outlined' onClick={() => refetch()}>
								Retry
							</Button>
						}
					/>
				</Surface>
			</Shell>
		)
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		const trimmed = content.trim()
		if (!trimmed) {
			setError('Content is required')
			return
		}
		if (trimmed.length < 10) {
			setError('Content must be at least 10 characters')
			return
		}
		try {
			await updatePrompt({ id, body: { content: trimmed } }).unwrap()
			showToast('Prompt updated successfully', 'success')
			navigate(`/prompts/preview/${id}`)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const dirty = content !== prompt.content

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo={`/prompts/preview/${id}`}
					backLabel='Back to prompt'
					icon={<PromptIcon />}
					title={`Edit — ${prompt.title}`}
					subtitle='Editing creates a new version of this prompt.'
					badgeLabel='Editing'
					badgeTone='edit'
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Prompt body'
							hint='Paste raw markdown or edit the plain text — switch views below.'
						/>
						<ModeRow>
							<AnimatedSegmented<EditorMode>
								items={MODE_ITEMS}
								active={mode}
								onSelect={(v) => setMode((v || 'plain') as EditorMode)}
							/>
							<CharCount>
								{content.length.toLocaleString()} chars
								{dirty && <DirtyDot aria-hidden='true' />}
							</CharCount>
						</ModeRow>
						<FieldStack>
							<Field label='Content' required error={error}>
								<EditorStack>
									<EditorPanel $active={mode === 'plain'}>
										<PlainTextarea
											ref={textareaRef}
											name='content'
											placeholder='Enter the prompt text (paste raw markdown if needed)…'
											value={content}
											onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
												setContent(e.target.value)
												if (error) setError(undefined)
											}}
											aria-label='Plain text content'
											aria-hidden={mode !== 'plain'}
											tabIndex={mode === 'plain' ? 0 : -1}
										/>
									</EditorPanel>
									<EditorPanel $active={mode === 'markdown'}>
										<MarkdownPreview aria-hidden={mode !== 'markdown'}>
											{content.trim() ? (
												<ReactMarkdown remarkPlugins={[remarkGfm]}>
													{content}
												</ReactMarkdown>
											) : (
												<PreviewEmpty>
													Nothing to render yet. Switch back to «Plain text» and paste
													your Markdown — the rendered output will appear here.
												</PreviewEmpty>
											)}
										</MarkdownPreview>
									</EditorPanel>
								</EditorStack>
							</Field>
						</FieldStack>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							Saving creates version {prompt.version + 1}
						</FootLeft>
						<FootActions>
							<CancelSlot>
								<Button
									varient='outlined'
									type='button'
									onClick={() => navigate(`/prompts/preview/${id}`)}
								>
									Cancel
								</Button>
							</CancelSlot>
							<PermissionGate permission='prompts:update'>
								<PrimarySolidButton type='submit' disabled={isSaving || !dirty}>
									{isSaving ? 'Saving…' : 'Save changes'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

export default PromptEditForm

/* ─── Styles ──────────────────────────────────────────────────── */

const ModeRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	margin-bottom: 14px;
	flex-wrap: wrap;
`

const CharCount = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	letter-spacing: 0.3px;
	color: ${T.textMuted};
`

/* Keeps the outlined Cancel button fully transparent on hover —
   the shared UI Button fills a light-primary tint by default. */
const CancelSlot = styled.div`
	display: inline-block;

	& > button:hover:not(:disabled) {
		background: transparent !important;
	}
`

const DirtyDot = styled.span`
	width: 7px;
	height: 7px;
	border-radius: 50%;
	background: #e85d2f;
	box-shadow: 0 0 0 3px rgba(232, 93, 47, 0.18);
`

/* ─── Editor crossfade stack ───────────────────────────────────
   Both panels live in the same grid cell. Only one is active —
   it fades in with a tiny translate-up spring, the other fades
   out and goes pointer-events: none. No layout jump between
   switches: the stack height = max of the two panels. */

const EditorStack = styled.div`
	position: relative;
	display: grid;
	grid-template-areas: 'cell';
	min-height: 380px;
`

const EditorPanel = styled.div<{ $active: boolean }>`
	grid-area: cell;
	display: flex;
	flex-direction: column;
	opacity: ${(p) => (p.$active ? 1 : 0)};
	transform: ${(p) => (p.$active ? 'translateY(0)' : 'translateY(6px)')};
	pointer-events: ${(p) => (p.$active ? 'auto' : 'none')};
	transition:
		opacity 260ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	will-change: opacity, transform;

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const PlainTextarea = styled.textarea`
	box-sizing: border-box;
	display: block;
	width: 100%;
	min-height: 380px;
	padding: 18px 18px 36px;
	border-radius: 10px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	resize: none;
	overflow: hidden;
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 13px;
	line-height: 1.55;
	color: ${T.textStrong};
	transition:
		border-color 160ms ease,
		box-shadow 180ms ease;

	&:hover {
		border-color: rgba(15, 23, 42, 0.22);
	}
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: ${T.primary};
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}

	&::placeholder {
		color: ${T.textMuted};
	}
`

const MarkdownPreview = styled.div`
	flex: 1;
	min-height: 380px;
	padding: 18px 22px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	background: #ffffff;
	overflow: visible;
	font-size: 13.5px;
	line-height: 1.6;
	color: ${T.textStrong};

	h1,
	h2,
	h3,
	h4 {
		margin: 0.6em 0 0.3em;
		font-family: 'Fraunces', ui-serif, Georgia, serif;
		font-weight: 600;
		letter-spacing: -0.2px;
	}
	h1 {
		font-size: 20px;
	}
	h2 {
		font-size: 17px;
	}
	h3 {
		font-size: 15px;
	}
	p {
		margin: 0.4em 0;
	}
	ul,
	ol {
		padding-left: 1.4em;
		margin: 0.4em 0;
	}
	li + li {
		margin-top: 2px;
	}
	code {
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 12px;
		padding: 1px 6px;
		border-radius: 4px;
		background: rgba(15, 23, 42, 0.06);
	}
	pre {
		padding: 10px 12px;
		border-radius: 8px;
		background: #0f172a;
		color: #e2e8f0;
		overflow-x: auto;

		code {
			background: transparent;
			color: inherit;
			padding: 0;
			font-size: 12px;
		}
	}
	blockquote {
		margin: 0.6em 0;
		padding: 4px 12px;
		border-left: 3px solid ${T.primary};
		color: ${T.textSecondary};
		background: rgba(3, 105, 161, 0.04);
	}
	table {
		border-collapse: collapse;
		margin: 0.6em 0;
		font-size: 12.5px;

		th,
		td {
			border: 1px solid rgba(15, 23, 42, 0.08);
			padding: 4px 8px;
			text-align: left;
		}
		th {
			background: rgba(15, 23, 42, 0.03);
		}
	}
	a {
		color: ${T.primary};
	}
	hr {
		border: 0;
		border-top: 1px dashed rgba(15, 23, 42, 0.14);
		margin: 1em 0;
	}
`

const PreviewEmpty = styled.div`
	color: ${T.textMuted};
	font-style: italic;
	font-size: 13px;
`
