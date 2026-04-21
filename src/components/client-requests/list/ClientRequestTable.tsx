import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Text } from '../../../ui'
import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import ClientRequestStatus from './ClientRequestStatus'
import ClientRequestListAction from './ClientRequestListAction'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'
import type { DataGridColoumn } from '../../layout/data-grid/type'
import type { ClientRequestItem } from '../../../store/clientRequests/types/definition'
import { formatDate } from '../../../utils/formatDate'

const isoToFlag = (iso: string) =>
  iso.toUpperCase().replace(/./g, c => String.fromCodePoint(c.charCodeAt(0) + 127397))

const columns: DataGridColoumn[] = [
  { fieldId: 'index',     label: '#',         width: '70px'  },
  { fieldId: 'name',      label: 'Name',      width: '180px' },
  { fieldId: 'company',   label: 'Company',   width: '160px' },
  { fieldId: 'phone',     label: 'Phone',     width: '160px' },
  { fieldId: 'email',     label: 'Email',     width: '200px' },
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
  const [messageText, setMessageText] = useState<string | null>(null)

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
            <DataGridCell width={field['phone'].width}>
              {row.phone ? (
                <Box display="flex" align="center" space={1}>
                  {row.phoneCountry && (
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{isoToFlag(row.phoneCountry)}</span>
                  )}
                  <Text varient="body2">{row.phone}</Text>
                </Box>
              ) : (
                <Text varient="body2">—</Text>
              )}
            </DataGridCell>
            <DataGridCell width={field['email'].width} value={row.email || '—'} />
            <DataGridCell width={field['message'].width}>
              {row.message ? (
                <span
                  onClick={() => setMessageText(row.message)}
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    fontSize: 13,
                    lineHeight: '1.5',
                    cursor: 'pointer',
                  }}
                >
                  {row.message}
                </span>
              ) : (
                <Text>—</Text>
              )}
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

      {messageText && (
        <Modal handleOutClick={() => setMessageText(null)}>
          <ModalContentLayout maxWidth='600px'>
            <Box display='flex' flexDirection='column' space={3}>
              <Text heading='h6'>Message</Text>
              <Box style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Text varient='body2' paragraph>
                  {messageText}
                </Text>
              </Box>
            </Box>
          </ModalContentLayout>
        </Modal>
      )}
    </Box>
  )
}

export default ClientRequestTable
