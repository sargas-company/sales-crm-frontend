import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import CounterpartyTable from '../../../components/counterparties/list/CounterpartyTable'
import CounterpartyDeleteModal from '../../../components/counterparties/list/CounterpartyDeleteModal'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { GridInnerContainer, GridItem } from '../../../components/layout'
import { TextField, Button } from '../../../ui'
import { useGetCounterpartiesQuery } from '../../../store/counterparties/counterpartiesApi'

interface DeleteTarget {
	id: string
	title: string
}

const LIMIT_OPTIONS = [10, 25, 50]

const CounterpartyList = () => {
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [search, setSearch] = useState('')
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [page, setPage] = useState(1)
	const navigate = useNavigate()

	const { data, isLoading, refetch } = useGetCounterpartiesQuery({ page, limit })
	const total = data?.total ?? 0
	const allItems = data?.data ?? []

	const handleDelete = (id: string) => {
		const item = allItems.find((i) => i.id === id)
		if (item) setDeleteTarget({ id, title: `${item.firstName} ${item.lastName}` })
	}

	const items = search
		? allItems.filter((item) => {
				const q = search.toLowerCase()
				return (
					item.firstName.toLowerCase().includes(q) ||
					item.lastName.toLowerCase().includes(q) ||
					item.type.toLowerCase().includes(q) ||
					(item.info ?? '').toLowerCase().includes(q)
				)
			})
		: allItems

	const passed = (page - 1) * limit + 1
	const next = Math.min(page * limit, total)

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	return (
		<>
			<Card padding={'30px'}>
				<Box display='flex' justify='space-between' padding={20}>
					<GridInnerContainer alignItems='center' justifyContent='space-between'>
						<GridItem xs={12} md={6}>
							<TextField
								type='text'
								name='search-counterparty'
								placeholder='Search counterparty'
								sizes='small'
								maxWidth='280px'
								onChange={(e) => setSearch(e.target.value)}
							/>
						</GridItem>
						<GridItem xs={12} md={6}>
							<Box display='flex' justify='flex-end'>
								<Button onClick={() => navigate('/counterparties/add/')}>
									Create Counterparty
								</Button>
							</Box>
						</GridItem>
					</GridInnerContainer>
				</Box>

				<CounterpartyTable items={items} isLoading={isLoading} onDelete={handleDelete} />

				{total > 0 && (
					<DataGridFooter
						total={total}
						rowPerPage={limit}
						rowPerPageOptions={LIMIT_OPTIONS}
						currentPage={page}
						next={next}
						passed={passed}
						handlePagination={setPage}
						handleRowOptSelect={handleLimitChange}
					/>
				)}
			</Card>

			{deleteTarget && (
				<CounterpartyDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (allItems.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}
		</>
	)
}

export default CounterpartyList
