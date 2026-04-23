import { useState } from 'react'
import Card from '../../../components/card/Card'
import JobPostTable from '../../../components/job-posts/list/JobPostTable'
import JobPostDeleteModal from '../../../components/job-posts/list/JobPostDeleteModal'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { useGetJobPostListQuery } from '../../../store/job-posts/jobPostsApi'
import type { JobPostItem } from '../../../store/job-posts/types/definition'

const LIMIT_OPTIONS = [8, 20]

interface DeleteTarget {
	id: string
	title: string
}

const JobPostList = () => {
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

	const offset = (page - 1) * limit

	const { data, isLoading, refetch } = useGetJobPostListQuery({ limit, offset })
	const items = data?.data ?? []
	const total = data?.meta.total ?? 0

	const passed = offset + 1
	const next = Math.min(offset + limit, total)

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	const handleDeleteRequest = (id: string) => {
		const item = items.find((i: JobPostItem) => i.id === id)
		if (item) setDeleteTarget({ id, title: item.title ?? 'this job post' })
	}

	return (
		<>
			<Card padding={'30px'}>
				<JobPostTable items={items} isLoading={isLoading} onDelete={handleDeleteRequest} />

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
				<JobPostDeleteModal
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

export default JobPostList
