import { Link } from 'react-router-dom'
import { AutoAwesomeOutlined } from '@mui/icons-material'
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
	{ fieldId: 'seq', label: '#', width: '90px' },
	{ fieldId: 'title', label: 'Title', width: '250px' },
	{ fieldId: 'type', label: 'Type', width: '180px' },
	{ fieldId: 'version', label: 'Version', width: '110px' },
	{ fieldId: 'isActive', label: 'Status', width: '120px' },
	{ fieldId: 'createdBy', label: 'Created By', width: '160px' },
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
	return (
		<Box padding={24} pl={40}>
			<DataGrid
				rows={items}
				columns={columns}
				gridDataKey={(item: PromptItem) => item.id}
				isLoading={isLoading}
				skeletonRows={6}
				emptyIcon={<AutoAwesomeOutlined style={{ fontSize: 44 }} />}
				emptyTitle='No prompts yet'
				emptyDescription='Create your first prompt — it will show up here.'
				renderGridData={(row: PromptItem, field, index) => (
					<>
						<DataGridCell
							width={field['seq'].width}
							children={
								<Link to={`/prompts/preview/${row.id}`}>
									<Text skinColor>#{index + 1}</Text>
								</Link>
							}
						/>
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
						<DataGridCell width={field['type'].width} justify='center'>
							<Chip
								label={row.type.replace(/_/g, ' ')}
								skin='light'
								size='small'
								color='info'
								styles={{
									whiteSpace: 'nowrap',
									fontSize: '12px',
									fontWeight: 600,
									letterSpacing: '0.3px',
									textTransform: 'capitalize',
								}}
							/>
						</DataGridCell>
						<DataGridCell width={field['version'].width} justify='center'>
							<span
								style={{
									display: 'inline-flex',
									alignItems: 'center',
									padding: '2px 10px',
									borderRadius: 999,
									fontFamily:
										'ui-monospace, SFMono-Regular, Menlo, monospace',
									fontSize: 12,
									fontWeight: 600,
									color: '#6366f1',
									background: 'rgba(99, 102, 241, 0.10)',
									letterSpacing: '0.4px',
								}}
							>
								v{row.version}
							</span>
						</DataGridCell>
						<DataGridCell width={field['isActive'].width} justify='center'>
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
