import { FC } from 'react'
import styled from 'styled-components'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Text } from '../../../ui'
import ColorBox from '../../box/ColorBox'
import useTheme from '../../../theme/useTheme'

const MsgBox: FC<Props> = ({ msg, from }) => {
	const { theme } = useTheme()
	const isAI = from !== 'me'

	return (
		<StyledMsgBox
			backgroundTheme={isAI ? 'background' : ''}
			color={theme.primaryColor.color}
			transparency={8}
			px={16}
			py={8}
			className='overflow-hidden'
			mb={6}
		>
			{isAI ? (
				<MarkdownWrapper>
					<ReactMarkdown remarkPlugins={[remarkGfm]}>{msg}</ReactMarkdown>
				</MarkdownWrapper>
			) : (
				<Text
					varient='body2'
					weight='medium'
					color='#fff'
					styles={{ whiteSpace: 'break-spaces' }}
				>
					{msg}
				</Text>
			)}
		</StyledMsgBox>
	)
}
export default MsgBox
interface Props {
	msg: string
	from?: 'me' | 'other'
}

const MarkdownWrapper = styled.div`
	font-size: 14px;
	line-height: 1.6;
	color: inherit;

	p {
		margin: 0 0 8px;
		&:last-child {
			margin-bottom: 0;
		}
	}

	h1,
	h2,
	h3,
	h4 {
		font-weight: 600;
		margin: 12px 0 6px;
		line-height: 1.3;
	}
	h1 {
		font-size: 18px;
	}
	h2 {
		font-size: 16px;
	}
	h3 {
		font-size: 15px;
	}

	ul,
	ol {
		padding-left: 20px;
		margin: 6px 0;
	}
	li {
		margin-bottom: 4px;
	}

	strong {
		font-weight: 600;
	}
	em {
		font-style: italic;
	}

	code {
		font-family: 'Fira Code', 'Courier New', monospace;
		font-size: 13px;
		background: rgba(0, 0, 0, 0.08);
		padding: 1px 5px;
		border-radius: 4px;
	}

	pre {
		background: rgba(0, 0, 0, 0.08);
		border-radius: 6px;
		padding: 10px 14px;
		margin: 8px 0;
		overflow-x: auto;

		code {
			background: none;
			padding: 0;
		}
	}

	blockquote {
		border-left: 3px solid currentColor;
		opacity: 0.7;
		padding-left: 10px;
		margin: 6px 0;
	}

	hr {
		border: none;
		border-top: 1px solid rgba(0, 0, 0, 0.15);
		margin: 10px 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 8px 0;
		font-size: 13px;
	}
	th,
	td {
		border: 1px solid rgba(0, 0, 0, 0.15);
		padding: 6px 10px;
		text-align: left;
	}
	th {
		font-weight: 600;
		background: rgba(0, 0, 0, 0.05);
	}
	tr:nth-child(even) td {
		background: rgba(0, 0, 0, 0.02);
	}
`

const StyledMsgBox = styled(ColorBox)`
	max-width: calc(100% - 3rem);
	border-radius: 8px;
	border-top-left-radius: 4px;
	@media screen and (min-width: 600px) {
		max-width: 65%;
	}
`
