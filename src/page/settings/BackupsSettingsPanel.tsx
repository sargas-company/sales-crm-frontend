import { useMemo } from 'react'
import styled from 'styled-components'
import {
	BackupOutlined,
	CloudQueueRounded,
	FolderOpenRounded,
	LockOutlined,
	NotificationsActiveRounded,
	ScheduleRounded,
	SettingsBackupRestoreRounded,
	StorageRounded,
	TimerRounded,
	TuneRounded,
	VerifiedOutlined,
	ArchiveOutlined,
} from '@mui/icons-material'
import { T } from '../../components/sales-analytics/_shared/tokens'
import { atom, nthStagger } from './_shared/stagger'

/**
 * Backups settings — presentational panel. Edits flow to the parent
 * (SettingsPage) which owns the saved+pending state and runs the one
 * floating SaveBar for all sections. The dangerous "Create backup
 * now" action is a separate side-effect wired to the real API.
 */

export const BACKUPS_LS_KEY = 'sargas.backup-settings.v1'

export interface BackupSettings {
	frequency: string
	timeOfDay: string
	weekdays: string[]
	bucket: string
	folder: string
	region: string
	retentionDays: number
	maxCount: number
	keepFailed: boolean
	preMigration: boolean
	preSeed: boolean
	compress: boolean
	encrypt: boolean
	verify: boolean
	notifyFail: boolean
	notifySuccess: boolean
}

export const BACKUPS_DEFAULTS: BackupSettings = {
	frequency: 'daily',
	timeOfDay: '03:00',
	weekdays: ['Mo', 'Tu', 'We', 'Th', 'Fr'],
	bucket: 'sargas-backups',
	folder: 'production/postgres/',
	region: 'eu-central-003',
	retentionDays: 30,
	maxCount: 90,
	keepFailed: true,
	preMigration: true,
	preSeed: true,
	compress: true,
	encrypt: true,
	verify: false,
	notifyFail: true,
	notifySuccess: false,
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

interface Props {
	saved: BackupSettings
	pending: Partial<BackupSettings>
	onFieldChange: (key: string, value: unknown) => void
}

const BackupsSettingsPanel = ({ saved, pending, onFieldChange }: Props) => {
	const effective: BackupSettings = useMemo(
		() => ({ ...saved, ...pending }),
		[saved, pending],
	)
	const isDirty = (k: keyof BackupSettings) =>
		Object.prototype.hasOwnProperty.call(pending, k)

	const setField = <K extends keyof BackupSettings>(
		key: K,
		val: BackupSettings[K],
	) => {
		onFieldChange(key as string, val)
	}

	const toggleWeekday = (d: string) => {
		const cur = effective.weekdays
		setField(
			'weekdays',
			cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d],
		)
	}

	return (
		<Panel>
			<Intro>
				<IntroIcon>
					<BackupOutlined />
				</IntroIcon>
				<div>
					<IntroTitle>Backup &amp; Recovery</IntroTitle>
					<IntroSubtitle>
						Automatic database snapshots, retention rules, remote storage
						and failure alerting. Dangerous — changes take effect on the
						next scheduled run.
					</IntroSubtitle>
				</div>
			</Intro>

			{/* Manual "Run now" button was removed with the file-layer
			 * stabilisation. Backups are triggered only from the CLI
			 * (`scripts/backup.ts`) so the HTTP backend does not hold
			 * the dedicated backup B2 credentials. The settings panel
			 * below still edits retention / notification config. */}

			<Section>
				<SectionHead>
					<SectionIcon>
						<ScheduleRounded />
					</SectionIcon>
					<div>
						<SectionTitle>Schedule</SectionTitle>
						<SectionDesc>
							When automatic backups run.
						</SectionDesc>
					</div>
				</SectionHead>
				<SectionBody>
					<Row $dirty={isDirty('frequency')}>
						<RowLabel>
							<RowTitle>
								Frequency
								<KeyPill>backup.frequency</KeyPill>
								<OwnerTag>Owner</OwnerTag>
							</RowTitle>
							<RowDesc>How often the scheduled dump runs.</RowDesc>
							<EffectHint>
								Takes effect at the next scheduled window.
							</EffectHint>
						</RowLabel>
						<RowControl>
							<Select
								value={effective.frequency}
								onChange={(e) =>
									setField('frequency', e.target.value)
								}
							>
								<option value='every_6h'>Every 6 hours</option>
								<option value='every_12h'>Every 12 hours</option>
								<option value='daily'>Daily</option>
								<option value='weekly'>Weekly</option>
							</Select>
							<MetaSlot>
								<DirtyTape $visible={isDirty('frequency')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('timeOfDay')}>
						<RowLabel>
							<RowTitle>
								Time of day
								<KeyPill>backup.time_of_day</KeyPill>
							</RowTitle>
							<RowDesc>
								UTC time when a daily / weekly run kicks off.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<TimeInput
								type='time'
								value={effective.timeOfDay}
								onChange={(e) =>
									setField('timeOfDay', e.target.value)
								}
							/>
							<MetaSlot>
								<DirtyTape $visible={isDirty('timeOfDay')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					{effective.frequency === 'weekly' && (
						<Row $dirty={isDirty('weekdays')}>
							<RowLabel>
								<RowTitle>
									Weekdays
									<KeyPill>backup.weekdays</KeyPill>
								</RowTitle>
								<RowDesc>Days a weekly backup is allowed to run.</RowDesc>
							</RowLabel>
							<RowControl>
								<ChipRow>
									{WEEKDAYS.map((d) => (
										<WeekChip
											key={d}
											type='button'
											$active={effective.weekdays.includes(d)}
											onClick={() => toggleWeekday(d)}
										>
											{d}
										</WeekChip>
									))}
								</ChipRow>
								<MetaSlot>
									<DirtyTape $visible={isDirty('weekdays')}>
										unsaved
									</DirtyTape>
								</MetaSlot>
							</RowControl>
						</Row>
					)}
				</SectionBody>
			</Section>

			<Section>
				<SectionHead>
					<SectionIcon>
						<CloudQueueRounded />
					</SectionIcon>
					<div>
						<SectionTitle>Storage</SectionTitle>
						<SectionDesc>
							Where the dumps and their manifests are uploaded.
						</SectionDesc>
					</div>
				</SectionHead>
				<SectionBody>
					<Row $dirty={isDirty('bucket')}>
						<RowLabel>
							<RowTitle>
								Bucket
								<KeyPill>backup.storage.bucket</KeyPill>
								<OwnerTag>Owner</OwnerTag>
							</RowTitle>
							<RowDesc>
								S3-compatible bucket name (e.g. Backblaze B2).
							</RowDesc>
						</RowLabel>
						<RowControl>
							<TextInput
								type='text'
								value={effective.bucket}
								onChange={(e) => setField('bucket', e.target.value)}
								placeholder='sargas-backups'
							/>
							<MetaSlot>
								<DirtyTape $visible={isDirty('bucket')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('folder')}>
						<RowLabel>
							<RowTitle>
								Folder / prefix
								<KeyPill>backup.storage.folder</KeyPill>
							</RowTitle>
							<RowDesc>
								Virtual path inside the bucket. Trailing slash is fine.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<TextInputWithIcon>
								<FolderOpenRounded className='ico' />
								<input
									type='text'
									value={effective.folder}
									onChange={(e) => setField('folder', e.target.value)}
									placeholder='production/postgres/'
								/>
							</TextInputWithIcon>
							<MetaSlot>
								<DirtyTape $visible={isDirty('folder')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('region')}>
						<RowLabel>
							<RowTitle>
								Region
								<KeyPill>backup.storage.region</KeyPill>
							</RowTitle>
							<RowDesc>Bucket region identifier.</RowDesc>
						</RowLabel>
						<RowControl>
							<Select
								value={effective.region}
								onChange={(e) => setField('region', e.target.value)}
							>
								<option value='eu-central-003'>eu-central-003</option>
								<option value='us-west-001'>us-west-001</option>
								<option value='us-east-001'>us-east-001</option>
								<option value='eu-west-001'>eu-west-001</option>
							</Select>
							<MetaSlot>
								<DirtyTape $visible={isDirty('region')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
				</SectionBody>
			</Section>

			<Section>
				<SectionHead>
					<SectionIcon>
						<ArchiveOutlined />
					</SectionIcon>
					<div>
						<SectionTitle>Retention</SectionTitle>
						<SectionDesc>
							How long dumps are kept before pruning.
						</SectionDesc>
					</div>
				</SectionHead>
				<SectionBody>
					<Row $dirty={isDirty('retentionDays')}>
						<RowLabel>
							<RowTitle>
								Keep for N days
								<KeyPill>backup.retention.days</KeyPill>
								<OwnerTag>Owner</OwnerTag>
							</RowTitle>
							<RowDesc>
								Daily dumps older than this are deleted from the bucket.
							</RowDesc>
							<EffectHint>
								Pruning runs once a day after the scheduled backup.
							</EffectHint>
						</RowLabel>
						<RowControl>
							<NumberInput
								type='number'
								min={1}
								max={3650}
								value={effective.retentionDays}
								onChange={(e) =>
									setField('retentionDays', Number(e.target.value))
								}
							/>
							<Unit>days</Unit>
							<MetaSlot>
								<DirtyTape $visible={isDirty('retentionDays')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('maxCount')}>
						<RowLabel>
							<RowTitle>
								Hard cap on count
								<KeyPill>backup.retention.max_count</KeyPill>
							</RowTitle>
							<RowDesc>
								Never keep more than this many dumps, regardless of age.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<NumberInput
								type='number'
								min={1}
								max={10000}
								value={effective.maxCount}
								onChange={(e) =>
									setField('maxCount', Number(e.target.value))
								}
							/>
							<Unit>dumps</Unit>
							<MetaSlot>
								<DirtyTape $visible={isDirty('maxCount')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('keepFailed')}>
						<RowLabel>
							<RowTitle>
								Keep failed runs forever
								<KeyPill>backup.retention.keep_failed</KeyPill>
							</RowTitle>
							<RowDesc>
								Failed dumps are not pruned until a human removes them.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.keepFailed}
								$on={effective.keepFailed}
								onClick={() =>
									setField('keepFailed', !effective.keepFailed)
								}
							>
								<ToggleDot $on={effective.keepFailed} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('keepFailed')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
				</SectionBody>
			</Section>

			<Section>
				<SectionHead>
					<SectionIcon>
						<TuneRounded />
					</SectionIcon>
					<div>
						<SectionTitle>Behavior</SectionTitle>
						<SectionDesc>
							Extra snapshots and how each dump is written.
						</SectionDesc>
					</div>
				</SectionHead>
				<SectionBody>
					<Row $dirty={isDirty('preMigration')}>
						<RowLabel>
							<RowTitle>
								Pre-migration backup
								<KeyPill>backup.pre_migration</KeyPill>
								<OwnerTag>Owner</OwnerTag>
							</RowTitle>
							<RowDesc>
								Dump the database before every schema migration. Blocks
								the migrate command on failure.
							</RowDesc>
							<EffectHint>
								Safety guard — leave this on in production.
							</EffectHint>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.preMigration}
								$on={effective.preMigration}
								onClick={() =>
									setField('preMigration', !effective.preMigration)
								}
							>
								<ToggleDot $on={effective.preMigration} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('preMigration')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('preSeed')}>
						<RowLabel>
							<RowTitle>
								Pre-seed backup
								<KeyPill>backup.pre_seed</KeyPill>
							</RowTitle>
							<RowDesc>Dump before any seed script runs.</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.preSeed}
								$on={effective.preSeed}
								onClick={() => setField('preSeed', !effective.preSeed)}
							>
								<ToggleDot $on={effective.preSeed} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('preSeed')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('compress')}>
						<RowLabel>
							<RowTitle>
								Compress (gzip)
								<KeyPill>backup.compress</KeyPill>
							</RowTitle>
							<RowDesc>
								Compress dump files before upload — smaller bucket cost,
								slightly slower snapshot.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.compress}
								$on={effective.compress}
								onClick={() =>
									setField('compress', !effective.compress)
								}
							>
								<ToggleDot $on={effective.compress} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('compress')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('encrypt')}>
						<RowLabel>
							<RowTitle>
								Encrypt at rest
								<KeyPill>backup.encrypt</KeyPill>
								<OwnerTag>Owner</OwnerTag>
							</RowTitle>
							<RowDesc>
								Encrypt dumps with the vault master key before upload.
								<MutedInline>
									<LockOutlined style={{ fontSize: 12 }} /> AES-256
								</MutedInline>
							</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.encrypt}
								$on={effective.encrypt}
								onClick={() => setField('encrypt', !effective.encrypt)}
							>
								<ToggleDot $on={effective.encrypt} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('encrypt')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('verify')}>
						<RowLabel>
							<RowTitle>
								Verify after backup
								<KeyPill>backup.verify</KeyPill>
							</RowTitle>
							<RowDesc>
								Re-download and checksum the dump after upload. Slower but
								guarantees the artifact is intact.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.verify}
								$on={effective.verify}
								onClick={() => setField('verify', !effective.verify)}
							>
								<ToggleDot $on={effective.verify} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('verify')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
				</SectionBody>
			</Section>

			<Section>
				<SectionHead>
					<SectionIcon>
						<NotificationsActiveRounded />
					</SectionIcon>
					<div>
						<SectionTitle>Notifications</SectionTitle>
						<SectionDesc>
							When the system pings you about backup outcomes.
						</SectionDesc>
					</div>
				</SectionHead>
				<SectionBody>
					<Row $dirty={isDirty('notifyFail')}>
						<RowLabel>
							<RowTitle>
								Notify on failure
								<KeyPill>backup.notify.failure</KeyPill>
							</RowTitle>
							<RowDesc>
								Post a message to the configured Discord webhook when
								a run fails.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.notifyFail}
								$on={effective.notifyFail}
								onClick={() =>
									setField('notifyFail', !effective.notifyFail)
								}
							>
								<ToggleDot $on={effective.notifyFail} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('notifyFail')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
					<Row $dirty={isDirty('notifySuccess')}>
						<RowLabel>
							<RowTitle>
								Notify on success
								<KeyPill>backup.notify.success</KeyPill>
							</RowTitle>
							<RowDesc>
								Ping on every successful run too. Noisy — off by default.
							</RowDesc>
						</RowLabel>
						<RowControl>
							<Toggle
								role='switch'
								aria-checked={effective.notifySuccess}
								$on={effective.notifySuccess}
								onClick={() =>
									setField('notifySuccess', !effective.notifySuccess)
								}
							>
								<ToggleDot $on={effective.notifySuccess} />
							</Toggle>
							<MetaSlot>
								<DirtyTape $visible={isDirty('notifySuccess')}>
									unsaved
								</DirtyTape>
							</MetaSlot>
						</RowControl>
					</Row>
				</SectionBody>
			</Section>

		</Panel>
	)
}

export default BackupsSettingsPanel

/* ─── Styles ─────────────────────────────────────────────────── */

const Panel = styled.div`
	display: flex;
	flex-direction: column;
	gap: 18px;

	& > * {
		${atom};
	}
	${nthStagger};
`

const Intro = styled.div`
	display: grid;
	grid-template-columns: 56px 1fr;
	gap: 16px;
	align-items: flex-start;
	padding: 20px 22px;
	border-radius: 16px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
`

const IntroIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 56px;
	height: 56px;
	border-radius: 16px;
	background: ${T.primaryTint};
	color: ${T.primary};

	svg {
		font-size: 28px;
	}
`

const IntroTitle = styled.h2`
	margin: 0 0 4px;
	font-family: 'Fraunces', 'Georgia', serif;
	font-size: 22px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.3px;
`

const IntroSubtitle = styled.p`
	margin: 0;
	font-size: 13px;
	color: ${T.textSecondary};
	line-height: 1.55;
	max-width: 60ch;
`

const Section = styled.section`
	display: flex;
	flex-direction: column;
	gap: 14px;
	padding: 18px 20px;
	border-radius: 14px;
	background: #ffffff;
	border: 1px solid rgba(15, 23, 42, 0.06);
`

const SectionHead = styled.header`
	display: grid;
	grid-template-columns: 36px 1fr;
	gap: 12px;
	align-items: flex-start;
`

const SectionIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 10px;
	background: ${T.primaryTint};
	color: ${T.primary};

	svg {
		font-size: 20px;
	}
`

const SectionTitle = styled.h3`
	margin: 0 0 2px;
	font-family: 'Fraunces', 'Georgia', serif;
	font-size: 17px;
	font-weight: 600;
	color: ${T.textStrong};
	letter-spacing: -0.2px;
`

const SectionDesc = styled.p`
	margin: 0;
	font-size: 12.5px;
	color: ${T.textSecondary};
	line-height: 1.45;
`

const SectionBody = styled.div`
	display: flex;
	flex-direction: column;
	gap: 0;
	border-top: 1px dashed rgba(15, 23, 42, 0.08);
	padding-top: 10px;

	& > * {
		${atom};
	}
	${nthStagger};
`

/* Row — mirrors SettingsPage's Row with orange left rail on dirty. */
const Row = styled.div<{ $dirty: boolean }>`
	position: relative;
	display: grid;
	grid-template-columns: 1fr minmax(260px, auto);
	gap: 36px;
	align-items: start;
	padding: 20px 0 20px ${(p) => (p.$dirty ? '14px' : '0')};
	border-top: 1px solid ${T.border};
	transition: padding-left 300ms cubic-bezier(0.22, 1, 0.36, 1);

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

const RowTitle = styled.span`
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
	border: 1px solid rgba(15, 23, 42, 0.08);
	font-family: 'JetBrains Mono', monospace;
	font-size: 10px;
	font-weight: 600;
	color: ${T.textMuted};
	letter-spacing: 0.3px;
	line-height: 1;
`

const OwnerTag = styled.span`
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

const RowDesc = styled.p`
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

const MutedInline = styled.span`
	display: inline-flex;
	align-items: center;
	gap: 3px;
	padding: 1px 7px;
	border-radius: 999px;
	background: rgba(15, 23, 42, 0.05);
	color: ${T.textSecondary};
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.3px;
	margin-left: 6px;
`

const RowControl = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	justify-self: end;
	min-width: 220px;
	max-width: 100%;

	@media (max-width: 640px) {
		justify-self: start;
	}
`

/* The field + its optional Unit live on one line; MetaSlot below. */
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
	font-size: 15px;
	color: #e85d2f;
	letter-spacing: 0.2px;
	opacity: ${(p) => (p.$visible ? 1 : 0)};
	transform: translateY(${(p) => (p.$visible ? '0' : '-4px')})
		rotate(-2deg);
	transition:
		opacity 220ms cubic-bezier(0.22, 1, 0.36, 1),
		transform 320ms cubic-bezier(0.22, 1, 0.36, 1);
`

/* ─── Form controls ──────────────────────────────────────────── */

const inputBase = `
	appearance: none;
	-webkit-appearance: none;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	border-radius: 10px;
	background: #ffffff;
	padding: 9px 12px;
	font: inherit;
	font-size: 13px;
	font-weight: 500;
	color: ${T.textStrong};
	transition: border-color 160ms ease;

	&:hover,
	&:focus,
	&:focus-visible {
		outline: none;
		border-color: ${T.primary};
	}
`

const TextInput = styled.input`
	${inputBase}
	min-width: 240px;

	@media (max-width: 640px) {
		min-width: 0;
		width: 100%;
	}
`

const TextInputWithIcon = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	border: 1.5px solid rgba(15, 23, 42, 0.1);
	border-radius: 10px;
	background: #ffffff;
	padding: 0 12px;
	min-width: 260px;
	transition: border-color 160ms ease;

	&:hover,
	&:focus-within {
		border-color: ${T.primary};
	}

	.ico {
		color: ${T.textMuted};
		font-size: 18px;
	}

	input {
		border: 0;
		outline: 0;
		background: transparent;
		padding: 9px 0;
		font: inherit;
		font-size: 13px;
		font-weight: 500;
		color: ${T.textStrong};
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 640px) {
		min-width: 0;
		width: 100%;
	}
`

const NumberInput = styled.input`
	${inputBase}
	width: 110px;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-variant-numeric: tabular-nums;
	text-align: right;
`

const TimeInput = styled.input`
	${inputBase}
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	width: 130px;
`

const Select = styled.select`
	${inputBase}
	min-width: 190px;
	padding-right: 36px;
	cursor: pointer;
	background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a7686' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");
	background-repeat: no-repeat;
	background-position: right 12px center;
	background-size: 12px 12px;
`

const Unit = styled.span`
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 14px;
	font-weight: 500;
	color: ${T.textStrong};
	letter-spacing: 0.3px;
	line-height: 1;
`

/* Exact mirror of ToggleSwitch + Dot used elsewhere in Settings — a
 * div with role="switch" + a single absolutely-positioned Dot. */
const Toggle = styled.div<{ $on: boolean }>`
	width: 46px;
	height: 26px;
	border-radius: 999px;
	background: ${(p) => (p.$on ? T.primary : 'rgba(15, 23, 42, 0.14)')};
	position: relative;
	cursor: pointer;
	transition: background 180ms;
`

const ToggleDot = styled.span<{ $on: boolean }>`
	position: absolute;
	top: 3px;
	left: ${(p) => (p.$on ? '22px' : '3px')};
	width: 20px;
	height: 20px;
	border-radius: 50%;
	background: #ffffff;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.14);
	transition: left 180ms cubic-bezier(0.22, 1, 0.36, 1);
`

const ChipRow = styled.div`
	display: inline-flex;
	flex-wrap: wrap;
	gap: 6px;
`

const WeekChip = styled.button<{ $active: boolean }>`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 36px;
	height: 36px;
	border-radius: 50%;
	border: 1.5px solid
		${(p) => (p.$active ? T.primary : 'rgba(15, 23, 42, 0.1)')};
	background: ${(p) => (p.$active ? T.primary : '#ffffff')};
	color: ${(p) => (p.$active ? '#ffffff' : T.textStrong)};
	font: inherit;
	font-family: 'JetBrains Mono', ui-monospace, monospace;
	font-size: 11.5px;
	font-weight: 700;
	cursor: pointer;
	transition: all 180ms ease;

	&:hover {
		border-color: ${T.primary};
	}
`

/* Unused but imported for clarity on what the panel manages. */
void StorageRounded
void SettingsBackupRestoreRounded
void TimerRounded
void VerifiedOutlined
