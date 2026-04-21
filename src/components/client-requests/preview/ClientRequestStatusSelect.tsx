import { useState } from 'react'
import { Menu, MenuItem } from '@mui/material'
import { KeyboardArrowDownOutlined } from '@mui/icons-material'
import { Chip } from '../../../ui'
import { useUpdateClientRequestMutation } from '../../../store/clientRequests/clientRequestsApi'
import type { ClientRequestStatus } from '../../../store/clientRequests/types/definition'
import { useToast } from '../../../context/toast/ToastContext'

const statusColor: Record<ClientRequestStatus, string> = {
  on_review:            'warning',
  conversation_ongoing: 'info',
  archived:             '#9E9E9E',
}

const statusLabel: Record<ClientRequestStatus, string> = {
  on_review:            'On Review',
  conversation_ongoing: 'Conversation Ongoing',
  archived:             'Archived',
}

const ALL_STATUSES: ClientRequestStatus[] = ['on_review', 'conversation_ongoing', 'archived']

const ClientRequestStatusSelect = ({ id, status }: { id: string; status: ClientRequestStatus }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [updateRequest, { isLoading }] = useUpdateClientRequestMutation()
  const { showToast } = useToast()

  const handleSelect = async (newStatus: ClientRequestStatus) => {
    setAnchorEl(null)
    if (newStatus !== status) {
      const result = await updateRequest({ id, body: { status: newStatus } })
      if (!('error' in result)) {
        showToast(`Status updated to "${statusLabel[newStatus]}"`, 'success')
      }
    }
  }

  return (
    <>
      <div
        onClick={(e) => !isLoading && setAnchorEl(e.currentTarget)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, cursor: isLoading ? 'default' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
      >
        <Chip
          label={statusLabel[status]}
          skin="light"
          size="small"
          color={statusColor[status]}
          styles={{ whiteSpace: 'nowrap', color: '#000000' }}
        />
        <KeyboardArrowDownOutlined style={{ fontSize: 16, color: 'var(--text-secondary, #8A8D93)', flexShrink: 0 }} />
      </div>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { style: { minWidth: 200, marginTop: 4 } } }}
      >
        {ALL_STATUSES.map((s) => (
          <MenuItem
            key={s}
            selected={s === status}
            onClick={() => handleSelect(s)}
            style={{ gap: 8 }}
          >
            <Chip
              label={statusLabel[s]}
              skin="light"
              size="small"
              color={statusColor[s]}
              styles={{ whiteSpace: 'nowrap', color: '#000000', pointerEvents: 'none' }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}

export default ClientRequestStatusSelect
