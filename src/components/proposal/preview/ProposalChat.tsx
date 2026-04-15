
import Box from "../../box/Box"


interface Props {
  proposalId: string;
}

const ProposalChat = ({ proposalId }: Props) => {

  return (
    <Box display="flex" flexDirection="column" style={{ height: "60vh" }}>
      Chat
    </Box>
  );
};

export default ProposalChat;
