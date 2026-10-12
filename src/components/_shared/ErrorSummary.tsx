import { forwardRef } from 'react'
import styled from 'styled-components'
import { T } from '../sales-analytics/_shared/tokens'

/** Scroll to and focus a form control by its `name` attribute. */
export const focusByName = (inputName: string) => {
	const el = document.querySelector<HTMLElement>(`[name="${inputName}"]`)
	el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
	el?.focus({ preventScroll: true })
}

export interface SummaryItem {
	name: string
	message: string
}

interface Props {
	items: SummaryItem[]
	onJump: (name: string) => void
}

/**
 * Focusable error summary shown after a failed submit when several
 * fields are invalid. Complements (never replaces) the inline
 * FieldError under each input: the form moves focus here, and each
 * row jumps to its field.
 */
const ErrorSummary = forwardRef<HTMLDivElement, Props>(({ items, onJump }, ref) => {
	if (items.length === 0) return null
	return (
		<Box ref={ref} role='alert' tabIndex={-1} aria-label='Form errors'>
			<SummaryTitle>
				There {items.length === 1 ? 'is a problem' : `are ${items.length} problems`} with the form
			</SummaryTitle>
			<List>
				{items.map((it) => (
					<li key={it.name}>
						<JumpLink type='button' onClick={() => onJump(it.name)}>
							{it.message}
						</JumpLink>
					</li>
				))}
			</List>
		</Box>
	)
})

ErrorSummary.displayName = 'ErrorSummary'
export default ErrorSummary

/** General (non-field) server error block shown above the footer. */
export const ServerErrorBox = styled.div`
	margin: 0 0 14px;
	padding: 10px 14px;
	border-radius: 12px;
	border: 1px solid rgba(220, 38, 38, 0.35);
	background: rgba(220, 38, 38, 0.06);
	color: #b91c1c;
	font-size: 12.5px;
	white-space: pre-line;
`

const Box = styled.div`
	margin: 0 0 16px;
	padding: 12px 16px;
	border-radius: 12px;
	border: 1px solid rgba(220, 38, 38, 0.35);
	background: rgba(220, 38, 38, 0.06);
	outline: none;
	&:focus-visible {
		box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
	}
`
const SummaryTitle = styled.div`
	font-weight: 700;
	font-size: 13.5px;
	color: #b91c1c;
	margin-bottom: 6px;
`
const List = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	li {
		margin: 3px 0;
	}
`
const JumpLink = styled.button`
	background: none;
	border: none;
	padding: 0;
	cursor: pointer;
	font-size: 12.5px;
	color: ${T.primary};
	font-weight: 600;
	text-decoration: underline;
	text-underline-offset: 2px;
	text-transform: none;
	letter-spacing: normal;
	text-align: left;
`
