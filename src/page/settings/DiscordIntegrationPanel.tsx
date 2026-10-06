import { useMemo, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import {
	CheckCircleRounded,
	ErrorOutlineRounded,
	WarningAmberRounded,
	BoltRounded,
	VerifiedUserOutlined,
	SendRounded,
	PreviewRounded,
	HubOutlined,
	WbSunnyRounded,
	CloudQueueRounded,
	BlurOnRounded,
	SensorsRounded,
} from '@mui/icons-material'

import {
	useActivateDiscordProfileMutation,
	useListDiscordProfilesQuery,
	useSendDiscordPreviewMutation,
	useSendDiscordTestMutation,
	useVerifyDiscordProfileMutation,
	type DiscordPreviewJob,
	type DiscordProfileName,
	type DiscordProfileView,
	type DiscordVerifyResult,
	type UpdateDiscordProfileBody,
	type VerifyChannelKey,
} from '../../store/discord-integration/discordIntegrationApi'
import { useToast } from '../../context/toast/ToastContext'
import parseServerError from '../../utils/parseServerError'
import ConfirmModal from '../../components/_shared/ConfirmModal'
import { AnimatedSegmented } from '../../components/_shared/AnimatedSegmented'
import {
	Section as PfSection,
	SectionHeadWrap as PfSectionHeadWrap,
	SectionNum as PfSectionNum,
	SectionText as PfSectionText,
	SectionTitle as PfSectionTitle,
	SectionHint as PfSectionHint,
	FieldGrid as PfFieldGrid,
	FieldRoot as PfFieldRoot,
	FieldLabel as PfFieldLabel,
	type FieldSpan,
} from '../../components/_shared/formShell.styled'
import useTheme from '../../theme/useTheme'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { atom, nthStagger } from './_shared/stagger'

const PREVIEW_JOBS: Array<{ key: DiscordPreviewJob; label: string }> = [
	{ key: 'REPORT', label: 'Report (daily)' },
	{ key: 'LATE_REPORT', label: 'Late report' },
	{ key: 'BIRTHDAY', label: 'Birthday' },
	{ key: 'ABSENCES', label: 'Absences' },
	{ key: 'REMINDER_18', label: 'Reminder 18:00' },
	{ key: 'DAILY_DIGEST_19', label: 'Daily digest 19:00' },
	{ key: 'WEEKLY_DIGEST', label: 'Weekly digest' },
]

type Draft = Partial<UpdateDiscordProfileBody>

/**
 * Flat key scheme used by SettingsPage.pending to store Discord
 * drafts alongside dynamic-section + Backups edits. The parent is
 * the source of truth; ProfileCard only reads/writes through it.
 */
export const DISCORD_KEY_PREFIX = 'discord'

export const discordPendingKey = (profile: DiscordProfileName, field: string) =>
	`${DISCORD_KEY_PREFIX}.${profile}.${field}`

export const parseDiscordPendingKey = (
	key: string
): { profile: DiscordProfileName; field: string } | null => {
	if (!key.startsWith(`${DISCORD_KEY_PREFIX}.`)) return null
	const [, profile, ...rest] = key.split('.')
	if (!rest.length) return null
	if (profile !== 'TEST' && profile !== 'PRODUCTION') return null
	return { profile, field: rest.join('.') }
}

export interface DiscordIntegrationPanelProps {
	pending?: Record<string, unknown>
	onFieldChange?: (key: string, value: unknown) => void
}

const DiscordIntegrationPanel = ({ pending, onFieldChange }: DiscordIntegrationPanelProps = {}) => {
	const { data: profiles = [], isLoading, isError, refetch } = useListDiscordProfilesQuery()

	// Default to the backend-active profile; fall back to the first one.
	// We only track the user's VIEW selection — flipping which profile is
	// backend-active still goes through the explicit "Activate" button
	// inside ProfileCard.
	const [selected, setSelected] = useState<DiscordProfileName | null>(null)
	const effective: DiscordProfileName | null = useMemo(() => {
		if (selected && profiles.some((p) => p.name === selected)) return selected
		const activeOne = profiles.find((p) => p.active)
		return activeOne?.name ?? profiles[0]?.name ?? null
	}, [selected, profiles])

	const selectedProfile = profiles.find((p) => p.name === effective) ?? null

	return (
		<Shell>
			<EnvCard profiles={profiles} />
			{isLoading && <Skeleton>Loading profiles…</Skeleton>}
			{isError && (
				<ErrorCard onRetry={() => void refetch()}>Could not load Discord profiles.</ErrorCard>
			)}
			{selectedProfile && (
				<RailRow>
					<SwitcherLine>
						<SwitcherSkin>
							<AnimatedSegmented<DiscordProfileName>
								items={profiles.map((p) => ({
									value: p.name,
									label: p.name === 'TEST' ? 'Test' : 'Production',
								}))}
								active={effective ?? ''}
								onSelect={(v) => {
									if (v) setSelected(v)
								}}
							/>
						</SwitcherSkin>
						<SwitcherHint aria-hidden='true'>
							<HintArrow>
								<svg viewBox='0 0 110 34' width='110' height='34'>
									<path
										d='M 100 8 C 76 26, 44 30, 16 22'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
									/>
									<path
										d='M 16 22 L 26 14 M 16 22 L 24 30'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
										strokeLinejoin='round'
									/>
								</svg>
							</HintArrow>
							<HintLabel>pick an environment</HintLabel>
						</SwitcherHint>
					</SwitcherLine>
					<ProfilePane key={selectedProfile.name}>
						<ProfileCard
							profile={selectedProfile}
							pending={pending}
							onFieldChange={onFieldChange}
						/>
					</ProfilePane>
				</RailRow>
			)}
		</Shell>
	)
}

export default DiscordIntegrationPanel

/* ─── env card ──────────────────────────────────────────────── */

const EnvCard = ({ profiles }: { profiles: DiscordProfileView[] }) => {
	const env = profiles[0]?.envStatus ?? {
		appIdSet: false,
		publicKeySet: false,
		botTokenSet: false,
	}
	return (
		<Card>
			<CardHead>
				<CardTitle>
					<HubOutlined /> Environment
				</CardTitle>
				<CardHint>
					Secrets live only in <code>.env</code> on the server. Guild & channel IDs are stored
					per-profile below.
				</CardHint>
			</CardHead>
			<EnvChecklist>
				<EnvCheckItem $ok={env.appIdSet} name='DISCORD_APP_ID' />
				<EnvCheckItem $ok={env.publicKeySet} name='DISCORD_PUBLIC_KEY' />
				<EnvCheckItem $ok={env.botTokenSet} name='DISCORD_BOT_TOKEN' />
			</EnvChecklist>
		</Card>
	)
}

/* ─── profile card ──────────────────────────────────────────── */

const ProfileCard = ({
	profile,
	pending,
	onFieldChange,
}: {
	profile: DiscordProfileView
	pending?: Record<string, unknown>
	onFieldChange?: (key: string, value: unknown) => void
}) => {
	const { showToast } = useToast()
	const { theme } = useTheme()
	const isDark = theme.mode.name === 'dark'
	const themePrimary = theme.primaryColor.color
	const [activate, { isLoading: isActivating }] = useActivateDiscordProfileMutation()
	const [verify, { isLoading: isVerifying }] = useVerifyDiscordProfileMutation()
	const [sendTest, { isLoading: isSendingTest }] = useSendDiscordTestMutation()
	const [sendPreview, { isLoading: isSendingPreview }] = useSendDiscordPreviewMutation()

	const [confirmActivate, setConfirmActivate] = useState(false)
	const [verifyResult, setVerifyResult] = useState<DiscordVerifyResult | null>(null)
	const [previewJob, setPreviewJob] = useState<DiscordPreviewJob>('REPORT')

	/* Draft lives up in SettingsPage.pending; filter the keys that
	   belong to this profile and strip the `discord.{profile}.`
	   prefix so the merged view treats them as plain field names. */
	const profileDraft: Draft = useMemo(() => {
		if (!pending) return {}
		const out: Record<string, unknown> = {}
		for (const [k, v] of Object.entries(pending)) {
			const parsed = parseDiscordPendingKey(k)
			if (parsed && parsed.profile === profile.name) {
				out[parsed.field] = v
			}
		}
		return out as Draft
	}, [pending, profile.name])

	const merged: DiscordProfileView = useMemo(
		() => ({ ...profile, ...(profileDraft as object) }) as DiscordProfileView,
		[profile, profileDraft]
	)

	const setField = <K extends keyof UpdateDiscordProfileBody>(
		k: K,
		v: UpdateDiscordProfileBody[K]
	) => {
		onFieldChange?.(discordPendingKey(profile.name, k as string), v)
	}

	const isFieldDirty = (field: keyof UpdateDiscordProfileBody): boolean =>
		Object.prototype.hasOwnProperty.call(profileDraft, field as string)

	const doActivate = async () => {
		try {
			await activate(profile.name).unwrap()
			showToast(`${profile.name} is now the active profile`, 'success')
			setConfirmActivate(false)
		} catch (err) {
			showToast(parseServerError(err), 'error')
			setConfirmActivate(false)
		}
	}

	const doVerify = async () => {
		try {
			const r = await verify(profile.name).unwrap()
			setVerifyResult(r)
			const hasErrors =
				(r.guild.configured && !r.guild.ok) ||
				(r.role.configured && !r.role.ok) ||
				Object.values(r.channels).some((c) => c.configured && !c.ok) ||
				(r.guild.configured && !r.botInGuild.ok)
			showToast(
				hasErrors
					? 'Verify finished — see details for missing access'
					: 'Verify finished — all configured items are reachable',
				hasErrors ? 'error' : 'success'
			)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const doSendTest = async () => {
		try {
			const r = await sendTest(profile.name).unwrap()
			showToast(`Test posted — message ${r.messageId}`, 'success')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	const doSendPreview = async () => {
		try {
			const r = await sendPreview({ name: profile.name, job: previewJob }).unwrap()
			showToast(`Preview posted to ${r.channel} — message ${r.messageId}`, 'success')
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Card>
			<CardHead>
				<ProfileWeather $state={weatherState(profile)} />
				{(profile.lastSuccessAt || profile.lastFailureAt) && (
					<Badges>
						{profile.lastSuccessAt && (
							<Badge $tone='muted'>
								last sent {new Date(profile.lastSuccessAt).toLocaleString()}
							</Badge>
						)}
						{profile.lastFailureAt && (
							<Badge $tone='error'>
								last failure {new Date(profile.lastFailureAt).toLocaleString()}
							</Badge>
						)}
					</Badges>
				)}
			</CardHead>
			{profile.lastFailureMessage && (
				<LastFailure>
					<ErrorOutlineRounded style={{ fontSize: 16 }} />
					<span>{profile.lastFailureMessage}</span>
				</LastFailure>
			)}

			<Section>
				<SectionTitle>Routing</SectionTitle>
				<LedgerList>
					<LedgerField
						label='Guild'
						hint='Discord server ID — snowflake, 17–20 digits'
						value={merged.guildId ?? ''}
						onChange={(v) => setField('guildId', v || null)}
						dirty={isFieldDirty('guildId')}
					/>
					<LedgerField
						label='PMS channel'
						hint='reminder · daily digest · weekly digest · absences · late'
						value={merged.pmsChannelId ?? ''}
						onChange={(v) => setField('pmsChannelId', v || null)}
						dirty={isFieldDirty('pmsChannelId')}
					/>
					<LedgerField
						label='General channel'
						hint='birthday pings'
						value={merged.generalChannelId ?? ''}
						onChange={(v) => setField('generalChannelId', v || null)}
						dirty={isFieldDirty('generalChannelId')}
					/>
					<LedgerField
						label='Sales channel'
						hint='lead-flow notifications'
						value={merged.salesChannelId ?? ''}
						onChange={(v) => setField('salesChannelId', v || null)}
						dirty={isFieldDirty('salesChannelId')}
					/>
					<LedgerField
						label='Ops channel'
						hint='technical failure alerts'
						value={merged.opsChannelId ?? ''}
						onChange={(v) => setField('opsChannelId', v || null)}
						dirty={isFieldDirty('opsChannelId')}
					/>
					<LedgerField
						label='Manager role'
						hint='mentioned by the 18:00 reminder'
						value={merged.managerRoleId ?? ''}
						onChange={(v) => setField('managerRoleId', v || null)}
						dirty={isFieldDirty('managerRoleId')}
					/>
					<LedgerField
						label='Timezone'
						hint='IANA zone, e.g. Europe/Kyiv'
						value={merged.timezone ?? ''}
						onChange={(v) => setField('timezone', v)}
						dirty={isFieldDirty('timezone')}
					/>
				</LedgerList>
			</Section>

			<ScheduleStack>
				<ScheduleBlock
					num='01'
					title='Reports'
					hint='Reminder, daily digest and late-report pings'
					enabled={merged.reportsEnabled}
					onToggle={(v) => setField('reportsEnabled', v)}
					toggleDirty={isFieldDirty('reportsEnabled')}
					isDark={isDark}
					primary={themePrimary}
				>
					<ScheduleField label='Reminder at' span='third' dirty={isFieldDirty('reminderAt')}>
						<ScheduleInput
							value={merged.reminderAt ?? ''}
							onChange={(e) => setField('reminderAt', e.target.value)}
							placeholder='HH:MM'
						/>
					</ScheduleField>
					<ScheduleField
						label='Daily digest at'
						span='third'
						dirty={isFieldDirty('dailyDigestAt')}
					>
						<ScheduleInput
							value={merged.dailyDigestAt ?? ''}
							onChange={(e) => setField('dailyDigestAt', e.target.value)}
							placeholder='HH:MM'
						/>
					</ScheduleField>
					<ScheduleField
						label='Cutoff hour'
						hint='0..23'
						span='third'
						dirty={isFieldDirty('cutoffHour')}
					>
						<ScheduleInput
							type='number'
							value={merged.cutoffHour != null ? String(merged.cutoffHour) : ''}
							onChange={(e) =>
								setField(
									'cutoffHour',
									Math.max(0, Math.min(23, Number(e.target.value) || 0))
								)
							}
							placeholder='0'
						/>
					</ScheduleField>
				</ScheduleBlock>

				<ScheduleBlock
					num='02'
					title='Weekly digest'
					hint='Rolls up the week on a chosen weekday'
					enabled={merged.weeklyEnabled}
					onToggle={(v) => setField('weeklyEnabled', v)}
					toggleDirty={isFieldDirty('weeklyEnabled')}
					isDark={isDark}
					primary={themePrimary}
				>
					<ScheduleField
						label='Weekday'
						hint='0=Sun … 6=Sat'
						span='quarter'
						dirty={isFieldDirty('weeklyDigestDay')}
					>
						<ScheduleInput
							type='number'
							value={merged.weeklyDigestDay != null ? String(merged.weeklyDigestDay) : ''}
							onChange={(e) =>
								setField(
									'weeklyDigestDay',
									Math.max(0, Math.min(6, Number(e.target.value) || 0))
								)
							}
							placeholder='0'
						/>
					</ScheduleField>
					<ScheduleField label='At' span='quarter' dirty={isFieldDirty('weeklyDigestAt')}>
						<ScheduleInput
							value={merged.weeklyDigestAt ?? ''}
							onChange={(e) => setField('weeklyDigestAt', e.target.value)}
							placeholder='HH:MM'
						/>
					</ScheduleField>
				</ScheduleBlock>

				<ScheduleBlock
					num='03'
					title='Birthdays'
					hint="Pings on each employee's birthday"
					enabled={merged.birthdaysEnabled}
					onToggle={(v) => setField('birthdaysEnabled', v)}
					toggleDirty={isFieldDirty('birthdaysEnabled')}
					isDark={isDark}
					primary={themePrimary}
				>
					<ScheduleField label='At' span='quarter' dirty={isFieldDirty('birthdayAt')}>
						<ScheduleInput
							value={merged.birthdayAt ?? ''}
							onChange={(e) => setField('birthdayAt', e.target.value)}
							placeholder='HH:MM'
						/>
					</ScheduleField>
				</ScheduleBlock>

				<ScheduleBlock
					num='04'
					title='Absences'
					hint='Weekday absence roll-up'
					enabled={merged.absencesEnabled}
					onToggle={(v) => setField('absencesEnabled', v)}
					toggleDirty={isFieldDirty('absencesEnabled')}
					isDark={isDark}
					primary={themePrimary}
				>
					<ScheduleField label='At' span='quarter' dirty={isFieldDirty('absencesAt')}>
						<ScheduleInput
							value={merged.absencesAt ?? ''}
							onChange={(e) => setField('absencesAt', e.target.value)}
							placeholder='HH:MM'
						/>
					</ScheduleField>
				</ScheduleBlock>
			</ScheduleStack>

			<NumberedSection
				num='05'
				title='Diagnostics & tests'
				hint='Validate access and preview messages without affecting live traffic.'
				isDark={isDark}
				primary={themePrimary}
			>
				<ActionList>
					<ActionRow>
						<ActionIcon $tone='primary'>
							<VerifiedUserOutlined sx={{ fontSize: 20 }} />
						</ActionIcon>
						<ActionMeta>
							<ActionTitle>Verify access</ActionTitle>
							<ActionDesc>
								Checks the bot can reach the guild, channels and manager role. Nothing is
								posted to Discord.
							</ActionDesc>
						</ActionMeta>
						<ActionCta>
							<Btn $tone='primary' onClick={doVerify} disabled={isVerifying}>
								{isVerifying ? 'Checking…' : 'Run check'}
							</Btn>
						</ActionCta>
					</ActionRow>
					{verifyResult && (
						<ActionRow $noLine>
							<span />
							<VerifyResultBlock result={verifyResult} />
							<span />
						</ActionRow>
					)}
					<ActionRow>
						<ActionIcon $tone='primary'>
							<SendRounded sx={{ fontSize: 20 }} />
						</ActionIcon>
						<ActionMeta>
							<ActionTitle>Send test to PMS</ActionTitle>
							<ActionDesc>
								Posts a short canary message to the configured PMS channel so you can
								confirm live delivery works.
							</ActionDesc>
						</ActionMeta>
						<ActionCta>
							<Btn $tone='primary' onClick={doSendTest} disabled={isSendingTest}>
								{isSendingTest ? 'Sending…' : 'Send'}
							</Btn>
						</ActionCta>
					</ActionRow>
					<ActionRow>
						<ActionIcon $tone='primary'>
							<PreviewRounded sx={{ fontSize: 20 }} />
						</ActionIcon>
						<ActionMeta>
							<ActionTitle>Preview a scheduled job</ActionTitle>
							<ActionDesc>
								Renders one of the scheduled messages (daily report, birthdays, reminders…)
								and posts it to its configured channel right now.
							</ActionDesc>
						</ActionMeta>
						<ActionCta>
							<PreviewSelect
								value={previewJob}
								onChange={(e) => setPreviewJob(e.target.value as DiscordPreviewJob)}
							>
								{PREVIEW_JOBS.map((j) => (
									<option key={j.key} value={j.key}>
										{j.label}
									</option>
								))}
							</PreviewSelect>
							<Btn $tone='primary' onClick={doSendPreview} disabled={isSendingPreview}>
								{isSendingPreview ? 'Posting…' : 'Post'}
							</Btn>
						</ActionCta>
					</ActionRow>
				</ActionList>
			</NumberedSection>

			<NumberedSection
				num='06'
				title='Activate for live traffic'
				hint='Only one profile at a time can receive real Discord notifications.'
				isDark={isDark}
				primary={themePrimary}
			>
				{profile.active ? (
					<LiveCallout>
						<LiveIcon>
							<SensorsRounded sx={{ fontSize: 22 }} />
						</LiveIcon>
						<ActionMeta>
							<ActionDesc>
								All scheduled Discord notifications currently route through this profile.
							</ActionDesc>
						</ActionMeta>
						<LiveBadge>LIVE</LiveBadge>
					</LiveCallout>
				) : (
					<Callout>
						<ActionIcon $tone='brand'>
							<BoltRounded sx={{ fontSize: 20 }} />
						</ActionIcon>
						<ActionMeta>
							<ActionDesc>
								The current active profile will be deactivated and scheduled jobs start
								using <b>{profile.name}</b> immediately. Nothing is sent to Discord as a
								side effect.
								{!profile.configured && (
									<>
										{' '}
										<ActivateWarning>
											Fill guild, PMS and General channel ids, and manager role id first.
										</ActivateWarning>
									</>
								)}
							</ActionDesc>
						</ActionMeta>
						<ActionCta>
							<Btn
								$tone='brand'
								onClick={() => setConfirmActivate(true)}
								disabled={!profile.configured || isActivating}
							>
								<BoltRounded style={{ fontSize: 16 }} />
								Activate profile
							</Btn>
						</ActionCta>
					</Callout>
				)}
			</NumberedSection>

			{confirmActivate && (
				<ConfirmModal
					icon={<BoltRounded />}
					iconTone='warning'
					title={`Activate ${profile.name} profile?`}
					description={
						<>
							This will immediately deactivate the currently active profile and route every
							outbound Discord notification through <b>{profile.name}</b>. Nothing is sent to
							Discord as a side effect of this action — the next scheduled job uses the new
							profile.
						</>
					}
					confirmLabel='Activate'
					confirmColor='warning'
					onConfirm={doActivate}
					onClose={() => setConfirmActivate(false)}
					isLoading={isActivating}
				/>
			)}
		</Card>
	)
}

/* ─── small helpers ─────────────────────────────────────────── */

const VerifyResultBlock = ({ result }: { result: DiscordVerifyResult }) => {
	const row = (
		label: string,
		cfg: boolean,
		ok: boolean,
		name: string | undefined,
		err: string | undefined
	) => (
		<VerifyRow key={label}>
			<VerifyLabel>{label}</VerifyLabel>
			<VerifyStatus $ok={ok} $cfg={cfg}>
				{!cfg ? (
					<>
						<WarningAmberRounded style={{ fontSize: 14 }} /> not configured
					</>
				) : ok ? (
					<>
						<CheckCircleRounded style={{ fontSize: 14 }} /> {name ?? 'ok'}
					</>
				) : (
					<>
						<ErrorOutlineRounded style={{ fontSize: 14 }} /> {err ?? 'error'}
					</>
				)}
			</VerifyStatus>
		</VerifyRow>
	)
	const channelLabel: Record<VerifyChannelKey, string> = {
		pmsChannelId: 'PMS channel',
		generalChannelId: 'General channel',
		salesChannelId: 'Sales channel',
		opsChannelId: 'Ops channel',
	}
	return (
		<Section>
			<SectionTitle>
				Verify result · {new Date(result.checkedAt).toLocaleTimeString()}
			</SectionTitle>
			{row(
				'Guild',
				result.guild.configured,
				result.guild.ok,
				result.guild.name,
				result.guild.error
			)}
			{row(
				'Bot in guild',
				result.guild.configured,
				result.botInGuild.ok,
				result.botInGuild.ok
					? `${result.botInGuild.roleCount ?? 0} roles granted to bot`
					: undefined,
				result.botInGuild.error
			)}
			{(Object.keys(result.channels) as VerifyChannelKey[]).map((k) =>
				row(
					channelLabel[k],
					result.channels[k].configured,
					result.channels[k].ok,
					result.channels[k].name,
					result.channels[k].error
				)
			)}
			{row(
				'Manager role',
				result.role.configured,
				result.role.ok,
				result.role.name,
				result.role.error
			)}
		</Section>
	)
}

const FormField = ({
	label,
	hint,
	value,
	onChange,
	type = 'text',
}: {
	label: string
	hint?: string
	value: string
	onChange: (v: string) => void
	type?: 'text' | 'number'
}) => (
	<FieldRoot>
		<FieldLabel>{label}</FieldLabel>
		<FieldInput
			type={type}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			placeholder={type === 'number' ? '0' : ''}
		/>
		{hint && <FieldHint>{hint}</FieldHint>}
	</FieldRoot>
)

/**
 * Ledger-style field used by the Routing block (R2 variant). Reads
 * like a book contents / accounting ledger: Fraunces label with a
 * small Inter sub-hint on the left, a dotted leader fills the gap,
 * and the mono-ID lives on the right as a borderless input. Empty
 * values show "not set" in amber italic (the same tape colour used
 * for other "missing" states on the page).
 */
const LedgerField = ({
	label,
	hint,
	value,
	onChange,
	dirty = false,
}: {
	label: string
	hint?: string
	value: string
	onChange: (v: string) => void
	dirty?: boolean
}) => (
	<LedgerRow>
		<LedgerLabel>
			<LedgerLabelMain>{label}</LedgerLabelMain>
			{hint && <LedgerLabelSub>{hint}</LedgerLabelSub>}
		</LedgerLabel>
		<LedgerRight>
			<LedgerValue
				$empty={!value}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder='not set'
				spellCheck={false}
				autoCorrect='off'
				autoCapitalize='off'
			/>
			<MetaSlot aria-hidden={!dirty}>
				<DirtyTape $visible={dirty}>unsaved</DirtyTape>
			</MetaSlot>
		</LedgerRight>
	</LedgerRow>
)

const Toggle = ({
	label,
	checked,
	onChange,
}: {
	label: string
	checked: boolean
	onChange: (v: boolean) => void
}) => (
	<ToggleRow $on={checked} onClick={() => onChange(!checked)}>
		<ToggleKnob $on={checked} />
		<span>{label}</span>
	</ToggleRow>
)

/* ─── Notifications & schedule (PortfolioForm canon) ───────── */

/**
 * One numbered schedule block — identical shape to a Section in
 * PortfolioForm.page.tsx: `01` Bebas Neue tint-pill badge on the
 * left, title + hint in the middle, header-right toggle to
 * enable/disable the whole notification type. The time inputs
 * live below in a 12-col FieldGrid.
 */
const ScheduleBlock = ({
	num,
	title,
	hint,
	enabled,
	onToggle,
	toggleDirty = false,
	isDark,
	primary,
	children,
}: {
	num: string
	title: string
	hint: string
	enabled: boolean
	onToggle: (v: boolean) => void
	toggleDirty?: boolean
	isDark: boolean
	primary: string
	children: React.ReactNode
}) => (
	<PfSection $delay={0}>
		<PfSectionHeadWrap>
			<PfSectionNum $dark={isDark} $primary={primary}>
				{num}
			</PfSectionNum>
			<PfSectionText>
				<PfSectionTitle>{title}</PfSectionTitle>
				<PfSectionHint $dark={isDark}>{hint}</PfSectionHint>
			</PfSectionText>
			<ScheduleHeadRight>
				<ScheduleHeadToggle onClick={() => onToggle(!enabled)}>
					<ToggleKnob $on={enabled} />
				</ScheduleHeadToggle>
				<ScheduleHeadMetaSlot aria-hidden={!toggleDirty}>
					<DirtyTape $visible={toggleDirty}>unsaved</DirtyTape>
				</ScheduleHeadMetaSlot>
			</ScheduleHeadRight>
		</PfSectionHeadWrap>
		<PfFieldGrid>{children}</PfFieldGrid>
	</PfSection>
)

/**
 * Same numbered-section header as ScheduleBlock, but without the
 * header toggle on the right. Used by the 05 Diagnostics & 06
 * Activation blocks where the content below the header is a
 * free-form action list, not a FieldGrid.
 *
 * Rendered as a plain flex-column (not PfSection) so the content
 * is NOT squeezed by formShell's default `padding: 28px 32px 8px`
 * — the parent Card already paints its own padding and we want
 * callouts to go edge-to-edge inside the Card.
 */
const NumberedSection = ({
	num,
	title,
	hint,
	isDark,
	primary,
	children,
}: {
	num: string
	title: string
	hint: string
	isDark: boolean
	primary: string
	children: React.ReactNode
}) => (
	<NumberedSectionShell>
		<PfSectionHeadWrap>
			<PfSectionNum $dark={isDark} $primary={primary}>
				{num}
			</PfSectionNum>
			<PfSectionText>
				<PfSectionTitle>{title}</PfSectionTitle>
				<PfSectionHint $dark={isDark}>{hint}</PfSectionHint>
			</PfSectionText>
		</PfSectionHeadWrap>
		{children}
	</NumberedSectionShell>
)

const ScheduleField = ({
	label,
	hint,
	span = 'auto',
	dirty = false,
	children,
}: {
	label: string
	hint?: string
	span?: FieldSpan
	dirty?: boolean
	children: React.ReactNode
}) => (
	<PfFieldRoot $span={span}>
		<PfFieldLabel>{label}</PfFieldLabel>
		{children}
		{hint && <ScheduleFieldHint>{hint}</ScheduleFieldHint>}
		<MetaSlot aria-hidden={!dirty}>
			<DirtyTape $visible={dirty}>unsaved</DirtyTape>
		</MetaSlot>
	</PfFieldRoot>
)

const ErrorCard = ({ children, onRetry }: { children: React.ReactNode; onRetry: () => void }) => (
	<Card>
		<CardHead>
			<CardTitle>
				<ErrorOutlineRounded /> Error
			</CardTitle>
		</CardHead>
		<p>{children}</p>
		<Btn $tone='ghost' onClick={onRetry}>
			Retry
		</Btn>
	</Card>
)

/* ─── styled ────────────────────────────────────────────────── */

const Shell = styled.div`
	display: flex;
	flex-direction: column;
	gap: 20px;

	& > * {
		${atom}
	}
	${nthStagger}
`

/* ─── Profile switcher — V2 "server rail" ─────────────────────── */

const RailRow = styled.div`
	display: flex;
	flex-direction: column;
	gap: 14px;
`

/* Horizontal row for the switcher + its hand-drawn hint. Hint hides
   on narrow screens — it is purely decorative. */
const SwitcherLine = styled.div`
	display: flex;
	align-items: center;
	gap: 10px;
	flex-wrap: wrap;
`

const hintArrowDraw = keyframes`
	from { stroke-dashoffset: 240; }
	to   { stroke-dashoffset: 0; }
`

const hintFadeIn = keyframes`
	from { opacity: 0; transform: translateX(-6px) rotate(-2deg); }
	to   { opacity: 1; transform: translateX(0) rotate(-2deg); }
`

const SwitcherHint = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 2px;
	color: #e85d2f;
	transform: rotate(-2deg);
	animation: ${hintFadeIn} 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
	user-select: none;

	@media (max-width: 640px) {
		display: none;
	}

	@media (prefers-reduced-motion: reduce) {
		animation: none;
	}
`

const HintArrow = styled.span`
	display: inline-flex;
	opacity: 0.9;
	margin-right: -2px;

	svg path {
		stroke-dasharray: 240;
		stroke-dashoffset: 240;
		animation: ${hintArrowDraw} 1s cubic-bezier(0.22, 1, 0.36, 1) 0.35s forwards;
	}

	@media (prefers-reduced-motion: reduce) {
		svg path {
			animation: none;
			stroke-dashoffset: 0;
		}
	}
`

const HintLabel = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-weight: 700;
	font-size: 22px;
	line-height: 1;
	letter-spacing: 0.3px;
	white-space: nowrap;
`

/**
 * Local skin override for AnimatedSegmented on this page only: paint
 * the active-pill brand-orange, center the button labels, force the
 * active label to white. No dot, no ping ring.
 */
const SwitcherSkin = styled.div`
	& > div {
		align-self: flex-start;
	}
	/* SegGroup is a div; its first child is the SegIndicator span. */
	& > div > span:first-child {
		background: #e85d2f;
		box-shadow: none;
	}
	& > div > button {
		padding: 10px 22px;
		justify-content: center;
		text-align: center;
	}
	& > div > button[data-active='true'] {
		color: #ffffff;
	}
	& > div > button[data-active='true']:hover {
		color: #ffffff;
	}
`

const ProfilePane = styled.div`
	/* ProfilePane is remounted via its React key when the user
	   flips TEST ↔ PRODUCTION, so every atom animation inside
	   replays on each environment switch in addition to the
	   initial page load. The actual row-by-row cascade is applied
	   on the containers (CardHead / Grid / Toggles / Actions) via
	   the shared "atom + nthStagger" pattern used across every
	   other Settings panel. */
`

const Card = styled.section`
	background: ${T.cardBg};
	border-radius: 14px;
	padding: 18px 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
	border: 1px solid rgba(15, 23, 42, 0.06);
`

const CardHead = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;

	& > * {
		${atom};
	}
	${nthStagger};
`

const CardTitle = styled.h3`
	margin: 0;
	font-family: 'Fraunces', 'Georgia', serif;
	font-size: 17px;
	font-weight: 600;
	letter-spacing: -0.2px;
	color: ${T.textStrong};
	display: flex;
	align-items: center;
	gap: 8px;
`

const CardHint = styled.p`
	font-size: 13px;
	color: ${T.textMuted};
	margin: 0;
	code {
		background: ${T.subtleBg};
		padding: 1px 6px;
		border-radius: 4px;
	}
`

/* ─── Profile weather status ───────────────────────────────── */

/**
 * Y1 "Weather forecast" treatment for the profile's live-ness.
 * Three states carry the whole active × configured matrix:
 *   - live  = active + configured  → sunny
 *   - idle  = inactive but configured → overcast
 *   - setup = anything not configured → fog, cannot activate yet.
 *
 * The whole widget replaces the ACTIVE / INACTIVE / CONFIGURED /
 * INCOMPLETE pill cluster; last-sent / last-failure stamps still
 * live below as small Badges.
 */
type WeatherState = 'live' | 'idle' | 'setup'

function weatherState(p: { active: boolean; configured: boolean }): WeatherState {
	if (!p.configured) return 'setup'
	return p.active ? 'live' : 'idle'
}

const WEATHER_COPY: Record<WeatherState, { head: string; desc: string }> = {
	live: {
		head: 'Clear and live',
		desc: 'Active profile, Discord is receiving traffic.',
	},
	idle: {
		head: 'Overcast, idle',
		desc: 'Fully configured but not currently sending.',
	},
	setup: {
		head: 'Fog, setup needed',
		desc: 'Required IDs still missing. Fill them in to activate.',
	},
}

const ProfileWeather = ({ $state }: { $state: WeatherState }) => {
	const copy = WEATHER_COPY[$state]
	return (
		<WeatherRow>
			<WeatherIcon $state={$state} aria-hidden='true'>
				{$state === 'live' && <WbSunnyRounded sx={{ fontSize: 44 }} />}
				{$state === 'idle' && <CloudQueueRounded sx={{ fontSize: 44 }} />}
				{$state === 'setup' && <BlurOnRounded sx={{ fontSize: 44 }} />}
			</WeatherIcon>
			<div>
				<WeatherHead $state={$state}>{copy.head}</WeatherHead>
				<WeatherDesc>{copy.desc}</WeatherDesc>
			</div>
		</WeatherRow>
	)
}

/* ─── Environment checklist (W2) ───────────────────────────── */

/**
 * Honest to-do list, no pill chrome. Done items get a filled dark
 * check-box with an ivory check-icon; missing items keep the empty
 * box, flip the key to amber, and gain a hand-written "missing"
 * marginal note. The whole thing reads like a page in a notebook,
 * which is the whole point.
 */
const EnvCheckItem = ({ $ok, name }: { $ok: boolean; name: string }) => (
	<EnvCheckRow>
		<EnvCheckBox $ok={$ok} aria-hidden='true'>
			{$ok && (
				<svg
					width='11'
					height='11'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='4'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<polyline points='20 6 9 17 4 12' />
				</svg>
			)}
		</EnvCheckBox>
		<EnvKey $ok={$ok}>{name}</EnvKey>
		{!$ok && <EnvMissingMark aria-hidden='true'>missing</EnvMissingMark>}
	</EnvCheckRow>
)

const EnvChecklist = styled.ul`
	list-style: none;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
`

const EnvCheckRow = styled.li`
	display: grid;
	grid-template-columns: 18px 1fr auto;
	gap: 14px;
	align-items: center;
	padding: 10px 0;
	border-bottom: 1px dashed ${T.border};

	&:last-child {
		border-bottom: 0;
	}
`

const EnvCheckBox = styled.span<{ $ok: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 18px;
	height: 18px;
	border-radius: 4px;
	border: 1.5px solid ${(p) => (p.$ok ? T.textStrong : T.textMuted)};
	background: ${(p) => (p.$ok ? T.textStrong : 'transparent')};
	color: #faf8f4;
	transition:
		background 180ms ${T.ease},
		border-color 180ms ${T.ease};
`

const EnvKey = styled.span<{ $ok: boolean }>`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 13px;
	font-weight: 500;
	letter-spacing: 0.2px;
	color: ${(p) => (p.$ok ? T.textStrong : '#e85d2f')};
`

const EnvMissingMark = styled.span`
	font-family: 'Caveat', 'Brush Script MT', cursive;
	font-weight: 700;
	font-size: 18px;
	letter-spacing: 0.3px;
	color: #e85d2f;
	transform: rotate(-2deg);
	line-height: 1;
	user-select: none;
`

const Badges = styled.div`
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
`

/* ─── Y1 Weather styles ──────────────────────────────────────── */

const weatherColor = (s: WeatherState) =>
	s === 'live' ? '#e85d2f' : s === 'setup' ? '#e85d2f' : T.textSecondary

const WeatherRow = styled.div`
	display: grid;
	grid-template-columns: 44px 1fr;
	gap: 16px;
	align-items: center;
	margin-top: 4px;
`

const weatherDrift = keyframes`
	0%, 100% { transform: translateX(-1px); }
	50% { transform: translateX(2px); }
`

const WeatherIcon = styled.span<{ $state: WeatherState }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	color: ${(p) => weatherColor(p.$state)};
	line-height: 0;

	svg {
		font-size: 44px;
		${(p) =>
			p.$state !== 'live' &&
			css`
				animation: ${weatherDrift} 7s ease-in-out infinite;
			`}
	}

	@media (prefers-reduced-motion: reduce) {
		svg {
			animation: none;
		}
	}
`

const WeatherHead = styled.div<{ $state: WeatherState }>`
	font-family: 'Fraunces', 'Georgia', serif;
	font-weight: 600;
	font-size: 20px;
	letter-spacing: -0.25px;
	color: ${(p) => (p.$state === 'setup' ? '#e85d2f' : T.textStrong)};
	line-height: 1.2;
`

const WeatherDesc = styled.div`
	margin-top: 3px;
	font-size: 12.5px;
	color: ${T.textSecondary};
	line-height: 1.45;
`

const Badge = styled.span<{ $tone: 'success' | 'info' | 'warning' | 'error' | 'muted' }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10.5px;
	padding: 3px 9px;
	border-radius: 999px;
	font-weight: 700;
	letter-spacing: 0.3px;
	text-transform: uppercase;
	line-height: 1.3;
	${(p) => p.$tone === 'success' && `color:${T.success};background:${T.successTint};`}
	${(p) => p.$tone === 'info' && `color:${T.primary};background:${T.primaryTint};`}
	${(p) => p.$tone === 'warning' && `color:${T.warning};background:${T.warningTint};`}
	${(p) => p.$tone === 'error' && `color:${T.error};background:${T.errorTint};`}
	${(p) => p.$tone === 'muted' && `color:${T.textMuted};background:rgba(15, 23, 42, 0.04);`}
`

const LastFailure = styled.div`
	display: flex;
	gap: 10px;
	align-items: start;
	padding: 12px 14px;
	border-radius: 12px;
	background: ${T.errorTint};
	color: ${T.error};
	font-size: 13px;
	border-left: 3px solid ${T.error};
`

const Section = styled.div`
	display: flex;
	flex-direction: column;
	gap: 10px;
`

const SectionTitle = styled.h4`
	font-size: 13px;
	font-weight: 600;
	text-transform: uppercase;
	letter-spacing: 0.04em;
	color: ${T.textMuted};
	margin: 0;
`

const Grid = styled.div`
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	gap: 14px;

	& > * {
		${atom};
	}
	${nthStagger};
`

const Toggles = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;

	& > * {
		${atom};
	}
	${nthStagger};
`

const ToggleRow = styled.div<{ $on: boolean }>`
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 8px 4px;
	cursor: pointer;
	background: transparent;
	color: ${(p) => (p.$on ? T.textStrong : T.textSecondary)};
	font-size: 13px;
	font-weight: 600;
	user-select: none;
	transition: color 0.18s cubic-bezier(0.22, 1, 0.36, 1);
`

const ToggleKnob = styled.span<{ $on: boolean }>`
	width: 46px;
	height: 26px;
	border-radius: 999px;
	background: ${(p) => (p.$on ? T.primary : 'rgba(15, 23, 42, 0.14)')};
	position: relative;
	transition: background 0.18s cubic-bezier(0.22, 1, 0.36, 1);
	flex-shrink: 0;
	&:after {
		content: '';
		position: absolute;
		top: 3px;
		left: ${(p) => (p.$on ? '23px' : '3px')};
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: #ffffff;
		box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
		transition: left 0.18s cubic-bezier(0.22, 1, 0.36, 1);
	}
`

const FieldRoot = styled.div`
	display: flex;
	flex-direction: column;
	gap: 4px;
`

const FieldLabel = styled.label`
	font-size: 12px;
	font-weight: 600;
	color: ${T.textMuted};
`

/* Portfolio-canon input sizing (mirrors @ui/TextField default):
 *   padding: 1rem 0.8rem, 1.5px slate border, 8px radius, 2px
 *   primary outline on focus with outline-offset -1px.
 * Applied to every input on the Discord Integration page. */
const portfolioInputStyle = css`
	appearance: none;
	-webkit-appearance: none;
	padding: 1rem 0.8rem;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: transparent;
	color: ${T.textStrong};
	font-size: 13px;
	font-weight: 500;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	transition: border-color 160ms ease;
	width: 100%;

	&:hover {
		border-color: rgba(15, 23, 42, 0.18);
	}
	&:focus,
	&:focus-visible {
		outline: 2px solid ${T.primary};
		outline-offset: -1px;
		border-color: ${T.primary};
	}
	&::placeholder {
		color: ${T.textMuted};
	}
`

const FieldInput = styled.input`
	${portfolioInputStyle}
`

const FieldHint = styled.span`
	font-size: 11px;
	color: ${T.textMuted};
`

/* ─── Notifications & schedule (Portfolio canon) ───────────── */

const ScheduleStack = styled.div`
	display: flex;
	flex-direction: column;
	gap: 8px;

	/* Override formShell Section's outer padding + its own fadeUp
	   animation — the Discord panel already paints its own Card
	   padding and runs its own atom + nthStagger cascade. */
	& > div {
		padding: 0;
		animation: none;
		border-bottom: 0;
	}

	& > * {
		${atom};
	}
	${nthStagger};

	/* Dashed hair-line between numbered blocks, matching the
	   Routing ledger's row separators. */
	& > * + * {
		border-top: 1px dashed ${T.border};
		padding-top: 20px;
		margin-top: 4px;
	}
`

const ScheduleHeadToggle = styled.span`
	display: inline-flex;
	align-items: center;
	cursor: pointer;
	user-select: none;
	padding: 2px 0 2px 10px;
`

const ScheduleInput = styled.input`
	${portfolioInputStyle}
`

const ScheduleFieldHint = styled.span`
	font-size: 11px;
	color: ${T.textMuted};
	opacity: 0.7;
`

/* ─── Ledger (Routing) ─────────────────────────────────────── */

const LedgerList = styled.div`
	display: flex;
	flex-direction: column;
	font-family: 'Fraunces', 'Georgia', serif;

	& > * {
		${atom};
	}
	${nthStagger};
`

const LedgerRow = styled.div`
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 14px;
	align-items: start;
	padding: 10px 0;
	border-bottom: 1px dotted color-mix(in srgb, ${T.textMuted} 40%, transparent);

	&:last-child {
		border-bottom: 0;
	}
`

const LedgerRight = styled.div`
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
	min-width: 220px;
`

/* ─── "unsaved" tape + reserved MetaSlot ─────────────────────
   Mirrors the pattern in SettingsPage.SettingRow / Backups.Row:
   a reserved 18px slot BELOW each control, DirtyTape absolutely
   positioned inside the slot. Layout never jumps when the tape
   appears / disappears, and the tape cannot overlap the input or
   toggle because it lives in its own vertical lane. */

const MetaSlot = styled.span`
	position: relative;
	display: block;
	width: 100%;
	min-height: 18px;
	pointer-events: none;
`

const ScheduleHeadRight = styled.span`
	margin-left: auto;
	display: inline-flex;
	flex-direction: column;
	align-items: flex-end;
	gap: 4px;
`

const ScheduleHeadMetaSlot = styled.span`
	position: relative;
	display: block;
	width: 80px;
	min-height: 18px;
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
	white-space: nowrap;
	pointer-events: none;
	transform-origin: right top;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transform: rotate(${(p) => (p.$visible ? '-2deg' : '-6deg')})
		translateY(${(p) => (p.$visible ? 0 : '-4px')}) scale(${(p) => (p.$visible ? 1 : 0.85)});
	transition:
		opacity 240ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 360ms cubic-bezier(0.34, 1.56, 0.64, 1);
	will-change: opacity, transform;

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`

const LedgerLabel = styled.span`
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;
`

const LedgerLabelMain = styled.span`
	font-family: 'Fraunces', 'Georgia', serif;
	font-weight: 500;
	font-size: 15px;
	letter-spacing: -0.1px;
	color: ${T.textStrong};
	line-height: 1.3;
`

const LedgerLabelSub = styled.span`
	font-family: 'Inter', system-ui, sans-serif;
	font-size: 11px;
	font-weight: 400;
	color: ${T.textMuted};
	line-height: 1.3;
`

const LedgerValue = styled.input<{ $empty: boolean }>`
	${portfolioInputStyle}
	min-width: 220px;
	max-width: 100%;
`

/* ─── NumberedSection shell (05 & 06) ────────────────────────
   Flex-column container that renders Pf section head above
   free-form body content. Avoids formShell PfSection's natural
   32px horizontal padding so callouts span the full Card width. */

const NumberedSectionShell = styled.div`
	display: flex;
	flex-direction: column;
`

/* ─── Diagnostics / Activation action list ───────────────────
   Row-list used in sections 05 & 06. Each row = icon + text
   stack (title + description) + CTA. Matches the SettingsPage
   row aesthetics but with free-form content on the right. */

const ActionList = styled.div`
	display: flex;
	flex-direction: column;
	margin-top: 10px;

	& > * {
		${atom};
	}
	${nthStagger};
`

const ActionRow = styled.div<{ $noLine?: boolean }>`
	display: grid;
	grid-template-columns: 36px 1fr auto;
	gap: 14px;
	align-items: start;
	padding: 14px 0;
	border-top: 1px dashed ${T.border};

	&:first-child {
		border-top: 0;
		padding-top: 6px;
	}
	${(p) => p.$noLine && `border-top: 0; padding-top: 0; padding-bottom: 0; margin-top: -4px;`}

	@media (max-width: 640px) {
		grid-template-columns: 36px 1fr;
		& > *:last-child {
			grid-column: 1 / -1;
			justify-content: flex-start;
		}
	}
`

type ActionIconTone = 'primary' | 'brand' | 'success'

const ActionIcon = styled.span<{ $tone: ActionIconTone }>`
	width: 36px;
	height: 36px;
	border-radius: 10px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	${(p) => p.$tone === 'primary' && `background: ${T.primaryTint}; color: ${T.primary};`}
	${(p) => p.$tone === 'brand' && `background: rgba(232, 93, 47, 0.12); color: #e85d2f;`}
	${(p) => p.$tone === 'success' && `background: ${T.successTint}; color: ${T.success};`}
`

const ActionMeta = styled.div`
	display: flex;
	flex-direction: column;
	gap: 3px;
	min-width: 0;
`

const ActionTitle = styled.div`
	font-family: 'Fraunces', 'Georgia', serif;
	font-size: 15px;
	font-weight: 500;
	letter-spacing: -0.1px;
	color: ${T.textStrong};
	line-height: 1.3;
`

const ActionDesc = styled.div`
	font-size: 12.5px;
	line-height: 1.5;
	color: ${T.textSecondary};
	max-width: 60ch;
`

const ActivateWarning = styled.span`
	display: inline-block;
	font-family: 'Caveat', 'Fraunces', cursive;
	font-weight: 700;
	font-size: 15px;
	color: #e85d2f;
	transform: rotate(-1deg);
	line-height: 1;
	margin-left: 2px;
`

const ActionCta = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 16px;
	flex-wrap: wrap;
	justify-content: flex-end;
`

/* ─── Activation callout (06) ───────────────────────────────
   One styled covers both the "promote to live" (brand) and the
   "profile is active" (success) states. Grid matches ActionRow
   exactly — 36px icon column, start-aligned, 14px gap, 14/16
   padding — so sections 05 and 06 share the same visual ritm.
   Only the tint recipe branches on $tone. The success state has
   its own richer treatment below (LiveCallout). */

/* ─── Active live-state callout (06) ─────────────────────────
   Icon chip + description + LIVE badge. Solid success-green
   surface, every element inside rendered in white. */

const signalPulse = keyframes`
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.14);
		opacity: 0.85;
	}
`

const LiveCallout = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: 44px 1fr auto;
	gap: 16px;
	align-items: center;
	padding: 16px 20px;
	border-radius: 14px;
	margin-top: 10px;
	background: ${T.success};
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.18),
		0 1px 2px rgba(22, 163, 74, 0.18),
		0 10px 24px -14px rgba(22, 163, 74, 0.4);

	/* Everything inside the callout flips to white. Descendant
	   selectors override the shared ActionTitle / ActionDesc text
	   tones without introducing a new "white" variant prop. */
	& > *,
	& ${ActionTitle}, & ${ActionDesc} {
		color: #ffffff;
	}
	& ${ActionDesc} {
		font-size: 14.5px;
		font-weight: 500;
		line-height: 1.45;
		letter-spacing: -0.1px;
	}
	& ${ActionDesc} b {
		color: #ffffff;
		font-weight: 700;
	}

	@media (max-width: 640px) {
		grid-template-columns: 44px 1fr;
		& > *:last-child {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}
`

const LiveIcon = styled.span`
	width: 44px;
	height: 44px;
	border-radius: 12px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background: rgba(255, 255, 255, 0.16);
	color: #ffffff;
	box-shadow:
		inset 0 1px 0 rgba(255, 255, 255, 0.3),
		0 0 0 1px rgba(255, 255, 255, 0.22);

	& svg {
		animation: ${signalPulse} 1.6s ease-in-out infinite;
		transform-origin: center;
	}

	@media (prefers-reduced-motion: reduce) {
		& svg {
			animation: none;
		}
	}
`

const LiveBadge = styled.span`
	display: inline-flex;
	align-items: center;
	padding: 9px 16px;
	border-radius: 10px;
	background: #ffffff;
	color: ${T.success};
	font-size: 12.5px;
	font-weight: 700;
	letter-spacing: 0.8px;
	line-height: 1;
	box-shadow: none;
	user-select: none;
`

/* ─── Promote-to-live callout (06, inactive profile) ─────────
   Solid brand-orange surface, all elements rendered in white —
   mirror of LiveCallout but for the actionable state. Button
   inverts to white-on-brand so it stays readable on the fill. */

const boltZap = keyframes`
	0%, 55%, 100% {
		transform: scale(1) rotate(0deg);
	}
	62% {
		transform: scale(1.18) rotate(-5deg);
	}
	72% {
		transform: scale(0.94) rotate(4deg);
	}
	82% {
		transform: scale(1.08) rotate(-2deg);
	}
	92% {
		transform: scale(1) rotate(0deg);
	}
`

const Callout = styled.div`
	position: relative;
	display: grid;
	grid-template-columns: 44px 1fr auto;
	gap: 16px;
	align-items: center;
	padding: 16px 20px;
	border-radius: 14px;
	margin-top: 10px;
	background: #e85d2f;

	& > *,
	& ${ActionTitle}, & ${ActionDesc} {
		color: #ffffff;
	}
	& ${ActionDesc} {
		font-size: 14.5px;
		font-weight: 500;
		line-height: 1.45;
		letter-spacing: -0.1px;
	}
	& ${ActionDesc} b {
		color: #ffffff;
		font-weight: 700;
	}
	& ${ActionIcon} {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.16);
		color: #ffffff;
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.3),
			0 0 0 1px rgba(255, 255, 255, 0.22);
	}
	& ${ActionIcon} svg {
		animation: ${boltZap} 2.4s ease-in-out infinite;
		transform-origin: center;
	}
	@media (prefers-reduced-motion: reduce) {
		& ${ActionIcon} svg {
			animation: none;
		}
	}
	& ${ActivateWarning} {
		color: #ffffff;
		opacity: 0.95;
		border-bottom-color: rgba(255, 255, 255, 0.55);
	}
	/* CTA inverts to white-fill with brand text so it reads on the orange. */
	& button {
		background: #ffffff;
		color: #e85d2f;
		box-shadow: none;
		transition:
			transform 220ms cubic-bezier(0.22, 1, 0.36, 1),
			filter 220ms ease;
	}
	& button:hover:not(:disabled) {
		transform: translateY(-2px) scale(1.03);
		filter: brightness(1.02);
	}
	& button:hover:not(:disabled) svg {
		transform: translateX(1px) scale(1.08) rotate(-6deg);
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	& button svg {
		transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
	}
	& button:active:not(:disabled) {
		transform: translateY(0) scale(0.99);
	}
	& button:disabled {
		opacity: 0.55;
	}

	@media (max-width: 640px) {
		grid-template-columns: 44px 1fr;
		& > *:last-child {
			grid-column: 1 / -1;
			justify-self: start;
		}
	}
`

const PreviewRow = styled.div`
	display: inline-flex;
	gap: 6px;
	align-items: stretch;
`

const PreviewSelect = styled.select`
	appearance: none;
	-webkit-appearance: none;
	padding: 1rem 2.4rem 1rem 0.8rem;
	border-radius: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	background: transparent
		url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a7686' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>")
		no-repeat right 12px center / 12px 12px;
	color: ${T.textStrong};
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	min-width: 190px;
	transition: border-color 160ms ease;
	&:hover {
		border-color: rgba(15, 23, 42, 0.18);
	}
	&:focus,
	&:focus-visible {
		outline: 2px solid ${T.primary};
		outline-offset: -1px;
		border-color: ${T.primary};
	}
`

const Btn = styled.button<{ $tone: 'primary' | 'ghost' | 'brand' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 9px 16px;
	border: 0;
	border-radius: 10px;
	font-size: 12.5px;
	font-weight: 700;
	cursor: pointer;
	transition:
		filter 0.15s ${T.ease},
		background 0.15s ${T.ease},
		color 0.15s ${T.ease};
	${(p) =>
		p.$tone === 'primary' &&
		`color:#ffffff;background:${T.primary};&:hover:not(:disabled){filter:brightness(1.08);}`}
	${(p) =>
		p.$tone === 'brand' &&
		`color:#ffffff;background:linear-gradient(135deg, #ff7a52, #e85d2f);&:hover:not(:disabled){filter:brightness(1.05);}`}
	${(p) =>
		p.$tone === 'ghost' &&
		`color:${T.textSecondary};background:rgba(15, 23, 42, 0.04);&:hover:not(:disabled){background:${T.primaryTint};color:${T.primary};}`}
	&:focus-visible {
		outline: none;
		box-shadow: 0 0 0 3px ${T.primaryStrong};
	}
	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
`

const Skeleton = styled.div`
	border: 1px dashed ${T.border};
	padding: 24px;
	border-radius: 12px;
	text-align: center;
	color: ${T.textMuted};
`

const VerifyRow = styled.div`
	display: grid;
	grid-template-columns: 180px 1fr;
	gap: 12px;
	align-items: center;
	font-size: 13px;
`

const VerifyLabel = styled.span`
	color: ${T.textMuted};
	font-weight: 500;
`

const VerifyStatus = styled.span<{ $ok: boolean; $cfg: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	color: ${(p) => (!p.$cfg ? T.textMuted : p.$ok ? T.success : T.error)};
`
