import { FC } from 'react'
import TextField from '../input/text-field/TextField'

/**
 * Thin wrapper: `<TextField>` with `multiRow` forced on. Callers
 * pass the same prop shape as the multi-row branch of `TextField`
 * (see `src/ui/input/type.d.ts` — the `multiRow: true` half of the
 * `InputEvents` union).
 */
type TextareaProps = Omit<
	Parameters<typeof TextField>[0],
	'type' | 'multiRow' | 'onChange' | 'onKeyDown'
> & {
	onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
	onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
	rows?: number
}

const Textarea: FC<TextareaProps> = (props) => {
	const merged = { ...props, multiRow: true as const }
	return <TextField {...(merged as Parameters<typeof TextField>[0])} />
}

export default Textarea
