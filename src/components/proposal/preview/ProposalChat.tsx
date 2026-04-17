import ChatPanel from '../../chat/panel/ChatPanel'

interface Props {
  proposalId: string
}

const ProposalChat = ({ proposalId }: Props) => {
  return (
    <ChatPanel
      historyUrl={`/proposals/${proposalId}/chat`}
      proposalId={proposalId}
    />
  )
}

export default ProposalChat
