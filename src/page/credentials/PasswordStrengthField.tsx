import { useMemo, useState } from 'react'
import styled from 'styled-components'
import {
	AutoAwesomeRounded,
	ContentCopyRounded,
	VisibilityOffRounded,
	VisibilityRounded,
} from '@mui/icons-material'

interface Props {
	value: string
	onChange: (next: string) => void
	placeholder?: string
	hasError?: boolean
	autoComplete?: string
	name?: string
}

/* Scoring: 0 (empty) .. 5 (excellent). Simple additive heuristic.
   For an owner-ready product you'd swap this for zxcvbn, but we want
   zero extra deps — this gives a passable curve for the UI. */
export function scorePassword(pwd: string): number {
	if (!pwd) return 0
	let s = 0
	if (pwd.length >= 8) s++
	if (pwd.length >= 12) s++
	if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) s++
	if (/\d/.test(pwd)) s++
	if (/[^A-Za-z0-9]/.test(pwd)) s++
	return s
}

const SCORE_LABEL: Record<number, string> = {
	0: '—',
	1: 'awful',
	2: 'weak',
	3: 'fair',
	4: 'strong',
	5: 'excellent',
}

const SCORE_COLOR: Record<number, string> = {
	0: '#cbd5e1',
	1: '#ef4444',
	2: '#f97316',
	3: '#eab308',
	4: '#22c55e',
	5: '#059669',
}

const GEN_ALPHA_LOWER = 'abcdefghijkmnopqrstuvwxyz'
const GEN_ALPHA_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const GEN_DIGITS = '23456789'
const GEN_SPECIAL = '!@#$%^&*()-_=+[]{}'

function cryptoChar(pool: string): string {
	const arr = new Uint32Array(1)
	crypto.getRandomValues(arr)
	return pool[arr[0] % pool.length]
}

function generatePassword(len = 20): string {
	const pools = [GEN_ALPHA_LOWER, GEN_ALPHA_UPPER, GEN_DIGITS, GEN_SPECIAL]
	const chars: string[] = pools.map((p) => cryptoChar(p))
	const all = pools.join('')
	for (let i = chars.length; i < len; i++) chars.push(cryptoChar(all))
	for (let i = chars.length - 1; i > 0; i--) {
		const arr = new Uint32Array(1)
		crypto.getRandomValues(arr)
		const j = arr[0] % (i + 1)
		;[chars[i], chars[j]] = [chars[j], chars[i]]
	}
	return chars.join('')
}

const PasswordStrengthField = ({
	value,
	onChange,
	placeholder,
	hasError,
	autoComplete,
	name,
}: Props) => {
	const [visible, setVisible] = useState(false)
	const [justCopied, setJustCopied] = useState(false)
	const score = useMemo(() => scorePassword(value), [value])

	const generate = () => {
		onChange(generatePassword(20))
		setVisible(true)
	}

	const copy = async () => {
		if (!value) return
		try {
			await navigator.clipboard.writeText(value)
			setJustCopied(true)
			setTimeout(() => setJustCopied(false), 1400)
		} catch {
			/* ignore */
		}
	}

	return (
		<Wrap>
			<Row>
				<InputBox $error={!!hasError}>
					<Input
						type={visible ? 'text' : 'password'}
						name={name}
						value={value}
						onChange={(e) => onChange(e.target.value)}
						placeholder={placeholder}
						autoComplete={autoComplete ?? 'new-password'}
						spellCheck={false}
					/>
					<InlineBtn
						type='button'
						onClick={() => setVisible((v) => !v)}
						aria-label={visible ? 'Hide password' : 'Show password'}
					>
						{visible ? (
							<VisibilityOffRounded style={{ fontSize: 18 }} />
						) : (
							<VisibilityRounded style={{ fontSize: 18 }} />
						)}
					</InlineBtn>
					<InlineBtn
						type='button'
						onClick={copy}
						disabled={!value}
						aria-label='Copy password'
						$success={justCopied}
					>
						<ContentCopyRounded style={{ fontSize: 16 }} />
					</InlineBtn>
				</InputBox>
				<GenBtn
					type='button'
					onClick={generate}
					aria-label='Generate strong password'
				>
					<AutoAwesomeRounded style={{ fontSize: 16 }} />
					generate
				</GenBtn>
			</Row>

			<StrengthRow>
				{[1, 2, 3, 4, 5].map((i) => (
					<Seg key={i} $filled={score >= i} $color={SCORE_COLOR[score]} />
				))}
				<StrengthLabel $color={SCORE_COLOR[score]}>
					{SCORE_LABEL[score]}
				</StrengthLabel>
			</StrengthRow>
		</Wrap>
	)
}

export default PasswordStrengthField

/* ─── Styles ──────────────────────────────────────────────────── */

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const Row = styled.div`
	display: flex;
	gap: 8px;
	align-items: stretch;
`

const InputBox = styled.div<{ $error: boolean }>`
	flex: 1;
	display: flex;
	align-items: center;
	gap: 0;
	padding: 0 4px 0 12px;
	border-radius: 10px;
	border: 1.5px solid
		${(p) => (p.$error ? '#dc2626' : 'rgba(15, 23, 42, 0.14)')};
	background: #ffffff;
	transition: border-color 160ms ease;
	&:focus-within {
		border-color: rgba(3, 105, 161, 1);
	}
`

const Input = styled.input`
	flex: 1;
	border: none;
	outline: none;
	padding: 10px 2px;
	font: inherit;
	font-size: 14px;
	background: transparent;
	color: #0f172a;
	&::placeholder {
		color: #94a3b8;
	}
`

const InlineBtn = styled.button<{ $success?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 auto;
	box-sizing: border-box;
	padding: 3px 4px;
	margin: 0;
	&:not(:last-child) {
		padding-right: 0;
		margin-right: -24px;
	}
	line-height: 0;
	border-radius: 4px;
	border: none;
	appearance: none;
	-webkit-appearance: none;
	background: transparent;
	color: ${(p) => (p.$success ? '#16a34a' : '#64748b')};
	cursor: pointer;
	transition: color 140ms ease;
	&:hover:not(:disabled) {
		color: #0f172a;
	}
	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

const GenBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 0 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(3, 105, 161, 0.35);
	background: transparent;
	color: rgba(3, 105, 161, 1);
	font: inherit;
	font-size: 12.5px;
	font-weight: 700;
	cursor: pointer;
	transition: transform 180ms cubic-bezier(0.22, 1.35, 0.36, 1);
	svg {
		transition: transform 320ms cubic-bezier(0.22, 1.35, 0.36, 1);
	}
	&:hover {
		transform: translateY(-1px);
	}
	&:hover svg {
		transform: rotate(90deg) scale(1.1);
	}
	&:active {
		transform: translateY(0);
	}
`

/* Segmented strength bars */
const StrengthRow = styled.div`
	display: flex;
	align-items: center;
	gap: 4px;
	padding: 2px 2px 0;
`
const Seg = styled.div<{ $filled: boolean; $color: string }>`
	flex: 1;
	height: 6px;
	border-radius: 3px;
	background: ${(p) => (p.$filled ? p.$color : 'rgba(15, 23, 42, 0.08)')};
	transition: background 320ms cubic-bezier(0.22, 1, 0.36, 1);
`
const StrengthLabel = styled.span<{ $color: string }>`
	min-width: 76px;
	text-align: right;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 1px;
	text-transform: uppercase;
	color: ${(p) => p.$color};
	transition: color 320ms ease;
`
