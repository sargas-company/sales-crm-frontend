import { useMemo, useState } from 'react'
import styled from 'styled-components'
import {
	CheckCircleRounded,
	ErrorOutlineRounded,
	WarningAmberRounded,
	BoltRounded,
	ScienceOutlined,
	VerifiedUserOutlined,
	SendRounded,
	PreviewRounded,
	HubOutlined,
} from '@mui/icons-material'

import {
	useActivateDiscordProfileMutation,
	useListDiscordProfilesQuery,
	useSendDiscordPreviewMutation,
	useSendDiscordTestMutation,
	useUpdateDiscordProfileMutation,
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
import { T } from '../../components/sales-analytics/_shared/tokens'

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

const DiscordIntegrationPanel = () => {
	const { data: profiles = [], isLoading, isError, refetch } =
		useListDiscordProfilesQuery()

	return (
		<Shell>
			<EnvCard profiles={profiles} />
			{isLoading && <Skeleton>Loading profiles…</Skeleton>}
			{isError && (
				<ErrorCard onRetry={() => void refetch()}>
					Could not load Discord profiles.
				</ErrorCard>
			)}
			{profiles.map((p) => (
				<ProfileCard key={p.name} profile={p} />
			))}
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
					Secrets live only in <code>.env</code> on the server. Guild &
					channel IDs are stored per-profile below.
				</CardHint>
			</CardHead>
			<EnvRow>
				<EnvItem $ok={env.appIdSet}>DISCORD_APP_ID</EnvItem>
				<EnvItem $ok={env.publicKeySet}>DISCORD_PUBLIC_KEY</EnvItem>
				<EnvItem $ok={env.botTokenSet}>DISCORD_BOT_TOKEN</EnvItem>
			</EnvRow>
		</Card>
	)
}

/* ─── profile card ──────────────────────────────────────────── */

const ProfileCard = ({ profile }: { profile: DiscordProfileView }) => {
	const { showToast } = useToast()
	const [update, { isLoading: isSaving }] = useUpdateDiscordProfileMutation()
	const [activate, { isLoading: isActivating }] =
		useActivateDiscordProfileMutation()
	const [verify, { isLoading: isVerifying }] =
		useVerifyDiscordProfileMutation()
	const [sendTest, { isLoading: isSendingTest }] =
		useSendDiscordTestMutation()
	const [sendPreview, { isLoading: isSendingPreview }] =
		useSendDiscordPreviewMutation()

	const [draft, setDraft] = useState<Draft>({})
	const [confirmActivate, setConfirmActivate] = useState(false)
	const [verifyResult, setVerifyResult] = useState<DiscordVerifyResult | null>(
		null,
	)
	const [previewJob, setPreviewJob] = useState<DiscordPreviewJob>('REPORT')

	const dirty = Object.keys(draft).length > 0
	const merged: DiscordProfileView = useMemo(
		() => ({ ...profile, ...(draft as object) }) as DiscordProfileView,
		[profile, draft],
	)

	const setField = <K extends keyof UpdateDiscordProfileBody>(
		k: K,
		v: UpdateDiscordProfileBody[K],
	) => {
		setDraft((prev) => ({ ...prev, [k]: v }))
	}

	const saveChanges = async () => {
		try {
			await update({ name: profile.name, body: draft }).unwrap()
			showToast(`${profile.name} profile saved`, 'success')
			setDraft({})
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

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
				hasErrors ? 'error' : 'success',
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
			showToast(
				`Preview posted to ${r.channel} — message ${r.messageId}`,
				'success',
			)
		} catch (err) {
			showToast(parseServerError(err), 'error')
		}
	}

	return (
		<Card>
			<CardHead>
				<CardTitle>
					<ScienceOutlined /> {profile.name} profile
				</CardTitle>
				<Badges>
					{profile.active ? (
						<Badge $tone='success'>
							<BoltRounded style={{ fontSize: 14 }} /> ACTIVE
						</Badge>
					) : (
						<Badge $tone='muted'>inactive</Badge>
					)}
					{profile.configured ? (
						<Badge $tone='info'>configured</Badge>
					) : (
						<Badge $tone='warning'>incomplete</Badge>
					)}
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
			</CardHead>
			{profile.lastFailureMessage && (
				<LastFailure>
					<ErrorOutlineRounded style={{ fontSize: 16 }} />
					<span>{profile.lastFailureMessage}</span>
				</LastFailure>
			)}

			<Section>
				<SectionTitle>Routing</SectionTitle>
				<Grid>
					<FormField
						label='Guild ID'
						hint='Discord server ID — snowflake, 17–20 digits'
						value={merged.guildId ?? ''}
						onChange={(v) => setField('guildId', v || null)}
					/>
					<FormField
						label='PMS channel ID'
						hint='Reminder / daily digest / weekly digest / absences / late report'
						value={merged.pmsChannelId ?? ''}
						onChange={(v) => setField('pmsChannelId', v || null)}
					/>
					<FormField
						label='General channel ID'
						hint='Birthday pings go here'
						value={merged.generalChannelId ?? ''}
						onChange={(v) => setField('generalChannelId', v || null)}
					/>
					<FormField
						label='Sales channel ID'
						hint='Reserved for lead-flow notifications (optional)'
						value={merged.salesChannelId ?? ''}
						onChange={(v) => setField('salesChannelId', v || null)}
					/>
					<FormField
						label='Ops channel ID'
						hint='Technical failure alerts (optional)'
						value={merged.opsChannelId ?? ''}
						onChange={(v) => setField('opsChannelId', v || null)}
					/>
					<FormField
						label='Manager role ID'
						hint='The role mentioned by the 18:00 reminder'
						value={merged.managerRoleId ?? ''}
						onChange={(v) => setField('managerRoleId', v || null)}
					/>
					<FormField
						label='Timezone'
						hint='IANA zone, e.g. Europe/Kyiv'
						value={merged.timezone}
						onChange={(v) => setField('timezone', v)}
					/>
				</Grid>
			</Section>

			<Section>
				<SectionTitle>Notifications &amp; schedule</SectionTitle>
				<Toggles>
					<Toggle
						label='Reports (reminder + daily digest + late report)'
						checked={merged.reportsEnabled}
						onChange={(v) => setField('reportsEnabled', v)}
					/>
					<Toggle
						label='Birthdays'
						checked={merged.birthdaysEnabled}
						onChange={(v) => setField('birthdaysEnabled', v)}
					/>
					<Toggle
						label='Absences (weekdays)'
						checked={merged.absencesEnabled}
						onChange={(v) => setField('absencesEnabled', v)}
					/>
					<Toggle
						label='Weekly digest'
						checked={merged.weeklyEnabled}
						onChange={(v) => setField('weeklyEnabled', v)}
					/>
				</Toggles>
				<Grid>
					<FormField
						label='Cutoff hour'
						hint='0..23 — below this the /report is credited to the previous day'
						type='number'
						value={String(merged.cutoffHour)}
						onChange={(v) =>
							setField('cutoffHour', Math.max(0, Math.min(23, Number(v) || 0)))
						}
					/>
					<FormField
						label='Reminder at'
						hint='HH:MM'
						value={merged.reminderAt}
						onChange={(v) => setField('reminderAt', v)}
					/>
					<FormField
						label='Daily digest at'
						hint='HH:MM'
						value={merged.dailyDigestAt}
						onChange={(v) => setField('dailyDigestAt', v)}
					/>
					<FormField
						label='Weekly digest day'
						hint='0=Sun, 1=Mon, …, 6=Sat'
						type='number'
						value={String(merged.weeklyDigestDay)}
						onChange={(v) =>
							setField(
								'weeklyDigestDay',
								Math.max(0, Math.min(6, Number(v) || 0)),
							)
						}
					/>
					<FormField
						label='Weekly digest at'
						hint='HH:MM'
						value={merged.weeklyDigestAt}
						onChange={(v) => setField('weeklyDigestAt', v)}
					/>
					<FormField
						label='Birthday at'
						hint='HH:MM'
						value={merged.birthdayAt}
						onChange={(v) => setField('birthdayAt', v)}
					/>
					<FormField
						label='Absences at'
						hint='HH:MM'
						value={merged.absencesAt}
						onChange={(v) => setField('absencesAt', v)}
					/>
				</Grid>
			</Section>

			{verifyResult && (
				<VerifyResultBlock result={verifyResult} />
			)}

			<Actions>
				<SaveRow>
					<Btn $tone='primary' onClick={saveChanges} disabled={!dirty || isSaving}>
						{isSaving ? 'Saving…' : dirty ? 'Save changes' : 'No changes'}
					</Btn>
					{dirty && (
						<Btn $tone='ghost' onClick={() => setDraft({})}>
							Discard
						</Btn>
					)}
				</SaveRow>
				<Divider />
				<ActionRow>
					<Btn $tone='ghost' onClick={doVerify} disabled={isVerifying}>
						<VerifiedUserOutlined style={{ fontSize: 16 }} />
						{isVerifying ? 'Verifying…' : 'Verify access'}
					</Btn>
					<Btn $tone='ghost' onClick={doSendTest} disabled={isSendingTest}>
						<SendRounded style={{ fontSize: 16 }} />
						{isSendingTest ? 'Sending…' : 'Send test to PMS'}
					</Btn>
					<PreviewRow>
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
						<Btn $tone='ghost' onClick={doSendPreview} disabled={isSendingPreview}>
							<PreviewRounded style={{ fontSize: 16 }} />
							{isSendingPreview ? 'Posting…' : 'Send preview'}
						</Btn>
					</PreviewRow>
					{!profile.active && (
						<Btn
							$tone='success'
							onClick={() => setConfirmActivate(true)}
							disabled={!profile.configured || isActivating}
							title={
								profile.configured
									? ''
									: 'Fill guild id, PMS and General channel ids, and manager role id first'
							}
						>
							<BoltRounded style={{ fontSize: 16 }} />
							Activate profile
						</Btn>
					)}
				</ActionRow>
			</Actions>

			{confirmActivate && (
				<ConfirmModal
					icon={<BoltRounded />}
					iconTone='success'
					title={`Activate ${profile.name} profile?`}
					description={
						<>
							This will immediately deactivate the currently active profile
							and route every outbound Discord notification through{' '}
							<b>{profile.name}</b>. Nothing is sent to Discord as a side
							effect of this action — the next scheduled job uses the new
							profile.
						</>
					}
					confirmLabel='Activate'
					confirmColor='success'
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
		err: string | undefined,
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
			<SectionTitle>Verify result · {new Date(result.checkedAt).toLocaleTimeString()}</SectionTitle>
			{row(
				'Guild',
				result.guild.configured,
				result.guild.ok,
				result.guild.name,
				result.guild.error,
			)}
			{row(
				'Bot in guild',
				result.guild.configured,
				result.botInGuild.ok,
				result.botInGuild.ok
					? `${result.botInGuild.roleCount ?? 0} roles granted to bot`
					: undefined,
				result.botInGuild.error,
			)}
			{(Object.keys(result.channels) as VerifyChannelKey[]).map((k) =>
				row(
					channelLabel[k],
					result.channels[k].configured,
					result.channels[k].ok,
					result.channels[k].name,
					result.channels[k].error,
				),
			)}
			{row(
				'Manager role',
				result.role.configured,
				result.role.ok,
				result.role.name,
				result.role.error,
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

const ErrorCard = ({
	children,
	onRetry,
}: {
	children: React.ReactNode
	onRetry: () => void
}) => (
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
`

const Card = styled.section`
	border: 1px solid ${T.border};
	background: ${T.cardBg};
	border-radius: 14px;
	padding: 20px;
	display: flex;
	flex-direction: column;
	gap: 16px;
`

const CardHead = styled.div`
	display: flex;
	flex-direction: column;
	gap: 6px;
`

const CardTitle = styled.h3`
	font-size: 16px;
	font-weight: 600;
	display: flex;
	align-items: center;
	gap: 8px;
	margin: 0;
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

const EnvRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`

const EnvItem = styled.span<{ $ok: boolean }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	font-size: 12px;
	padding: 4px 10px;
	border-radius: 999px;
	border: 1px solid ${(p) => (p.$ok ? T.success : T.warning)};
	background: ${(p) => (p.$ok ? T.successTint : T.warningTint)};
	color: ${(p) => (p.$ok ? T.success : T.warning)};
	&:before {
		content: ${(p) => (p.$ok ? "'✓'" : "'•'")};
	}
`

const Badges = styled.div`
	display: flex;
	gap: 6px;
	flex-wrap: wrap;
`

const Badge = styled.span<{ $tone: 'success' | 'info' | 'warning' | 'error' | 'muted' }>`
	display: inline-flex;
	align-items: center;
	gap: 4px;
	font-size: 11px;
	padding: 3px 8px;
	border-radius: 999px;
	font-weight: 500;
	${(p) =>
		p.$tone === 'success' &&
		`color:${T.success};background:${T.successTint};border:1px solid ${T.success};`}
	${(p) =>
		p.$tone === 'info' &&
		`color:${T.primary};background:${T.primaryTint};border:1px solid ${T.primary};`}
	${(p) =>
		p.$tone === 'warning' &&
		`color:${T.warning};background:${T.warningTint};border:1px solid ${T.warning};`}
	${(p) =>
		p.$tone === 'error' &&
		`color:${T.error};background:${T.errorTint};border:1px solid ${T.error};`}
	${(p) =>
		p.$tone === 'muted' &&
		`color:${T.textMuted};background:${T.subtleBg};border:1px solid ${T.border};`}
`

const LastFailure = styled.div`
	display: flex;
	gap: 8px;
	align-items: start;
	padding: 10px 12px;
	border-radius: 10px;
	background: ${T.errorTint};
	border: 1px solid ${T.error};
	color: ${T.error};
	font-size: 13px;
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
`

const Toggles = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
`

const ToggleRow = styled.div<{ $on: boolean }>`
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 12px;
	border-radius: 10px;
	cursor: pointer;
	background: ${(p) => (p.$on ? T.successTint : T.subtleBg)};
	border: 1px solid ${(p) => (p.$on ? T.success : T.border)};
	color: ${(p) => (p.$on ? T.success : T.textPrimary)};
	font-size: 13px;
	user-select: none;
`

const ToggleKnob = styled.span<{ $on: boolean }>`
	width: 32px;
	height: 18px;
	border-radius: 999px;
	background: ${(p) => (p.$on ? T.success : T.border)};
	position: relative;
	transition: background 0.15s ease;
	&:after {
		content: '';
		position: absolute;
		top: 2px;
		left: ${(p) => (p.$on ? '16px' : '2px')};
		width: 14px;
		height: 14px;
		border-radius: 999px;
		background: white;
		transition: left 0.15s ease;
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

const FieldInput = styled.input`
	padding: 8px 10px;
	border-radius: 8px;
	border: 1px solid ${T.border};
	background: ${T.cardBg};
	color: ${T.textPrimary};
	font-size: 13px;
	font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
	&:focus {
		outline: none;
		border-color: ${T.primary};
	}
`

const FieldHint = styled.span`
	font-size: 11px;
	color: ${T.textMuted};
`

const Actions = styled.div`
	display: flex;
	flex-direction: column;
	gap: 12px;
`

const SaveRow = styled.div`
	display: flex;
	gap: 8px;
	flex-wrap: wrap;
`

const Divider = styled.div`
	height: 1px;
	background: ${T.border};
`

const ActionRow = styled.div`
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
	align-items: center;
`

const PreviewRow = styled.div`
	display: inline-flex;
	gap: 6px;
	align-items: stretch;
`

const PreviewSelect = styled.select`
	padding: 7px 10px;
	border-radius: 8px;
	border: 1px solid ${T.border};
	background: ${T.cardBg};
	color: ${T.textPrimary};
	font-size: 13px;
`

const Btn = styled.button<{ $tone: 'primary' | 'ghost' | 'success' }>`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 8px 14px;
	border-radius: 8px;
	font-size: 13px;
	font-weight: 500;
	cursor: pointer;
	transition:
		background 0.1s ease,
		border-color 0.1s ease;
	${(p) =>
		p.$tone === 'primary' &&
		`color:white;background:${T.primary};border:1px solid ${T.primary};&:hover{filter:brightness(1.05);}`}
	${(p) =>
		p.$tone === 'success' &&
		`color:white;background:${T.success};border:1px solid ${T.success};&:hover{filter:brightness(1.05);}`}
	${(p) =>
		p.$tone === 'ghost' &&
		`color:${T.textPrimary};background:transparent;border:1px solid ${T.border};&:hover{background:${T.subtleBg};}`}
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
