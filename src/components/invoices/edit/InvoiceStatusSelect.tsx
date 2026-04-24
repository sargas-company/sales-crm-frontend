import { useEffect, useState } from 'react'
import { KeyboardArrowDownOutlined } from '@mui/icons-material'
import { Menu, MenuItem } from '@mui/material'
import { Chip } from '../../../ui'
import { type InvoiceStatus, useUpdateInvoiceMutation } from '../../../store/invoices/invoicesApi'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'

const statusColor: Record<InvoiceStatus, string> = {
	draft: 'warning',
	open: 'info',
	paid: 'success',
}

const statusLabel: Record<InvoiceStatus, string> = {
	draft: 'Draft',
	open: 'Open',
	paid: 'Paid',
}

const ALL_STATUSES: InvoiceStatus[] = ['draft', 'open', 'paid']

type Props = {
	id: string
	status?: InvoiceStatus
}

const InvoiceStatusSelect = ({ id, status = 'draft' }: Props) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const [localStatus, setLocalStatus] = useState<InvoiceStatus>(status)
	const [updateInvoice, { isLoading }] = useUpdateInvoiceMutation()
	const { showToast } = useToast()

	useEffect(() => {
		setLocalStatus(status)
	}, [status])

	const handleSelect = async (newStatus: InvoiceStatus) => {
		setAnchorEl(null)
		if (newStatus === localStatus) return

		try {
			await updateInvoice({ id, body: { status: newStatus } }).unwrap()
			setLocalStatus(newStatus)
			showToast(`Status updated to "${statusLabel[newStatus]}"`, 'success')
		} catch (error) {
			showToast(parseServerError(error), 'error')
		}
	}

	return (
		<>
			<div
				onClick={(e) => !isLoading && setAnchorEl(e.currentTarget)}
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					gap: 4,
					cursor: isLoading ? 'default' : 'pointer',
					opacity: isLoading ? 0.6 : 1,
				}}
			>
				<Chip
					label={statusLabel[localStatus]}
					skin='light'
					size='small'
					color={statusColor[localStatus]}
					styles={{ whiteSpace: 'nowrap', color: '#000000' }}
				/>
				<KeyboardArrowDownOutlined
					style={{ fontSize: 16, color: 'var(--text-secondary, #8A8D93)', flexShrink: 0 }}
				/>
			</div>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={() => setAnchorEl(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
				transformOrigin={{ vertical: 'top', horizontal: 'left' }}
				slotProps={{ paper: { style: { minWidth: 160, marginTop: 4 } } }}
			>
				{ALL_STATUSES.map((statusItem) => (
					<MenuItem
						key={statusItem}
						selected={statusItem === localStatus}
						onClick={() => handleSelect(statusItem)}
						style={{ gap: 8 }}
					>
						<Chip
							label={statusLabel[statusItem]}
							skin='light'
							size='small'
							color={statusColor[statusItem]}
							styles={{ whiteSpace: 'nowrap', color: '#000000', pointerEvents: 'none' }}
						/>
					</MenuItem>
				))}
			</Menu>
		</>
	)
}

export default InvoiceStatusSelect
