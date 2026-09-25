import { useState } from 'react'
import styled from 'styled-components'
import {
	useGetCanonicalTaxonomyQuery,
	useRunCandidateActionMutation,
} from '../../../store/sales-analytics/salesAnalyticsApi'
import type {
	CandidateActionType,
	TaxonomyCandidate,
} from '../../../store/sales-analytics/types/candidates'

interface Props {
	candidate: TaxonomyCandidate
}

const Wrap = styled('div')`
	display: flex;
	flex-wrap: wrap;
	gap: 8px;

	button {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
		padding: 6px 12px;
		font-size: 12.5px;
		font-weight: 700;
		color: #1f2937;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}
	button:hover {
		background: rgba(3, 105, 161, 0.08);
		color: rgba(3, 105, 161, 1);
		border-color: rgba(3, 105, 161, 0.16);
	}
	button.danger:hover {
		background: #fef2f2;
		color: #991b1b;
		border-color: #fecaca;
	}
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	select {
		padding: 6px 8px;
		border-radius: 8px;
		border: 1px solid #e2e8f0;
		font-size: 12.5px;
	}
`

const Modal = styled('div')`
	position: fixed;
	inset: 0;
	background: rgba(15, 23, 42, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 60;

	.confirm-box {
		background: #ffffff;
		border-radius: 6px;
		padding: 22px;
		max-width: 480px;
		width: 100%;
		box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.2);
	}
	.confirm-title {
		font-size: 16px;
		font-weight: 700;
		color: #0f172a;
	}
	.confirm-msg {
		font-size: 13.5px;
		color: #475569;
		margin-top: 6px;
		line-height: 1.5;
	}
	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
		margin-top: 18px;
	}
`

const TaxonomyCandidateActions = ({ candidate }: Props) => {
	const [run, { isLoading }] = useRunCandidateActionMutation()
	const { data: taxonomy } = useGetCanonicalTaxonomyQuery()
	const [confirming, setConfirming] = useState<null | {
		action: CandidateActionType
		title: string
		message: string
	}>(null)
	const [mergeTarget, setMergeTarget] = useState('')
	const [showMerge, setShowMerge] = useState(false)

	const submit = async (action: CandidateActionType, targetTaxonomyItemId?: string) => {
		await run({ candidateId: candidate.id, action, targetTaxonomyItemId })
	}

	const askConfirm = (action: CandidateActionType, title: string, message: string) =>
		setConfirming({ action, title, message })

	const doConfirmed = async () => {
		if (!confirming) return
		if (confirming.action === 'merge' || confirming.action === 'alias') {
			if (!mergeTarget) return
			await submit(confirming.action, mergeTarget)
		} else {
			await submit(confirming.action)
		}
		setConfirming(null)
		setMergeTarget('')
		setShowMerge(false)
	}

	const mergeChoices = [...(taxonomy?.technologies ?? []), ...(taxonomy?.directions ?? [])]

	return (
		<>
			<Wrap>
				<button type='button' disabled={isLoading} onClick={() => submit('approve_technology')}>
					Approve as technology
				</button>
				<button type='button' disabled={isLoading} onClick={() => submit('approve_direction')}>
					Approve as direction
				</button>
				<button type='button' disabled={isLoading} onClick={() => submit('keep_signal')}>
					Keep as signal
				</button>
				<button
					type='button'
					disabled={isLoading}
					onClick={() => {
						setShowMerge(true)
						setConfirming({
							action: 'merge',
							title: 'Merge candidate with existing taxonomy',
							message: `Merge "${candidate.proposedName}" into an existing canonical entry? This action is a demo update in mock state and can be reset.`,
						})
					}}
				>
					Merge with existing
				</button>
				<button
					type='button'
					disabled={isLoading}
					onClick={() => {
						setShowMerge(true)
						setConfirming({
							action: 'alias',
							title: 'Add as alias',
							message: `Add "${candidate.proposedName}" as an alias for an existing canonical entry? This is a demo mock state change.`,
						})
					}}
				>
					Add as alias
				</button>
				<button type='button' disabled={isLoading} onClick={() => submit('watch')}>
					Watch
				</button>
				<button
					type='button'
					className='danger'
					disabled={isLoading}
					onClick={() =>
						askConfirm(
							'reject',
							'Reject candidate',
							'Reject this candidate? It will remain hidden from the active workflow. This is a demo mock state change – it can be reset.'
						)
					}
				>
					Reject
				</button>
				<button type='button' disabled={isLoading} onClick={() => submit('ignore')}>
					Ignore
				</button>
			</Wrap>
			{confirming && (
				<Modal role='dialog' aria-modal='true' aria-label={confirming.title}>
					<div className='confirm-box'>
						<div className='confirm-title'>{confirming.title}</div>
						<div className='confirm-msg'>{confirming.message}</div>
						{showMerge && (
							<div style={{ marginTop: 14 }}>
								<label
									htmlFor='merge-target'
									style={{
										fontSize: 11,
										fontWeight: 700,
										color: '#64748b',
										textTransform: 'uppercase',
										letterSpacing: 0.4,
										display: 'block',
										marginBottom: 4,
									}}
								>
									Target
								</label>
								<select
									id='merge-target'
									value={mergeTarget}
									onChange={(e) => setMergeTarget(e.target.value)}
									style={{
										width: '100%',
										padding: '6px 8px',
										borderRadius: 8,
										border: '1px solid #e2e8f0',
									}}
								>
									<option value=''>Select…</option>
									{mergeChoices.map((t) => (
										<option key={t.id} value={t.id}>
											{t.name} ({t.type})
										</option>
									))}
								</select>
							</div>
						)}
						<div className='confirm-actions'>
							<button
								type='button'
								onClick={() => {
									setConfirming(null)
									setShowMerge(false)
									setMergeTarget('')
								}}
								style={{
									background: 'transparent',
									border: '1px solid #e2e8f0',
									padding: '6px 12px',
									borderRadius: 8,
									fontWeight: 600,
									cursor: 'pointer',
								}}
							>
								Cancel
							</button>
							<button
								type='button'
								onClick={doConfirmed}
								disabled={showMerge && !mergeTarget}
								style={{
									background: 'rgba(3, 105, 161, 1)',
									color: '#ffffff',
									border: 'none',
									padding: '6px 14px',
									borderRadius: 8,
									fontWeight: 700,
									cursor: 'pointer',
								}}
							>
								Confirm
							</button>
						</div>
					</div>
				</Modal>
			)}
		</>
	)
}

export default TaxonomyCandidateActions
