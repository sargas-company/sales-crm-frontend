/**
 * Thin re-export of the existing `TextField` primitive as the
 * canonical form Input. Kept as its own module so `FormField` and
 * new page code can `import Input from '../ui/form/Input'` without
 * reaching into the legacy `ui/input/text-field/` path.
 */
import TextField from '../input/text-field/TextField'

export type { Inputs as InputProps } from '../input/type'
export default TextField
