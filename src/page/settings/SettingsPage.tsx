import { useEffect, useMemo, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import {
	SettingsOutlined,
	NotificationsActiveOutlined,
	NotificationsActiveRounded,
	ReceiptLongOutlined,
	BeachAccessOutlined,
	PaidOutlined,
	VpnKeyOutlined,
	HubOutlined,
	SearchOutlined,
	ClearRounded,
	WarningAmberRounded,
	CheckCircleOutlined,
	ErrorOutlineOutlined,
	BoltRounded,
	ShieldOutlined,
	ShieldRounded,
	PersonOutlineOutlined,
	BackupOutlined,
	PhoneAndroidOutlined,
	SimCardOutlined,
	FolderSpecialOutlined,
} from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import MyAccountPanel from './MyAccountPanel'
import BackupsSettingsPanel, {
	BACKUPS_LS_KEY,
	BACKUPS_DEFAULTS,
	type BackupSettings,
} from './BackupsSettingsPanel'
import DiscordIntegrationPanel from './DiscordIntegrationPanel'
import { atom, nthStagger } from './_shared/stagger'
import { T } from '../../components/sales-analytics/_shared/tokens'
import {
	useGetSettingsSectionsQuery,
	useGetSettingsStatusQuery,
	useUpdateSettingsSectionMutation,
	useTestDiscordMutation,
	useTestPhoneAlertPingMutation,
	useEndAllVaultSessionsMutation,
	type RegistrySection,
	type SettingsEntry,
	type SettingsSection,
	type SettingsStatus,
} from '../../store/settings/settingsRegistryApi'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import { API_BASE_URL } from '../../api/baseApi'
import {
	ContentCopyRounded,
	NotificationsActiveRounded as NotifRoundedIc,
	LockOpenOutlined,
} from '@mui/icons-material'
import ConfirmModal from '../../components/_shared/ConfirmModal'

const SECTION_ICON: Record<RegistrySection, JSX.Element> = {
	general: <SettingsOutlined />,
	scanner_alerts: <NotificationsActiveOutlined />,
	client_invoicing: <ReceiptLongOutlined />,
	people_time_off: <BeachAccessOutlined />,
	payroll_compensation: <PaidOutlined />,
	credentials_security: <VpnKeyOutlined />,
	phone_alerts: <PhoneAndroidOutlined />,
	phone_defaults: <SimCardOutlined />,
	portfolio: <FolderSpecialOutlined />,
	integrations: <HubOutlined />,
}

const SettingsPage = () => {
	const {
		data: sections = [],
		isLoading,
		isError,
		refetch,
	} = useGetSettingsSectionsQuery()
	const { data: status } = useGetSettingsStatusQuery()
	const [updateSection, { isLoading: isSaving }] =
		useUpdateSettingsSectionMutation()
	const [testDiscord, { isLoading: isTesting }] = useTestDiscordMutation()
	const [testPhoneAlertPing, { isLoading: isPhonePinging }] =
		useTestPhoneAlertPingMutation()
	const [endSessions, { isLoading: isEnding }] =
		useEndAllVaultSessionsMutation()
	const { showToast } = useToast()

	const [pending, setPending] = useState<Record<string, unknown>>({})
	const [search, setSearch] = useState('')

	// Backups-category state lives up here so the main floating SaveBar
	// also handles save/discard for it — no second bar, no stacked
	// position-fixed overlay, no dedicated plumbing. The field edits
	// still land in `pending`; `handleSave` branches by active section.
	const [backupsSaved, setBackupsSaved] = useState<BackupSettings>(() => {
		try {
			const raw = localStorage.getItem(BACKUPS_LS_KEY)
			if (!raw) return BACKUPS_DEFAULTS
			return { ...BACKUPS_DEFAULTS, ...(JSON.parse(raw) as object) }
		} catch {
			return BACKUPS_DEFAULTS
		}
	})

	// The URL (`?s=<key>`) is the source of truth for which section is
	// open, so these links are shareable — paste `/settings?s=scanner`
	// anywhere and it lands on Scanner directly. The local state only
	// tracks pending edits in the form.
	const [searchParams, setSearchParams] = useSearchParams()
	const urlKey = searchParams.get('s')

	const activeKey = useMemo<
		RegistrySection | 'my_account' | 'backups' | 'discord' | null
	>(() => {
		if (urlKey === 'my_account') return 'my_account'
		if (urlKey === 'backups') return 'backups'
		if (urlKey === 'discord') return 'discord'
		if (urlKey && sections.find((s) => s.key === urlKey)) {
			return urlKey as RegistrySection
		}
		// Sections list is still loading — trust the URL for now. The
		// fallback-to-my_account decision is deferred until we can
		// actually tell whether the key is valid, so refreshing on
		// `/settings?s=scanner` does not bump the user to My account
		// just because the API has not responded yet.
		if (isLoading && urlKey) return urlKey as RegistrySection
		return 'my_account'
	}, [urlKey, sections, isLoading])

	const setActiveKey = (
		key: RegistrySection | 'my_account' | 'backups' | 'discord',
	) => {
		const next = new URLSearchParams(searchParams)
		next.set('s', key)
		setSearchParams(next, { replace: true })
	}

	// If the URL points at a section we cannot resolve (unknown key, or
	// a backup link opened by a non-owner), rewrite it to the resolved
	// one so what the user copies next matches what they see — but only
	// AFTER the sections list has loaded, otherwise a cold refresh on
	// `/settings?s=scanner` would clobber the URL during the first
	// render pass.
	useEffect(() => {
		if (isLoading) return
		if (activeKey && urlKey !== activeKey) {
			const next = new URLSearchParams(searchParams)
			next.set('s', activeKey)
			setSearchParams(next, { replace: true })
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeKey, isLoading])

	const section =
		activeKey &&
		activeKey !== 'my_account' &&
		activeKey !== 'backups' &&
		activeKey !== 'discord'
			? sections.find((s) => s.key === activeKey) ?? null
			: null
	const isMyAccountActive = activeKey === 'my_account'
	const isBackupsActive = activeKey === 'backups'
	const isDiscordActive = activeKey === 'discord'
	const pendingCount = Object.keys(pending).length
	const dirty = pendingCount > 0

	// Keep the previous non-zero count during the SaveBar's fade-out so
	// the text does not flash "0 unsaved changes" while the pill is
	// animating away.
	const [displayedCount, setDisplayedCount] = useState(pendingCount)
	useEffect(() => {
		if (pendingCount > 0) setDisplayedCount(pendingCount)
	}, [pendingCount])

	const filteredEntries = useMemo(() => {
		if (!section) return []
		if (!search.trim()) return section.entries
		const q = search.trim().toLowerCase()
		return section.entries.filter(
			(e) =>
				e.label.toLowerCase().includes(q) ||
				e.description.toLowerCase().includes(q) ||
				e.key.toLowerCase().includes(q),
		)
	}, [section, search])

	const handleFieldChange = (key: string, value: unknown) => {
		setPending((prev) => ({ ...prev, [key]: value }))
	}
	const handleDiscard = () => setPending({})

	const handleSave = async () => {
		if (isBackupsActive) {
			try {
				const next = { ...backupsSaved, ...pending } as BackupSettings
				localStorage.setItem(BACKUPS_LS_KEY, JSON.stringify(next))
				setBackupsSaved(next)
				setPending({})
				showToast('Backup settings saved', 'success')
			} catch {
				showToast('Could not save backup settings', 'error')
			}
			return
		}
		if (!section) return
		try {
			await updateSection({ section: section.key, values: pending }).unwrap()
			setPending({})
			showToast('Settings updated', 'success')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const activeSectionIndex = sections.findIndex((s) => s.key === activeKey)

	return (
		<Shell>
			<Hero>
				<Crumbs>
					<span className='crumb-dot' aria-hidden='true' />
					<span className='current'>Workspace settings</span>
				</Crumbs>
				<PageHead>
					<div className='title'>
						<h1>Settings</h1>
						<p>Business policy, integrations, operational flags.</p>
					</div>
					<div className='title-right' aria-hidden='true'>
						<span className='hand-line'>tune the works</span>
						<span className='hand-flourish'>
							<svg viewBox='0 0 120 20' width='120' height='20'>
								<path
									d='M2 12 C 28 2, 60 22, 96 6'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.2'
									strokeLinecap='round'
								/>
								<path
									d='M88 4 L 98 6 L 92 14'
									fill='none'
									stroke='currentColor'
									strokeWidth='2.2'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
						</span>
					</div>
				</PageHead>
			</Hero>

			<Body>
				{/* Sidebar */}
				<SideNav>
					<SideItem
						$active={isMyAccountActive}
						onClick={() => {
							if (dirty && !window.confirm('Discard unsaved changes?'))
								return
							setPending({})
							setActiveKey('my_account')
						}}
						style={{ animationDelay: '0ms' }}
					>
						<SideIcon $active={isMyAccountActive}>
							<PersonOutlineOutlined />
						</SideIcon>
						<SideTitle>My account</SideTitle>
					</SideItem>
					<SideDivider />
					{isLoading && <SideSkeleton />}
					{sections.map((s, i) => (
						<SideItem
							key={s.key}
							$active={s.key === activeKey}
							onClick={() => {
								if (dirty && !window.confirm('Discard unsaved changes?'))
									return
								setPending({})
								setActiveKey(s.key)
							}}
							style={{ animationDelay: `${i * 40}ms` }}
						>
							<SideIcon $active={s.key === activeKey}>
								{SECTION_ICON[s.key] ?? <SettingsOutlined />}
							</SideIcon>
							<SideTitle>{s.title}</SideTitle>
							{s.ownerOnly && (
								<OwnerDot
									$onDark={s.key === activeKey}
									title='Owner managed'
								/>
							)}
						</SideItem>
					))}
					<SideItem
						$active={isBackupsActive}
						onClick={() => {
							if (dirty && !window.confirm('Discard unsaved changes?'))
								return
							setPending({})
							setActiveKey('backups')
						}}
						style={{ animationDelay: `${(sections.length + 1) * 40}ms` }}
					>
						<SideIcon $active={isBackupsActive}>
							<BackupOutlined />
						</SideIcon>
						<SideTitle>Backups</SideTitle>
						<OwnerDot
							$onDark={isBackupsActive}
							title='Owner managed'
						/>
					</SideItem>
					<SideItem
						$active={isDiscordActive}
						onClick={() => {
							if (dirty && !window.confirm('Discard unsaved changes?'))
								return
							setPending({})
							setActiveKey('discord')
						}}
						style={{ animationDelay: `${(sections.length + 2) * 40}ms` }}
					>
						<SideIcon $active={isDiscordActive}>
							<HubOutlined />
						</SideIcon>
						<SideTitle>Discord Integration</SideTitle>
						<OwnerDot
							$onDark={isDiscordActive}
							title='Owner managed'
						/>
					</SideItem>
				</SideNav>

				{/* Content */}
				<Content>
					{isError ? (
						<EmptyState>
							<ErrorOutlineOutlined style={{ fontSize: 32, color: T.error }} />
							<h3>Could not load settings</h3>
							<p>Something went wrong on the backend side.</p>
							<RetryBtn type='button' onClick={() => refetch()}>
								Retry
							</RetryBtn>
						</EmptyState>
					) : isLoading && !isMyAccountActive && !isBackupsActive ? (
						<ContentSkeleton />
					) : isMyAccountActive ? (
						<SectionHero key='my_account'>
							<SectionHead>
								<SectionTitle>My account</SectionTitle>
								<SectionSubtitle>
									Your personal profile — avatar, display name and the
									role granted to you by an administrator.
								</SectionSubtitle>
							</SectionHead>
							<MyAccountPanel />
						</SectionHero>
					) : isBackupsActive ? (
						<SectionHero key='backups'>
							<SectionHead>
								<SectionTitle>Backups</SectionTitle>
								<SectionSubtitle>
									Snapshot schedule, remote storage, retention and the
									failure alerts behind the Backup &amp; Recovery panel.
								</SectionSubtitle>
							</SectionHead>
							<BackupsSettingsPanel
								saved={backupsSaved}
								pending={pending as Partial<BackupSettings>}
								onFieldChange={handleFieldChange}
							/>
						</SectionHero>
					) : isDiscordActive ? (
						<SectionHero key='discord'>
							<SectionHead>
								<SectionTitle>Discord Integration</SectionTitle>
								<SectionSubtitle>
									TEST and PRODUCTION profiles — guild &amp; channel ids,
									schedules, access verification, test send and preview
									messages. The active profile drives every outbound
									notification.
								</SectionSubtitle>
							</SectionHead>
							<DiscordIntegrationPanel />
						</SectionHero>
					) : !section ? (
						<EmptyState>
							<WarningAmberRounded style={{ fontSize: 32, color: T.warning }} />
							<h3>No sections available</h3>
							<p>
								You don&apos;t have permission to see any settings sections
								yet.
							</p>
						</EmptyState>
					) : (
						<SectionHero key={section.key}>
							<SectionHead>
								<SectionHeadRow>
									<div>
										<SectionEyebrow>
											§ {activeSectionIndex + 1} · {section.key}
										</SectionEyebrow>
										<SectionTitle>
											{section.title}
											<SectionTitleAccent>settings</SectionTitleAccent>
											{section.ownerOnly && (
												<OwnerBadge>Owner managed</OwnerBadge>
											)}
										</SectionTitle>
										<SectionSubtitle>{section.description}</SectionSubtitle>
									</div>
									<FieldCount>
										<b>
											{String(
												section.key === 'integrations'
													? 3
													: section.entries.length,
											).padStart(2, '0')}
										</b>
										<span>
											{section.key === 'integrations'
												? 'integrations'
												: `field${section.entries.length === 1 ? '' : 's'}`}
										</span>
									</FieldCount>
								</SectionHeadRow>
								{section.key !== 'integrations' && (
									<SearchBar>
										<SearchOutlined />
										<input
											placeholder='Search in this section'
											value={search}
											onChange={(e) => setSearch(e.target.value)}
										/>
										{search && (
											<ClearRounded
												onClick={() => setSearch('')}
												style={{ cursor: 'pointer' }}
											/>
										)}
									</SearchBar>
								)}
							</SectionHead>

							{section.key === 'integrations' ? (
								<IntegrationsBlock
									status={status}
									onTest={() =>
										testDiscord()
											.unwrap()
											.then(() =>
												showToast(
													'Test notification sent',
													'success',
												),
											)
											.catch((e) =>
												showToast(parseServerError(e), 'error'),
											)
									}
									onEndSessions={() =>
										endSessions()
											.unwrap()
											.then((r) =>
												showToast(
													`Ended ${r.endedSessionCount} vault sessions`,
													'success',
												),
											)
											.catch((e) =>
												showToast(parseServerError(e), 'error'),
											)
									}
									testing={isTesting}
									ending={isEnding}
								/>
							) : (
								<SectionBody>
									{filteredEntries.length === 0 ? (
										<EmptyMatch>
											<WarningAmberRounded style={{ fontSize: 20 }} />
											Nothing matches your search.
										</EmptyMatch>
									) : (
										filteredEntries.map((entry) => (
											<SettingRow
												key={entry.key}
												entry={entry}
												pending={pending[entry.key]}
												onChange={(v) =>
													handleFieldChange(entry.key, v)
												}
											/>
										))
									)}
									{section.key === 'phone_alerts' && (
										<TestPingRow>
											<div className='info'>
												<strong>Verify webhook</strong>
												<span>
													Sends a single test message to the configured
													URL — doesn't bump the daily counter.
												</span>
											</div>
											<TestPingBtn
												type='button'
												disabled={isPhonePinging}
												onClick={() =>
													testPhoneAlertPing()
														.unwrap()
														.then((r) => {
															if (r.success) {
																showToast(
																	'Test ping sent — check Discord',
																	'success',
																)
															} else {
																showToast(
																	r.message ?? 'Ping failed',
																	'error',
																)
															}
														})
														.catch((e) =>
															showToast(parseServerError(e), 'error'),
														)
												}
											>
												{isPhonePinging ? 'Sending…' : 'Send test ping'}
											</TestPingBtn>
										</TestPingRow>
									)}
								</SectionBody>
							)}
						</SectionHero>
					)}

					{/* Dynamic-form SaveBar — also drives the virtual Backups
					 * category since its pending edits land in the same
					 * `pending` bag. Only hidden for My account (which has
					 * its own self-contained save flow). */}
					{!isMyAccountActive && (
						<SaveBar $visible={dirty} aria-hidden={!dirty}>
							<div className='savebar-pill'>
								<SaveBarInfo>
									{displayedCount} unsaved change
									{displayedCount === 1 ? '' : 's'}
								</SaveBarInfo>
								<SaveBarActions>
									<GhostBtn
										type='button'
										onClick={handleDiscard}
										disabled={isSaving || !dirty}
										tabIndex={dirty ? 0 : -1}
									>
										Discard
									</GhostBtn>
									<PrimaryBtn
										type='button'
										onClick={handleSave}
										disabled={isSaving || !dirty}
										tabIndex={dirty ? 0 : -1}
									>
										{isSaving ? 'Saving…' : 'Save changes'}
									</PrimaryBtn>
								</SaveBarActions>
							</div>
						</SaveBar>
					)}
				</Content>
			</Body>
			{void activeSectionIndex}
		</Shell>
	)
}

export default SettingsPage

/* ─── Setting row ─────────────────────────────────────────────── */

const SettingRow = ({
	entry,
	pending,
	onChange,
}: {
	entry: SettingsEntry
	pending: unknown
	onChange: (v: unknown) => void
}) => {
	const value = pending !== undefined ? pending : entry.value
	const dirty = pending !== undefined
	const disabled = !entry.canEdit || entry.readOnly
	return (
		<Row $dirty={dirty}>
			<RowLabel>
				<RowTitle>
					{entry.label}
					<KeyPill>{entry.key}</KeyPill>
					{!entry.canEdit && !entry.readOnly && (
						<OwnerManagedTag>Owner managed</OwnerManagedTag>
					)}
					{entry.dangerous && (
						<DangerTag title='Changing this affects live traffic.'>
							Dangerous
						</DangerTag>
					)}
				</RowTitle>
				<RowDescription>{entry.description}</RowDescription>
				{entry.effectHint && <EffectHint>{entry.effectHint}</EffectHint>}
			</RowLabel>
			<RowControl>
				<Control
					entry={entry}
					value={value}
					disabled={disabled}
					onChange={onChange}
				/>
				<MetaSlot>
					{entry.updatedAt && (
						<RowMeta $visible={!dirty} aria-hidden={dirty}>
							Last updated{' '}
							{new Date(entry.updatedAt).toLocaleString()}
						</RowMeta>
					)}
					<DirtyTape $visible={dirty} aria-hidden={!dirty}>
						unsaved
					</DirtyTape>
				</MetaSlot>
			</RowControl>
		</Row>
	)
}

const Control = ({
	entry,
	value,
	disabled,
	onChange,
}: {
	entry: SettingsEntry
	value: unknown
	disabled: boolean
	onChange: (v: unknown) => void
}) => {
	switch (entry.type) {
		case 'boolean':
			return (
				<ToggleSwitch
					aria-label={entry.label}
					role='switch'
					aria-checked={!!value}
					$on={!!value}
					$disabled={disabled}
					onClick={() => !disabled && onChange(!value)}
				>
					<Dot $on={!!value} />
				</ToggleSwitch>
			)
		case 'number':
		case 'duration_minutes':
		case 'duration_seconds':
			return (
				<NumberCell>
					<input
						type='number'
						value={value as number | string}
						onChange={(e) =>
							onChange(e.target.value === '' ? '' : Number(e.target.value))
						}
						disabled={disabled}
						min={entry.min}
						max={entry.max}
						step={entry.step ?? 1}
						placeholder={String(entry.value ?? '')}
					/>
					{(entry.unit ||
						entry.type === 'duration_minutes' ||
						entry.type === 'duration_seconds') && (
						<Unit>
							{entry.unit ??
								(entry.type === 'duration_minutes' ? 'min' : 'sec')}
						</Unit>
					)}
				</NumberCell>
			)
		case 'percentage':
			return (
				<NumberCell>
					<input
						type='number'
						value={value as number | string}
						onChange={(e) =>
							onChange(e.target.value === '' ? '' : Number(e.target.value))
						}
						disabled={disabled}
						min={entry.min}
						max={entry.max}
						step={entry.step ?? 0.1}
						placeholder={String(entry.value ?? '')}
					/>
					<Unit>%</Unit>
				</NumberCell>
			)
		case 'currency':
		case 'select':
			return (
				<SelectCell
					value={value as string}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
				>
					{entry.options?.map((o) => (
						<option key={o.value} value={o.value}>
							{o.label}
						</option>
					))}
				</SelectCell>
			)
		case 'weekdays':
			return (
				<WeekdayRow>
					{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
						(label, i) => {
							const day = i === 6 ? 0 : i + 1 // ISO: 0=Sun,1=Mon
							const current = Array.isArray(value)
								? (value as number[])
								: []
							const on = current.includes(day)
							return (
								<WeekdayPill
									type='button'
									key={label}
									$on={on}
									disabled={disabled}
									aria-label={label}
									title={label}
									onClick={() => {
										if (disabled) return
										const next = on
											? current.filter((n) => n !== day)
											: [...current, day]
										onChange(next.sort((a, b) => a - b))
									}}
								>
									{label[0]}
								</WeekdayPill>
							)
						},
					)}
				</WeekdayRow>
			)
		case 'string':
		default: {
			// When the stored value is empty we fall back to a label-based
			// hint so the user still sees what the field is for — otherwise
			// the input would show no placeholder on sections like Client
			// invoicing where many strings are not configured yet.
			const stored =
				entry.value === null || entry.value === undefined
					? ''
					: String(entry.value)
			const placeholder = stored || entry.label
			return (
				<TextCell
					value={value as string | undefined | null ?? ''}
					onChange={(e) => onChange(e.target.value)}
					disabled={disabled}
					placeholder={placeholder}
				/>
			)
		}
	}
}

/* ─── Integrations block ──────────────────────────────────────── */

const IntegrationsBlock = ({
	status,
	onTest,
	onEndSessions,
	testing,
	ending,
}: {
	status: SettingsStatus | undefined
	onTest: () => void
	onEndSessions: () => void
	testing: boolean
	ending: boolean
}) => {
	const [confirmAction, setConfirmAction] = useState<
		'test' | 'end' | null
	>(null)

	if (!status) return <ContentSkeleton />
	const vibeOk =
		status.vibeWorker.configured && !!status.vibeWorker.lastEventReceivedAt
	const vibeNotConf = !status.vibeWorker.configured
	const discordNotConf = !status.discord.configured
	const vaultBusy = status.vault.activeSessions > 0

	const closeConfirm = () => setConfirmAction(null)

	return (
		<IntGrid>
			{/* Vibe Worker — spans both columns because the webhook block
			    needs breathing room for the full URL. */}
			<IntCard $wide>
				<IntStrip $tone='sky'>
					<IntStripTitle>
						<BoltRounded />
						<h3>Vibe Worker</h3>
					</IntStripTitle>
					<IntStripKey>vibe.webhook</IntStripKey>
				</IntStrip>
				<IntBody>
					<VibeWebhookBlock />
					<IntFoot>
						<IntStatusDot
							$tone={vibeNotConf ? 'warn' : vibeOk ? 'ok' : 'neutral'}
						>
							{vibeNotConf
								? 'Not configured'
								: vibeOk
									? 'Receiving'
									: 'Idle'}
						</IntStatusDot>
					</IntFoot>
				</IntBody>
			</IntCard>

			{/* Discord — orange accent */}
			<IntCard>
				<IntStrip $tone='accent'>
					<IntStripTitle>
						<NotificationsActiveRounded />
						<h3>Discord</h3>
					</IntStripTitle>
					<IntStripKey>discord.bot</IntStripKey>
				</IntStrip>
				<IntBody>
				<IntMetric>
					<b>{status.discord.usedBy?.length ?? 0}</b>
					<em>use cases</em>
				</IntMetric>
				<IntFoot>
					<IntStatusDot
						$tone={
							discordNotConf
								? 'warn'
								: status.discord.alertsEnabled
									? 'ok'
									: 'neutral'
						}
					>
						{discordNotConf
							? 'Not configured'
							: status.discord.alertsEnabled
								? 'Connected'
								: 'Disabled'}
					</IntStatusDot>
					<IntBtn
						type='button'
						$tone='accent'
						onClick={() => setConfirmAction('test')}
						disabled={testing || !status.discord.configured}
					>
						{testing ? 'Sending…' : 'Send test'}
					</IntBtn>
				</IntFoot>
				</IntBody>
			</IntCard>

			{/* Vault sessions */}
			<IntCard>
				<IntStrip $tone='ink'>
					<IntStripTitle>
						<ShieldRounded />
						<h3>Vault sessions</h3>
					</IntStripTitle>
					<IntStripKey>vault.sessions</IntStripKey>
				</IntStrip>
				<IntBody>
				<IntMetric>
					<b>{status.vault.activeSessions}</b>
					<em>active now</em>
				</IntMetric>
				<IntSub>
					{vaultBusy
						? 'Ending all sessions forces every user to re-authenticate with MFA.'
						: 'No active unlocks right now.'}
				</IntSub>
				<IntFoot>
					<IntStatusDot $tone={vaultBusy ? 'warn' : 'ok'}>
						{vaultBusy ? `${status.vault.activeSessions} active` : 'Idle'}
					</IntStatusDot>
					<IntBtn
						type='button'
						$tone='ink'
						onClick={() => setConfirmAction('end')}
						disabled={ending || status.vault.activeSessions === 0}
					>
						{ending ? 'Ending…' : 'End all'}
					</IntBtn>
				</IntFoot>
				</IntBody>
			</IntCard>

			{confirmAction === 'test' && (
				<ConfirmModal
					icon={<NotifRoundedIc />}
					iconTone='info'
					title='Send a test notification?'
					description={
						<>
							A single test message will be posted to the configured
							Discord webhook so you can verify delivery.
						</>
					}
					confirmLabel='Send test'
					confirmLoadingLabel='Sending…'
					confirmColor='primary'
					isLoading={testing}
					onClose={closeConfirm}
					onConfirm={() => {
						onTest()
						closeConfirm()
					}}
				/>
			)}

			{confirmAction === 'end' && (
				<ConfirmModal
					icon={<LockOpenOutlined />}
					iconTone='danger'
					title={
						status.vault.activeSessions === 1
							? 'End the active vault session?'
							: `End all ${status.vault.activeSessions} vault sessions?`
					}
					description={
						<>
							Every user with an open unlock will be forced to
							re-authenticate with MFA before revealing another secret.
							Current in-flight reveals are not interrupted.
						</>
					}
					confirmLabel='End sessions'
					confirmLoadingLabel='Ending…'
					confirmColor='error'
					isLoading={ending}
					onClose={closeConfirm}
					onConfirm={() => {
						onEndSessions()
						closeConfirm()
					}}
				/>
			)}
		</IntGrid>
	)
}


/* ─── Styles ──────────────────────────────────────────────────── */

const Shell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 16px;
	min-width: 0;
`

const heroIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`

const handDraw = keyframes`
	from { opacity: 0; transform: rotate(-6deg) translateY(6px); }
	to   { opacity: 1; transform: rotate(-6deg) translateY(0); }
`

const flourishDraw = keyframes`
	to { stroke-dashoffset: 0; opacity: 1; }
`

const Hero = styled.header`
	position: relative;
	padding: 32px 36px 28px;
	border-radius: ${T.radius};
	background: #ffffff;
	border: 1px solid ${T.border};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 20px 40px -20px rgba(15, 23, 42, 0.12);
	overflow: hidden;
	isolation: isolate;
	animation: ${heroIn} 300ms ${T.ease};

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(900px 340px at 5% -10%, rgba(3, 105, 161, 0.05) 0%, transparent 60%),
			radial-gradient(700px 300px at 95% -5%, rgba(124, 58, 237, 0.05) 0%, transparent 55%);
		z-index: -1;
		pointer-events: none;
	}

	@media (max-width: 720px) {
		padding: 22px 20px;
	}
`

const Crumbs = styled.nav`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12.5px;
	font-weight: 600;
	color: ${T.textMuted};
	margin-bottom: 14px;
	letter-spacing: 0.1px;

	.crumb-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: ${T.primary};
		opacity: 0.6;
	}
	.current {
		color: ${T.textSecondary};
	}
`

const PageHead = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 24px;

	.title h1 {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-size: 36px;
		font-weight: 700;
		font-variation-settings: 'opsz' 72;
		line-height: 0.95;
		margin: 0;
		color: ${T.textStrong};
		letter-spacing: -1.3px;
	}
	.title p {
		color: ${T.textSecondary};
		margin: 14px 0 0;
		max-width: 62ch;
		font-size: 14px;
		line-height: 1.5;
	}
	.title-right {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 2px;
		flex-shrink: 0;
		margin-top: -8px;
		padding-right: 6px;
	}
	.hand-line {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-size: 42px;
		font-weight: 700;
		line-height: 1;
		color: #0369a1;
		transform: rotate(-6deg);
		transform-origin: right center;
		text-shadow: 0 6px 22px rgba(2, 132, 199, 0.22);
		animation: ${handDraw} 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both;
		white-space: nowrap;
	}
	.hand-flourish {
		display: inline-flex;
		color: #0284c7;
		opacity: 0.75;
		margin-right: -4px;
		transform: rotate(-4deg);
	}
	.hand-flourish svg path {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: ${flourishDraw} 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		.hand-line { animation: none; transform: rotate(-6deg); }
		.hand-flourish svg path {
			animation: none;
			stroke-dashoffset: 0;
			opacity: 1;
		}
	}

	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
		.title h1 {
			font-size: 28px;
			letter-spacing: -0.8px;
		}
		.title-right {
			align-items: flex-start;
			margin-top: 0;
		}
		.hand-line {
			font-size: 32px;
		}
	}
`

const Body = styled.div`
	display: grid;
	/* Sidebar hugs its own content (as wide as the longest nav item
	 * plus padding), capped at 320px so a very long translation does
	 * not eat half the screen. Content pane takes the rest. */
	grid-template-columns: fit-content(320px) 1fr;
	gap: 16px;
	min-width: 0;

	@media (max-width: 900px) {
		grid-template-columns: 1fr;
	}
`

const SideNav = styled.nav`
	background: #ffffff;
	border-radius: ${T.radius};
	border: 1px solid ${T.border};
	box-shadow: ${T.cardShadow};
	padding: 12px;
	display: flex;
	flex-direction: column;
	gap: 4px;
	align-self: start;

	@media (max-width: 900px) {
		flex-direction: row;
		overflow-x: auto;
		padding: 10px;
	}
`

const sideIn = keyframes`
	from { opacity: 0; transform: translateX(-4px); }
	to { opacity: 1; transform: translateX(0); }
`

const SideItem = styled.button<{ $active: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 10px 12px;
	border-radius: 10px;
	border: none;
	/* Inactive = transparent + muted ink matching the main sidebar's
	 *   theme.textColor (light mode #3a3541de).
	 * Active = main sidebar's filled look: blue gradient, white text,
	 *   soft blue glow. */
	background: ${(p) =>
		p.$active
			? 'linear-gradient(270deg, #0284c7, #075985)'
			: 'transparent'};
	color: ${(p) => (p.$active ? '#f5f5f5' : '#3a3541de')};
	box-shadow: ${(p) =>
		p.$active ? 'rgba(3, 105, 161, 0.28) -2px 6px 16px -4px' : 'none'};
	font: inherit;
	font-size: 14px;
	font-weight: 500;
	letter-spacing: 0.1px;
	text-transform: none;
	cursor: pointer;
	text-align: left;
	animation: ${sideIn} 220ms ${T.ease} both;
	transition:
		background 220ms ${T.ease},
		color 220ms ${T.ease},
		box-shadow 220ms ${T.ease};

	&:hover {
		background: ${(p) =>
			p.$active
				? 'linear-gradient(270deg, #0284c7, #075985)'
				: 'rgba(3, 105, 161, 0.04)'};
		color: ${(p) => (p.$active ? '#f5f5f5' : T.primary)};
	}

	@media (max-width: 900px) {
		flex: 0 0 auto;
	}
`

const SideIcon = styled.span<{ $active?: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 28px;
	height: 28px;
	border-radius: 8px;
	background: ${(p) => (p.$active ? 'transparent' : 'rgba(3, 105, 161, 0.08)')};
	color: ${(p) => (p.$active ? '#f5f5f5' : T.primary)};
	transition: background 220ms ${T.ease}, color 220ms ${T.ease};

	svg {
		font-size: 18px;
	}
`

const SideTitle = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	flex: 1;
	min-width: 0;
	white-space: nowrap;
`

const OwnerDot = styled.span<{ $onDark?: boolean }>`
	width: 9px;
	height: 9px;
	border-radius: 50%;
	background: ${(p) => (p.$onDark ? '#fbbf24' : T.warning)};
	flex-shrink: 0;
	margin-left: auto;
`

const SideDivider = styled.hr`
	border: 0;
	border-top: 1px solid ${T.border};
	margin: 8px 4px;
`

const SideSkeleton = styled.div`
	height: 48px;
	border-radius: 10px;
	background: rgba(15, 23, 42, 0.04);
`

const Content = styled.main`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
`

const sectionIn = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to { opacity: 1; transform: translateY(0); }
`

const sectionShellIn = keyframes`
	from { opacity: 0; }
	to { opacity: 1; }
`

const SectionHero = styled.div`
	background: #ffffff;
	border-radius: ${T.radius};
	border: 1px solid ${T.border};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.03),
		0 20px 60px -40px rgba(15, 23, 42, 0.18);
	padding: 32px 36px 28px;
	display: flex;
	flex-direction: column;
	gap: 20px;
	animation: ${sectionShellIn} 160ms ${T.ease} both;

	@media (max-width: 640px) {
		padding: 22px 20px;
	}

	/* Only the section header animates at this outer level. The panels
	 * inside (MyAccountPanel / BackupRecoveryPanel / FormCluster) handle
	 * their own atom-level stagger so every row shows up one by one. */
	& > header {
		animation: ${sectionIn} 260ms ${T.ease} both;
	}
`

const SectionHead = styled.header`
	display: flex;
	flex-direction: column;
	gap: 8px;
`

const SectionEyebrow = styled.div`
	display: flex;
	align-items: baseline;
	gap: 10px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	letter-spacing: 0.4px;
	color: ${T.textMuted};
`

const SectionHeadRow = styled.div`
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 24px;
	align-items: baseline;

	@media (max-width: 640px) {
		grid-template-columns: 1fr;
	}
`

const FieldCount = styled.div`
	text-align: right;
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	color: ${T.textMuted};
	letter-spacing: 0.3px;
	line-height: 1.1;

	b {
		display: block;
		font-family: 'Fraunces', serif;
		font-weight: 500;
		font-size: 28px;
		color: ${T.textStrong};
		letter-spacing: -0.4px;
		margin-bottom: 2px;
		font-optical-sizing: auto;
		font-variation-settings: 'opsz' 144;
	}
`

const SectionTitle = styled.h2`
	margin: 0;
	display: inline-flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 10px;
	font-family: 'Fraunces', 'Fraunces Fallback', serif;
	font-size: 30px;
	font-weight: 500;
	letter-spacing: -0.6px;
	line-height: 1.1;
	color: ${T.textStrong};
	font-optical-sizing: auto;
	font-variation-settings: 'opsz' 144;
`

const SectionTitleAccent = styled.em`
	font-style: italic;
	font-weight: 500;
	color: #e85d2f;
`

const SectionSubtitle = styled.p`
	margin: 2px 0 0;
	font-size: 13.5px;
	color: ${T.textSecondary};
	max-width: 560px;
	line-height: 1.5;
`

const OwnerBadge = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2px 10px;
	border-radius: 999px;
	background: rgba(217, 119, 6, 0.12);
	color: #b45309;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10px;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.4px;

	&::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #d97706;
	}
`

const SearchBar = styled.div`
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 8px 12px;
	border-radius: 10px;
	border: 1px solid ${T.border};
	background: rgba(15, 23, 42, 0.02);
	max-width: 420px;

	svg {
		font-size: 18px;
		color: ${T.textMuted};
	}

	input {
		flex: 1;
		border: none;
		background: transparent;
		font: inherit;
		font-size: 13px;
		color: ${T.textStrong};
		outline: none;
	}
`

const SectionBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;

	/* Each registry row appears one by one, same cadence as the sidebar
	 * items and the My account card atoms. */
	& > * {
		${atom};
	}
	${nthStagger};
`

const EmptyMatch = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 16px;
	border-radius: 10px;
	background: rgba(100, 116, 139, 0.05);
	color: ${T.textSecondary};
	font-size: 12.5px;
`

const TestPingRow = styled.div`
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 16px;
	padding: 16px 0 4px;
	border-top: 1px dashed rgba(15, 23, 42, 0.12);
	margin-top: 8px;

	.info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.info strong {
		font-size: 13.5px;
		font-weight: 700;
		color: ${T.textStrong};
	}
	.info span {
		font-size: 12px;
		color: ${T.textSecondary};
	}
`
const TestPingBtn = styled.button`
	padding: 8px 16px;
	border-radius: 10px;
	border: 1.5px solid rgba(232, 93, 47, 0.4);
	background: rgba(232, 93, 47, 0.06);
	color: #e85d2f;
	font: inherit;
	font-weight: 700;
	font-size: 12.5px;
	letter-spacing: 0.3px;
	cursor: pointer;
	transition: all 160ms ease;

	&:hover:not(:disabled) {
		background: #e85d2f;
		color: #ffffff;
		border-color: #e85d2f;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
`

const Row = styled.div<{ $dirty: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 1fr minmax(260px, auto);
	gap: 36px;
	padding: 20px 0 20px ${(p) => (p.$dirty ? '14px' : '0')};
	border-top: 1px solid ${T.border};
	align-items: start;
	transition:
		padding-left 300ms cubic-bezier(0.22, 1, 0.36, 1),
		background 180ms;

	/* Dirty rows get a 3px orange rail on the left. The rail is an
	 * absolutely positioned pseudo-element so we can transition it in
	 * via scaleY + opacity without the box-shadow animation jank. */
	&::before {
		content: '';
		position: absolute;
		left: 0;
		top: 10px;
		bottom: 10px;
		width: 3px;
		border-radius: 3px;
		background: #e85d2f;
		opacity: ${(p) => (p.$dirty ? 1 : 0)};
		transform: scaleY(${(p) => (p.$dirty ? 1 : 0.4)});
		transform-origin: center;
		transition:
			opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
			transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
		pointer-events: none;
	}

	/* First visible row inside a SectionBody has no top border — the
	 * SectionHead already separates it. */
	&:first-child {
		border-top: none;
	}

	@media (max-width: 720px) {
		grid-template-columns: 1fr;
		gap: 14px;
	}
`

const RowLabel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
`

const RowTitle = styled.div`
	display: inline-flex;
	align-items: baseline;
	flex-wrap: wrap;
	gap: 10px;
	font-family: 'Fraunces', 'Fraunces Fallback', serif;
	font-weight: 500;
	font-size: 17px;
	letter-spacing: -0.2px;
	color: ${T.textStrong};
	line-height: 1.3;
	font-optical-sizing: auto;
	font-variation-settings: 'opsz' 36;
`

const KeyPill = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 2px 8px;
	border-radius: 999px;
	background: rgba(37, 45, 58, 0.04);
	border: 1px solid ${T.border};
	font-family: 'JetBrains Mono', monospace;
	font-size: 10px;
	font-weight: 600;
	color: ${T.textMuted};
	letter-spacing: 0.3px;
	line-height: 1;
`

const DangerTag = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2px 8px;
	border-radius: 999px;
	background: rgba(220, 38, 38, 0.08);
	color: #c2410c;
	font-family: 'JetBrains Mono', monospace;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	line-height: 1;

	&::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #c2410c;
	}
`

const RowDescription = styled.p`
	margin: 0;
	font-size: 13px;
	color: ${T.textSecondary};
	line-height: 1.5;
	max-width: 500px;
`

const EffectHint = styled.p`
	margin: 2px 0 0;
	font-size: 11.5px;
	color: ${T.primary};
	font-style: italic;
`

const OwnerManagedTag = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 5px;
	padding: 2px 8px;
	border-radius: 999px;
	background: rgba(217, 119, 6, 0.12);
	color: #b45309;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.4px;
	text-transform: uppercase;
	line-height: 1;

	&::before {
		content: '';
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #d97706;
	}
`

/* Reserved slot for either "Last updated …" meta or the orange
 * "unsaved" tape. Both children live inside, stacked absolutely so
 * swapping between them never jerks surrounding layout — the slot's
 * min-height is one line of either, enough for a smooth crossfade. */
const MetaSlot = styled.div`
	position: relative;
	width: 100%;
	min-height: 18px;
	display: flex;
	justify-content: flex-end;
	pointer-events: none;
`

const DirtyTape = styled.span<{ $visible: boolean }>`
	position: absolute;
	right: 0;
	top: 0;
	font-family: 'Caveat', 'Fraunces', cursive;
	font-weight: 700;
	font-size: 16px;
	color: #e85d2f;
	line-height: 1;
	padding-top: 2px;
	white-space: nowrap;
	transform-origin: right top;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transform: rotate(${(p) => (p.$visible ? '-2deg' : '-6deg')})
		translateY(${(p) => (p.$visible ? 0 : '-4px')})
		scale(${(p) => (p.$visible ? 1 : 0.85)});
	transition:
		opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
	will-change: opacity, transform;
`

const RowControl = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
	min-width: 0;
	align-items: flex-end;

	/* Controls like inputs/selects shouldn't be stretched to the right
	 * — they size to their natural width. Toggle stays compact too. */
	& > * {
		max-width: 100%;
	}

	@media (max-width: 720px) {
		align-items: flex-start;
	}
`

const RowMeta = styled.span<{ $visible: boolean }>`
	position: absolute;
	right: 0;
	top: 0;
	font-size: 10.5px;
	color: ${T.textMuted};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	white-space: nowrap;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transition: opacity 220ms cubic-bezier(0.22, 1, 0.36, 1);
	will-change: opacity;
`

const ToggleSwitch = styled.div<{ $on: boolean; $disabled: boolean }>`
	width: 46px;
	height: 26px;
	border-radius: 999px;
	background: ${(p) => (p.$on ? T.primary : 'rgba(15, 23, 42, 0.14)')};
	position: relative;
	cursor: ${(p) => (p.$disabled ? 'not-allowed' : 'pointer')};
	opacity: ${(p) => (p.$disabled ? 0.4 : 1)};
	transition: background 180ms;
`

const Dot = styled.span<{ $on: boolean }>`
	position: absolute;
	top: 3px;
	left: ${(p) => (p.$on ? '22px' : '3px')};
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: #ffffff;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
	transition: left 180ms ${T.ease};
`

const NumberCell = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 6px;

	input {
		padding: 8px 12px;
		border-radius: 8px;
		border: 1.5px solid rgba(15, 23, 42, 0.1);
		background: #ffffff;
		font: inherit;
		font-size: 13px;
		color: ${T.textStrong};
		width: 110px;
		outline: none;

		&::placeholder {
			color: ${T.textMuted};
			font-style: italic;
			opacity: 1;
		}
		&:disabled {
			opacity: 0.5;
		}
	}
`

const Unit = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 14px;
	font-weight: 500;
	color: ${T.textStrong};
	letter-spacing: 0.3px;
	line-height: 1;
`

const SelectCell = styled.select`
	/* Replace the native dropdown arrow with a custom SVG chevron
	 * positioned 14px from the right edge, with 36px right padding so
	 * the value never butts up against the arrow. */
	appearance: none;
	-webkit-appearance: none;
	-moz-appearance: none;
	padding: 8px 36px 8px 12px;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff
		url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237a7686' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")
		no-repeat right 14px center;
	background-size: 12px 12px;
	font: inherit;
	font-size: 13px;
	color: ${T.textStrong};
	outline: none;
	max-width: 320px;
	cursor: pointer;

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	&::-ms-expand {
		display: none;
	}
`

const TextCell = styled.input`
	padding: 8px 12px;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: #ffffff;
	font: inherit;
	font-size: 13px;
	color: ${T.textStrong};
	outline: none;

	&::placeholder {
		color: ${T.textMuted};
		font-style: italic;
		opacity: 1;
	}
	&:disabled {
		opacity: 0.5;
	}
`

const WeekdayRow = styled.div`
	display: inline-flex;
	gap: 10px;
	flex-wrap: wrap;
`

/* Fitness-tracker style letter dots. Off = dashed outline, mono letter.
 * On = solid primary filled, white letter. */
const WeekdayPill = styled.button<{ $on: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 36px;
	box-sizing: border-box;
	width: 36px;
	min-width: 36px;
	height: 36px;
	aspect-ratio: 1 / 1;
	padding: 0;
	line-height: 1;
	border-radius: 50%;
	border: 1.5px ${(p) => (p.$on ? 'solid' : 'dashed')}
		${(p) => (p.$on ? T.primary : 'rgba(37, 45, 58, 0.22)')};
	background: ${(p) => (p.$on ? T.primary : 'transparent')};
	color: ${(p) => (p.$on ? '#ffffff' : T.textMuted)};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 12px;
	font-weight: 700;
	letter-spacing: 0.4px;
	cursor: pointer;
	transition:
		background 180ms cubic-bezier(0.22, 1, 0.36, 1),
		border-color 180ms,
		color 180ms;

	&:hover:not(:disabled) {
		border-color: ${(p) => (p.$on ? T.primary : T.textSecondary)};
		color: ${(p) => (p.$on ? '#ffffff' : T.textStrong)};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

/* Floating pill fixed to the viewport bottom. Always mounted, so it
 * never shifts page layout; visibility rides on opacity + translateY. */
const SaveBar = styled.div<{ $visible: boolean }>`
	position: fixed;
	bottom: 24px;
	left: 50%;
	z-index: 90;
	pointer-events: ${(p) => (p.$visible ? 'auto' : 'none')};
	transform: translate(-50%, ${(p) => (p.$visible ? '0' : '24px')});
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transition:
		opacity 240ms cubic-bezier(0.22, 1, 0.36, 1)
			${(p) => (p.$visible ? '60ms' : '0ms')},
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
	will-change: opacity, transform;

	& > .savebar-pill {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 12px 16px;
		min-width: min(560px, calc(100vw - 48px));
		border-radius: 14px;
		background: #0f172a;
		color: #ffffff;
		/* Layered neutral depth — top inner highlight for lift,
		 * crisp contact shadow, and two soft dark ambient layers. */
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.08),
			0 2px 4px rgba(15, 23, 42, 0.22),
			0 10px 24px -6px rgba(15, 23, 42, 0.3),
			0 28px 60px -16px rgba(15, 23, 42, 0.45);
	}
`

const SaveBarInfo = styled.span`
	font-size: 12.5px;
	font-weight: 600;
`

const SaveBarActions = styled.div`
	display: inline-flex;
	gap: 8px;
`

const PrimaryBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 16px;
	border-radius: 10px;
	border: none;
	background: linear-gradient(135deg, #0284c7, #0369a1);
	color: #ffffff;
	font: inherit;
	font-weight: 700;
	font-size: 12.5px;
	cursor: pointer;

	&:hover:not(:disabled) {
		filter: brightness(1.05);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const GhostBtn = styled.button`
	padding: 8px 14px;
	border-radius: 10px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	background: transparent;
	color: #ffffff;
	font: inherit;
	font-weight: 500;
	font-size: 12.5px;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.08);
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
`

const DangerBtn = styled.button`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 10px;
	border: 1.5px solid rgba(220, 38, 38, 0.5);
	background: #ffffff;
	color: #b91c1c;
	font: inherit;
	font-weight: 600;
	font-size: 12.5px;
	cursor: pointer;

	&:hover:not(:disabled) {
		background: rgba(220, 38, 38, 0.06);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

/* ─── Integrations styles ─────────────────────────────────────── */

/* ─── Vibe Worker webhook block ─────────────────────────────── */

const VIBE_WEBHOOK_PATH = '/webhooks/vibe-worker/job-post'
const VIBE_SECRET_HEADER = 'x-vibe-worker-secret'

const VibeWebhookBlock = () => {
	const { showToast } = useToast()
	const url = `${API_BASE_URL}${VIBE_WEBHOOK_PATH}`

	const copy = async (value: string, label: string) => {
		try {
			await navigator.clipboard.writeText(value)
			showToast(`${label} copied`, 'success')
		} catch {
			showToast('Could not copy', 'error')
		}
	}

	return (
		<WebhookBlock>
			<WebhookRow>
				<label>POST webhook URL</label>
				<div className='value'>
					<code>{url}</code>
					<CopyBtn
						type='button'
						onClick={() => copy(url, 'Webhook URL')}
						aria-label='Copy webhook URL'
					>
						<ContentCopyRounded style={{ fontSize: 14 }} />
					</CopyBtn>
				</div>
			</WebhookRow>
			<WebhookRow>
				<label>Required header</label>
				<div className='value'>
					<code>
						{VIBE_SECRET_HEADER}: &lt;VIBE_WORKER_WEBHOOK_SECRET&gt;
					</code>
					<CopyBtn
						type='button'
						onClick={() => copy(VIBE_SECRET_HEADER, 'Header name')}
						aria-label='Copy header name'
					>
						<ContentCopyRounded style={{ fontSize: 14 }} />
					</CopyBtn>
				</div>
			</WebhookRow>
			<WebhookHint>
				Send one JSON job-post per request. Include{' '}
				<code>x-vibe-worker-event-id</code> for idempotency.
			</WebhookHint>
		</WebhookBlock>
	)
}

/* ─── Integrations (sparkline cards, variant B) ────────────────── */

const INT_ACCENT = '#e85d2f'

const IntGrid = styled.div`
	display: grid;
	gap: 14px;
	/* 3 columns: Vibe spans 2 (left two cells), Discord + Vault stack
	 * in the third column as 2 rows. */
	grid-template-columns: repeat(3, minmax(0, 1fr));
	grid-auto-rows: minmax(0, auto);

	/* Match the stagger cadence of other Settings panels (My account,
	 * registry rows) — each card cascades in one by one. */
	& > * {
		${atom};
	}
	${nthStagger};

	@media (max-width: 820px) {
		grid-template-columns: 1fr;
	}
`

const IntCard = styled.div<{ $wide?: boolean }>`
	display: flex;
	flex-direction: column;
	border: 1px solid ${T.border};
	border-radius: 16px;
	background: #ffffff;
	overflow: hidden;

	${(p) => p.$wide && 'grid-column: span 2;'}

	@media (max-width: 820px) {
		grid-column: auto !important;
		grid-row: auto !important;
	}
`

/* Colored header plaque at the top of each card — holds the icon,
 * service name, and mono-key. Replaces the plain IntHead. */
const IntStrip = styled.div<{ $tone: 'sky' | 'accent' | 'ink' }>`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
	padding: 14px 20px;
	color: #ffffff;
	background: ${(p) =>
		p.$tone === 'sky'
			? T.primary
			: p.$tone === 'accent'
				? '#e85d2f'
				: '#0f172a'};
`

const IntStripTitle = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	color: #ffffff;

	svg {
		font-size: 18px;
		color: #ffffff;
	}

	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-weight: 700;
		font-size: 16px;
		letter-spacing: -0.3px;
		color: #ffffff;
		font-variation-settings: 'opsz' 36;
	}
`

const IntStripKey = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 0.8px;
	text-transform: uppercase;
	color: rgba(255, 255, 255, 0.92);
	padding: 3px 9px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.14);
	line-height: 1.3;
`

const IntBody = styled.div`
	display: flex;
	flex-direction: column;
	padding: 20px;
	flex: 1;
`

const IntHead = styled.div`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 10px;
`

const IntTitle = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;

	h3 {
		margin: 0;
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-weight: 700;
		font-size: 17px;
		letter-spacing: -0.4px;
		color: ${T.textStrong};
		font-variation-settings: 'opsz' 36;
	}
`

const IntIc = styled.span<{ $tone: 'sky' | 'accent' | 'rose' }>`
	width: 28px;
	height: 28px;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: ${(p) =>
		p.$tone === 'sky'
			? 'rgba(2, 132, 199, 0.12)'
			: p.$tone === 'accent'
				? 'rgba(232, 93, 47, 0.14)'
				: 'rgba(225, 29, 72, 0.12)'};
	color: ${(p) =>
		p.$tone === 'sky'
			? T.primary
			: p.$tone === 'accent'
				? INT_ACCENT
				: '#c2410c'};

	svg {
		font-size: 15px;
	}
`

const IntKey = styled.span`
	font-family: 'JetBrains Mono', monospace;
	font-size: 9.5px;
	color: ${T.textMuted};
	letter-spacing: 0.5px;
	text-transform: uppercase;
	align-self: center;
`

const IntMetric = styled.div`
	display: flex;
	align-items: baseline;
	gap: 8px;
	margin-bottom: 2px;

	b {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-weight: 700;
		font-size: 36px;
		letter-spacing: -1.3px;
		line-height: 0.95;
		color: ${T.textStrong};
		font-variation-settings: 'opsz' 72;
	}

	em {
		font-style: normal;
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		color: ${T.textMuted};
		letter-spacing: 0.4px;
		text-transform: uppercase;
	}
`

const IntSub = styled.p`
	margin: 2px 0 14px;
	font-size: 12px;
	color: ${T.textSecondary};
	line-height: 1.5;
`

const IntFoot = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding-top: 14px;
	margin-top: auto;
	border-top: 1px solid ${T.border};
`

const IntStatusDot = styled.span<{ $tone: 'ok' | 'warn' | 'neutral' }>`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	padding: 4px 10px 4px 8px;
	border-radius: 999px;
	font-family: 'JetBrains Mono', monospace;
	font-size: 10.5px;
	font-weight: 700;
	letter-spacing: 0.5px;
	text-transform: uppercase;
	background: ${(p) =>
		p.$tone === 'ok'
			? 'rgba(16, 185, 129, 0.1)'
			: p.$tone === 'warn'
				? 'rgba(217, 119, 6, 0.1)'
				: 'rgba(100, 116, 139, 0.08)'};
	color: ${(p) =>
		p.$tone === 'ok'
			? '#047857'
			: p.$tone === 'warn'
				? '#b45309'
				: '#475569'};

	&::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: ${(p) =>
			p.$tone === 'ok'
				? '#10b981'
				: p.$tone === 'warn'
					? '#d97706'
					: '#94a3b8'};
		box-shadow: 0 0 0 3px
			${(p) =>
				p.$tone === 'ok'
					? 'rgba(16, 185, 129, 0.22)'
					: p.$tone === 'warn'
						? 'rgba(217, 119, 6, 0.22)'
						: 'rgba(100, 116, 139, 0.18)'};
	}
`

/* ─── Vibe webhook styles ─────────────────────────────────────── */

const WebhookBlock = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
	margin: 2px 0 14px;
`

const WebhookRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;

	label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 9.5px;
		letter-spacing: 0.6px;
		text-transform: uppercase;
		color: ${T.textMuted};
	}

	.value {
		display: flex;
		align-items: stretch;
		gap: 4px;
		min-width: 0;
	}

	code {
		flex: 1;
		min-width: 0;
		padding: 7px 10px;
		border-radius: 8px;
		background: rgba(37, 45, 58, 0.04);
		border: 1px solid ${T.border};
		font-family: 'JetBrains Mono', monospace;
		font-size: 11.5px;
		color: ${T.textStrong};
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.5;
	}
`

const CopyBtn = styled.button`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	flex-shrink: 0;
	padding: 0;
	border-radius: 8px;
	background: #ffffff;
	border: 1px solid ${T.border};
	color: ${T.textSecondary};
	cursor: pointer;
	transition: color 160ms, border-color 160ms, background 160ms;

	&:hover {
		color: ${T.primary};
		border-color: ${T.primary};
		background: rgba(3, 105, 161, 0.04);
	}
`

const WebhookHint = styled.p`
	margin: 0;
	font-size: 11.5px;
	color: ${T.textSecondary};
	line-height: 1.5;

	code {
		font-family: 'JetBrains Mono', monospace;
		font-size: 10.5px;
		padding: 1px 5px;
		border-radius: 4px;
		background: rgba(37, 45, 58, 0.05);
		color: ${T.textStrong};
	}
`

/* Outlined buttons, color matches the card's top plaque so the action
 * reads as "part of this integration" without the heavy filled look. */
const IntBtn = styled.button<{ $tone?: 'sky' | 'accent' | 'ink' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 10px;
	font: inherit;
	font-weight: 600;
	font-size: 12.5px;
	cursor: pointer;
	background: transparent;
	color: ${(p) =>
		p.$tone === 'accent'
			? '#e85d2f'
			: p.$tone === 'ink'
				? '#0f172a'
				: T.primary};
	border: 1.5px solid
		${(p) =>
			p.$tone === 'accent'
				? 'rgba(232, 93, 47, 0.4)'
				: p.$tone === 'ink'
					? 'rgba(15, 23, 42, 0.3)'
					: 'rgba(3, 105, 161, 0.3)'};
	transition: background 160ms, border-color 160ms;

	&:hover:not(:disabled) {
		background: ${(p) =>
			p.$tone === 'accent'
				? 'rgba(232, 93, 47, 0.06)'
				: p.$tone === 'ink'
					? 'rgba(15, 23, 42, 0.04)'
					: 'rgba(3, 105, 161, 0.06)'};
		border-color: ${(p) =>
			p.$tone === 'accent'
				? '#e85d2f'
				: p.$tone === 'ink'
					? '#0f172a'
					: T.primary};
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const EmptyState = styled.div`
	padding: 48px 24px;
	text-align: center;
	border-radius: 14px;
	border: 1px dashed rgba(15, 23, 42, 0.1);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
	color: ${T.textSecondary};

	h3 {
		margin: 0;
		font-size: 15px;
		color: ${T.textStrong};
	}
	p {
		margin: 0;
		font-size: 12.5px;
	}
`

const RetryBtn = styled.button`
	margin-top: 10px;
	padding: 8px 16px;
	border-radius: 10px;
	border: 1.5px solid ${T.primary};
	background: #ffffff;
	color: ${T.primary};
	font: inherit;
	font-weight: 600;
	cursor: pointer;

	&:hover {
		background: ${T.primaryTint};
	}
`

const ContentSkeleton = styled.div`
	height: 320px;
	border-radius: ${T.radius};
	background: linear-gradient(
		90deg,
		rgba(15, 23, 42, 0.03) 0%,
		rgba(15, 23, 42, 0.06) 50%,
		rgba(15, 23, 42, 0.03) 100%
	);
	animation: pulse 1.4s ease-in-out infinite;

	@keyframes pulse {
		0% {
			opacity: 0.6;
		}
		50% {
			opacity: 0.85;
		}
		100% {
			opacity: 0.6;
		}
	}
`
