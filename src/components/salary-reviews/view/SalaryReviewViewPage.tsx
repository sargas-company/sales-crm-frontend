import { useNavigate, useParams } from 'react-router-dom'
import {
	LocalOfferOutlined,
	EditOutlined,
	ArrowBackRounded,
} from '@mui/icons-material'
import { TextField } from '../../../ui'
import useTheme from '../../../theme/useTheme'
import PermissionGate from '../../auth/PermissionGate'
import {
	Field,
	FormHeader,
	FormLoading,
	FormNotFound,
	SectionHead,
} from '../../_shared/FormShell'
import {
	BackGhostButton,
	DotMini,
	EditSolidButton,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'
import { useGetSalaryReviewByIdQuery } from '../../../store/salary-reviews/salaryReviewsApi'

const RESULT_LABEL: Record<string, string> = {
	INCREASED: 'Increased',
	NO_CHANGE: 'No change',
	POSTPONED: 'Postponed',
}

const RATE_TYPE_LABEL: Record<string, string> = {
	HOURLY: 'Hourly',
	MONTHLY: 'Monthly',
}

const SalaryReviewViewPage = () => {
	const { id = '' } = useParams<{ id: string }>()
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const { data, isLoading, isError } = useGetSalaryReviewByIdQuery(id, {
		skip: !id,
	})

	if (isLoading) return <FormLoading label='Loading salary review…' />
	if (isError || !data) return <FormNotFound label='Salary review not found' />

	const employeeName = `${data.employee.firstName} ${data.employee.lastName}`
	const resultLabel = data.result ? RESULT_LABEL[data.result] : 'Pending'

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/finances/promotions'
					backLabel='Back to salary reviews'
					icon={<LocalOfferOutlined />}
					title='Salary review'
					subtitle={`Review for ${employeeName}`}
					badgeLabel='View'
					badgeTone='view'
				/>

				<Section $delay={80}>
					<SectionHead
						num='01'
						title='Employee & schedule'
						hint='Who and when'
					/>
					<FieldGrid>
						<Field label='Employee' span='full'>
							<TextField value={employeeName} disable width='100%' />
						</Field>
						<Field label='Scheduled date'>
							<TextField value={data.scheduledDate} disable width='100%' />
						</Field>
						<Field label='Result'>
							<TextField value={resultLabel} disable width='100%' />
						</Field>
					</FieldGrid>
				</Section>

				<Section $delay={140}>
					<SectionHead
						num='02'
						title='Previous rate'
						hint='What was paid before the review'
					/>
					<FieldGrid>
						<Field label='Previous rate type'>
							<TextField
								value={
									data.previousRateType
										? RATE_TYPE_LABEL[data.previousRateType]
										: '—'
								}
								disable
								width='100%'
							/>
						</Field>
						<Field label='Previous rate'>
							<TextField
								value={data.previousRate ?? '—'}
								disable
								width='100%'
							/>
						</Field>
					</FieldGrid>
				</Section>

				<Section $delay={200}>
					<SectionHead
						num='03'
						title='New rate'
						hint='Applied only when the result is Increased'
					/>
					<FieldGrid>
						<Field label='New rate type'>
							<TextField
								value={
									data.newRateType ? RATE_TYPE_LABEL[data.newRateType] : '—'
								}
								disable
								width='100%'
							/>
						</Field>
						<Field label='New rate'>
							<TextField value={data.newRate ?? '—'} disable width='100%' />
						</Field>
						<Field label='Effective date'>
							<TextField
								value={data.effectiveDate ?? '—'}
								disable
								width='100%'
							/>
						</Field>
						<Field label='Note' span='full'>
							<TextField value={data.note ?? ''} disable width='100%' />
						</Field>
					</FieldGrid>
				</Section>

				<FootBar $dark={isDark}>
					<FootLeft $dark={isDark}>
						<DotMini />
						Read-only view
					</FootLeft>
					<FootActions>
						<BackGhostButton
							type='button'
							onClick={() => navigate('/finances/promotions')}
						>
							<ArrowBackRounded style={{ fontSize: 18 }} />
							Back
						</BackGhostButton>
						<PermissionGate permission='compensation_reviews:update'>
							<EditSolidButton
								type='button'
								onClick={() => navigate(`/finances/promotions/edit/${id}`)}
							>
								<EditOutlined style={{ fontSize: 18 }} />
								Edit
							</EditSolidButton>
						</PermissionGate>
					</FootActions>
				</FootBar>
			</Surface>
		</Shell>
	)
}

export default SalaryReviewViewPage
