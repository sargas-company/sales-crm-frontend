import React from 'react'
import { CloseRounded, InsertDriveFileRounded } from '@mui/icons-material'
import type { AttachedFile } from './useFileAttachment'

interface Props {
	files: AttachedFile[]
	onRemove: (id: string) => void
}

const EXT_COLOR: Record<string, string> = {
	pdf: '#FA423E',
	doc: '#2B5797',
	docx: '#2B5797',
	xls: '#217346',
	xlsx: '#217346',
	csv: '#217346',
	txt: '#6B7280',
	md: '#6B7280',
	jpg: '#7C3AED',
	jpeg: '#7C3AED',
	png: '#7C3AED',
}

const FileChip = ({ file, onRemove }: { file: AttachedFile; onRemove: (id: string) => void }) => {
	const ext = file.ext.replace('.', '').toLowerCase()
	const iconBg = EXT_COLOR[ext] ?? 'rgba(120,120,128,0.4)'

	return (
		<div
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				width: 200,
				flexShrink: 0,
				padding: '6px 6px 6px 8px',
				borderRadius: 12,
				background: 'rgba(120,120,128,0.15)',
				gap: 8,
			}}
		>
			<div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 8,
						background: iconBg,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexShrink: 0,
					}}
				>
					{file.previewUrl ? (
						<img
							src={file.previewUrl}
							alt=''
							style={{ width: 32, height: 32, borderRadius: 8, objectFit: 'cover' }}
						/>
					) : (
						<InsertDriveFileRounded style={{ fontSize: 17, color: '#fff' }} />
					)}
				</div>

				<div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
					<div
						style={{
							fontSize: 12,
							fontWeight: 600,
							lineHeight: 1.3,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						{file.name}
					</div>
					<div style={{ fontSize: 10, opacity: 0.45, lineHeight: 1.3, textTransform: 'uppercase' }}>
						{ext}
					</div>
				</div>
			</div>

			<div
				onClick={() => onRemove(file.id)}
				style={{
					display: 'inline-flex',
					alignItems: 'center',
					padding: 4,
					cursor: 'pointer',
					opacity: 0.45,
					flexShrink: 0,
				}}
			>
				<CloseRounded style={{ fontSize: 14 }} />
			</div>
		</div>
	)
}

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
