import { useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { GroupsOutlined, EditOutlined, ArrowBackRounded } from '@mui/icons-material'
import { TextField, Button } from '../../ui'
import Loading from '../../ui/state/Loading'
import ErrorState from '../../ui/state/ErrorState'
import useTheme from '../../theme/useTheme'
import PermissionGate from '../auth/PermissionGate'
import { Field, FormHeader, SectionHead } from '../_shared/FormShell'
import {
	BackGhostButton,
	DotMini,
	EditSolidButton,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../_shared/formShell.styled'
import { useGetEmployeeByIdQuery } from '../../store/employees/employeesApi'
import { formatDate } from '../../utils/format'
import { T } from '../sales-analytics/_shared/tokens'

const fullName = (first: string, last: string) => `${first} ${last}`.trim() || '—'

const EmployeeViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { data: employee, isLoading, isError } = useGetEmployeeByIdQuery(id, { skip: !id })

	if (isLoading) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<Loading label='Loading employee…' />
					</Center>
				</Surface>
			</Shell>
		)
	}

	if (isError || !employee) {
		return (
			<Shell $dark={isDark}>
				<Surface $dark={isDark}>
					<Center>
						<ErrorState
							title='Employee not available'
							description='Could not load employee.'
							action={<Button onClick={() => navigate('/employees/list')}>Back to list</Button>}
						/>
					</Center>
				</Surface>
			</Shell>
		)
	}

	const name = fullName(employee.firstName, employee.lastName)

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/employees/list'
					backLabel='Back to employees'
					icon={<GroupsOutlined />}
					title={name}
					subtitle={`${employee.email} · created ${formatDate(employee.createdAt, 'short')}`}
					badgeLabel={employee.status === 'active' ? 'Active' : 'Inactive'}
					badgeTone={employee.status === 'active' ? 'new' : 'draft'}
				/>

				<Section $delay={80}>
					<SectionHead num='01' title='Identity' hint='Contact details' />
					<Grid>
						<Field label='First name'>
							<TextField name='fn' value={employee.firstName} disable sizes='small' width='100%' />
						</Field>
						<Field label='Last name'>
							<TextField name='ln' value={employee.lastName} disable sizes='small' width='100%' />
						</Field>
						<Field label='Email'>
							<TextField name='em' value={employee.email} disable sizes='small' width='100%' />
						</Field>
						<Field label='Phone'>
							<TextField name='ph' value={employee.phone ?? '—'} disable sizes='small' width='100%' />
						</Field>
					</Grid>
				</Section>

				<Section $delay={140}>
					<SectionHead num='02' title='Team profile' hint='Roles and hiring info' />
					<TagsBlock>
						<TagsLabel>Positions</TagsLabel>
						{employee.positions.length > 0 ? (
							<Tags>
								{employee.positions.map((p) => (
									<Tag key={p}>{p}</Tag>
								))}
							</Tags>
						) : (
							<TagsEmpty>—</TagsEmpty>
						)}
					</TagsBlock>
					<Grid>
						<Field label='Status'>
							<TextField
								name='st'
								value={employee.status === 'active' ? 'Active' : 'Inactive'}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Hired at'>
							<TextField
								name='hi'
								value={employee.hiredAt ? formatDate(employee.hiredAt, 'short') : '—'}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
						<Field label='Linked user' span='full'>
							<TextField
								name='us'
								value={
									employee.user
										? `${employee.user.firstName} ${employee.user.lastName} (${employee.user.email})`
										: '—'
								}
								disable
								sizes='small'
								width='100%'
							/>
						</Field>
					</Grid>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Viewing employee in read-only mode.
					</FootLeft>
					<FootActions>
						<BackGhostButton type='button' onClick={() => navigate('/employees/list')}>
							<ArrowBackRounded />
							Back to list
						</BackGhostButton>
						<PermissionGate permission='employees:update'>
							<EditSolidButton
								type='button'
								onClick={() => navigate(`/employees/edit/${employee.id}`)}
							>
								<EditOutlined />
								Edit employee
							</EditSolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default EmployeeViewPage

const Center = styled.div`
	padding: 96px 32px;
	display: flex;
	align-items: center;
	justify-content: center;
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 22px 20px;
	@media (max-width: 720px) {
		grid-template-columns: 1fr;
	}
`

const TagsBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin-bottom: 20px;
`

const TagsLabel = styled.div`
	font-size: 12px;
	font-weight: 700;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.4px;
`

const Tags = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 8px;
	align-items: center;
`

const Tag = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 4px 10px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 600;
	background: ${T.primaryTint};
	color: ${T.primary};
	border: 1px solid #d5e5f3;
`

const TagsEmpty = styled.span`
	font-size: 13px;
	color: ${T.textSecondary};
`
