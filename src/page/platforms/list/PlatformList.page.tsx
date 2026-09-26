import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../../ui/page/PageShell'
import PageHeader from '../../../ui/page/PageHeader'
import SectionCard from '../../../ui/surface/SectionCard'
import FilterBar from '../../../ui/data/FilterBar'
import * as TableShell from '../../../ui/data/TableShell'
import Input from '../../../ui/form/Input'
import { Button } from '../../../ui'
import PlatformDeleteModal from '../../../components/platforms/list/PlatformDeleteModal'
import PlatformListAction from '../../../components/platforms/list/PlatformListAction'
import DataGridFooterContainer from '../../../components/data-grid-item/DataGridFooterContainer'
import { useGetPlatformsQuery } from '../../../store/platforms/platformsApi'
import { formatDate } from '../../../utils/format'

interface DeleteTarget {
	id: string
	title: string
}

const COLUMN_COUNT = 5
const DEFAULT_ROW_PER_PAGE = 10
const ROW_PER_PAGE_OPTIONS = [10, 25, 50]

const PlatformList = () => {
	const [search, setSearch] = useState('')
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
	const [paginationWindow, setPaginationWindow] = useState({
		next: DEFAULT_ROW_PER_PAGE,
		passedRows: 1,
	})
	const navigate = useNavigate()

	const { data, isLoading, isError, refetch } = useGetPlatformsQuery()
	const allItems = data ?? []

	const handleDelete = (id: string) => {
		const item = allItems.find((i) => i.id === id)
		if (item) setDeleteTarget({ id, title: item.title })
	}

	const items = search
		? allItems.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
		: allItems

	const pageItems = items.slice(paginationWindow.passedRows - 1, paginationWindow.next)
	const showPagination = !isLoading && !isError && items.length > 0

	return (
		<>
			<PageShell>
				<PageHeader
					title='Platforms'
					subtitle='Sources for job posts and proposals.'
					actions={
						<Button onClick={() => navigate('/platforms/add/')}>Create Platform</Button>
					}
				/>

				<SectionCard padding='none'>
					<FilterBar>
						<Input
							type='text'
							name='search-platform'
							placeholder='Search platform'
							sizes='small'
							maxWidth='280px'
							onChange={(e) => setSearch(e.target.value)}
						/>
					</FilterBar>

					<table style={{ width: '100%', borderCollapse: 'collapse' }}>
						<TableShell.Header>
							<TableShell.Row>
								<TableShell.Cell as='th' value='#' compact />
								<TableShell.Cell as='th' value='Title' compact />
								<TableShell.Cell as='th' value='Logo' compact align='center' />
								<TableShell.Cell as='th' value='Created' compact />
								<TableShell.Cell as='th' value='Actions' compact align='right' />
							</TableShell.Row>
						</TableShell.Header>
						<TableShell.Body>
							{isLoading && (
								<TableShell.LoadingState
									colSpan={COLUMN_COUNT}
									label='Loading platforms…'
								/>
							)}
							{isError && !isLoading && (
								<TableShell.ErrorState
									colSpan={COLUMN_COUNT}
									description='Could not load platforms.'
									action={<Button onClick={() => refetch()}>Retry</Button>}
								/>
							)}
							{!isLoading && !isError && items.length === 0 && (
								<TableShell.EmptyState
									colSpan={COLUMN_COUNT}
									title={search ? 'No platforms match your search.' : 'No platforms yet.'}
									description={
										search
											? 'Adjust the search or create a new one.'
											: 'Add the first one to begin.'
									}
									action={
										!search && (
											<Button onClick={() => navigate('/platforms/add/')}>
												Create Platform
											</Button>
										)
									}
								/>
							)}
							{!isLoading &&
								!isError &&
								pageItems.map((row, index) => (
									<TableShell.Row key={row.id}>
										<TableShell.Cell value={`#${paginationWindow.passedRows + index}`} />
										<TableShell.Cell value={row.title} weight={500} />
										<TableShell.Cell
											align='center'
											value={
												row.imageUrl ? (
													<img
														src={row.imageUrl}
														alt={row.title}
														style={{ width: 32, height: 32, objectFit: 'contain' }}
													/>
												) : (
													'—'
												)
											}
										/>
										<TableShell.Cell value={formatDate(row.createdAt, 'short')} />
										<TableShell.Cell
											align='right'
											value={
												<PlatformListAction
													platformId={row.id}
													onDelete={handleDelete}
												/>
											}
										/>
									</TableShell.Row>
								))}
						</TableShell.Body>
					</table>
					{showPagination && (
						<DataGridFooterContainer
							total={items.length}
							rowPerPage={DEFAULT_ROW_PER_PAGE}
							rowPerPageOptions={ROW_PER_PAGE_OPTIONS}
							setPaginationOption={setPaginationWindow}
						/>
					)}
				</SectionCard>
			</PageShell>

			{deleteTarget && (
				<PlatformDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => refetch()}
				/>
			)}
		</>
	)
}

export default PlatformList
