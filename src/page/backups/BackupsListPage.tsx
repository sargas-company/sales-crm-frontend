import styled from 'styled-components'
import { T } from '../../components/sales-analytics/_shared/tokens'
import BackupRecoveryPanel from '../settings/BackupRecoveryPanel'

/**
 * Standalone top-level Backups page. Lives at `/backups/list`, wired
 * into the app sidebar under its own "Backup & Recovery" group so the
 * surface is first-class and discoverable, not tucked away inside
 * Settings. The actual table + hero stats are the same component that
 * used to render inside Settings; only the page shell is new.
 */
const BackupsListPage = () => {
	return (
		<Shell>
			<Hero>
				<Crumbs>
					<span className='crumb-dot' aria-hidden='true' />
					<span className='current'>Backup &amp; Recovery</span>
				</Crumbs>
				<HeadRow>
					<div className='title'>
						<h1>Backups</h1>
					</div>
					<BackupHint aria-hidden='true'>
							<span className='row'>
								<span className='w'>sleep</span>
								<span className='amber-wrap'>
									<span className='a'>tight</span>
									<svg
										className='squiggle'
										viewBox='0 0 120 12'
										width='120'
										height='12'
										preserveAspectRatio='none'
									>
										<path
											d='M2 8 Q 12 2, 22 8 T 42 8 T 62 8 T 82 8 T 102 8 T 118 8'
											fill='none'
											stroke='currentColor'
											strokeWidth='2.2'
											strokeLinecap='round'
										/>
									</svg>
								</span>
								<span className='w'>tonight</span>
							</span>
							<span className='stars'>
								<svg
									className='s'
									width='16'
									height='16'
									viewBox='0 0 24 24'
									fill='currentColor'
								>
									<path d='M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.9l-6.2 4.4 2.4-7.4L2 9.4h7.6z' />
								</svg>
							</span>
					</BackupHint>
				</HeadRow>
			</Hero>

			<Content>
				<BackupRecoveryPanel />
			</Content>
		</Shell>
	)
}

export default BackupsListPage

/* ─── Styles ──────────────────────────────────── */

const Shell = styled.main`
	display: flex;
	flex-direction: column;
	gap: 16px;
	padding: 20px 24px 60px;
	max-width: 1400px;
	margin: 0 auto;
	width: 100%;
`

const Hero = styled.header`
	position: relative;
	padding: 32px 36px 28px;
	border-radius: 16px;
	background: #ffffff;
	border: 1px solid ${T.border};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 20px 40px -20px rgba(15, 23, 42, 0.12);
	overflow: hidden;
	isolation: isolate;

	&::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			radial-gradient(900px 340px at 5% -10%, rgba(3, 105, 161, 0.05) 0%, transparent 60%),
			radial-gradient(700px 300px at 95% -5%, rgba(217, 119, 6, 0.05) 0%, transparent 55%);
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
	font-size: 12px;
	font-weight: 600;
	color: ${T.textMuted};
	margin-bottom: 14px;
	letter-spacing: 0.3px;
	text-transform: uppercase;

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

const HeadRow = styled.div`
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 24px;

	.title h1 {
		font-family: 'Bricolage Grotesque', 'Inter', system-ui, sans-serif;
		font-size: 44px;
		font-weight: 700;
		font-variation-settings: 'opsz' 72;
		line-height: 0.95;
		margin: 0;
		color: ${T.textStrong};
		letter-spacing: -1.6px;
	}

	@media (max-width: 720px) {
		flex-direction: column;
		align-items: stretch;
		gap: 16px;
		.title h1 {
			font-size: 34px;
			letter-spacing: -1px;
		}
	}
`

const BackupHint = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 10px;
	pointer-events: none;
	color: #241e16;
	align-self: flex-start;
	margin-top: -18px;

	.row {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
	}

	.w {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 32px;
		line-height: 1;
		letter-spacing: 0.2px;
		color: #241e16;
	}

	.amber-wrap {
		position: relative;
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		padding-bottom: 4px;
	}

	.a {
		font-family: 'Caveat', 'Brush Script MT', cursive;
		font-weight: 700;
		font-size: 36px;
		line-height: 1;
		letter-spacing: 0.3px;
		color: #e85d2f;
	}

	.squiggle {
		display: block;
		width: 100%;
		max-width: 120px;
		margin-top: 2px;
		color: #e85d2f;
	}

	.stars {
		display: inline-flex;
		align-items: center;
		margin-left: 2px;
		color: #e85d2f;
	}

	@media (max-width: 720px) {
		display: none;
	}
`


const Content = styled.div`
	background: #ffffff;
	border-radius: 16px;
	border: 1px solid ${T.border};
	box-shadow: ${T.cardShadow};
	padding: 24px 28px;

	@media (max-width: 720px) {
		padding: 18px 16px;
	}
`
