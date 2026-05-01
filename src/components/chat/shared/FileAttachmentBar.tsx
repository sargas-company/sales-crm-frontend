import React from 'react'
import { CloseRounded, InsertDriveFileRounded } from '@mui/icons-material'
import type { AttachedFile } from './useFileAttachment'

interface Props {
	files: AttachedFile[]
	onRemove: (id: string) => void
}

const FileChip = ({ file, onRemove }: { file: AttachedFile; onRemove: (id: string) => void }) => (
	<div
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 6,
			padding: '5px 6px 5px 8px',
			borderRadius: 10,
			background: 'rgba(120,120,128,0.15)',
			flexShrink: 0,
		}}
	>
		{file.previewUrl ? (
			<img
				src={file.previewUrl}
				alt=''
				style={{ width: 26, height: 26, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }}
			/>
		) : (
			<InsertDriveFileRounded style={{ fontSize: 18, opacity: 0.5, flexShrink: 0 }} />
		)}

		<div style={{ maxWidth: 110, overflow: 'hidden' }}>
			<div
				style={{
					fontSize: 12,
					fontWeight: 500,
					lineHeight: 1.3,
					whiteSpace: 'nowrap',
					overflow: 'hidden',
					textOverflow: 'ellipsis',
				}}
			>
				{file.name}
			</div>
			<div style={{ fontSize: 10, opacity: 0.45, lineHeight: 1.3, textTransform: 'uppercase' }}>
				{file.ext.replace('.', '')}
			</div>
		</div>

		<button
			type='button'
			onClick={() => onRemove(file.id)}
			aria-label={`Delete ${file.name}`}
			style={{
				border: 0,
				background: 'transparent',
				cursor: 'pointer',
				padding: 2,
				display: 'inline-flex',
				alignItems: 'center',
				opacity: 0.5,
				flexShrink: 0,
				lineHeight: 1,
			}}
		>
			<CloseRounded style={{ fontSize: 13 }} />
		</button>
	</div>
)

const FileAttachmentBar = ({ files, onRemove }: Props) => {
	if (files.length === 0) return null

	return (
		<div
			style={{
				display: 'flex',
				flexWrap: 'wrap',
				gap: 6,
				padding: '10px 12px 4px 12px',
			}}
		>
			{files.map((f) => (
				<FileChip key={f.id} file={f} onRemove={onRemove} />
			))}
		</div>
	)
}

export default FileAttachmentBar
