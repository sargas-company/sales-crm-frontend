import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { HandshakeOutlined, EditOutlined } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
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
import { useGetCounterpartyByIdQuery } from '../../store/counterparties/counterpartiesApi'
import { formatDate } from '../../utils/format'

const fullName = (first: string, last: string) => `${first} ${last}`.trim() || '—'

const personInitials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const CounterpartyViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const {
		data: counterparty,
		isLoading,
		isError,
	} = useGetCounterpartyByIdQuery(id, {
		skip: !id,
	})

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<Loading label='Loading counterparty…' />
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	if (isError || !counterparty) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<CenteredState>
						<ErrorState
							title='Counterparty not available'
							description='Could not load counterparty.'
							action={
								<Button onClick={() => navigate('/counterparties/list/')}>
									Back to list
								</Button>
							}
						/>
					</CenteredState>
				</Surface>
			</Shell>
		)
	}

	const name = fullName(counterparty.firstName, counterparty.lastName)
	const badgeLabel = counterparty.type === 'client' ? 'Client' : 'Contractor'
	const badgeTone = counterparty.type === 'client' ? 'edit' : 'new'

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/counterparties/list/'
					backLabel='Back to counterparties'
					icon={<HandshakeOutlined />}
					title={name}
					subtitle={`ID: ${counterparty.id} · created ${formatDate(counterparty.createdAt, 'short')}`}
					badgeLabel={badgeLabel}
					badgeTone={badgeTone}
				/>

				<Section $delay={80}>
					<SectionHead
						num='01'
						title='Identity'
						hint='Read-only view. Use the edit action to change name or type.'
					/>
					<IdentityGrid>
						<Field label='First name'>
							<TextField
								name='cp-first-name'
								value={counterparty.firstName}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Last name'>
							<TextField
								name='cp-last-name'
								value={counterparty.lastName}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Type' hint='Client — pays invoices. Contractor — bills you.'>
							<TextField
								name='cp-type'
								value={badgeLabel}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Initials'>
							<TextField
								name='cp-initials'
								value={personInitials(counterparty.firstName, counterparty.lastName)}
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
						title='Details'
						hint='Free-form notes attached to this counterparty (address, tax info, contacts).'
					/>
					<Field label='Info'>
						<TextField
							name='cp-info'
							value={counterparty.info ?? ''}
							disable
							multiRow
							sizes='small'
							width='100%'
							style={{
								minHeight: 80,
								resize: 'none',
								fieldSizing: 'content',
							}}
						/>
					</Field>
				</Section>

				<Section $delay={200}>
					<SectionHead
						num='03'
						title='Timestamps'
						hint='When this record was created and last modified.'
					/>
					<IdentityGrid>
						<Field label='Created at'>
							<TextField
								name='cp-created'
								value={formatDate(counterparty.createdAt, 'short')}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Updated at'>
							<TextField
								name='cp-updated'
								value={formatDate(counterparty.updatedAt, 'short')}
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
						Viewing counterparty in read-only mode.
					</FootLeft>
					<FootActions>
						<Button
							varient='outlined'
							color='rgba(3, 105, 161, 1)'
							type='button'
							onClick={() => navigate('/counterparties/list/')}
						>
							Back to list
						</Button>
						<PrimarySolidButton
							type='button'
							onClick={() => navigate(`/counterparties/edit/${counterparty.id}`)}
						>
							<EditOutlined />
							Edit counterparty
						</PrimarySolidButton>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default CounterpartyViewPage

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
