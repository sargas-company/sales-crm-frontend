import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import type { CounterpartyItem } from '../../../store/counterparties/counterpartiesApi'
import CounterpartyListAction from './CounterpartyListAction'
import CounterpartyTypeChip from './CounterpartyTypeChip'

const columns: DataGridColoumn[] = [
	{ fieldId: 'seq', label: '#', width: '90px' },
	{ fieldId: 'firstName', label: 'First Name', width: '150px' },
	{ fieldId: 'lastName', label: 'Last Name', width: '150px' },
	{ fieldId: 'type', label: 'Type', width: '130px' },
	{ fieldId: 'info', label: 'Info', width: '280px' },
	{ fieldId: 'createdAt', label: 'Created', width: '150px' },
	{ fieldId: 'actions', label: 'Actions', width: '120px' },
]

interface CounterpartyTableProps {
	items: CounterpartyItem[]
	isLoading: boolean
	onDelete: (id: string) => void
}

const CounterpartyTable = ({ items, isLoading, onDelete }: CounterpartyTableProps) => {
	if (isLoading || !items) return <></>

	return (
		<Box padding={24} pl={40}>
			<DataGrid
				rows={items}
				columns={columns}
				gridDataKey={(item) => item.id}
				renderGridData={(row, field, index) => (
					<>
						<DataGridCell width={field['seq'].width} value={`#${index + 1}`} />
						<DataGridCell width={field['firstName'].width} value={row.firstName} />
						<DataGridCell width={field['lastName'].width} value={row.lastName} />
						<DataGridCell
							width={field['type'].width}
							justify='center'
							children={<CounterpartyTypeChip type={row.type} />}
						/>
						<DataGridCell width={field['info'].width} value={row.info ?? '—'} />
						<DataGridCell
							width={field['createdAt'].width}
							value={new Date(row.createdAt).toLocaleDateString()}
						/>
						<DataGridCell width={field['actions'].width}>
							<CounterpartyListAction counterpartyId={row.id} onDelete={onDelete} />
						</DataGridCell>
					</>
				)}
			/>
		</Box>
	)
}

export default CounterpartyTable
