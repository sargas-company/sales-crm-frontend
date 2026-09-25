import styled, { keyframes } from 'styled-components'
import type { StyledProps } from './type'

const fadeInUp = keyframes`
	from {
		opacity: 0;
		transform: translate3d(0, 6px, 0);
	}
	to {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}
`

const emptyFade = keyframes`
	from {
		opacity: 0;
		transform: scale(0.94);
	}
	to {
		opacity: 1;
		transform: scale(1);
	}
`

const iconFloat = keyframes`
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-6px); }
`

const StyledDataGrid = styled('div')<StyledProps>`
	width: ${({ width }) => (width ? width : '100%')};
	padding: 12px 0px;

	& .data_grid {
		border-radius: 12px;
		overflow-x: auto;
		overflow-y: hidden;

		.data_grid_content {
			width: 100%;
			min-width: max-content;

			.data_grid_body {
				min-height: 260px;
				display: flex;
				flex-direction: column;
			}
		}
	}
`

export const EmptyStateBox = styled('div')<{ visibleWidth?: number | null }>`
	flex: 1 1 auto;
	min-height: min(55vh, 420px);
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 32px 24px;
	animation: ${emptyFade} 0.45s ease-out both;

	/* Stick to the left edge of the horizontal-scroll viewport and constrain
	   the width to the visible area so the content centers over what the user
	   actually sees, not the (possibly much wider) full content width. */
	position: sticky;
	left: 0;
	${({ visibleWidth }) =>
		visibleWidth
			? `width: ${visibleWidth}px; max-width: ${visibleWidth}px;`
			: 'width: 100%;'}
	box-sizing: border-box;

	.empty-state-inner {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		max-width: 360px;
		text-align: center;
	}

	.empty-state-icon-wrap {
		margin-bottom: 6px;
		animation: ${iconFloat} 3.2s ease-in-out infinite;
	}
`

const shimmer = keyframes`
	0% { background-position: -400px 0; }
	100% { background-position: 400px 0; }
`

export const SkeletonBox = styled('div')<{ isDark?: boolean }>`
	display: flex;
	flex-direction: column;
	width: 100%;

	.skeleton-row {
		display: flex;
		align-items: center;
		gap: 24px;
		padding: 20px 24px;
		min-height: 64px;
		border-bottom: 1px solid
			${({ isDark }) => (isDark ? 'rgba(177, 177, 177, 0.10)' : 'rgba(122, 122, 122, 0.10)')};
		animation: ${fadeInUp} 0.35s ease-out both;
	}
	.skeleton-row:last-child {
		border-bottom: none;
	}

	.skeleton-bar {
		height: 14px;
		border-radius: 7px;
		background: ${({ isDark }) =>
			isDark
				? 'linear-gradient(90deg, #2a2a2a 0%, #3a3a3a 50%, #2a2a2a 100%)'
				: 'linear-gradient(90deg, #eef0f3 0%, #f7f8fa 50%, #eef0f3 100%)'};
		background-size: 800px 100%;
		animation: ${shimmer} 1.4s linear infinite;
	}
`

export { fadeInUp }

export default StyledDataGrid
