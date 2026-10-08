import { ReactNode, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { InboxOutlined, SearchOffOutlined } from '@mui/icons-material'
import {
	DataRow,
	EmptyIconWrap,
	EmptyState,
	EmptyTitle,
	Pager,
	PagerBtn,
	PagerButtons,
	PagerInfo,
	SelectCheckbox,
	Skeleton,
	SkeletonActions,
	SortHeader,
	SortIndicator,
	Table,
	TableCard,
	TableScroll,
	TableScrollWrap,
} from './DataTable.styled'

export type SortDirection = 'asc' | 'desc'
export interface SortState {
	key: string
	direction: SortDirection
}

export interface DataTableColumn<T> {
	key: string
	label: string
	minWidth?: number
	className?: string
	render: (row: T, index: number) => ReactNode
	/** Render a per-cell skeleton placeholder for the loading state. */
	skeleton?: (index: number) => ReactNode
	/** Enable click-to-sort on the column header. */
	sortable?: boolean
	/** Comparable value extractor — used when sortable=true. Falls back to
	 *  `String(row[key])` if omitted, when possible. */
	sortValue?: (row: T) => string | number | Date | null | undefined
}

export interface DataTablePagination {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
}

/**
 * Opt-in row selection. When supplied, the DataTable renders a
 * leading checkbox column — header checkbox toggles every row on
 * the current page, cell checkboxes toggle individual rows. The
 * caller owns the selection state (so bulk-action bars can live
 * outside the table). Checkbox clicks never bubble into other row
 * click handlers.
 */
export interface DataTableSelection<T> {
	/** Set of selected row IDs. */
	selected: Set<string>
	/** Toggle a single row by its `rowKey`. Boolean = new state. */
	onToggleRow: (id: string, next: boolean) => void
	/** Toggle every row currently rendered on this page. */
	onToggleAllOnPage: (rows: T[], next: boolean) => void
	/** Optional label for assistive tech on the header checkbox. */
	headerLabel?: string
	/** Optional label template for the per-row checkbox. */
	rowLabel?: (row: T) => string
}

export interface DataTableProps<T> {
	columns: DataTableColumn<T>[]
	rows: T[]
	rowKey: (row: T) => string
	isLoading?: boolean
	isError?: boolean
	onRetry?: () => void
	/** Set to true when a search filter is active — affects empty-state copy. */
	searchActive?: boolean
	emptyIcon?: ReactNode
	emptyTitle?: string
	emptyTitleSearch?: string
	skeletonRowCount?: number
	/** Controlled sort — when provided, DataTable calls `onSortChange` and
	 *  DOES NOT sort the rows itself. Omit both to enable client-side sort. */
	sort?: SortState | null
	onSortChange?: (next: SortState | null) => void
	/** Initial sort for the uncontrolled (client-side) mode. */
	defaultSort?: SortState | null
	pagination: DataTablePagination
	/** Column key that should get an "actions" alignment (right-align + tight
	 *  right padding). Defaults to `"actions"`. */
	actionsColumnKey?: string
	/** Opt-in row selection — adds a leading checkbox column. */
	selection?: DataTableSelection<T>
}

function DataTable<T>({
	columns,
	rows,
	rowKey,
	isLoading,
	isError,
	onRetry,
	searchActive,
	emptyIcon,
	emptyTitle = 'No data found',
	emptyTitleSearch = 'Nothing found',
	skeletonRowCount = 8,
	pagination,
	actionsColumnKey = 'actions',
	sort,
	onSortChange,
	defaultSort = null,
	selection,
}: DataTableProps<T>) {
	const { page, pageSize, total, onPageChange } = pagination
	const totalPages = Math.max(1, Math.ceil(total / pageSize))
	const clampedPage = Math.min(Math.max(1, page), totalPages)
	const offset = (clampedPage - 1) * pageSize

	// Sort — controlled if `sort` prop provided, otherwise internal state.
	const [uncontrolledSort, setUncontrolledSort] = useState<SortState | null>(defaultSort)
	const isControlled = sort !== undefined
	const activeSort = isControlled ? (sort ?? null) : uncontrolledSort

	const setSort = (next: SortState | null) => {
		if (isControlled) onSortChange?.(next)
		else {
			setUncontrolledSort(next)
			onSortChange?.(next)
		}
	}

	const cycleSort = (key: string) => {
		if (!activeSort || activeSort.key !== key) {
			setSort({ key, direction: 'asc' })
		} else if (activeSort.direction === 'asc') {
			setSort({ key, direction: 'desc' })
		} else {
			setSort(null)
		}
	}

	const sortedRows = useMemo(() => {
		if (!activeSort || isControlled) return rows
		const col = columns.find((c) => c.key === activeSort.key)
		if (!col || !col.sortable) return rows
		const accessor = col.sortValue
		if (!accessor) return rows
		const dir = activeSort.direction === 'asc' ? 1 : -1
		return [...rows].sort((a, b) => {
			const av = accessor(a)
			const bv = accessor(b)
			if (av == null && bv == null) return 0
			if (av == null) return 1
			if (bv == null) return -1
			if (av instanceof Date && bv instanceof Date) {
				return (av.getTime() - bv.getTime()) * dir
			}
			if (typeof av === 'number' && typeof bv === 'number') {
				return (av - bv) * dir
			}
			return String(av).localeCompare(String(bv)) * dir
		})
	}, [rows, activeSort, columns, isControlled])

	// Horizontal overflow hints — soft fade on either side, only visible
	// when there is actual content clipped in that direction.
	const scrollRef = useRef<HTMLDivElement>(null)
	const [edge, setEdge] = useState({ left: false, right: false })

	const recalc = () => {
		const el = scrollRef.current
		if (!el) return
		setEdge({
			left: el.scrollLeft > 2,
			right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
		})
	}

	useLayoutEffect(() => {
		recalc()
		const el = scrollRef.current
		if (!el) return
		const ro = new ResizeObserver(recalc)
		ro.observe(el)
		return () => ro.disconnect()
	}, [rows.length, isLoading, columns.length])

	// Total column count including the invisible spacer column that lives
	// between the last data column and the sticky-right Actions cell.
	const totalCols = columns.length + 1

	// Selection-column derived state. Lives alongside the data columns
	// so colgroup / thead / tbody can all consume the same booleans.
	const selectedCount = selection ? selection.selected.size : 0
	const pageIds = selection ? sortedRows.map((r) => rowKey(r)) : []
	const allOnPageSelected =
		selection && pageIds.length > 0 && pageIds.every((id) => selection.selected.has(id))
	const someOnPageSelected =
		selection && !allOnPageSelected && pageIds.some((id) => selection.selected.has(id))

	const isActions = (key: string) => key === actionsColumnKey
	const colClass = (col: DataTableColumn<T>) =>
		[`col-${col.key}`, isActions(col.key) ? 'col-actions' : '', col.className]
			.filter(Boolean)
			.join(' ')

	// Split columns so the Actions column always renders last, with the
	// spacer immediately before it. Non-actions columns keep their order.
	const dataColumns = columns.filter((c) => !isActions(c.key))
	const actionsColumn = columns.find((c) => isActions(c.key))

	// Both the error and the "empty response" paths share the same
	// clean-canvas layout: no header row, no pager, a centered icon
	// + text. Only the copy differs — an error gets a retry CTA.
	const showBlank = !isLoading && (isError || sortedRows.length === 0)

	if (showBlank) {
		return (
			<TableCard>
				<EmptyState>
					<EmptyIconWrap>
						{emptyIcon ?? (searchActive ? <SearchOffOutlined /> : <InboxOutlined />)}
					</EmptyIconWrap>
					<EmptyTitle>
						{isError
							? 'Could not load records'
							: searchActive
								? emptyTitleSearch
								: emptyTitle}
					</EmptyTitle>
				</EmptyState>
			</TableCard>
		)
	}

	return (
		<TableCard>
			<TableScrollWrap $leftHint={edge.left} $rightHint={edge.right}>
				<TableScroll ref={scrollRef} onScroll={recalc}>
					<Table>
						<colgroup>
							{selection && <col className='col-select' style={{ width: '42px' }} />}
							{dataColumns.map((c) => (
								<col
									key={c.key}
									style={c.minWidth ? { minWidth: `${c.minWidth}px` } : undefined}
								/>
							))}
							<col />
							{actionsColumn && <col />}
						</colgroup>

						<thead>
							<tr>
								{selection && (
									<th className='col-select' aria-label='Select'>
										<SelectCheckbox
											type='checkbox'
											aria-label={selection.headerLabel ?? 'Select all on page'}
											checked={!!allOnPageSelected}
											ref={(el) => {
												if (el) el.indeterminate = !!someOnPageSelected
											}}
											onChange={(e) =>
												selection.onToggleAllOnPage(sortedRows, e.target.checked)
											}
										/>
									</th>
								)}
								{dataColumns.map((c) => {
									const active = activeSort?.key === c.key
									const dir = active ? activeSort!.direction : null
									return (
										<th
											key={c.key}
											className={colClass(c)}
											style={c.minWidth ? { minWidth: `${c.minWidth}px` } : undefined}
											aria-sort={
												active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
											}
										>
											{c.sortable ? (
												<SortHeader
													type='button'
													onClick={() => cycleSort(c.key)}
													$active={active}
												>
													{c.label}
													<SortIndicator $active={active} $dir={dir}>
														<span className='asc' aria-hidden='true' />
														<span className='desc' aria-hidden='true' />
													</SortIndicator>
												</SortHeader>
											) : (
												c.label
											)}
										</th>
									)
								})}
								<th className='col-spacer' aria-hidden='true' />
								{actionsColumn && (
									<th key={actionsColumn.key} className={colClass(actionsColumn)}>
										{actionsColumn.label}
									</th>
								)}
							</tr>
						</thead>

						<tbody>
							{isLoading &&
								Array.from({ length: skeletonRowCount }).map((_, i) => (
									<tr key={`skel-${i}`}>
										{selection && (
											<td className='col-select'>
												<Skeleton $w='18px' $h='18px' />
											</td>
										)}
										{dataColumns.map((c) => (
											<td key={c.key} className={colClass(c)}>
												{c.skeleton ? c.skeleton(i) : <Skeleton $w='60%' $h='14px' />}
											</td>
										))}
										<td className='col-spacer' />
										{actionsColumn && (
											<td className={colClass(actionsColumn)}>
												{actionsColumn.skeleton ? (
													actionsColumn.skeleton(i)
												) : (
													<SkeletonActions>
														<Skeleton $w='34px' $h='34px' $round />
														<Skeleton $w='34px' $h='34px' $round />
														<Skeleton $w='34px' $h='34px' $round />
													</SkeletonActions>
												)}
											</td>
										)}
									</tr>
								))}

							{!isLoading &&
								!isError &&
								sortedRows.map((row, idx) => {
									const id = rowKey(row)
									const isSelected = selection
										? selection.selected.has(id)
										: false
									return (
										<DataRow key={id} $delay={idx * 40}>
											{selection && (
												<td className='col-select'>
													<SelectCheckbox
														type='checkbox'
														aria-label={
															selection.rowLabel ? selection.rowLabel(row) : 'Select row'
														}
														checked={isSelected}
														onChange={(e) =>
															selection.onToggleRow(id, e.target.checked)
														}
														// Clicking a checkbox is a selection act, not a
														// row-open act — contain the event so parent
														// handlers do not navigate on toggle.
														onClick={(e) => e.stopPropagation()}
													/>
												</td>
											)}
											{dataColumns.map((c) => (
												<td key={c.key} className={colClass(c)}>
													{c.render(row, idx)}
												</td>
											))}
											<td className='col-spacer' />
											{actionsColumn && (
												<td className={colClass(actionsColumn)}>
													{actionsColumn.render(row, idx)}
												</td>
											)}
										</DataRow>
									)
								})}
						</tbody>
					</Table>
				</TableScroll>
			</TableScrollWrap>

			<Pager>
				<PagerInfo>
					{total === 0
						? 'No records'
						: `Showing ${offset + 1}–${Math.min(offset + pageSize, total)} of ${total}`}
				</PagerInfo>
				<PagerButtons>
					<PagerBtn
						type='button'
						disabled={clampedPage === 1}
						onClick={() => onPageChange(clampedPage - 1)}
					>
						Prev
					</PagerBtn>
					<span className='pager-current'>
						Page {clampedPage} / {totalPages}
					</span>
					<PagerBtn
						type='button'
						disabled={clampedPage >= totalPages}
						onClick={() => onPageChange(clampedPage + 1)}
					>
						Next
					</PagerBtn>
				</PagerButtons>
			</Pager>
		</TableCard>
	)
}

export default DataTable
