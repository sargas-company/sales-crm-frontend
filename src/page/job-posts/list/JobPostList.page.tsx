import { useState } from 'react'
import Card from '../../../components/card/Card'
import JobPostTable from '../../../components/job-posts/list/JobPostTable'
import DataGridFooter from '../../../components/data-grid-item/DataGridFooter'
import { useGetJobPostListQuery } from '../../../store/job-posts/jobPostsApi'

const LIMIT_OPTIONS = [8, 20]

const JobPostList = () => {
	const [page, setPage] = useState(1)
	const [limit, setLimit] = useState(LIMIT_OPTIONS[0])

	const offset = (page - 1) * limit

	const { data, isLoading } = useGetJobPostListQuery({ limit, offset })
	const items = data?.data ?? []
	const total = data?.meta.total ?? 0

	const passed = offset + 1
	const next = Math.min(offset + limit, total)

	const handleLimitChange = (newLimit: number) => {
		setLimit(newLimit)
		setPage(1)
	}

	return (
		<Card padding={'30px'}>
			<JobPostTable items={items} isLoading={isLoading} />

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
	)
}

export default JobPostList
