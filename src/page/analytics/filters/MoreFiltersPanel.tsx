import { useGetFiltersOptionsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { useSalesFilters } from './useSalesFilters'
import { MoreFiltersPanel as Panel } from './filters.styled'

// Only filters that the backend actually applies today are exposed here.
// Manual relevance, notification status, contract type, budget bucket,
// platform, direction and client-quality controls are intentionally
// omitted — the backend silently ignores them, so showing them in the
// UI would make the results look filtered when they are not. Re-add
// each one only when the corresponding filter lands in
// AnalyticsService.buildWhere.

const MoreFiltersPanel = () => {
	const { data } = useGetFiltersOptionsQuery()
	const { filters, setFilter } = useSalesFilters()

	if (!data) return null

	const toggleInList = (list: string[] | undefined, value: string): string[] | undefined => {
		const set = new Set(list ?? [])
		if (set.has(value)) set.delete(value)
		else set.add(value)
		return set.size ? Array.from(set) : undefined
	}

	return (
		<Panel role='region' aria-label='Additional filters'>
			<div className='filter-section'>
				<div className='section-title'>Signal quality</div>
				<div className='field-grid'>
					<div className='filter-field'>
						<span className='field-label'>Score range</span>
						<div className='range'>
							<input
								type='number'
								min={0}
								max={100}
								placeholder='Min'
								value={filters.scoreMin ?? ''}
								onChange={(e) =>
									setFilter({
										scoreMin: e.target.value === '' ? undefined : Number(e.target.value),
									})
								}
								aria-label='Minimum score'
							/>
							<span aria-hidden='true'>–</span>
							<input
								type='number'
								min={0}
								max={100}
								placeholder='Max'
								value={filters.scoreMax ?? ''}
								onChange={(e) =>
									setFilter({
										scoreMax: e.target.value === '' ? undefined : Number(e.target.value),
									})
								}
								aria-label='Maximum score'
							/>
						</div>
					</div>

					<div className='filter-field'>
						<label htmlFor='client-country'>Client country</label>
						<select
							id='client-country'
							value={filters.clientCountry?.[0] ?? ''}
							onChange={(e) =>
								setFilter({
									clientCountry: e.target.value ? [e.target.value] : undefined,
								})
							}
						>
							<option value=''>Any country</option>
							{data.clientCountries.map((c) => (
								<option key={c} value={c}>
									{c}
								</option>
							))}
						</select>
					</div>
				</div>
			</div>

			{data.technologies.length > 0 && (
				<div className='filter-section'>
					<div className='section-title'>Technologies</div>
					<div className='chip-row'>
						{data.technologies.map((t) => {
							const active = filters.technology?.includes(t) ?? false
							return (
								<button
									key={t}
									type='button'
									className={`chip ${active ? 'active' : ''}`}
									onClick={() =>
										setFilter({ technology: toggleInList(filters.technology, t) })
									}
									aria-pressed={active}
								>
									{t}
								</button>
							)
						})}
					</div>
				</div>
			)}
		</Panel>
	)
}

export default MoreFiltersPanel
