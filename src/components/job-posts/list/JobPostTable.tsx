import { Link } from 'react-router-dom'
import { Text } from '../../../ui'
import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import JobPostDecisionChip from './JobPostDecisionChip'
import JobPostPriorityChip from './JobPostPriorityChip'
import JobPostListAction from './JobPostListAction'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import type { JobPostItem } from '../../../store/job-posts/types/definition'
import { formatDate } from '../../../utils/formatDate'

const columns: DataGridColoumn[] = [
	{ fieldId: 'title', label: 'Title', width: '280px' },
	{ fieldId: 'decision', label: 'Decision', width: '120px' },
	{ fieldId: 'matchScore', label: 'Score', width: '80px' },
	{ fieldId: 'priority', label: 'Priority', width: '110px' },
	{ fieldId: 'budget', label: 'Budget', width: '160px' },
	{ fieldId: 'location', label: 'Location', width: '150px' },
	{ fieldId: 'gigRadarScore', label: 'GigRadar', width: '100px' },
	{ fieldId: 'scanner', label: 'Scanner', width: '160px' },
	{ fieldId: 'createdAt', label: 'Created At', width: '150px' },
	{ fieldId: 'actions', label: 'Actions', width: '90px' },
]

interface JobPostTableProps {
	items: JobPostItem[]
	isLoading: boolean
	onDelete: (id: string) => void
}

const JobPostTable = ({ items, isLoading, onDelete }: JobPostTableProps) => {
	if (isLoading || !items) return <></>

	return (
		<Box padding={24} pl={40}>
			<DataGrid
				rows={items}
				columns={columns}
				gridDataKey={(item) => item.id}
				renderGridData={(row, field) => (
					<>
						<DataGridCell width={field['title'].width}>
							<Link to={`/job-posts/preview/${row.id}`}>
								<Text
									skinColor
									styles={{
										display: '-webkit-box',
										WebkitLineClamp: 2,
										WebkitBoxOrient: 'vertical',
										overflow: 'hidden',
										lineHeight: '1.4',
									}}
								>
									{row.title ?? '—'}
								</Text>
							</Link>
						</DataGridCell>
						<DataGridCell
							width={field['decision'].width}
							children={<JobPostDecisionChip decision={row.decision} />}
						/>
						<DataGridCell
							width={field['matchScore'].width}
							justify='center'
							value={row.matchScore != null ? `${row.matchScore}` : '—'}
						/>
						<DataGridCell
							width={field['priority'].width}
							children={<JobPostPriorityChip priority={row.priority} />}
						/>
						<DataGridCell width={field['budget'].width} value={row.budget ?? '—'} />
						<DataGridCell width={field['location'].width} value={row.location ?? '—'} />
						<DataGridCell
							width={field['gigRadarScore'].width}
							justify='center'
							value={row.gigRadarScore != null ? `${row.gigRadarScore}` : '—'}
						/>
						<DataGridCell width={field['scanner'].width} value={row.scanner ?? '—'} />
						<DataGridCell
							width={field['createdAt'].width}
							value={formatDate(row.createdAt)}
						/>
						<DataGridCell width={field['actions'].width}>
							<JobPostListAction jobPostId={row.id} onDelete={onDelete} />
						</DataGridCell>
					</>
				)}
			/>
		</Box>
	)
}

export default JobPostTable
