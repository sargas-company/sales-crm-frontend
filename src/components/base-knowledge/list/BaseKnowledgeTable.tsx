import { Link } from 'react-router-dom'
import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import { Text, Chip } from '../../../ui'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import { BaseKnowledgeItem } from '../../../store/baseKnowledge/baseKnowledgeApi'
import BaseKnowledgeListAction from './BaseKnowledgeListAction'

const columns: DataGridColoumn[] = [
	{ fieldId: 'seq', label: '#', width: '90px' },
	{ fieldId: 'title', label: 'Title', width: '400px' },
	{ fieldId: 'category', label: 'Category', width: '160px' },
	{ fieldId: 'createdAt', label: 'Created At', width: '150px' },
	{ fieldId: 'updatedAt', label: 'Updated At', width: '150px' },
	{ fieldId: 'actions', label: 'Actions', width: '120px' },
]

const formatDate = (iso: string) =>
	new Date(iso).toLocaleDateString('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	})

interface Props {
	items: BaseKnowledgeItem[]
	isLoading: boolean
	onEdit: (id: string) => void
	onDelete: (id: string) => void
}

const BaseKnowledgeTable = ({ items, isLoading, onEdit, onDelete }: Props) => {
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
				gridDataKey={(item: BaseKnowledgeItem) => item.id}
				renderGridData={(row: BaseKnowledgeItem, field, index) => (
					<>
						<DataGridCell
							width={field['seq'].width}
							children={
								<Link to={`/knowledge/preview/${row.id}`}>
									<Text skinColor>#{index + 1}</Text>
								</Link>
							}
						/>
						<DataGridCell width={field['title'].width}>
							<Link to={`/knowledge/preview/${row.id}`}>
								<Text skinColor>{row.title}</Text>
							</Link>
						</DataGridCell>
						<DataGridCell width={field['category'].width}>
							{row.category ? (
								<Chip label={row.category} skin='light' size='small' color='info' styles={{ color: '#000000' }} />
							) : (
								<Text>—</Text>
							)}
						</DataGridCell>
						<DataGridCell
							width={field['createdAt'].width}
							value={formatDate(row.createdAt)}
						/>
						<DataGridCell
							width={field['updatedAt'].width}
							value={formatDate(row.updatedAt)}
						/>
						<DataGridCell width={field['actions'].width}>
							<BaseKnowledgeListAction id={row.id} onEdit={onEdit} onDelete={onDelete} />
						</DataGridCell>
					</>
				)}
			/>
		</Box>
	)
}

export default BaseKnowledgeTable
