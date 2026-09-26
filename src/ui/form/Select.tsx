/**
 * Thin re-export of the existing `Select` primitive. Kept as its
 * own module so `FormField` and new page code can
 * `import Select, { SelectItem } from '../ui/form/Select'`
 * without reaching into the legacy `ui/input/select/` path.
 */
export { default, SelectItem } from '../input/select/Select'
