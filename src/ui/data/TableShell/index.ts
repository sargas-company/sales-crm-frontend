/**
 * Canonical TableShell surface. Consolidates the existing table
 * primitives from `components/table/*` into one addressable
 * `src/ui/data/TableShell/` module and adds Footer plus the three
 * state slots (Empty / Loading / Error) that legacy tables lacked.
 *
 * Existing `components/data-grid`, `components/data-grid-item` and
 * `components/layout/table` stacks are NOT removed here — Legacy
 * Cleanup owns their removal.
 */
export { default as Header } from '../../../components/table/TableHead'
export { default as Body } from '../../../components/table/TableBody'
export { default as Row } from '../../../components/table/TableRow'
export { default as Cell } from '../../../components/table/TableCell'
export { default as Footer } from './Footer'
export { default as EmptyState } from './EmptyState'
export { default as LoadingState } from './LoadingState'
export { default as ErrorState } from './ErrorState'
