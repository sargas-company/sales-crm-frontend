import type { ComponentType, CSSProperties } from 'react'
import {
	AudiotrackOutlined,
	CodeOutlined,
	DescriptionOutlined,
	FolderZipOutlined,
	ImageOutlined,
	InsertDriveFileOutlined,
	MovieOutlined,
	PictureAsPdfOutlined,
	SlideshowOutlined,
	TableChartOutlined,
} from '@mui/icons-material'

export type FileIconDef = {
	Icon: ComponentType<{ style?: CSSProperties }>
	color: string
	bg: string
	label: string
}

/* Muted, desaturated palette — professional, not toxic.
 * Low-chroma versions of the semantic hues sit well against
 * neutral tile backgrounds in forms and read lists. */
export const pickFileIcon = (fileName: string): FileIconDef => {
	const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
	if (ext === 'pdf')
		return {
			Icon: PictureAsPdfOutlined,
			color: '#9a5a5a',
			bg: 'rgba(154, 90, 90, 0.09)',
			label: 'PDF',
		}
	if (['doc', 'docx', 'rtf', 'odt', 'txt', 'md'].includes(ext))
		return {
			Icon: DescriptionOutlined,
			color: '#5c7391',
			bg: 'rgba(92, 115, 145, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext))
		return {
			Icon: TableChartOutlined,
			color: '#5e7f6b',
			bg: 'rgba(94, 127, 107, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['ppt', 'pptx', 'key', 'odp'].includes(ext))
		return {
			Icon: SlideshowOutlined,
			color: '#a07d4e',
			bg: 'rgba(160, 125, 78, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['zip', 'rar', '7z', 'tar', 'gz', 'tgz'].includes(ext))
		return {
			Icon: FolderZipOutlined,
			color: '#7a6f8a',
			bg: 'rgba(122, 111, 138, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext))
		return {
			Icon: MovieOutlined,
			color: '#8c6478',
			bg: 'rgba(140, 100, 120, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext))
		return {
			Icon: AudiotrackOutlined,
			color: '#5e7f8c',
			bg: 'rgba(94, 127, 140, 0.09)',
			label: ext.toUpperCase(),
		}
	if (
		[
			'js', 'ts', 'tsx', 'jsx', 'py', 'rb', 'go',
			'rs', 'java', 'c', 'cpp', 'h', 'json', 'xml',
			'html', 'css', 'scss', 'yml', 'yaml', 'sh',
		].includes(ext)
	)
		return {
			Icon: CodeOutlined,
			color: '#6a6d8d',
			bg: 'rgba(106, 109, 141, 0.09)',
			label: ext.toUpperCase(),
		}
	if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext))
		return {
			Icon: ImageOutlined,
			color: '#597794',
			bg: 'rgba(89, 119, 148, 0.09)',
			label: ext.toUpperCase(),
		}
	return {
		Icon: InsertDriveFileOutlined,
		color: '#64748b',
		bg: 'rgba(100, 116, 139, 0.08)',
		label: ext ? ext.toUpperCase() : 'FILE',
	}
}
