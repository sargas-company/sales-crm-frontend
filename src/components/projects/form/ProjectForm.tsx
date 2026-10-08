import { ChangeEvent, FormEvent, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { FolderOutlined, CloseRounded, AddRounded } from '@mui/icons-material'
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
import { T } from '../../sales-analytics/_shared/tokens'
import {
	useGetProjectByIdQuery,
	useCreateProjectMutation,
	useUpdateProjectMutation,
	type ProjectStatus,
} from '../../../store/projects/projectsApi'
import { useGetCounterpartiesQuery } from '../../../store/counterparties/counterpartiesApi'
import { useGetEmployeesQuery } from '../../../store/employees/employeesApi'

interface Props {
	id?: string
}

interface FormFields {
	name: string
	clientId: string
	status: ProjectStatus
	description: string
	startDate: string
	endDate: string
	memberIds: string[]
	discordChannelId: string
}

const initials = (first: string, last: string): string => {
	const a = (first?.[0] ?? '').toUpperCase()
	const b = (last?.[0] ?? '').toUpperCase()
	return (a + b || '?').slice(0, 2)
}

const empty: FormFields = {
	name: '',
	clientId: '',
	status: 'planned',
	description: '',
	startDate: '',
	endDate: '',
	memberIds: [],
	discordChannelId: '',
}

const ProjectFormInner = ({ id, initial }: { id?: string; initial: FormFields }) => {
	const navigate = useNavigate()
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const [fields, setFields] = useState<FormFields>(initial)
	const [errors, setErrors] = useState<{
		name?: string
		clientId?: string
		endDate?: string
	}>({})
	const [createProject, { isLoading: creating }] = useCreateProjectMutation()
	const [updateProject, { isLoading: updating }] = useUpdateProjectMutation()
	const isLoading = creating || updating
	const isEdit = Boolean(id)

	const { data: counterpartiesPage, isLoading: clientsLoading } =
		useGetCounterpartiesQuery({
			page: 1,
			limit: 200,
			type: 'client',
			sortBy: 'firstName',
			sortDirection: 'asc',
		})
	const { data: employeesPage } = useGetEmployeesQuery({
		page: 1,
		limit: 500,
		status: 'active',
	})
	const clientOptions = useMemo(
		() => counterpartiesPage?.data ?? [],
		[counterpartiesPage],
	)
	const hasNoClients = !clientsLoading && clientOptions.length === 0
	const employees = employeesPage?.data ?? []

	// Employees currently animating out of one column before moving to
	// the other. Prevents duplicate clicks and lets the chip finish its
	// exit keyframe before React actually unmounts / moves it.
	const [leavingIds, setLeavingIds] = useState<Set<string>>(new Set())
	const TOGGLE_ANIM_MS = 220
	const FLIP_MS = 320

	// FLIP animation refs — track every chip's DOM node + its position
	// on the previous render. After each layout, staying chips are
	// briefly translated back to their old spot, then released with a
	// transition so they *slide* into the new position instead of
	// snapping when other chips are added or removed. The same trick
	// is applied to the section wrapper's min-height so the form
	// below no longer twitches when the two lists trade a chip.
	const chipRefs = useRef<Map<string, HTMLElement>>(new Map())
	const previousPositions = useRef<Map<string, DOMRect>>(new Map())
	const teamContentRef = useRef<HTMLDivElement>(null)
	const previousTeamHeight = useRef<number | null>(null)

	const setChipRef = (id: string) => (el: HTMLElement | null) => {
		if (el) chipRefs.current.set(id, el)
		else chipRefs.current.delete(id)
	}

	useLayoutEffect(() => {
		const nodes = chipRefs.current
		const previous = previousPositions.current
		const nextPositions = new Map<string, DOMRect>()

		nodes.forEach((el, id) => {
			nextPositions.set(id, el.getBoundingClientRect())
		})

		nodes.forEach((el, id) => {
			const oldRect = previous.get(id)
			const newRect = nextPositions.get(id)
			if (!oldRect || !newRect) return
			const dx = oldRect.left - newRect.left
			const dy = oldRect.top - newRect.top
			if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return

			// Invert to the old position instantly, no transition.
			el.style.transition = 'none'
			el.style.transform = `translate(${dx}px, ${dy}px)`

			// Play to the new position on the next frame with a
			// smooth spring-y easing. transitionend cleans up inline
			// styles so hover/lift transitions can take over again.
			requestAnimationFrame(() => {
				el.style.transition = `transform ${FLIP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
				el.style.transform = ''
				const done = (ev: TransitionEvent) => {
					if (ev.propertyName !== 'transform') return
					el.style.transition = ''
					el.removeEventListener('transitionend', done)
				}
				el.addEventListener('transitionend', done)
			})
		})

		previousPositions.current = nextPositions

		// Same FLIP idea but on the wrapper's min-height — stops the
		// whole form from jumping when a chip moves between lists.
		const wrap = teamContentRef.current
		if (wrap) {
			const newHeight = wrap.offsetHeight
			const oldHeight = previousTeamHeight.current
			if (oldHeight !== null && oldHeight !== newHeight) {
				wrap.style.transition = 'none'
				wrap.style.minHeight = `${oldHeight}px`
				requestAnimationFrame(() => {
					wrap.style.transition = `min-height ${FLIP_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
					wrap.style.minHeight = `${newHeight}px`
					const done = (ev: TransitionEvent) => {
						if (ev.propertyName !== 'min-height') return
						wrap.style.minHeight = ''
						wrap.style.transition = ''
						wrap.removeEventListener('transitionend', done)
					}
					wrap.addEventListener('transitionend', done)
				})
			}
			previousTeamHeight.current = newHeight
		}
	})

	const setField = <K extends keyof FormFields>(key: K, value: FormFields[K]) => {
		setFields((prev) => ({ ...prev, [key]: value }))
		if ((errors as Record<string, unknown>)[key])
			setErrors((prev) => ({ ...prev, [key]: undefined }))
	}

	const toggleMember = (empId: string) => {
		if (leavingIds.has(empId)) return
		setLeavingIds((prev) => {
			const next = new Set(prev)
			next.add(empId)
			return next
		})
		window.setTimeout(() => {
			setFields((prev) => {
				const has = prev.memberIds.includes(empId)
				return {
					...prev,
					memberIds: has
						? prev.memberIds.filter((x) => x !== empId)
						: [...prev.memberIds, empId],
				}
			})
			setLeavingIds((prev) => {
				const next = new Set(prev)
				next.delete(empId)
				return next
			})
		}, TOGGLE_ANIM_MS)
	}

	const validate = (): boolean => {
		const next: { name?: string; clientId?: string; endDate?: string } = {}
		if (!fields.name.trim()) next.name = 'Name is required'
		if (!fields.clientId) next.clientId = 'Client is required'
		if (
			fields.startDate &&
			fields.endDate &&
			fields.endDate < fields.startDate
		) {
			next.endDate = 'End date must be on or after start date'
		}
		setErrors(next)
		return Object.keys(next).length === 0
	}

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault()
		if (!validate()) return
		const payload = {
			name: fields.name.trim(),
			clientId: fields.clientId,
			status: fields.status,
			description: fields.description || undefined,
			startDate: fields.startDate || undefined,
			endDate: fields.endDate || undefined,
			memberIds: fields.memberIds,
			discordChannelId: fields.discordChannelId.trim() || null,
		}
		try {
			if (isEdit) {
				await updateProject({ id: id!, body: payload }).unwrap()
				showToast('Project updated', 'success')
			} else {
				await createProject(payload).unwrap()
				showToast('Project created', 'success')
			}
			navigate('/projects/list')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const selectedEmployees = useMemo(
		() => employees.filter((e) => fields.memberIds.includes(e.id)),
		[employees, fields.memberIds],
	)

	return (
		<Shell $dark={isDark}>
			<Surface $dark={isDark}>
				<FormHeader
					backTo='/projects/list'
					backLabel='Back to projects'
					icon={<FolderOutlined />}
					title={isEdit ? 'Edit project' : 'New project'}
					subtitle={isEdit ? 'Update project details' : 'Create a new client engagement'}
					badgeLabel={isEdit ? 'Edit' : 'Draft'}
					badgeTone={isEdit ? 'edit' : 'draft'}
				/>

				<form onSubmit={handleSubmit} noValidate>
					<Section $delay={80}>
						<SectionHead num='01' title='Overview' hint='Name, client and status' />
						<FieldGrid>
							<Field label='Name' required error={errors.name} span='full'>
								<TextField
									name='name'
									placeholder='e.g. Payments Dashboard v2'
									value={fields.name}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('name', e.target.value)
									}
									width='100%'
									error={!!errors.name}
								/>
							</Field>
							<Field
								label='Client'
								required
								error={errors.clientId}
								hint={
									hasNoClients
										? 'No client-type counterparties yet — add one in Counterparties first.'
										: undefined
								}
							>
								<Select
									label='Client'
									defaultValue={fields.clientId}
									onChange={(value) => setField('clientId', value as string)}
									width='100%'
									sizes='normal'
								>
									{clientOptions.length === 0 ? (
										<SelectItem
											label={clientsLoading ? 'Loading clients…' : 'No clients available'}
											value=''
										/>
									) : (
										clientOptions.map((c) => {
											const name = `${c.firstName} ${c.lastName}`.trim()
											return (
												<SelectItem
													key={c.id}
													label={c.company ? `${name || c.id} — ${c.company}` : name || c.id}
													value={c.id}
												/>
											)
										})
									)}
								</Select>
							</Field>
							<Field label='Status'>
								<Select
									label='Status'
									defaultValue={fields.status}
									onChange={(value) => setField('status', value as ProjectStatus)}
									width='100%'
									sizes='normal'
								>
									<SelectItem label='Planned' value='planned' />
									<SelectItem label='Active' value='active' />
									<SelectItem label='Paused' value='paused' />
									<SelectItem label='Completed' value='completed' />
									<SelectItem label='Archived' value='archived' />
								</Select>
							</Field>
							<Field label='Start date'>
								<TextField
									name='startDate'
									type='date'
									placeholder='YYYY-MM-DD'
									value={fields.startDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('startDate', e.target.value)
									}
									width='100%'
								/>
							</Field>
							<Field label='End date' error={errors.endDate}>
								<TextField
									name='endDate'
									type='date'
									placeholder='YYYY-MM-DD'
									value={fields.endDate}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('endDate', e.target.value)
									}
									width='100%'
									error={!!errors.endDate}
								/>
							</Field>
							<Field label='Description' span='full'>
								<TextField
									name='description'
									placeholder='Short summary of the engagement — scope, goals, key stakeholders…'
									value={fields.description}
									onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
										setField('description', e.target.value)
									}
									width='100%'
									multiRow
									style={{ minHeight: 90, resize: 'vertical' }}
								/>
							</Field>
							<Field
								label='Discord channel ID'
								hint='Snowflake (17–20 digits). `/report` from this channel attributes to this project.'
								span='full'
							>
								<TextField
									name='discordChannelId'
									placeholder='e.g. 123456789012345678'
									value={fields.discordChannelId}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										setField('discordChannelId', e.target.value.trim())
									}
									width='100%'
								/>
							</Field>
						</FieldGrid>
					</Section>

					<Section $delay={140}>
						<SectionHead num='02' title='Team' hint='Assign employees to this project' />
						<TeamContent ref={teamContentRef}>
						<GroupHead>
							<GroupTitle>Assigned</GroupTitle>
							<GroupCount>{selectedEmployees.length}</GroupCount>
						</GroupHead>
						{selectedEmployees.length > 0 ? (
							<MembersRow>
								{selectedEmployees.map((e) => {
									const isLeaving = leavingIds.has(e.id)
									return (
										<Chip
											key={e.id}
											ref={setChipRef(`assigned:${e.id}`)}
											$leaving={isLeaving}
										>
											<ChipAvatar>{initials(e.firstName, e.lastName)}</ChipAvatar>
											<ChipName>
												{e.firstName} {e.lastName}
											</ChipName>
											<ChipRemove
												type='button'
												onClick={() => toggleMember(e.id)}
												aria-label={`Remove ${e.firstName} ${e.lastName}`}
												disabled={isLeaving}
											>
												<CloseRounded />
											</ChipRemove>
										</Chip>
									)
								})}
							</MembersRow>
						) : (
							<EmptyHint>No members yet — pick from the pool below.</EmptyHint>
						)}
						<GroupHead style={{ marginTop: 18 }}>
							<GroupTitle>Available</GroupTitle>
							<GroupCount>
								{employees.filter((e) => !fields.memberIds.includes(e.id)).length}
							</GroupCount>
						</GroupHead>
						<Pool>
							{employees
								.filter((e) => !fields.memberIds.includes(e.id))
								.map((e) => {
									const isLeaving = leavingIds.has(e.id)
									return (
										<PoolChip
											key={e.id}
											ref={setChipRef(`pool:${e.id}`)}
											type='button'
											onClick={() => toggleMember(e.id)}
											$leaving={isLeaving}
											disabled={isLeaving}
										>
											<PoolPlus aria-hidden='true'>
												<AddRounded />
											</PoolPlus>
											<PoolName>
												{e.firstName} {e.lastName}
											</PoolName>
										</PoolChip>
									)
								})}
							{employees.length === 0 && <EmptyHint>No active employees.</EmptyHint>}
							{employees.length > 0 &&
								employees.filter((e) => !fields.memberIds.includes(e.id)).length === 0 && (
									<EmptyHint>Everyone's on the team.</EmptyHint>
								)}
						</Pool>
						</TeamContent>
					</Section>

					<FootBar $dark={isDark}>
						<FootLeft $dark={isDark}>
							<DotMini />
							{isEdit ? 'Editing project' : 'Project will be created immediately'}
						</FootLeft>
						<FootActions>
							<PrimaryGhostButton type='button' onClick={() => navigate('/projects/list')}>
								Cancel
							</PrimaryGhostButton>
							<PermissionGate permission={isEdit ? 'projects:update' : 'projects:create'}>
								<PrimarySolidButton type='submit' disabled={isLoading}>
									{isLoading ? 'Saving…' : isEdit ? 'Save changes' : 'Create project'}
								</PrimarySolidButton>
							</PermissionGate>
						</FootActions>
					</FootBar>
				</form>
			</Surface>
		</Shell>
	)
}

const ProjectForm = ({ id }: Props) => {
	const { data, isLoading, isError } = useGetProjectByIdQuery(id!, { skip: !id })

	if (id && isLoading) return <FormLoading label='Loading project…' />
	if (id && (isError || !data)) return <FormNotFound label='Project not found' />

	const initial: FormFields = data
		? {
				name: data.name,
				clientId: data.clientId ?? '',
				status: data.status,
				description: data.description ?? '',
				startDate: data.startDate ? data.startDate.slice(0, 10) : '',
				endDate: data.endDate ? data.endDate.slice(0, 10) : '',
				memberIds: data.members.map((m) => m.employeeId),
				discordChannelId: (data as { discordChannelId?: string | null }).discordChannelId ?? '',
			}
		: empty

	return <ProjectFormInner id={id} initial={initial} />
}

export default ProjectForm

const chipEnter = keyframes`
	0%   { opacity: 0; transform: scale(0.85) translateY(4px); }
	100% { opacity: 1; transform: scale(1) translateY(0); }
`

const chipExit = keyframes`
	0%   { opacity: 1; transform: scale(1) translateY(0); }
	100% { opacity: 0; transform: scale(0.75) translateY(-4px); }
`

const TeamContent = styled.div`
	/* Height is driven by inline styles applied via the FLIP hook on
	   each reflow — see useLayoutEffect above. The animated
	   min-height keeps the whole form from jumping when a chip
	   moves between the Assigned and Available lists. */
`

const GroupHead = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	margin-bottom: 11px;
`

const GroupTitle = styled.span`
	font-size: 12.5px;
	font-weight: 700;
	color: ${T.textSecondary};
	text-transform: uppercase;
	letter-spacing: 0.65px;
`

const GroupCount = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 26px;
	height: 22px;
	padding: 0 7px;
	border-radius: 999px;
	background: rgba(3, 105, 161, 0.12);
	color: rgba(3, 105, 161, 1);
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 12.5px;
	font-weight: 700;
	font-variant-numeric: tabular-nums;
	letter-spacing: -0.1px;
`

const MembersRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
`

const Chip = styled.span<{ $leaving: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 5px 8px 5px 5px;
	border-radius: 999px;
	background: #ffffff;
	color: rgba(3, 105, 161, 1);
	border: 1px solid rgba(3, 105, 161, 0.28);
	font-size: 14px;
	font-weight: 600;
	line-height: 1;
	animation: ${({ $leaving }) => ($leaving ? chipExit : chipEnter)} 220ms
		cubic-bezier(0.22, 1, 0.36, 1) both;
	transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	pointer-events: ${({ $leaving }) => ($leaving ? 'none' : 'auto')};

	&:hover {
		transform: translateY(-1px);
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transition: none;
		&:hover {
			transform: none;
		}
	}
`

const ChipAvatar = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	background: rgba(3, 105, 161, 0.14);
	color: rgba(3, 105, 161, 1);
	font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	font-size: 11px;
	font-weight: 700;
	letter-spacing: 0.3px;
	flex-shrink: 0;
`

const ChipName = styled.span`
	white-space: nowrap;
`

const ChipRemove = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	min-width: 0;
	background: transparent;
	border: none;
	border-radius: 50%;
	padding: 0;
	margin: 0;
	color: inherit;
	cursor: pointer;
	line-height: 1;
	letter-spacing: normal;
	text-transform: none;
	transition: transform 260ms cubic-bezier(0.22, 1, 0.36, 1);

	svg {
		font-size: 16px;
		display: block;
	}

	&:hover {
		transform: rotate(90deg);
	}

	&:active {
		transform: rotate(90deg) scale(0.9);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
		&:hover,
		&:active {
			transform: none;
		}
	}
`

const Pool = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
`

const PoolChip = styled.button<{ $leaving: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	padding: 6px 14px 6px 6px;
	border-radius: 999px;
	border: 1px dashed rgba(15, 23, 42, 0.16);
	background: transparent;
	color: ${T.textSecondary};
	font-family: inherit;
	font-size: 14px;
	font-weight: 500;
	line-height: 1;
	text-transform: none;
	letter-spacing: normal;
	cursor: pointer;
	animation: ${({ $leaving }) => ($leaving ? chipExit : chipEnter)} 220ms
		cubic-bezier(0.22, 1, 0.36, 1) both;
	transition:
		transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
		color 200ms ease,
		border-color 200ms ease;
	pointer-events: ${({ $leaving }) => ($leaving ? 'none' : 'auto')};

	&:hover {
		transform: translateY(-1px);
		color: rgba(3, 105, 161, 1);
		border-color: rgba(3, 105, 161, 0.45);
		border-style: solid;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
		transition: color 200ms ease, border-color 200ms ease;
		&:hover {
			transform: none;
		}
	}
`

const PoolPlus = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 30px;
	height: 30px;
	border-radius: 50%;
	background: rgba(15, 23, 42, 0.04);
	color: ${T.textSecondary};
	flex-shrink: 0;
	transition:
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
		background 220ms ease,
		color 220ms ease;

	svg {
		font-size: 18px;
	}

	${PoolChip}:hover & {
		transform: rotate(90deg);
		background: rgba(3, 105, 161, 0.14);
		color: rgba(3, 105, 161, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		transition: background 220ms ease, color 220ms ease;
		${PoolChip}:hover & {
			transform: none;
		}
	}
`

const PoolName = styled.span`
	white-space: nowrap;
`

const EmptyHint = styled.div`
	font-size: 13px;
	color: ${T.textSecondary};
	font-style: italic;
	padding: 4px 0;
`
