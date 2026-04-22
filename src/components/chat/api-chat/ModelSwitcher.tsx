import React, { useMemo, useState } from 'react'
import { KeyboardArrowDown, Check } from '@mui/icons-material'
import { Menu, MenuItem, Divider } from '@mui/material'

import Box from '../../box/Box'
import { Text } from '../../../ui'
import { useAppDispatch, useAppSelector } from '../../../hooks'
import { setSelectedModel } from '../../../store/chats/apiChatSlice'

type ModelOption = {
	id: string
	label: string
	description?: string
	modelId: string
}

export const MODEL_OPTIONS: ModelOption[] = [
	{
		id: 'instant',
		label: 'Claude Sonnet 4.6',
		description: 'For everyday chats',
		modelId: 'claude-sonnet-4-6',
	},
	{
		id: 'thinking',
		label: 'Claude Opus 4.6',
		description: 'For complex questions',
		modelId: 'claude-opus-4-6',
	},
]

interface Props {
	/** Controlled mode: current modelId (e.g. 'claude-sonnet-4-6') */
	value?: string
	/** Controlled mode: called with the new modelId */
	onChange?: (modelId: string) => void
}

const ModelSwitcher = ({ value, onChange }: Props) => {
	const dispatch = useAppDispatch()
	const reduxModel = useAppSelector((state) => state.apiChat.selectedModel)

	const isControlled = value !== undefined

	// Uncontrolled: track by option.id; controlled: derive option.id from value
	const [localId, setLocalId] = useState('instant')
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const activeId = isControlled
		? (MODEL_OPTIONS.find((o) => o.modelId === value)?.id ?? 'instant')
		: (MODEL_OPTIONS.find((o) => o.modelId === reduxModel)?.id ?? localId)

	const selectedOption = useMemo(() => MODEL_OPTIONS.find((o) => o.id === activeId), [activeId])

	const open = Boolean(anchorEl)

	const handleOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
	const handleClose = () => setAnchorEl(null)

	const handleSelect = (option: ModelOption) => {
		if (isControlled) {
			onChange?.(option.modelId)
		} else {
			setLocalId(option.id)
			dispatch(setSelectedModel(option.modelId))
		}
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

				{MODEL_OPTIONS.map((option) => {
					const isSelected = option.id === activeId

					return (
						<MenuItem
							key={option.id}
							onClick={() => handleSelect(option)}
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
