import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import {
	ArrowBackRounded,
	DeleteOutlineRounded,
	FolderOpenOutlined,
	LockOutlined,
} from '@mui/icons-material'
import {
	useGetFileMetaQuery,
	useLazyGetFilePreviewUrlQuery,
} from '../store/file-manager/fileManagerApi'
import { FilePreview } from '../page/file-manager/FilePreview'
import axiosInstance from '../api/axiosInstance'
import { previewNeedsBackendProxy } from '../page/file-manager/FileManager.page'

/* Standalone portal preview for a single file reached by a direct
 * link: files.<domain>/file-manager/file/:fileId. Decouples the file
 * preview from the parent-folder listing — a user with a file-level
 * share can open the file even when they have no folder access.
 * Falls back to a dedicated 403 screen on no-access or missing file. */
export const FilePortalView = () => {
	const navigate = useNavigate()
	const { fileId } = useParams<{ fileId: string }>()
	const { data: meta, isLoading, isError, error } = useGetFileMetaQuery(
		fileId ?? '',
		{ skip: !fileId },
	)
	const [getPreviewUrl] = useLazyGetFilePreviewUrlQuery()
	const [preview, setPreview] = useState<{
		url: string
		name: string
		mime: string
		revoke: boolean
	} | null>(null)
	const [previewError, setPreviewError] = useState<string | null>(null)

	useEffect(() => {
		if (!meta) return
		let revoked = false
		const open = async () => {
			try {
				if (previewNeedsBackendProxy(meta.mimeType, meta.originalName)) {
					const res = await axiosInstance.get(
						`/file-manager/files/${meta.id}/content`,
						{ responseType: 'blob' },
					)
					if (revoked) return
					const blobUrl = URL.createObjectURL(res.data as Blob)
					setPreview({
						url: blobUrl,
						name: meta.originalName,
						mime: meta.mimeType,
						revoke: true,
					})
				} else {
					const { url, mimeType } = await getPreviewUrl(meta.id).unwrap()
					if (revoked) return
					setPreview({
						url,
						name: meta.originalName,
						mime: mimeType ?? meta.mimeType,
						revoke: false,
					})
				}
			} catch (e) {
				const err = e as {
					response?: { status?: number; data?: { message?: string } }
					message?: string
				}
				setPreviewError(
					err?.response?.data?.message ?? err?.message ?? 'Could not open file',
				)
			}
		}
		void open()
		return () => {
			revoked = true
		}
	}, [meta, getPreviewUrl])

	useEffect(
		() => () => {
			if (preview?.revoke) URL.revokeObjectURL(preview.url)
		},
		[preview],
	)

	const errorStatus =
		error && typeof error === 'object' && 'status' in error
			? (error as { status?: number }).status
			: undefined

	if (isLoading) {
		return (
			<Shell>
				<LoadingBlock>Loading file…</LoadingBlock>
			</Shell>
		)
	}

	if (isError && errorStatus === 403) {
		return (
			<Shell>
				<AccessDenied>
					<BigCode>
						<span className='digit'>4</span>
						<AccessIcon aria-hidden='true'>
							<LockOutlined />
						</AccessIcon>
						<span className='digit'>3</span>
					</BigCode>
					<AccessTitle>No access to this file</AccessTitle>
					<AccessSub>
						This file isn't shared with your account. Ask an admin to grant
						access.
					</AccessSub>
					<AccessAction
						type='button'
						onClick={() => navigate('/file-manager')}
					>
						<FolderOpenOutlined style={{ fontSize: 16 }} /> Open your folders
					</AccessAction>
				</AccessDenied>
			</Shell>
		)
	}

	if (isError || !meta) {
		return (
			<Shell>
				<AccessDenied>
					<BigCode $tone='danger'>
						<span className='digit'>4</span>
						<DangerIcon aria-hidden='true'>
							<DeleteOutlineRounded />
						</DangerIcon>
						<span className='digit'>4</span>
					</BigCode>
					<AccessTitle>File was deleted</AccessTitle>
					<AccessSub>
						This file has been removed by the owner. The link no longer leads
						anywhere.
					</AccessSub>
					<AccessAction
						type='button'
						onClick={() => navigate('/file-manager')}
					>
						<FolderOpenOutlined style={{ fontSize: 16 }} /> Open your folders
					</AccessAction>
				</AccessDenied>
			</Shell>
		)
	}

	return (
		<Shell>
			<TopBar>
				<BackBtn
					type='button'
					onClick={() => navigate('/file-manager')}
					aria-label='Back to folders'
				>
					<ArrowBackRounded style={{ fontSize: 18 }} />
					<span>Back</span>
				</BackBtn>
				<FileName title={meta.originalName}>{meta.originalName}</FileName>
			</TopBar>

			{previewError ? (
				<ErrorBlock>{previewError}</ErrorBlock>
			) : preview ? (
				<PreviewFrame>
					<FilePreview url={preview.url} name={preview.name} mime={preview.mime} />
				</PreviewFrame>
			) : (
				<LoadingBlock>Opening preview…</LoadingBlock>
			)}
		</Shell>
	)
}

const Shell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 24px;
	min-height: 100%;
`

const TopBar = styled.div`
	display: flex;
	align-items: center;
	gap: 14px;
`

const BackBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 7px 12px;
	border-radius: 10px;
	border: 1px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	color: #0f172a;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	cursor: pointer;
	transition:
		background 160ms ease,
		border-color 160ms ease;
	&:hover {
		background: #f8fafc;
		border-color: rgba(15, 23, 42, 0.18);
	}
`

const FileName = styled.span`
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 16px;
	font-weight: 600;
	letter-spacing: -0.3px;
	color: #0f172a;
	max-width: 60ch;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const PreviewFrame = styled.div`
	flex: 1;
	min-height: 60vh;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-radius: 14px;
	overflow: hidden;
	background: #ffffff;
`

const LoadingBlock = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: #64748b;
	font-size: 13px;
`

const ErrorBlock = styled.div`
	padding: 60px 20px;
	text-align: center;
	color: #b91c1c;
	font-size: 13px;
`

const floatY = keyframes`
	0%, 100% { transform: translateY(0); }
	50%      { transform: translateY(-4px); }
`

const AccessDenied = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 16px;
	padding: 72px 24px 80px;
	text-align: center;
	flex: 1;
`

const digitDrop = keyframes`
	from { opacity: 0; transform: translateY(-12px); }
	to   { opacity: 1; transform: translateY(0); }
`

const BigCode = styled.div<{ $tone?: 'ink' | 'danger' }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 4px;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	line-height: 1;

	.digit {
		font-size: 128px;
		font-weight: 800;
		letter-spacing: -6px;
		color: ${(p) => (p.$tone === 'danger' ? '#9a3412' : '#0f172a')};
		opacity: ${(p) => (p.$tone === 'danger' ? 1 : 0.9)};
		animation: ${digitDrop} 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
	}
	.digit:nth-child(3) {
		animation-delay: 0.08s;
	}

	@media (prefers-reduced-motion: reduce) {
		.digit {
			animation: none;
		}
	}
`

const DangerIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 96px;
	height: 96px;
	border-radius: 50%;
	background: rgba(154, 52, 18, 0.1);
	color: #9a3412;
	animation: ${floatY} 3.4s ease-in-out infinite;
	svg {
		font-size: 50px;
	}
`

const AccessIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 96px;
	height: 96px;
	border-radius: 50%;
	background: #f1f5f9;
	color: #94a3b8;
	animation: ${floatY} 3.4s ease-in-out infinite;
	svg {
		font-size: 50px;
	}
`
const AccessTitle = styled.h3`
	margin: 4px 0 0;
	font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
	font-size: 22px;
	font-weight: 700;
	letter-spacing: -0.4px;
	color: #0f172a;
`
const AccessSub = styled.p`
	margin: 0;
	font-size: 14px;
	line-height: 1.5;
	color: #64748b;
	max-width: 44ch;
`
const AccessAction = styled.button`
	margin-top: 6px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 10px 20px;
	border-radius: 10px;
	border: none;
	background: #0f172a;
	color: #ffffff;
	font: inherit;
	font-size: 13px;
	font-weight: 600;
	letter-spacing: -0.1px;
	cursor: pointer;
	transition:
		background 160ms ease,
		transform 160ms ease;
	&:hover {
		background: #1e293b;
		transform: translateY(-1px);
	}
`
