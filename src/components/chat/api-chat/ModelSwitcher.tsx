import React, { useMemo, useState } from 'react'
import { KeyboardArrowDown, Check } from '@mui/icons-material'
import { Menu, MenuItem, Divider } from '@mui/material'

import Box from '../../box/Box'
import { Text } from '../../../ui'

type ModelOption = {
	id: string
	label: string
	description?: string
	group?: 'latest' | 'other'
}

const modelOptions: ModelOption[] = [
	{
		id: 'instant',
		label: 'Claude Sonnet 4.6',
		description: 'For everyday chats',
		group: 'latest',
	},
	{
		id: 'thinking',
		label: 'Claude Opus 4.6',
		description: 'For complex questions',
		group: 'latest',
	},
]

const ModelSwitcher = () => {
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
	const [selectedModel, setSelectedModel] = useState('instant')

	const open = Boolean(anchorEl)

	const selectedOption = useMemo(
		() => modelOptions.find((option) => option.id === selectedModel),
		[selectedModel]
	)

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	const handleSelect = (modelId: string) => {
		setSelectedModel(modelId)
		handleClose()
	}

	return (
		<>
			<Box
				display='flex'
				align='center'
				style={{
					marginLeft: 'auto',
					display: 'inline-flex',
					alignItems: 'center',
					gap: 8,
					height: 40,
					padding: '0 14px',
					borderRadius: 12,
					background: '#f5f9ff',
					border: '1px solid #cfe0ff',
					cursor: 'pointer',
				}}
				onClick={handleOpen}
			>
				<Text varient='body2' weight='bold'>
					{selectedOption?.label || 'Select model'}
				</Text>
				<KeyboardArrowDown fontSize='small' />
			</Box>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				transformOrigin={{ horizontal: 'right', vertical: 'top' }}
				anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
				slotProps={{
					paper: {
						style: {
							width: 320,
							borderRadius: 20,
							padding: 8,
						},
					},
				}}
			>
				<Box style={{ padding: '8px 12px 4px' }}>
					<Text varient='caption' secondary>
						Latest
					</Text>
				</Box>

				{modelOptions.map((option) => {
					const isSelected = option.id === selectedModel

					return (
						<MenuItem
							key={option.id}
							onClick={() => handleSelect(option.id)}
							style={{
								borderRadius: 12,
								margin: '4px 0',
								padding: '12px 14px',
							}}
						>
							<Box display='flex' align='center' style={{ width: '100%' }}>
								<Box display='flex' flexDirection='column'>
									<Text varient='body2'>{option.label}</Text>
									{option.description && (
										<Text varient='caption' secondary>
											{option.description}
										</Text>
									)}
								</Box>

								{isSelected && (
									<Box style={{ marginLeft: 'auto', display: 'flex' }}>
										<Check fontSize='small' />
									</Box>
								)}
							</Box>
						</MenuItem>
					)
				})}

				<Divider style={{ margin: '8px 12px' }} />

				<MenuItem
					onClick={handleClose}
					style={{
						borderRadius: 12,
						margin: '4px 0',
						padding: '12px 14px',
					}}
				>
					<Text varient='body2'>Configure...</Text>
				</MenuItem>
			</Menu>
		</>
	)
}

export default ModelSwitcher
