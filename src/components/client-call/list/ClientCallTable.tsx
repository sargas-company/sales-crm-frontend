import { Link } from 'react-router-dom'

import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import { Text } from '../../../ui'

import type { DataGridColoumn } from '../../layout/data-grid/type'
import { formatDate, formatClientDateTime, formatKyivDateTime } from '../../../utils/formatDate'
import ClientCallListAction from './ClientCallListAction'
import ClientCallStatusChip from './ClientCallStatusChip'
import ClientCallSourceChip from './ClientCallSourceChip'

type ClientCallItem = {
	id: string
	clientType: 'lead' | 'client_request'
	clientName: string
	leadId: string | null
	clientRequestId: string | null
	callTitle: string
	clientDateTime: string
	kyivDateTime: string
	clientTimezone: string
	duration: number
	status: 'scheduled' | 'cancelled' | 'completed'
	createdAt: string
}

const columns: DataGridColoumn[] = [
	{ fieldId: 'id', label: '#', width: '90px' },
	{ fieldId: 'clientType', label: 'Source', width: '170px' },
	{ fieldId: 'clientName', label: 'Client', width: '200px' },
	{ fieldId: 'callTitle', label: 'Call Title', width: '220px' },
	{ fieldId: 'clientDateTime', label: 'Client Time', width: '220px' },
	{ fieldId: 'kyivDateTime', label: 'Kyiv Time', width: '220px' },
	{ fieldId: 'clientTimezone', label: 'Timezone', width: '130px' },
	{ fieldId: 'duration', label: 'Duration', width: '130px' },
	{ fieldId: 'status', label: 'Status', width: '150px' },
	{ fieldId: 'createdAt', label: 'Created At', width: '160px' },
	{ fieldId: 'actions', label: 'Actions', width: '160px' },
]

interface Props {
	items: ClientCallItem[]
	isLoading: boolean
	onDelete: (id: string) => void
}

const ClientCallTable = ({ items, isLoading, onDelete }: Props) => {
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
				renderGridData={(row, field, index) => (
					<>
						<DataGridCell
							width={field['id'].width}
							children={
								<Link to={`/client-calls/preview/${row.id}`}>
									<Text skinColor>#{index + 1}</Text>
								</Link>
							}
						/>

						<DataGridCell width={field['clientType'].width}>
							<ClientCallSourceChip clientType={row.clientType} />
						</DataGridCell>

						<DataGridCell width={field['clientName'].width}>
							{row.clientType === 'lead' && row.leadId ? (
								<Link to={`/leads/preview/${row.leadId}`}>
									<Text skinColor varient={'body2'} >{row.clientName}</Text>
								</Link>
							) : row.clientType === 'client_request' && row.clientRequestId ? (
								<Link to={`/client-requests/preview/${row.clientRequestId}`}>
									<Text skinColor varient={'body2'}>{row.clientName}</Text>
								</Link>
							) : (
								<Text>{row.clientName}</Text>
							)}
						</DataGridCell>

						<DataGridCell width={field['callTitle'].width} value={row.callTitle} />

						<DataGridCell width={field['clientDateTime'].width} value={formatClientDateTime(row.clientDateTime)} />

						<DataGridCell width={field['kyivDateTime'].width} value={formatKyivDateTime(row.kyivDateTime)} />

						<DataGridCell
							width={field['clientTimezone'].width}
							justify='center'
							value={row.clientTimezone}
						/>

						<DataGridCell
							width={field['duration'].width}
							justify='center'
							value={`${row.duration} min`}
						/>

						<DataGridCell width={field['status'].width}>
							<ClientCallStatusChip status={row.status} />
						</DataGridCell>

						<DataGridCell
							width={field['createdAt'].width}
							value={formatDate(row.createdAt)}
						/>

						<DataGridCell width={field['actions'].width}>
							<ClientCallListAction clientCallId={row.id} status={row.status} onDelete={onDelete} />
						</DataGridCell>
					</>
				)}
				columns={columns}
				gridDataKey={(item) => item.id}
			/>
		</Box>
	)
}

export default ClientCallTable
