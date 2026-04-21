import { Link } from 'react-router-dom'
import { Text } from '../../../ui'
import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import ClientRequestStatus from './ClientRequestStatus'
import ClientRequestListAction from './ClientRequestListAction'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import type { ClientRequestItem } from '../../../store/clientRequests/types/definition'
import { formatDate } from '../../../utils/formatDate'

const columns: DataGridColoumn[] = [
  { fieldId: 'index',     label: '#',         width: '70px'  },
  { fieldId: 'name',      label: 'Name',      width: '180px' },
  { fieldId: 'company',   label: 'Company',   width: '160px' },
  { fieldId: 'phone',     label: 'Phone',     width: '160px' },
  { fieldId: 'message',   label: 'Message',   width: '260px' },
  { fieldId: 'status',    label: 'Status',    width: '210px' },
  { fieldId: 'createdAt', label: 'Created At', width: '160px' },
  { fieldId: 'actions',   label: 'Actions',   width: '140px' },
]

interface ClientRequestTableProps {
  items: ClientRequestItem[]
  isLoading: boolean
  onDelete: (id: string) => void
}

const ClientRequestTable = ({ items, isLoading, onDelete }: ClientRequestTableProps) => {
  if (isLoading || !items) return <></>

  return (
    <Box padding={24} pl={40}>
      <DataGrid
        rows={items}
        renderGridData={(row, field, index) => (
          <>
            <DataGridCell width={field['index'].width}>
              <Link to={`/client-requests/preview/${row.id}`}>
                <Text skinColor>#{index + 1}</Text>
              </Link>
            </DataGridCell>
            <DataGridCell width={field['name'].width} value={row.name || '—'} />
            <DataGridCell width={field['company'].width} value={row.company || '—'} />
            <DataGridCell width={field['phone'].width} value={row.phone || '—'} />
            <DataGridCell width={field['message'].width}>
              <Text
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: field['message'].width,
                  display: 'block',
                }}
              >
                {row.message || '—'}
              </Text>
            </DataGridCell>
            <DataGridCell width={field['status'].width}>
              <ClientRequestStatus status={row.status} />
            </DataGridCell>
            <DataGridCell width={field['createdAt'].width} value={formatDate(row.createdAt)} />
            <DataGridCell width={field['actions'].width}>
              <ClientRequestListAction id={row.id} onDelete={onDelete} />
            </DataGridCell>
          </>
        )}
        columns={columns}
        gridDataKey={(item) => item.id}
      />
    </Box>
  )
}

export default ClientRequestTable
