import { useState } from 'react'
import Card from '../../../components/card/Card'
import Box from '../../../components/box/Box'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { GridInnerContainer, GridItem } from '../../../components/layout'
import { TextField } from '../../../ui'
import { useGetClientRequestListQuery } from '../../../store/clientRequests/clientRequestsApi'
import ClientRequestTable from '../../../components/client-requests/list/ClientRequestTable'
import ClientRequestDeleteModal from '../../../components/client-requests/list/ClientRequestDeleteModal'

const LIMIT_OPTIONS = [8, 20]

interface DeleteTarget {
	id: string
	title: string
}

const ClientRequestList = () => {
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [search, setSearch] = useState('')
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, refetch } = useGetClientRequestListQuery({ page, limit })
	const allItems = data?.data ?? []
	const total = data?.total ?? 0

	const handleDelete = (id: string) => {
		const item = allItems.find((i) => i.id === id)
		if (item) setDeleteTarget({ id, title: item.name || 'this request' })
	}

	const items = search
		? allItems.filter((item) => {
				const q = search.toLowerCase()
				return (
					item.name.toLowerCase().includes(q) ||
					item.company.toLowerCase().includes(q) ||
					item.status.toLowerCase().includes(q) ||
					item.services.some((s) => s.toLowerCase().includes(q))
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
			<Card padding='30px'>
				<Box display='flex' justify='space-between' padding={20}>
					<GridInnerContainer alignItems='center' justifyContent='space-between'>
						<GridItem xs={12} md={6}>
							<TextField
								type='text'
								name='search-client-request'
								placeholder='Search client request'
								sizes='small'
								maxWidth='280px'
								onChange={(e) => setSearch(e.target.value)}
							/>
						</GridItem>
					</GridInnerContainer>
				</Box>

				<ClientRequestTable items={items} isLoading={isLoading} onDelete={handleDelete} />

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
				<ClientRequestDeleteModal
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

export default ClientRequestList
