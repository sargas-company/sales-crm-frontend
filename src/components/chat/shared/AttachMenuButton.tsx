import React, { useRef, useState } from 'react'
import { AddRounded, PhotoLibraryRounded } from '@mui/icons-material'
import { ListItemIcon, Menu, MenuItem } from '@mui/material'

const ACCEPT = '.pdf,.docx,.txt,.md,.xlsx,.csv,.jpg,.jpeg,.png'

interface Props {
	disabled?: boolean
	onFilesSelected: (files: File[]) => void
}

const AttachMenuButton = ({ disabled, onFilesSelected }: Props) => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		if (disabled) return
		setAnchorEl(e.currentTarget)
	}

	const handleClose = () => setAnchorEl(null)

	const handleFilesMenuClick = () => {
		handleClose()
		fileInputRef.current?.click()
	}

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? [])
		if (files.length > 0) onFilesSelected(files)
		e.target.value = ''
	}

	return (
		<>
			<input
				ref={fileInputRef}
				type='file'
				multiple
				accept={ACCEPT}
				onChange={handleInputChange}
				style={{ display: 'none' }}
				tabIndex={-1}
			/>

			<button
				type='button'
				aria-label='Attach files'
				aria-haspopup='menu'
				disabled={disabled}
				onClick={handleClick}
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					flexShrink: 0,
					border: 0,
					background: 'transparent',
					cursor: disabled ? 'default' : 'pointer',
					opacity: disabled ? 0.35 : 1,
					padding: '0 4px 10px 10px',
				}}
			>
				<span
					style={{
						width: 30,
						height: 30,
						borderRadius: '50%',
						background: 'rgba(120,120,128,0.18)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
					}}
				>
					<AddRounded style={{ fontSize: 18 }} />
				</span>
			</button>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
				transformOrigin={{ horizontal: 'left', vertical: 'bottom' }}
				slotProps={{
					paper: {
						style: {
							borderRadius: 14,
							minWidth: 190,
							boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
							padding: '4px 0',
						},
					},
				}}
			>
				<MenuItem
					onClick={handleFilesMenuClick}
					style={{ padding: '10px 16px', borderRadius: 10, gap: 10 }}
				>
					<ListItemIcon style={{ minWidth: 'unset' }}>
						<PhotoLibraryRounded style={{ fontSize: 20 }} />
					</ListItemIcon>
					<span style={{ fontSize: 14 }}>Photos &amp; files</span>
				</MenuItem>
			</Menu>
		</>
	)
}

export default AttachMenuButton
