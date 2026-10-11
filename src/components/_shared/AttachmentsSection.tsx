import { useRef, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	AttachFileRounded,
	UploadFileRounded,
	InsertDriveFileOutlined,
	DeleteOutline,
	CloudDownloadOutlined,
} from '@mui/icons-material'

import {
	useDeleteAttachmentMutation,
	useGetAttachmentsQuery,
	useUploadAttachmentMutation,
	type AttachmentOwnerType,
} from '../../store/attachments/attachmentsApi'
import axiosInstance from '../../api/axiosInstance'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'

interface Props {
	ownerType: AttachmentOwnerType
	ownerId: string
	// When true, upload / delete controls are rendered. Omitting
	// this disables writes (list / download still work).
	canWrite?: boolean
}

const AttachmentsSection = ({ ownerType, ownerId, canWrite = true }: Props) => {
	const { data, isLoading, isError } = useGetAttachmentsQuery({
		ownerType,
		ownerId,
	})
	const [uploadAttachment, { isLoading: uploading }] =
		useUploadAttachmentMutation()
	const [deleteAttachment] = useDeleteAttachmentMutation()
	const { showToast } = useToast()
	const inputRef = useRef<HTMLInputElement>(null)
	const [pendingDelete, setPendingDelete] = useState<string | null>(null)

	const openPicker = () => inputRef.current?.click()

	const handleFiles = async (files: FileList | null) => {
		if (!files || files.length === 0) return
		// Sequentially — simple and avoids racing the invalidation.
		for (const f of Array.from(files)) {
			try {
				await uploadAttachment({ ownerType, ownerId, file: f }).unwrap()
			} catch (err) {
				showToast(parseServerError(err) || `Failed to upload ${f.name}`, 'error')
			}
		}
		if (inputRef.current) inputRef.current.value = ''
	}

	const handleDownload = async (id: string, filename: string) => {
		try {
			const res = await axiosInstance.get(`/attachments/${id}/download`, {
				responseType: 'blob',
			})
			const url = URL.createObjectURL(res.data as Blob)
			const link = document.createElement('a')
			link.href = url
			link.download = filename
			document.body.appendChild(link)
			link.click()
			link.remove()
			URL.revokeObjectURL(url)
		} catch (err) {
			showToast(parseServerError(err) || 'Could not download attachment', 'error')
		}
	}

	const handleDelete = async (id: string) => {
		setPendingDelete(id)
		try {
			await deleteAttachment({ id, ownerType, ownerId }).unwrap()
		} catch (err) {
			showToast(parseServerError(err) || 'Could not delete attachment', 'error')
		} finally {
			setPendingDelete(null)
		}
	}

	const list = data ?? []

	return (
		<Wrap>
			<Head>
				<Title>
					<AttachFileRounded sx={{ fontSize: 18 }} />
					Attachments
					{list.length > 0 && <Count>{list.length}</Count>}
				</Title>
				{canWrite && (
					<UploadBtn
						type='button'
						onClick={openPicker}
						disabled={uploading}
						aria-label='Upload attachment'
					>
						<UploadFileRounded sx={{ fontSize: 16 }} />
						{uploading ? 'Uploading…' : 'Add file'}
					</UploadBtn>
				)}
				<HiddenInput
					ref={inputRef}
					type='file'
					multiple
					onChange={(e) => handleFiles(e.target.files)}
				/>
			</Head>

			{isLoading ? (
				<Muted>Loading…</Muted>
			) : isError ? (
				<Muted>Could not load attachments.</Muted>
			) : list.length === 0 ? (
				<Empty>
					{canWrite
						? 'No attachments yet. Drop any file to add one.'
						: 'No attachments.'}
				</Empty>
			) : (
				<List>
					{list.map((a) => (
						<Row key={a.id}>
							<FileIcon>
								<InsertDriveFileOutlined />
							</FileIcon>
							<FileInfo>
								<FileName title={a.originalName}>{a.originalName}</FileName>
								<FileMeta>
									{formatBytes(a.size)}
									{a.uploadedBy
										? ` · ${a.uploadedBy.firstName} ${a.uploadedBy.lastName}`
										: ''}
									{` · ${a.createdAt.slice(0, 10)}`}
								</FileMeta>
							</FileInfo>
							<RowActions>
								<IconBtn
									type='button'
									onClick={() => handleDownload(a.id, a.originalName)}
									aria-label='Download'
								>
									<CloudDownloadOutlined sx={{ fontSize: 18 }} />
								</IconBtn>
								{canWrite && (
									<IconBtn
										type='button'
										$danger
										disabled={pendingDelete === a.id}
										onClick={() => handleDelete(a.id)}
										aria-label='Delete'
									>
										<DeleteOutline sx={{ fontSize: 18 }} />
									</IconBtn>
								)}
							</RowActions>
						</Row>
					))}
				</List>
			)}
		</Wrap>
	)
}

export default AttachmentsSection

function formatBytes(bytes: number): string {
	if (!bytes) return '0 B'
	const units = ['B', 'KB', 'MB', 'GB']
	let value = bytes
	let i = 0
	while (value >= 1024 && i < units.length - 1) {
		value /= 1024
		i++
	}
	return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

const INK = '#0f172a'
const INK_60 = 'rgba(15, 23, 42, 0.6)'
const INK_45 = 'rgba(15, 23, 42, 0.45)'
const INK_10 = 'rgba(15, 23, 42, 0.08)'
const PRIMARY = 'rgb(3, 105, 161)'

const rowIn = keyframes`
	from { opacity: 0; transform: translateY(2px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Wrap = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const Head = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
`

const Title = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 11px;
	font-weight: 800;
	letter-spacing: 0.22em;
	text-transform: uppercase;
	color: ${INK_45};
`

const Count = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 20px;
	height: 20px;
	padding: 0 6px;
	border-radius: 999px;
	background: ${INK_10};
	color: ${INK_60};
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0;
	text-transform: none;
`

const UploadBtn = styled.button`
	margin-left: auto;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	background: #fff;
	border: 1px solid rgba(3, 105, 161, 0.35);
	color: ${PRIMARY};
	border-radius: 10px;
	padding: 8px 14px;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition: transform 180ms ease, background 180ms ease;

	&:hover:not(:disabled) {
		transform: translateY(-1px);
		background: rgba(3, 105, 161, 0.06);
	}
	&:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}
`

const HiddenInput = styled.input`
	display: none;
`

const Muted = styled.span`
	font-size: 13px;
	color: ${INK_60};
`

const Empty = styled.div`
	padding: 18px 20px;
	border: 1px dashed ${INK_10};
	border-radius: 12px;
	font-size: 13px;
	color: ${INK_60};
	text-align: center;
`

const List = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const Row = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 12px;
	border-radius: 12px;
	background: #fff;
	border: 1px solid ${INK_10};
	animation: ${rowIn} 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
`

const FileIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 9px;
	background: rgba(3, 105, 161, 0.1);
	color: ${PRIMARY};
	flex-shrink: 0;

	svg {
		font-size: 18px;
	}
`

const FileInfo = styled.div`
	display: flex;
	flex-direction: column;
	min-width: 0;
	flex: 1;
`

const FileName = styled.span`
	font-size: 13.5px;
	font-weight: 600;
	color: ${INK};
	line-height: 1.3;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const FileMeta = styled.span`
	font-size: 11.5px;
	color: ${INK_60};
	margin-top: 2px;
`

const RowActions = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
`

const IconBtn = styled.button<{ $danger?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 8px;
	background: transparent;
	border: 1px solid transparent;
	color: ${({ $danger }) => ($danger ? '#b91c1c' : INK)};
	cursor: pointer;
	transition: background 160ms ease, border-color 160ms ease;

	&:hover:not(:disabled) {
		background: ${({ $danger }) =>
			$danger ? 'rgba(185, 28, 28, 0.08)' : 'rgba(15, 23, 42, 0.04)'};
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

