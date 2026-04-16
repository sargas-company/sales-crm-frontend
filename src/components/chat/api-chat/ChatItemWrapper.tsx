import { FC, ReactNode } from 'react'
import styled from 'styled-components'
import Box from '../../box/Box'
import { useAppSelector } from '../../../hooks'
import useTheme from '../../../theme/useTheme'
import genColorShades from '../../../utils/genColorShades'

const ChatItemWrapper: FC<Props> = ({ children, uid, onClick }) => {
  const isActive = useAppSelector((state) => state.apiChat.selectedChatId === uid)
  const {
    theme: {
      mode,
      primaryColor: { color },
    },
  } = useTheme()

  return (
    <StyledWrp
      my={4}
      className={`${isActive ? 'active-chat' : ''} ${
        mode.name === 'dark'
          ? 'theme-dark-active-fade-hover'
          : 'theme-light-active-fade-hover'
      }`}
      display="flex"
      align="center"
      padding={12}
      theme={{ color }}
      onClick={onClick}
    >
      {children}
    </StyledWrp>
  )
}

export default ChatItemWrapper

interface Props {
  children: ReactNode
  uid: string
  onClick: () => void
}

const StyledWrp = styled(Box)`
  cursor: pointer;
  border-radius: 6px;

  &.active-chat {
    background: linear-gradient(
      -260deg,
      ${({ theme }) =>
        `${
          genColorShades(theme.color, {
            total: 1,
            intensity: 5,
          })[0]
        } 10%, ${genColorShades(theme.color)[0]}`}
    );
    * {
      color: #fff;
    }
  }
`
