import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../../../components/card/Card'
import Box from '../../../components/box/Box'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { GridInnerContainer, GridItem } from '../../../components/layout'
import { Select, SelectItem, Button } from '../../../ui'
import PromptTable from '../../../components/prompts/list/PromptTable'
import PromptDeleteModal from '../../../components/prompts/list/PromptDeleteModal'
import { useGetPromptListQuery } from '../../../store/prompts/promptsApi'
import type { PromptType, PromptItem } from '../../../store/prompts/types/definition'

const LIMIT_OPTIONS = [10, 20]

const PROMPT_TYPES: { value: PromptType; label: string }[] = [
	{ value: 'JOB_GATEKEEPER', label: 'Job Gatekeeper' },
	{ value: 'JOB_EVALUATION', label: 'Job Evaluation' },
	{ value: 'CHAT_SYSTEM', label: 'Chat System' },
	{ value: 'CHAT_FALLBACK', label: 'Chat Fallback' },
]

interface DeleteTarget {
	id: string
	title: string
}

const PromptList = () => {
	const navigate = useNavigate()
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [typeFilter, setTypeFilter] = useState<PromptType | ''>('')
	const [activeFilter, setActiveFilter] = useState<'true' | 'false' | ''>('')
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const { data, isLoading, refetch } = useGetPromptListQuery({
		page,
		limit,
		...(typeFilter && { type: typeFilter }),
		...(activeFilter !== '' && { isActive: activeFilter === 'true' }),
	})

	const items = data?.data ?? []
	const total = data?.total ?? 0

	const passed = (page - 1) * limit + 1
	const next = Math.min(page * limit, total)

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	const handleTypeChange = (value: string) => {
		setTypeFilter(value as PromptType | '')
		setPage(1)
	}

	const handleActiveChange = (value: string) => {
		setActiveFilter(value as 'true' | 'false' | '')
		setPage(1)
	}

	const handleDeleteRequest = (id: string) => {
		const item = items.find((i: PromptItem) => i.id === id)
		if (item) setDeleteTarget({ id, title: item.title })
	}

	return (
		<>
			<Card padding={'30px'}>
				<Box display='flex' justify='space-between' padding={20}>
					<GridInnerContainer alignItems='center' justifyContent='space-between'>
						<GridItem xs={12} md={8}>
							<Box display='flex' align='center' style={{ gap: '16px' }}>
								<Box style={{ minWidth: '180px', maxWidth: '220px', flex: 1 }}>
									<Select
										label='Type'
										defaultValue={typeFilter}
										onChange={handleTypeChange}
										sizes='small'
										width='100%'
									>
										<SelectItem label='All types' value='' />
										{PROMPT_TYPES.map(({ value, label }) => (
											<SelectItem key={value} label={label} value={value} />
										))}
									</Select>
								</Box>
								<Box style={{ minWidth: '180px', maxWidth: '220px', flex: 1 }}>
									<Select
										label='Status'
										defaultValue={activeFilter}
										onChange={handleActiveChange}
										sizes='small'
										width='100%'
									>
										<SelectItem label='All statuses' value='' />
										<SelectItem label='Active' value='true' />
										<SelectItem label='Inactive' value='false' />
									</Select>
								</Box>
							</Box>
						</GridItem>
						<GridItem xs={12} md={4}>
							<Box display='flex' justify='flex-end'>
								<Button onClick={() => navigate('/prompts/add')}>Create Prompt</Button>
							</Box>
						</GridItem>
					</GridInnerContainer>
				</Box>

				<PromptTable items={items} isLoading={isLoading} onDelete={handleDeleteRequest} />

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
				<PromptDeleteModal
					id={deleteTarget.id}
					title={deleteTarget.title}
					onClose={() => setDeleteTarget(null)}
					onSuccess={() => {
						if (items.length === 1 && page > 1) setPage(page - 1)
						else refetch()
					}}
				/>
			)}
		</>
	)
}

export default PromptList
