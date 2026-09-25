import { FormEvent, ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'
import { TextField, Button, Toggle, Select, SelectItem } from '../../../ui'
import {
	useCreateProposalMutation,
	useUpdateProposalMutation,
	useGetProposalByIdQuery,
} from '../../../store/proposals/proposalsApi'
import { useGetAccountsQuery } from '../../../store/accounts/accountsApi'
import { useGetPlatformsQuery } from '../../../store/platforms/platformsApi'
import { useToast } from '../../../context/toast/ToastContext'
import useProposalForm from '../add/useProposalForm'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import type { ProposalItem } from '../../../store/proposals/types/definition'
import {
	Field,
	FormHeader,
	FormLoading,
	SectionHead,
} from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FieldStack,
	FootActions,
	FootBar,
	FootLeft,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'

interface ProposalFormProps {
	mode: 'create' | 'edit'
	id?: string
}

const toFormValues = (data: ProposalItem) => ({
	title: data.title,
	accountId: data.accountId,
	platformId: data.platformId,
	proposalType: data.proposalType,
	status: data.status,
	jobUrl: data.jobUrl ?? '',
	boosted: data.boosted,
	connects: String(data.connects),
	boostedConnects: String(data.boostedConnects),
	coverLetter: data.coverLetter,
	vacancy: data.vacancy ?? '',
})

const DocIcon = () => (
	<svg width='22' height='22' viewBox='0 0 24 24' fill='none'>
		<path
			d='M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
		<path
			d='M14 3v5h5M9 13h6M9 17h4'
			stroke='currentColor'
			strokeWidth='1.8'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
)

const ProposalFormInner = ({
	mode,
	id,
	initialData,
}: ProposalFormProps & { initialData?: ProposalItem }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'

	const { fields, errors, setField, runValidation, getPayload } = useProposalForm(
		initialData ? toFormValues(initialData) : undefined
	)

	const { data: accounts = [], isLoading: accountsLoading } = useGetAccountsQuery()
	const { data: platforms = [], isLoading: platformsLoading } = useGetPlatformsQuery()

	const [createProposal, { isLoading: isCreating }] = useCreateProposalMutation()
	const [updateProposal, { isLoading: isUpdating }] = useUpdateProposalMutation()
	const isLoading = isCreating || isUpdating

	const handleAccountChange = (accountId: string) => {
		setField('accountId', accountId)
		const account = accounts.find((a) => a.id === accountId)
		if (account) setField('platformId', account.platformId)
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!runValidation()) return
		try {
			if (mode === 'edit' && id) {
				await updateProposal({ id, body: getPayload() }).unwrap()
				showToast('Proposal updated successfully', 'success')
			} else {
				const { status: _omit, ...createPayload } = getPayload()
				await createProposal(createPayload).unwrap()
				showToast('Proposal created successfully', 'success')
			}
			navigate('/proposal/list')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/proposal/list'
					backLabel='Back to proposals'
					icon={<DocIcon />}
					title={mode === 'edit' ? 'Edit proposal' : 'New proposal'}
					subtitle={
						mode === 'edit'
							? 'Update the proposal details below'
							: 'Fill in the details to create a new proposal'
					}
					badgeLabel={mode === 'edit' ? 'Editing' : 'Draft'}
					badgeTone={mode === 'edit' ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead
							num='01'
							title='Title'
							hint='A short, descriptive summary of what this proposal is about'
						/>
						<Field label='Proposal title' required error={errors.title}>
							<TextField
								name='title'
								placeholder='e.g. React developer for SaaS product'
								value={fields.title}
								onChange={(e) => setField('title', e.target.value)}
								error={!!errors.title}
								width='100%'
							/>
						</Field>
					</Section>

					<Section $delay={160}>
						<SectionHead
							num='02'
							title='Main details'
							hint='Who is applying and from which platform'
						/>
						<FieldGrid>
							<Field label='Developer account' required error={errors.accountId}>
								<Select
									label={accountsLoading ? 'Loading…' : 'Select account'}
									defaultValue={fields.accountId}
									onChange={(value) => handleAccountChange(value as string)}
									width='100%'
									sizes='normal'
								>
									{accounts.map((acc) => (
										<SelectItem
											key={acc.id}
											label={`${acc.firstName} ${acc.lastName} (${acc.platform.title})`}
											value={acc.id}
											icon={acc.platform.imageUrl ?? undefined}
										/>
									))}
								</Select>
							</Field>

							<Field label='Platform'>
								<Select
									label={platformsLoading ? 'Loading…' : 'Select platform'}
									defaultValue={fields.platformId}
									onChange={(value) => setField('platformId', value as string)}
									width='100%'
									sizes='normal'
								>
									{platforms.map((p) => (
										<SelectItem key={p.id} label={p.title} value={p.id} />
									))}
								</Select>
							</Field>

							<Field label='Proposal type' required error={errors.proposalType}>
								<Select
									label='Select type'
									defaultValue={fields.proposalType}
									onChange={(value) => {
										setField('proposalType', value as any)
										if (value !== 'Bid') {
											setField('boosted', false)
											setField('boostedConnects', '0')
										}
									}}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Bid' value='Bid' />
									<SelectItem label='Invite' value='Invite' />
									<SelectItem label='Direct Message' value='DirectMessage' />
								</Select>
							</Field>

							{mode === 'edit' && (
								<Field label='Status'>
									<Select
										label='Select status'
										defaultValue={fields.status}
										onChange={(value) => setField('status', value as any)}
										width='100%'
										sizes='normal'
									>
										<SelectItem label='Draft' value='Draft' />
										<SelectItem label='Sent' value='Sent' />
										<SelectItem label='Viewed' value='Viewed' />
										<SelectItem label='Replied' value='Replied' />
									</Select>
								</Field>
							)}
						</FieldGrid>
					</Section>

					<Section $delay={240}>
						<SectionHead
							num='03'
							title='Job details'
							hint='Where this proposal is going and how it will be delivered'
						/>
						<FieldGrid>
							<Field
								label='Job URL'
								error={errors.jobUrl}
								span={fields.proposalType === 'Bid' ? 'two-thirds' : 'full'}
							>
								<TextField
									name='jobUrl'
									placeholder='https://www.upwork.com/jobs/~...'
									value={fields.jobUrl}
									onChange={(e) => setField('jobUrl', e.target.value)}
									width='100%'
									error={!!errors.jobUrl}
								/>
							</Field>

							{fields.proposalType === 'Bid' && (
								<>
									<Field label='Connects' span='third'>
										<TextField
											name='connects'
											type='number'
											value={fields.connects}
											onChange={(e) => setField('connects', e.target.value)}
											width='100%'
											minValue={0}
										/>
									</Field>

									<BoostPanel $dark={isDark} $active={fields.boosted}>
										<BoostLeft>
											<BoostIcon $active={fields.boosted}>
												<svg width='18' height='18' viewBox='0 0 24 24' fill='none'>
													<path
														d='M13 2L4.5 13.5H11L11 22L19.5 10.5H13L13 2z'
														fill='currentColor'
													/>
												</svg>
											</BoostIcon>
											<BoostText>
												<Toggle
													toggled={fields.boosted}
													onToggle={() => setField('boosted', !fields.boosted)}
													label='Boosted proposal'
												/>
												<BoostHint $dark={isDark}>
													Spend extra connects to place this proposal higher in the client&apos;s
													queue
												</BoostHint>
											</BoostText>
										</BoostLeft>
										{fields.boosted && (
											<BoostConnects>
												<TextField
													name='boostedConnects'
													label='Boosted connects'
													type='number'
													value={fields.boostedConnects}
													onChange={(e) => setField('boostedConnects', e.target.value)}
													width='100%'
													minValue={0}
												/>
											</BoostConnects>
										)}
									</BoostPanel>
								</>
							)}
						</FieldGrid>
					</Section>

					<Section $delay={320}>
						<SectionHead
							num='04'
							title='Content'
							hint='The job description you are responding to, and your reply'
						/>
						<FieldStack>
							<Field label='Vacancy description'>
								<TextField
									name='vacancy'
									placeholder='Paste the job description from the platform…'
									value={fields.vacancy}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('vacancy', e.target.value)
									}
									multiRow
									width='100%'
									style={{ minHeight: 120, resize: 'vertical' }}
								/>
							</Field>

							<Field label='Cover letter' hint={`${fields.coverLetter.length} characters`}>
								<TextField
									name='coverLetter'
									placeholder='Write your cover letter…'
									value={fields.coverLetter}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('coverLetter', e.target.value)
									}
									multiRow
									width='100%'
									style={{ minHeight: 180, resize: 'vertical' }}
								/>
							</Field>
						</FieldStack>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{mode === 'edit'
								? 'Changes are saved when you press Save'
								: 'Proposal will be created as a draft'}
						</FootLeft>
						<FootActions>
							<Button
								varient='outlined'
								color='info'
								type='button'
								onClick={() => navigate('/proposal/list')}
							>
								Cancel
							</Button>
							<Button type='submit' disabled={isLoading}>
								{isLoading
									? mode === 'edit'
										? 'Saving…'
										: 'Creating…'
									: mode === 'edit'
										? 'Save changes'
										: 'Create proposal'}
							</Button>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const ProposalForm = ({ mode, id }: ProposalFormProps) => {
	const { data, isLoading } = useGetProposalByIdQuery(id!, { skip: mode !== 'edit' || !id })

	if (mode === 'edit' && isLoading) return <FormLoading label='Loading proposal…' />

	return <ProposalFormInner mode={mode} id={id} initialData={data} />
}

export default ProposalForm

/* ── Local Boost panel styles ───────────────────────────────────────────── */

const BoostPanel = styled.div<{ $dark: boolean; $active: boolean }>`
	grid-column: span 12;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 14px 16px;
	border-radius: 12px;
	background: ${({ $dark, $active }) =>
		$active
			? $dark
				? 'rgba(245, 158, 11, 0.08)'
				: '#fffaf0'
			: $dark
				? 'rgba(255, 255, 255, 0.03)'
				: '#faf9fd'};
	border: 1px solid
		${({ $dark, $active }) =>
			$active
				? $dark
					? 'rgba(245, 158, 11, 0.25)'
					: '#ffe6b8'
				: $dark
					? '#323a48'
					: '#ecebf5'};
	transition: all 220ms ease;

	@media (max-width: 640px) {
		flex-direction: column;
		align-items: stretch;
	}
`

const BoostLeft = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex: 1;
	min-width: 0;
`

const BoostIcon = styled.div<{ $active: boolean }>`
	width: 32px;
	height: 32px;
	border-radius: 8px;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: ${({ $active }) =>
		$active ? '#f59e0b' : 'rgba(148, 148, 172, 0.15)'};
	color: ${({ $active }) => ($active ? '#ffffff' : '#8a85a3')};
	transition: all 220ms ease;

	${({ $active }) =>
		$active &&
		css`
			box-shadow: 0 6px 16px -6px #f59e0b;
		`}
`

const BoostText = styled.div`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const BoostHint = styled.span<{ $dark: boolean }>`
	font-size: 11px;
	color: ${({ $dark }) => ($dark ? '#8f96a8' : '#8a85a3')};
`

const BoostConnects = styled.div`
	width: 160px;
	flex-shrink: 0;

	@media (max-width: 640px) {
		width: 100%;
	}
`
