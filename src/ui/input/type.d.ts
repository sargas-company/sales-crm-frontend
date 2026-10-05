import { ChangeEvent, CSSProperties, KeyboardEventHandler, ReactNode } from 'react'
import { AlertColorType } from '../color/alert'

type InputType =
	| 'text'
	| 'password'
	| 'email'
	| 'file'
	| 'number'
	| 'checkbox'
	| 'radio'
	| 'range'
	| 'date'
	| 'datetime-local'
	| 'time'
export type InputVarient = 'filled' | 'standard' | 'regular'
type TextFieldChange = React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>

// Single flat shape — a prior discriminated-union forced call sites
// to narrow `multiRow` before TypeScript would accept any event
// handler. Legacy forms store the `onChange` as a generic callback
// that accepts either an input or a textarea event, so the type
// here is widened to that same shape; the two renderers below cast
// their own event back to the concrete DOM type they actually emit.
type InputEvents = {
	multiRow?: boolean
	multiline?: boolean
	onChange?: (
		e:
			| React.ChangeEvent<HTMLInputElement>
			| React.ChangeEvent<HTMLTextAreaElement>,
	) => void
	onKeyDown?: (
		e:
			| React.KeyboardEvent<HTMLInputElement>
			| React.KeyboardEvent<HTMLTextAreaElement>,
	) => void
	onBlur?: (
		e:
			| React.FocusEvent<HTMLInputElement>
			| React.FocusEvent<HTMLTextAreaElement>,
	) => void
}

export interface InputOptions {
	disable?: boolean
	// `disabled` is accepted as an alias for `disable` so legacy call
	// sites that mirror the native HTML attribute keep compiling.
	disabled?: boolean
	// `rows` is accepted on both single- and multi-row inputs for the
	// same reason; the single-line path simply ignores it.
	rows?: number
	varient?: InputVarient
	sizes?: 'small' | 'normal'
	color?: AlertColorType
	error?: boolean
	hasLabel?: boolean
	borderRadius?: string
	width?: string
	maxWidth?: string
	as?: string
}
export type Inputs = {
	type?: InputType
	name?: string
	defaultValue?: string | number
	placeholder?: string
	required?: boolean
	label?: string
	id?: string
	classes?: string
	hypertext?: string
	startAdornment?: ReactNode
	endAdornment?: ReactNode
	style?: CSSProperties
	autoFocus?: boolean
	value?: number | string | undefined
	maxValue?: number
	minValue?: number
	minLength?: number
	maxLength?: number
	pattern?: string
} & InputOptions &
	InputEvents
