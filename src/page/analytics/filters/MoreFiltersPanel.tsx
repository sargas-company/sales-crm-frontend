import { useGetFiltersOptionsQuery } from '../../../store/sales-analytics/salesAnalyticsApi'
import { useSalesFilters } from './useSalesFilters'
import { MoreFiltersPanel as Panel } from './filters.styled'
import type { ClientTier } from '../../../store/sales-analytics/types/jobPost'

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
						<label htmlFor='relevance'>Manual relevance</label>
						<select
							id='relevance'
							value={filters.manualRelevance ?? ''}
							onChange={(e) =>
								setFilter({
									manualRelevance: (e.target.value || undefined) as
										| 'relevant'
										| 'not_relevant'
										| 'very_relevant'
										| 'unrated'
										| undefined,
								})
							}
						>
							<option value=''>Any</option>
							<option value='very_relevant'>Very relevant</option>
							<option value='relevant'>Relevant</option>
							<option value='not_relevant'>Not relevant</option>
							<option value='unrated'>Unrated</option>
						</select>
					</div>

					<div className='filter-field'>
						<label htmlFor='notification'>Notification status</label>
						<select
							id='notification'
							value={filters.notificationStatus ?? ''}
							onChange={(e) =>
								setFilter({
									notificationStatus: (e.target.value || undefined) as
										| 'sent'
										| 'failed'
										| 'not_required'
										| 'pending'
										| undefined,
								})
							}
						>
							<option value=''>Any status</option>
							<option value='sent'>Sent</option>
							<option value='pending'>Pending</option>
							<option value='failed'>Failed</option>
							<option value='not_required'>Not required</option>
						</select>
					</div>
				</div>
			</div>

			<div className='filter-section'>
				<div className='section-title'>Contract &amp; source</div>
				<div className='field-grid'>
					<div className='filter-field'>
						<label htmlFor='contract-type'>Contract type</label>
						<select
							id='contract-type'
							value={filters.contractType ?? ''}
							onChange={(e) =>
								setFilter({
									contractType: (e.target.value || undefined) as
										| 'fixed'
										| 'hourly'
										| 'unknown'
										| undefined,
								})
							}
						>
							<option value=''>Any</option>
							<option value='fixed'>Fixed</option>
							<option value='hourly'>Hourly</option>
							<option value='unknown'>Unknown</option>
						</select>
					</div>

					<div className='filter-field'>
						<label htmlFor='budget'>Budget bucket</label>
						<select
							id='budget'
							value={filters.budgetBucket ?? ''}
							onChange={(e) => setFilter({ budgetBucket: e.target.value || undefined })}
						>
							<option value=''>Any budget</option>
							{data.budgetBuckets.map((b) => (
								<option key={b.key} value={b.key}>
									{b.label}
								</option>
							))}
						</select>
					</div>

					<div className='filter-field'>
						<label htmlFor='platform'>Platform</label>
						<select
							id='platform'
							value={filters.platformId?.[0] ?? ''}
							onChange={(e) =>
								setFilter({
									platformId: e.target.value ? [e.target.value] : undefined,
								})
							}
						>
							<option value=''>All platforms</option>
							{data.platforms.map((p) => (
								<option key={p.id} value={p.id}>
									{p.name}
								</option>
							))}
						</select>
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

			<div className='filter-section'>
				<div className='section-title'>Direction</div>
				<div className='chip-row'>
					{data.directions.map((d) => {
						const active = filters.direction?.includes(d) ?? false
						return (
							<button
								key={d}
								type='button'
								className={`chip ${active ? 'active' : ''}`}
								onClick={() => setFilter({ direction: toggleInList(filters.direction, d) })}
								aria-pressed={active}
							>
								{d}
							</button>
						)
					})}
				</div>
			</div>

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

			<div className='filter-section'>
				<div className='section-title'>Client quality</div>
				<div className='chip-row'>
					{data.clientTiers.map((t) => {
						const active = filters.clientQuality?.includes(t.key) ?? false
						return (
							<button
								key={t.key}
								type='button'
								className={`chip ${active ? 'active' : ''}`}
								onClick={() =>
									setFilter({
										clientQuality: toggleInList(
											filters.clientQuality,
											t.key as ClientTier
										),
									})
								}
								aria-pressed={active}
							>
								{t.label}
							</button>
						)
					})}
				</div>
			</div>
		</Panel>
	)
}

export default MoreFiltersPanel
