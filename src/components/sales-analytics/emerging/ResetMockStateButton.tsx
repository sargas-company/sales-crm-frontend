import { useState } from 'react'
import styled from 'styled-components'
import { useResetSalesMockStateMutation } from '../../../store/sales-analytics/salesAnalyticsApi'

const Btn = styled('button')`
	background: #fef2f2;
	color: #991b1b;
	border: 1px solid #fecaca;
	border-radius: 8px;
	padding: 6px 12px;
	font-size: 12px;
	font-weight: 700;
	cursor: pointer;

	&:hover {
		background: #fee2e2;
	}
	&:focus-visible {
		outline: 2px solid #f87171;
	}
	&:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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
`

const ResetMockStateButton = () => {
	const [reset, { isLoading }] = useResetSalesMockStateMutation()
	const [confirming, setConfirming] = useState(false)

	return (
		<>
			<Btn type='button' onClick={() => setConfirming(true)}>
				Reset demo state
			</Btn>
			{confirming && (
				<Modal role='dialog' aria-modal='true' aria-label='Reset demo state'>
					<div
						style={{
							background: '#ffffff',
							borderRadius: 6,
							padding: 22,
							maxWidth: 460,
							width: '100%',
							boxShadow: '0 20px 40px -10px rgba(15,23,42,0.2)',
						}}
					>
						<div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
							Reset demo state?
						</div>
						<div style={{ fontSize: 13.5, color: '#475569', marginTop: 6, lineHeight: 1.5 }}>
							Clears manual relevance ratings, taxonomy candidate actions and alert config
							back to their mock baseline. Nothing in this UI is real backend state.
						</div>
						<div
							style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}
						>
							<button
								type='button'
								onClick={() => setConfirming(false)}
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
								disabled={isLoading}
								onClick={async () => {
									await reset()
									setConfirming(false)
								}}
								style={{
									background: '#dc2626',
									color: '#ffffff',
									border: 'none',
									padding: '6px 14px',
									borderRadius: 8,
									fontWeight: 700,
									cursor: 'pointer',
								}}
							>
								{isLoading ? 'Resetting…' : 'Reset'}
							</button>
						</div>
					</div>
				</Modal>
			)}
		</>
	)
}

export default ResetMockStateButton
