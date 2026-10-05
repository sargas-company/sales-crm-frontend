import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
	AddRounded,
	AppsRounded,
	ClearRounded,
	DeleteOutline,
	EditOutlined,
	SearchOutlined,
	VisibilityOutlined,
} from '@mui/icons-material'
import { ListPageShell } from '../../components/_shared/ListPageShell'
import {
	Actions,
	DataTable,
	IconAction,
	TableSkeleton,
	type DataTableColumn,
} from '../../components/_shared/DataTable'
import { T } from '../../components/sales-analytics/_shared/tokens'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { PrimarySolidButton } from '../../components/_shared/formShell.styled'
import PermissionGate from '../../components/auth/PermissionGate'
import { useToast } from '../../context/toast/ToastContext'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import parseServerError from '../../utils/parseServerError'
import {
	ClearBtn,
	FreshFiltersWrap,
	SearchPill,
} from '../../components/_shared/filters/freshPaperFilters'
import {
	useListPhoneServicesQuery,
	useRemovePhoneServiceMutation,
	type PhoneService,
} from '../../store/phone-numbers/phoneServicesApi'

const PhoneServicesPage = () => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const [searchInput, setSearchInput] = useState('')
	const search = useDebouncedValue(searchInput.trim(), 300)
	const { data, isLoading, isError, refetch } = useListPhoneServicesQuery({
		q: search || undefined,
	})

	const [removing, setRemoving] = useState<PhoneService | null>(null)
	const [removeMut, { isLoading: isRemoving }] = useRemovePhoneServiceMutation()

	const rows = data ?? []

	const columns = useMemo<DataTableColumn<PhoneService>[]>(
		() => [
			{
				key: 'name',
				label: 'Service',
				minWidth: 160,
				render: (r) => <Strong>{r.name}</Strong>,
				skeleton: () => <TableSkeleton $w='120px' $h='14px' />,
			},
			{
				key: 'slug',
				label: 'Slug',
				minWidth: 140,
				render: (r) => <Mono>{r.slug}</Mono>,
				skeleton: () => <TableSkeleton $w='100px' $h='14px' />,
			},
			{
				key: 'bindings',
				label: 'Bindings',
				minWidth: 100,
				render: (r) => (
					<CountPill $muted={r.bindingsCount === 0}>
						{r.bindingsCount}
					</CountPill>
				),
				skeleton: () => <TableSkeleton $w='30px' $h='18px' />,
			},
			{
				key: 'updated',
				label: 'Updated',
				minWidth: 120,
				render: (r) => (
					<DateCell>
						{new Date(r.updatedAt).toLocaleDateString()}
					</DateCell>
				),
				skeleton: () => <TableSkeleton $w='90px' $h='15px' />,
			},
			{
				key: 'actions',
				label: 'Actions',
				render: (r) => (
					<Actions>
						<IconAction
							type='button'
							aria-label='View service'
							onClick={() =>
								navigate(`/phone-numbers/services/${r.id}`)
							}
						>
							<VisibilityOutlined />
						</IconAction>
						<PermissionGate permission='phone_numbers:update'>
							<IconAction
								type='button'
								aria-label='Edit service'
								onClick={() =>
									navigate(`/phone-numbers/services/${r.id}/edit`)
								}
							>
								<EditOutlined />
							</IconAction>
							<IconAction
								type='button'
								aria-label='Remove service'
								$danger
								onClick={() => setRemoving(r)}
							>
								<DeleteOutline />
							</IconAction>
						</PermissionGate>
					</Actions>
				),
			},
		],
		[navigate],
	)

	return (
		<ListPageShell
			crumbs={[
				{ label: 'Operations' },
				{ label: 'Phone Numbers' },
				{ label: 'Services', current: true },
			]}
			icon={<AppsRounded />}
			title='Phone services'
			subtitle='Catalogue of services phone numbers can be assigned to. Shared by every SIM in the system.'
			action={
				<PermissionGate permission='phone_numbers:update'>
					<PrimarySolidButton
						type='button'
						onClick={() => navigate('/phone-numbers/services/new')}
					>
						<AddRounded />
						New service
					</PrimarySolidButton>
				</PermissionGate>
			}
			filters={
				<FreshFiltersWrap role='region' aria-label='Services filters'>
					<SearchPill>
						<SearchOutlined className='ico' />
						<input
							type='text'
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							placeholder='Search name or slug'
							aria-label='Search'
						/>
					</SearchPill>
					<div className='filter-spacer' />
					<ClearBtn
						type='button'
						onClick={() => setSearchInput('')}
						disabled={!searchInput}
					>
						<ClearRounded style={{ fontSize: 15 }} />
						Clear
					</ClearBtn>
				</FreshFiltersWrap>
			}
		>
			<DataTable
				columns={columns}
				rows={rows}
				rowKey={(r) => r.id}
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				emptyTitle='No services yet'
				emptyTitleSearch='Nothing matches your search'
				searchActive={!!search}
				pagination={{
					page: 1,
					pageSize: rows.length || 1,
					total: rows.length,
					onPageChange: () => {},
				}}
			/>

			{removing && (
				<ConfirmModal
					icon={<DeleteOutline />}
					iconTone='danger'
					confirmColor='error'
					title='Remove service?'
					description={
						<>
							This will delete <strong>{removing.name}</strong>. Any phone
							assignments still using it will block the delete.
						</>
					}
					confirmLabel='Remove'
					confirmLoadingLabel='Removing…'
					cancelLabel='Cancel'
					isLoading={isRemoving}
					onConfirm={async () => {
						try {
							await removeMut(removing.id).unwrap()
							showToast('Service removed', 'success')
							setRemoving(null)
						} catch (err) {
							showToast(parseServerError(err), 'error')
						}
					}}
					onClose={() => {
						if (!isRemoving) setRemoving(null)
					}}
				/>
			)}
		</ListPageShell>
	)
}

export default PhoneServicesPage

const Strong = styled.strong`
	font-size: 13.5px;
	font-weight: 700;
	color: ${T.textStrong};
`
const Mono = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 12px;
	color: ${T.textMuted};
`
const Muted = styled.span`
	color: ${T.textMuted};
	font-size: 12px;
`
const DateCell = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 13.5px;
	color: ${T.textStrong};
	font-weight: 600;
	letter-spacing: 0.3px;
	white-space: nowrap;
`
const CountPill = styled.span<{ $muted?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 28px;
	padding: 2px 10px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11.5px;
	font-weight: 700;
	background: ${(p) =>
		p.$muted ? 'rgba(100, 116, 139, 0.1)' : 'rgba(3, 105, 161, 0.1)'};
	color: ${(p) => (p.$muted ? '#64748b' : '#0369a1')};
`
