import { Link } from 'react-router-dom'
import { Text } from '../../../ui'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import DataGrid from '../../layout/data-grid/DataGrid'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import type { InvoiceItem } from '../../../store/invoices/invoicesApi'
import { formatDate } from '../../../utils/formatDate'
import InvoiceListAction from './InvoiceListAction'
import InvoiceListItemStatus from './InvoiceListItemStatus'
import { formatInvoiceMoney, getCounterpartyName, getInvoiceTotal } from './utils'

const columns: DataGridColoumn[] = [
	{ fieldId: 'seq', label: '#', width: '90px' },
	{ fieldId: 'number', label: 'Invoice', width: '130px' },
	{ fieldId: 'counterparty', label: 'Counterparty', width: '220px' },
	{ fieldId: 'status', label: 'Status', width: '210px' },
	{ fieldId: 'date', label: 'Date', width: '160px' },
	{ fieldId: 'dueDate', label: 'Due Date', width: '160px' },
	{ fieldId: 'total', label: 'Total', width: '150px' },
	{ fieldId: 'actions', label: 'Actions', width: '140px' },
]

interface InvoiceTableProps {
	items: InvoiceItem[]
	isLoading: boolean
	onDelete: (id: string) => void
	onMarkPaid: (id: string) => void
}

const InvoiceTable = ({ items, isLoading, onDelete, onMarkPaid }: InvoiceTableProps) => {
	if (isLoading || !items) return <></>

	return (
		<Box padding={24} pl={40}>
			<DataGrid
				rows={items}
				renderGridData={(row, field, index) => (
					<>
						<DataGridCell
							width={field['seq'].width}
							children={
								<Link to={`/invoices/preview/${row.id}`}>
									<Text skinColor>#{index + 1}</Text>
								</Link>
							}
						/>
						<DataGridCell
							width={field['number'].width}
							children={
								<Link to={`/invoices/preview/${row.id}`}>
									<Text skinColor>{row.number ? `#${row.number}` : 'No number'}</Text>
								</Link>
							}
						/>
						<DataGridCell
							width={field['counterparty'].width}
							value={getCounterpartyName(row)}
						/>
						<DataGridCell
							width={field['status'].width}
							children={<InvoiceListItemStatus itemStatus={row.status} />}
						/>
						<DataGridCell width={field['date'].width} value={formatDate(row.date)} />
						<DataGridCell width={field['dueDate'].width} value={formatDate(row.dueDate)} />
						<DataGridCell
							width={field['total'].width}
							justify='center'
							value={formatInvoiceMoney(getInvoiceTotal(row), row.currency)}
						/>
						<DataGridCell width={field['actions'].width}>
							<InvoiceListAction
								invoiceId={row.id}
								status={row.status}
								onDelete={onDelete}
								onMarkPaid={onMarkPaid}
							/>
						</DataGridCell>
					</>
				)}
				columns={columns}
				gridDataKey={(item) => item.id}
			/>
		</Box>
	)
}

export default InvoiceTable
