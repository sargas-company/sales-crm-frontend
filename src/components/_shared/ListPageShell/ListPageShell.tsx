import { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'
import { SearchOutlined } from '@mui/icons-material'
import { T } from '../../sales-analytics/_shared/tokens'

export interface Crumb {
	label: string
	current?: boolean
	href?: string
}

interface Props {
	crumbs: Crumb[]
	icon: ReactNode
	title: string
	subtitle?: string
	action?: ReactNode
	searchPlaceholder?: string
	search?: string
	onSearchChange?: (v: string) => void
	filters?: ReactNode
	children: ReactNode
}

const ListPageShell = ({
	crumbs,
	icon,
	title,
	subtitle,
	action,
	searchPlaceholder,
	search,
	onSearchChange,
	filters,
	children,
}: Props) => (
	<ViewFade>
		<ShellCard>
			<ShellInner>
				<Crumbs>
					<span className='crumb-dot' aria-hidden='true' />
					{crumbs.map((c, i) => (
						<span key={i} className={c.current ? 'current' : 'crumb-parent'}>
							{c.label}
							{i < crumbs.length - 1 && (
								<span className='crumb-sep' aria-hidden='true'>
									{' '}
									/
								</span>
							)}
						</span>
					))}
				</Crumbs>

				<PageHead>
					<div className='title'>
						<HeadIcon>{icon}</HeadIcon>
						<div className='title-text'>
							<h1>{title}</h1>
							{subtitle && <p>{subtitle}</p>}
						</div>
					</div>
					{action}
				</PageHead>

				{(onSearchChange || filters) && (
					<FiltersBar>
						{onSearchChange && (
							<SearchField>
								<SearchOutlined />
								<input
									type='text'
									name='list-search'
									placeholder={searchPlaceholder ?? 'Search'}
									value={search ?? ''}
									onChange={(e) => onSearchChange(e.target.value)}
									aria-label={searchPlaceholder ?? 'Search'}
								/>
							</SearchField>
						)}
						{filters}
					</FiltersBar>
				)}

				{children}
			</ShellInner>
		</ShellCard>
	</ViewFade>
)

export default ListPageShell

const fadeUp = keyframes`
	from { opacity: 0; transform: translateY(6px); }
	to   { opacity: 1; transform: translateY(0); }
`

const ViewFade = styled.div`
	animation: ${fadeUp} 240ms ${T.ease};
`

const ShellCard = styled.div`
	position: relative;
	background: ${T.cardBg};
	border-radius: ${T.radiusLg};
	box-shadow:
		0 1px 2px rgba(15, 23, 42, 0.04),
		0 12px 40px rgba(39, 36, 45, 0.06);
	overflow: hidden;
`

const ShellInner = styled.div`
	padding: 30px 32px 32px;
	display: flex;
	flex-direction: column;
	gap: 22px;

	@media (max-width: 767px) {
		padding: 22px 18px 24px;
		gap: 18px;
	}
`

const Crumbs = styled.div`
	display: inline-flex;
	align-items: center;
	gap: 8px;
	font-size: 12.5px;
	color: ${T.textMuted};

	.crumb-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: ${T.primary};
	}
	.crumb-sep {
		opacity: 0.4;
		margin-left: 6px;
	}
	.current {
		color: ${T.textSecondary};
		font-weight: 600;
	}
`

const PageHead = styled.header`
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 20px;
	flex-wrap: wrap;
	padding-bottom: 22px;
	border-bottom: 1px solid ${T.divider};

	.title {
		display: inline-flex;
		align-items: center;
		gap: 18px;
		min-width: 0;
	}
	.title-text {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}
	.title-text h1 {
		margin: 0;
		font-size: 34px;
		font-weight: 700;
		letter-spacing: -0.8px;
		line-height: 1.05;
		color: ${T.textStrong};
	}
	.title-text p {
		margin: 0;
		font-size: 14px;
		line-height: 1.5;
		color: ${T.textSecondary};
		max-width: 62ch;
	}

	@media (max-width: 720px) {
		.title-text h1 {
			font-size: 28px;
			letter-spacing: -0.5px;
		}
	}
`

const HeadIcon = styled.span`
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 52px;
	height: 52px;
	border-radius: 14px;
	background: ${T.primaryTint};
	color: ${T.primary};
	flex-shrink: 0;

	svg {
		font-size: 28px;
	}
`

const FiltersBar = styled.div`
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
`

const SearchField = styled.label`
	position: relative;
	display: inline-flex;
	align-items: center;
	background: transparent;
	border: 1.5px solid #cec9d8;
	border-radius: ${T.radiusPill};
	padding: 10px 16px 10px 14px;
	gap: 10px;
	min-width: 280px;
	max-width: 380px;
	flex: 1;
	transition:
		border-color 120ms ${T.ease},
		box-shadow 160ms ${T.ease};

	svg {
		font-size: 19px;
		color: ${T.textSecondary};
	}
	input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-family: inherit;
		font-size: 13.5px;
		color: ${T.textStrong};
		min-width: 0;

		&::placeholder {
			color: ${T.textSecondary};
		}
	}

	&:hover {
		border-color: #b3adc2;
	}

	&:focus-within {
		border-color: ${T.primary};
		box-shadow: 0 0 0 3px ${T.primaryTint};
	}
`
