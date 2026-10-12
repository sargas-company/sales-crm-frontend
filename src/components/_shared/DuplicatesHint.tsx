import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
import { PeopleAltOutlined } from '@mui/icons-material'
import { T } from '../sales-analytics/_shared/tokens'

export interface DuplicateRow {
	id: string
	title: string
	subtitle?: string
}

interface Props {
	entityLabel: string // 'lead' | 'client' — used in the copy
	items: DuplicateRow[]
	linkBase: string // e.g. '/leads/view' → links to `${linkBase}/${id}`
	/** What actually matched — shown in the headline ("match by phone"). */
	matchBasis?: 'email' | 'phone' | 'email or phone'
}

/**
 * Non-blocking duplicate suggestion shown inside the contact context.
 * Deliberately a compact contextual notice in the CRM's own primary
 * palette (never amber — saving is always allowed): icon chip, one
 * headline naming the match basis, linked records, quiet footnote.
 */
const DuplicatesHint = ({
	entityLabel,
	items,
	linkBase,
	matchBasis = 'email or phone',
}: Props) => {
	if (items.length === 0) return null
	const noun = items.length === 1 ? entityLabel : `${entityLabel}s`
	return (
		<Notice role='status'>
			<IconChip>
				<PeopleAltOutlined />
			</IconChip>
			<Body>
				<Headline>
					Possible duplicate <Dot>·</Dot>
					<Basis>match by {matchBasis}</Basis>
					{items.length > 1 && <Count>{items.length} {noun}</Count>}
				</Headline>
				<Rows>
					{items.slice(0, 3).map((d) => (
						<Row key={d.id}>
							<RecordLink to={`${linkBase}/${d.id}`} target='_blank'>
								{d.title}
							</RecordLink>
							{d.subtitle && <Sub>{d.subtitle}</Sub>}
						</Row>
					))}
				</Rows>
				<Foot>You can still save — nothing is merged automatically.</Foot>
			</Body>
		</Notice>
	)
}

export default DuplicatesHint

const noticeIn = keyframes`
	from { opacity: 0; transform: translateY(-3px); }
	to   { opacity: 1; transform: translateY(0); }
`

const Notice = styled.div`
	display: flex;
	align-items: flex-start;
	gap: 12px;
	padding: 10px 14px 10px 12px;
	border: 1px solid rgba(15, 23, 42, 0.08);
	border-left: 3px solid ${T.primary};
	border-radius: 10px;
	background: #ffffff;
	animation: ${noticeIn} 180ms ease-out both;
`

const IconChip = styled.span`
	flex-shrink: 0;
	width: 30px;
	height: 30px;
	border-radius: 8px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: rgba(3, 105, 161, 0.08);
	color: ${T.primary};

	svg {
		font-size: 17px;
	}
`

const Body = styled.div`
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 3px;
`

const Headline = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 6px;
	font-size: 13px;
	font-weight: 600;
	color: ${T.textStrong};
`

const Dot = styled.span`
	color: ${T.textMuted};
	font-weight: 400;
`

const Basis = styled.span`
	color: ${T.primary};
	font-weight: 600;
`

const Count = styled.span`
	margin-left: 2px;
	font-size: 11px;
	font-weight: 600;
	color: ${T.textSecondary};
	background: rgba(15, 23, 42, 0.05);
	border-radius: 999px;
	padding: 1px 8px;
`

const Rows = styled.div`
	display: flex;
	flex-direction: column;
	gap: 1px;
`

const Row = styled.div`
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
	font-size: 12.5px;
	min-width: 0;
`

const RecordLink = styled(Link)`
	color: ${T.textStrong};
	font-weight: 600;
	text-decoration: none;
	border-bottom: 1px solid rgba(15, 23, 42, 0.18);
	transition:
		color 150ms ease,
		border-color 150ms ease;

	&:hover {
		color: ${T.primary};
		border-color: ${T.primary};
	}
`

const Sub = styled.span`
	color: ${T.textMuted};
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
`

const Foot = styled.div`
	font-size: 11.5px;
	color: ${T.textMuted};
`
