import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Snackbar, Alert } from '@mui/material'
import { Tooltip } from '@mui/material'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ContentCopy, DescriptionOutlined } from '@mui/icons-material'

import type { ProposalItem } from '../../../store/proposals/types/definition'
import { formatDate } from '../../../utils/formatDate'

import DataGrid from '../../layout/data-grid/DataGrid'
import Box from '../../box/Box'
import DataGridCell from '../../data-grid-item/DataGridCell'
import ProposalListItemStatus from './ProposalListItemStatus'
import ProposalListItemType from './ProposalListItemType'
import ProposalListItemBoosted from './ProposalListItemBoosted'
import Modal from '../../modal/Modal'
import ModalContentLayout from '../../users/layout/ModalContentLayout'
import { Text } from '../../../ui'
import { CoverLetterCell, JobUrlCell } from './ProposalTable.styled'

import type { DataGridColoumn } from '../../layout/data-grid/type'
import ProposalListAction from './ProposalListAction'

const columns: DataGridColoumn[] = [
	{ fieldId: 'id', label: '#', width: '90px' },
	{ fieldId: 'jobUrl', label: 'Job URL', width: '130px' },
	{ fieldId: 'status', label: 'Status', width: '120px' },
	{ fieldId: 'coverLetter', label: 'Cover Letter', width: '320px' },
	{ fieldId: 'user', label: 'Manager', width: '160px' },
	{ fieldId: 'account', label: 'Account', width: '200px' },
	{ fieldId: 'platform', label: 'Platform', width: '120px' },
	{ fieldId: 'proposalType', label: 'Type', width: '160px' },
	{ fieldId: 'boosted', label: 'Boosted', width: '175px' },
	{ fieldId: 'connects', label: 'Connects', width: '110px' },
	{ fieldId: 'boostedConnects', label: 'Boosted Connects', width: '175px' },
	{ fieldId: 'createdAt', label: 'Created At', width: '160px' },
	{ fieldId: 'sentAt', label: 'Sent At', width: '160px' },

	{ fieldId: 'actions', label: 'Actions', width: '140px' },
]

interface Props {
	items: ProposalItem[]
	isLoading: boolean
	onDelete: (id: string) => void
}

const ProposalTable = ({ items, isLoading, onDelete }: Props) => {
	const [toastOpen, setToastOpen] = useState(false)
	const [coverLetterText, setCoverLetterText] = useState<string | null>(null)

	const handleCopyJobId = (url: string) => {
		navigator.clipboard.writeText(url)
		setToastOpen(true)
	}

	return (
		<Box padding={24} pl={40}>
			<DataGrid
				rows={items}
				isLoading={isLoading}
				skeletonRows={6}
				emptyIcon={<DescriptionOutlined style={{ fontSize: 44 }} />}
				emptyTitle='No proposals yet'
				emptyDescription='Create your first proposal — it will show up here.'
				renderGridData={(row, field, index) => (
					<>
						<DataGridCell
							width={field['id'].width}
							children={
								<Link to={`/proposal/preview/${row.id}`}>
									<Tooltip title={row.id} placement='top'>
										<span>
											<Text skinColor>#{index + 1}</Text>
										</span>
									</Tooltip>
								</Link>
							}
						/>
						<DataGridCell
							width={field['jobUrl'].width}
							justify='center'
							children={
								row.jobUrl ? (
									<Tooltip title={row.jobUrl} placement='top'>
										<JobUrlCell onClick={() => handleCopyJobId(row.jobUrl!)}>
											<span className='job-url-tag'>…{row.jobUrl.slice(-4)}</span>
											<ContentCopy className='job-url-copy' />
										</JobUrlCell>
									</Tooltip>
								) : (
									<Text secondary>—</Text>
								)
							}
						/>
						<DataGridCell
							width={field['status'].width}
							children={<ProposalListItemStatus itemStatus={row.status} />}
						/>
						<DataGridCell
							width={field['coverLetter'].width}
							children={
								row.coverLetter ? (
									<CoverLetterCell onClick={() => setCoverLetterText(row.coverLetter)}>
										<span className='cover-letter-text'>{row.coverLetter}</span>
										<span className='cover-letter-hint'>Click to read</span>
									</CoverLetterCell>
								) : (
									<Text secondary>—</Text>
								)
							}
						/>
						<DataGridCell
							width={field['user'].width}
							value={`${row.user.firstName} ${row.user.lastName}`}
						/>
						<DataGridCell
							width={field['account'].width}
							value={row.account ? `${row.account.firstName} ${row.account.lastName}` : '—'}
						/>
						<DataGridCell
							width={field['platform'].width}
							justify='center'
							children={
								row.platform.imageUrl ? (
									<img
										src={row.platform.imageUrl}
										alt={row.platform.title}
										style={{ width: 24, height: 24, objectFit: 'contain' }}
									/>
								) : (
									<Text varient='body2'>{row.platform.title}</Text>
								)
							}
						/>
						<DataGridCell
							width={field['proposalType'].width}
							children={<ProposalListItemType itemType={row.proposalType} />}
						/>
						<DataGridCell
							width={field['boosted'].width}
							children={
								<ProposalListItemBoosted
									itemBoosted={row.boosted ? 'Boosted' : 'Not Boosted'}
								/>
							}
						/>
						<DataGridCell
							width={field['connects'].width}
							justify='center'
							value={String(row.connects)}
						/>
						<DataGridCell
							width={field['boostedConnects'].width}
							justify='center'
							value={String(row.boostedConnects)}
						/>
						<DataGridCell
							width={field['createdAt'].width}
							value={formatDate(row.createdAt)}
						/>
						<DataGridCell width={field['sentAt'].width} value={formatDate(row.sentAt)} />

						<DataGridCell width={field['actions'].width}>
							<ProposalListAction proposalId={row.id} onDelete={onDelete} />
						</DataGridCell>
					</>
				)}
				columns={columns}
				gridDataKey={(item) => item.id}
			/>

			{coverLetterText && (
				<Modal handleOutClick={() => setCoverLetterText(null)}>
					<ModalContentLayout maxWidth='600px'>
						<Box display='flex' flexDirection='column' space={3}>
							<Text heading='h6'>Cover Letter</Text>
							<Box
								style={{
									maxHeight: '70vh',
									overflowY: 'auto',
									fontSize: 14,
									lineHeight: '1.6',
								}}
							>
								<ReactMarkdown remarkPlugins={[remarkGfm]}>{coverLetterText}</ReactMarkdown>
							</Box>
						</Box>
					</ModalContentLayout>
				</Modal>
			)}

			<Snackbar
				open={toastOpen}
				autoHideDuration={2000}
				onClose={() => setToastOpen(false)}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
			>
				<Alert severity='success' onClose={() => setToastOpen(false)}>
					Job URL copied to clipboard
				</Alert>
			</Snackbar>
		</Box>
	)
}

export default ProposalTable
