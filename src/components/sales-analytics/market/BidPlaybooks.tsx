import { useState } from 'react'
import SectionCard from '../_shared/SectionCard'
import SkeletonBlock from '../_shared/SkeletonBlock'
import ErrorState from '../_shared/ErrorState'
import EmptyState from '../_shared/EmptyState'
import { emitPostDetail } from '../posts/JobPostDrawerBus'
import { useSalesFilters } from '../../../page/analytics/filters/useSalesFilters'
import { useGetBidPlaybooksQuery } from '../../../store/sales-analytics/salesAnalyticsApi'

const BidPlaybooks = () => {
	const { filters } = useSalesFilters()
	const { data, isLoading, isError, refetch } = useGetBidPlaybooksQuery(filters)
	const [openId, setOpenId] = useState<string | null>(null)

	if (isLoading || !data)
		return (
			<SectionCard title='Bid playbooks'>
				<SkeletonBlock height={220} />
			</SectionCard>
		)
	if (isError)
		return (
			<SectionCard title='Bid playbooks'>
				<ErrorState onRetry={() => refetch()} />
			</SectionCard>
		)
	if (!data.some((p) => p.sampleSize > 0))
		return (
			<SectionCard title='Bid playbooks'>
				<EmptyState
					title='No playbooks match the current period'
					description='Playbooks appear when the dataset contains representative jobs.'
				/>
			</SectionCard>
		)

	return (
		<SectionCard
			title='Bid playbooks'
			hint='Market-derived – not a claim about conversion. No proposal outcome data yet.'
		>
			<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
				{data.map((pb) => {
					const open = openId === pb.id
					return (
						<div
							key={pb.id}
							style={{
								background: '#f8fafc',
								border: '1px solid #eef1f6',
								borderRadius: 6,
								overflow: 'hidden',
							}}
						>
							<button
								type='button'
								onClick={() => setOpenId(open ? null : pb.id)}
								aria-expanded={open}
								style={{
									width: '100%',
									textAlign: 'left',
									background: '#ffffff',
									border: 'none',
									padding: '12px 14px',
									cursor: 'pointer',
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<div>
									<div style={{ fontWeight: 700, color: '#0f172a' }}>{pb.cluster}</div>
									<div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
										{pb.targetPattern}
									</div>
								</div>
								<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
									<span
										style={{
											fontSize: 11,
											fontWeight: 700,
											color: '#64748b',
											textTransform: 'uppercase',
											letterSpacing: 0.4,
										}}
									>
										{pb.sampleSize} in sample · {pb.periodLabel}
									</span>
									<span aria-hidden='true' style={{ color: '#94a3b8' }}>
										{open ? '▲' : '▼'}
									</span>
								</div>
							</button>
							{open && (
								<div style={{ padding: '14px 16px', display: 'grid', gap: 14 }}>
									<Section title='Recommended opening angle'>
										<p
											style={{
												margin: 0,
												fontSize: 13,
												color: '#1f2937',
												lineHeight: 1.5,
											}}
										>
											{pb.openingAngle}
										</p>
									</Section>
									<TwoCol>
										<Section title='Typical goals'>
											<Tags items={pb.typicalGoals} />
										</Section>
										<Section title='Typical pain points'>
											<Tags items={pb.typicalPainPoints} />
										</Section>
									</TwoCol>
									<TwoCol>
										<Section title='Proof / cases to mention'>
											<List items={pb.proofPoints} />
										</Section>
										<Section title='Technical points to emphasize'>
											<List items={pb.technicalEmphasis} />
										</Section>
									</TwoCol>
									<TwoCol>
										<Section title='Useful discovery questions'>
											<List items={pb.discoveryQuestions} />
										</Section>
										<Section title='Risks or promises to avoid'>
											<List items={pb.avoid} />
										</Section>
									</TwoCol>
									{pb.representativePostIds.length > 0 && (
										<Section title='Representative job posts'>
											<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
												{pb.representativePostIds.map((id) => (
													<button
														key={id}
														type='button'
														onClick={() => emitPostDetail(id)}
														style={{
															background: '#ffffff',
															border: '1px solid #e2e8f0',
															borderRadius: 999,
															padding: '3px 10px',
															fontSize: 11.5,
															color: 'rgba(3, 105, 161, 1)',
															cursor: 'pointer',
														}}
													>
														{id}
													</button>
												))}
											</div>
										</Section>
									)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</SectionCard>
	)
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
	<div>
		<div
			style={{
				fontSize: 11,
				fontWeight: 700,
				color: '#64748b',
				textTransform: 'uppercase',
				letterSpacing: 0.4,
				marginBottom: 4,
			}}
		>
			{title}
		</div>
		{children}
	</div>
)

const TwoCol = ({ children }: { children: React.ReactNode }) => (
	<div
		style={{
			display: 'grid',
			gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
			gap: 14,
		}}
	>
		{children}
	</div>
)

const List = ({ items }: { items: string[] }) => (
	<ul style={{ margin: 0, paddingLeft: 18, color: '#1f2937', fontSize: 13, lineHeight: 1.55 }}>
		{items.map((i, idx) => (
			<li key={idx}>{i}</li>
		))}
	</ul>
)

const Tags = ({ items }: { items: string[] }) => (
	<div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
		{items.map((t) => (
			<span
				key={t}
				style={{
					padding: '3px 10px',
					borderRadius: 999,
					background: 'rgba(3, 105, 161, 0.08)',
					color: 'rgba(3, 105, 161, 1)',
					fontSize: 12,
					fontWeight: 600,
				}}
			>
				{t}
			</span>
		))}
	</div>
)

export default BidPlaybooks
