import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { PeopleAltOutlined, EditOutlined } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../auth/PermissionGate'
import { Field, FormHeader, SectionHead } from '../_shared/FormShell'
import {
	DotMini,
	FootActions,
	FootBar,
	FootLeft,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import { useGetAccountByIdQuery } from '../../store/accounts/accountsApi'
import { formatDate } from '../../utils/format'

const fullName = (first: string, last: string) => `${first} ${last}`.trim() || '—'

const personInitials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const AccountViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const {
		data: account,
		isLoading,
		isError,
	} = useGetAccountByIdQuery(id, {
		skip: !id,
	})

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<Loading label='Loading account…' />
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	if (isError || !account) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<ErrorState
							title='Account not available'
							description='Could not load account.'
							action={
								<Button onClick={() => navigate('/accounts/list/')}>Back to list</Button>
							}
						/>
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	const name = fullName(account.firstName, account.lastName)
	const platformName = account.platform?.title ?? '—'

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/accounts/list/'
					backLabel='Back to accounts'
					icon={<PeopleAltOutlined />}
					title={name}
					subtitle={`ID: ${account.id} · created ${formatDate(account.createdAt, 'short')}`}
					badgeLabel='Account'
					badgeTone='edit'
				/>

				<Section $delay={80}>
					<SectionHead
						num='01'
						title='Identity'
						hint='Read-only view. Use the edit action to change name or platform link.'
					/>
					<IdentityGrid>
						<Field label='First name'>
							<TextField
								name='acc-first-name'
								value={account.firstName}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Last name'>
							<TextField
								name='acc-last-name'
								value={account.lastName}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Platform'>
							<TextField
								name='acc-platform'
								value={platformName}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Initials'>
							<TextField
								name='acc-initials'
								value={personInitials(account.firstName, account.lastName)}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</IdentityGrid>
				</Section>

				<Section $delay={140}>
					<SectionHead
						num='02'
						title='Timestamps'
						hint='When this record was created and last modified.'
					/>
					<IdentityGrid>
						<Field label='Created at'>
							<TextField
								name='acc-created'
								value={formatDate(account.createdAt, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Updated at'>
							<TextField
								name='acc-updated'
								value={formatDate(account.updatedAt, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</IdentityGrid>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing account in read-only mode.
					</FootLeft>
					<FootActions>
						<Button
							varient='outlined'
							color='rgba(3, 105, 161, 1)'
							type='button'
							onClick={() => navigate('/accounts/list/')}
						>
							Back to list
						</Button>
						<PermissionGate permission='accounts:update'>
							<PrimarySolidButton
								type='button'
								onClick={() => navigate(`/accounts/edit/${account.id}`)}
							>
								<EditOutlined />
								Edit account
							</PrimarySolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default AccountViewPage

const CenteredState = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const IdentityGrid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`
