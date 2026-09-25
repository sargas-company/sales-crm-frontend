import styled from 'styled-components'

export const CoverLetterCell = styled('div')`
	position: relative;
	display: flex;
	flex-direction: column;
	gap: 4px;
	width: 100%;
	padding: 6px 10px;
	border-radius: 8px;
	cursor: pointer;
	transition:
		background 0.2s ease,
		transform 0.2s ease;

	.cover-letter-text {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		font-size: 13px;
		line-height: 1.5;
	}
	.cover-letter-hint {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.4px;
		text-transform: uppercase;
		opacity: 0;
		color: #6366f1;
		transform: translateY(-2px);
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	&:hover {
		background: rgba(99, 102, 241, 0.08);
	}
	&:hover .cover-letter-hint {
		opacity: 1;
		transform: translateY(0);
	}
`

export const JobUrlCell = styled('div')`
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px 10px;
	border-radius: 999px;
	background: rgba(99, 102, 241, 0.08);
	cursor: pointer;
	transition:
		background 0.2s ease,
		transform 0.2s ease;

	.job-url-tag {
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12px;
		font-weight: 600;
		color: #6366f1;
		letter-spacing: 0.5px;
	}
	.job-url-copy {
		font-size: 14px !important;
		color: #6366f1;
		opacity: 0.7;
		transition: opacity 0.2s ease;
	}
	&:hover {
		background: rgba(99, 102, 241, 0.16);
		transform: translateY(-1px);
	}
	&:hover .job-url-copy {
		opacity: 1;
	}
`
