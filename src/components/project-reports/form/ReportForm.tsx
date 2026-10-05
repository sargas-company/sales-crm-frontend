import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AssessmentOutlined } from '@mui/icons-material'
import { TextField, Select, SelectItem } from '../../../ui'
import { useToast } from '../../../context/toast/ToastContext'
import parseServerError from '../../../utils/parseServerError'
import useTheme from '../../../theme/useTheme'
import PermissionGate from '../../auth/PermissionGate'
import { Field, FormHeader, FormLoading, FormNotFound, SectionHead } from '../../_shared/FormShell'
import {
	DotMini,
	FieldGrid,
	FootActions,
	FootBar,
	FootLeft,
	PrimaryGhostButton,
	PrimarySolidButton,
	Section,
	Shell,
	Surface,
} from '../../_shared/formShell.styled'
import {
	useGetProjectReportByIdQuery,
	useCreateProjectReportMutation,
	useUpdateProjectReportMutation,
} from '../../../store/project-reports/projectReportsApi'
import { useGetProjectsQuery } from '../../../store/projects/projectsApi'

interface Props {
	id?: string
}

interface FormFields {
	projectId: string
	employeeId: string
	reportDate: string
	hours: string
	content: string
}

const today = () => new Date().toISOString().slice(0, 10)

const empty: FormFields = {
	projectId: '',
	employeeId: '',
	reportDate: today(),
	hours: '',
	content: '',
}

interface FormErrors {
	projectId?: string
	employeeId?: string
	reportDate?: string
	hours?: string
	content?: string
}

const ReportFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<FormErrors>({})
	const [createReport, { isLoading: creating }] = useCreateProjectReportMutation()
	const [updateReport, { isLoading: updating }] = useUpdateProjectReportMutation()
	const isEdit = Boolean(id)
	const isLoading = creating || updating

	const { data: projectsPage } = useGetProjectsQuery({ page: 1, limit: 200 })
	const projects = projectsPage?.data ?? []
	const selectedProject = useMemo(
		() => projects.find((p) => p.id === fields.projectId),
		[projects, fields.projectId],
	)
	const projectMembers = selectedProject?.members ?? []

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	// When the picked project's members do not contain the currently
	// selected employee, clear it so the user re-picks a valid one.
	useEffect(() => {
		if (!fields.employeeId) return
		if (!projectMembers.some((m) => m.employeeId === fields.employeeId)) {
			setFields((prev) => ({ ...prev, employeeId: '' }))
		}
	}, [fields.projectId, projectMembers, fields.employeeId])

	const validate = (): boolean => {
		const next: FormErrors = {}
		if (!isEdit && !fields.projectId) next.projectId = 'Project is required'
		if (!isEdit && !fields.employeeId) next.employeeId = 'Employee is required'
		if (!fields.reportDate) next.reportDate = 'Report date is required'
		const hoursNum = Number(fields.hours)
		if (!fields.hours || Number.isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24)
			next.hours = 'Enter hours between 0.1 and 24'
		if (!fields.content.trim()) next.content = 'Summary is required'
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const hoursNum = Number(fields.hours)
		try {
			if (isEdit) {
				await updateReport({
					id: id!,
					body: {
						reportDate: fields.reportDate,
						hours: hoursNum,
						content: fields.content.trim(),
					},
				}).unwrap()
				showToast('Report updated', 'success')
			} else {
				await createReport({
					projectId: fields.projectId,
					employeeId: fields.employeeId,
					reportDate: fields.reportDate,
					hours: hoursNum,
					content: fields.content.trim(),
				}).unwrap()
				showToast('Report created', 'success')
			}
			navigate('/projects/reports')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/projects/reports'
					backLabel='Back to reports'
					icon={<AssessmentOutlined />}
					title={isEdit ? 'Edit report' : 'New report'}
					subtitle={
						isEdit
							? 'Update the daily work log'
							: 'Log the work done on a project for a specific day'
					}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Context' hint='Project, author and date' />
						<FieldGrid>
							<Field label='Project' required error={errors.projectId}>
								{isEdit ? (
									<TextField
										name='project'
										value={fields.projectId}
										disable
										sizes='small'
										width='100%'
									/>
								) : (
									<Select
										label='Project'
										defaultValue={fields.projectId}
										onChange={(value) => setField('projectId', value as string)}
										width='100%'
										sizes='normal'
									>
										<SelectItem label='— Pick a project —' value='' />
										{projects.map((p) => (
											<SelectItem key={p.id} label={p.name} value={p.id} />
										))}
									</Select>
								)}
							</Field>
							<Field label='Author' required error={errors.employeeId}>
								{isEdit ? (
									<TextField
										name='author'
										value={fields.employeeId}
										disable
										sizes='small'
										width='100%'
									/>
								) : (
									<Select
										label='Author'
										defaultValue={fields.employeeId}
										onChange={(value) => setField('employeeId', value as string)}
										width='100%'
										sizes='normal'
									>
										<SelectItem
											label={
												selectedProject
													? '— Pick a team member —'
													: '— Pick a project first —'
											}
											value=''
										/>
										{projectMembers.map((m) => (
											<SelectItem
												key={m.employeeId}
												label={`${m.employee.firstName} ${m.employee.lastName}`}
												value={m.employeeId}
											/>
										))}
									</Select>
								)}
							</Field>
							<Field label='Report date' required error={errors.reportDate}>
								<TextField
									name='reportDate'
									type='date'
									placeholder='YYYY-MM-DD'
									value={fields.reportDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('reportDate', e.target.value)
									}
									width='100%'
									error={!!errors.reportDate}
								/>
							</Field>
							<Field
								label='Hours worked'
								required
								error={errors.hours}
								hint='Between 0.1 and 24'
							>
								<TextField
									name='hours'
									type='number'
									placeholder='e.g. 4.5'
									value={fields.hours}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('hours', e.target.value)
									}
									width='100%'
									error={!!errors.hours}
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead
							num='02'
							title='Summary'
							hint='What was worked on, decisions made, blockers'
						/>
						<Field label='Summary' required error={errors.content}>
							<TextField
								name='content'
								placeholder='What did you work on today? Decisions made, blockers, links to PRs…'
								value={fields.content}
								onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
									setField('content', e.target.value)
								}
								width='100%'
								multiRow
								error={!!errors.content}
								style={{ minHeight: 180, resize: 'vertical' }}
							/>
						</Field>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							One report per employee per project per day
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton
								type='button'
								onClick={() => navigate('/projects/reports')}
							>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate
								permission={isEdit ? 'project_reports:update' : 'project_reports:create'}
							>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create report'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const ReportForm = ({ id }: Props) => {
	const [searchParams] = useSearchParams()
	const { data, isLoading, isError } = useGetProjectReportByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading report…' />
	if (id && (isError || !data)) return <FormNotFound label='Report not found' />

	const initial: FormFields = data
		? {
				projectId: data.projectId,
				employeeId: data.employeeId,
				reportDate: data.reportDate.slice(0, 10),
				hours: String(data.hours),
				content: data.content,
			}
		: {
				...empty,
				projectId: searchParams.get('projectId') ?? '',
			}

	return <ReportFormInner id={id} initial={initial} />
}

export default ReportForm
