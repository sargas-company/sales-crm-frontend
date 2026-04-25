import { useState } from 'react'
import Box from '../../../components/box/Box'
import Card from '../../../components/card/Card'
import CreateNewClientCall from '../../../components/client-call/list/CreateNewCall'
import ClientCallTable from '../../../components/client-call/list/ClientCallTable'
import ClientCallDeleteModal from '../../../components/proposal/list/ProposalDeleteModal'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { GridInnerContainer, GridItem } from '../../../components/layout'
import { useGetProposalListQuery } from '../../../store/proposals/proposalsApi'

interface DeleteTarget {
	id: string
	title: string
}

const LIMIT_OPTIONS = [8, 20]

const ClientCallList = () => {
	const [page, setPage] = useState(1)
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [search, setSearch] = useState('')

	const { data, isLoading, refetch } = useGetProposalListQuery({ page, limit });

	const allItems = []; // data?.data ??
	const total = data?.total ?? 0;

	const passed = (page - 1) * limit + 1
	const next = Math.min(page * limit, total)

	const items = search
		? allItems.filter((item) => {
				const q = search.toLowerCase();
				return (
					item.id.toString().includes(q) ||
					`${item.user.firstName} ${item.user.lastName}`.toLowerCase().includes(q) ||
					`${item.account.firstName} ${item.account.lastName}`.toLowerCase().includes(q) ||
					item.status.toLowerCase().includes(q)
				)
			})
		: allItems

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	const handleDelete = (id: string) => {
		const item = allItems.find((i) => i.id === id)
		if (item) setDeleteTarget({ id, title: item.title })
	}

	return (
		<>
			<Card padding={'30px'}>
				<Box display='flex' justify='space-between' padding={20}>
					<GridInnerContainer alignItems='center' justifyContent='space-between'>
						<GridItem xs={12} md={12}>
							<Box display='flex' justify='flex-end'>
								<CreateNewClientCall />
							</Box>
						</GridItem>
					</GridInnerContainer>
				</Box>

				<ClientCallTable items={items} isLoading={isLoading} onDelete={handleDelete} />

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
				<ClientCallDeleteModal
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

export default ClientCallList
