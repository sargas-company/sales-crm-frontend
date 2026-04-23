import { Link } from 'react-router-dom'
import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import { Text, Chip } from '../../../ui'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import type { PromptItem } from '../../../store/prompts/types/definition'
import { formatDate } from '../../../utils/formatDate'
import PromptActiveChip from './PromptActiveChip'
import PromptListAction from './PromptListAction'

const columns: DataGridColoumn[] = [
	{ fieldId: 'title', label: 'Title', width: '220px' },
	{ fieldId: 'type', label: 'Type', width: '160px' },
	{ fieldId: 'version', label: 'Version', width: '80px' },
	{ fieldId: 'isActive', label: 'Status', width: '100px' },
	{ fieldId: 'createdBy', label: 'Created By', width: '130px' },
	{ fieldId: 'createdAt', label: 'Created At', width: '150px' },
	{ fieldId: 'updatedAt', label: 'Updated At', width: '150px' },
	{ fieldId: 'actions', label: 'Actions', width: '90px' },
]

interface Props {
	items: PromptItem[]
	isLoading: boolean
	onDelete: (id: string) => void
}

const PromptTable = ({ items, isLoading, onDelete }: Props) => {
	if (isLoading)
		return (
			<Box padding={24}>
				<Text>Loading…</Text>
			</Box>
		)

	return (
		<Box padding={24} pl={40}>
			<DataGrid
				rows={items}
				columns={columns}
				gridDataKey={(item: PromptItem) => item.id}
				renderGridData={(row: PromptItem, field) => (
					<>
						<DataGridCell width={field['title'].width}>
							<Link to={`/prompts/preview/${row.id}`}>
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
									{row.title}
								</Text>
							</Link>
						</DataGridCell>
						<DataGridCell width={field['type'].width}>
							<Chip
								label={row.type}
								skin='light'
								size='small'
								color='info'
								styles={{ whiteSpace: 'nowrap', fontSize: '11px' }}
							/>
						</DataGridCell>
						<DataGridCell
							width={field['version'].width}
							justify='center'
							value={`v${row.version}`}
						/>
						<DataGridCell width={field['isActive'].width}>
							<PromptActiveChip isActive={row.isActive} />
						</DataGridCell>
						<DataGridCell width={field['createdBy'].width} value={row.createdBy} />
						<DataGridCell
							width={field['createdAt'].width}
							value={formatDate(row.createdAt)}
						/>
						<DataGridCell
							width={field['updatedAt'].width}
							value={formatDate(row.updatedAt)}
						/>
						<DataGridCell width={field['actions'].width}>
							<PromptListAction
								promptId={row.id}
								isActive={row.isActive}
								onDelete={onDelete}
							/>
						</DataGridCell>
					</>
				)}
			/>
		</Box>
	)
}

export default PromptTable
