import { Link } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'
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
}

/**
 * Non-blocking duplicate suggestion shown under the contact fields.
 * The user may always save — the system never auto-links or merges.
 */
const DuplicatesHint = ({ entityLabel, items, linkBase }: Props) => {
	if (items.length === 0) return null
	const noun = items.length === 1 ? entityLabel : `${entityLabel}s`
	const verb = items.length === 1 ? 'shares' : 'share'
	return (
		<Box role='status'>
			<HintTitle>
				Possible duplicate — {items.length} {noun} {verb} this email or phone
			</HintTitle>
			<Note>
				You can still save — the system will not merge or link records
				automatically.
			</Note>
			<List>
				{items.slice(0, 5).map((d) => (
					<li key={d.id}>
						<Link to={`${linkBase}/${d.id}`} target='_blank'>
							{d.title}
						</Link>
						{d.subtitle ? ` · ${d.subtitle}` : ''}
					</li>
				))}
			</List>
		</Box>
	)
}

export default DuplicatesHint

const hintIn = keyframes`
	from { opacity: 0; transform: translateY(-3px); }
	to   { opacity: 1; transform: translateY(0); }
`

/* Deliberately quiet: this is an informational aside, not a warning —
   saving is always allowed, so it must not shout at the user. */
const Box = styled.div`
	margin-top: 12px;
	padding: 10px 14px;
	border-radius: 10px;
	background: rgba(15, 23, 42, 0.025);
	border: 1px solid rgba(15, 23, 42, 0.08);
	font-size: 12.5px;
	color: ${T.textSecondary};
	animation: ${hintIn} 180ms ease-out both;
`
const HintTitle = styled.div`
	font-weight: 600;
	color: ${T.textStrong};
	margin-bottom: 2px;
`
const Note = styled.div`
	color: ${T.textSecondary};
	margin-bottom: 6px;
`
const List = styled.ul`
	list-style: none;
	padding-left: 0;
	margin: 0;
	li {
		margin: 2px 0;
	}
	a {
		color: ${T.primary};
		font-weight: 600;
	}
`
