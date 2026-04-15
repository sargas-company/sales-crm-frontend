import { Link } from "react-router-dom";
import Box from "../../box/Box";
import { IconButton } from "../../../ui";
import { DeleteOutline, VisibilityOutlined, EditOutlined } from "@mui/icons-material";

const ProposalListAction = ({ proposalId }: { proposalId: string }) => (
  <Box display="flex">
    <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
      <DeleteOutline />
    </IconButton>
    <Link to={`/proposal/preview/${proposalId}`}>
      <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
        <VisibilityOutlined />
      </IconButton>
    </Link>
    <Link to={`/proposal/edit/${proposalId}`}>
      <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
        <EditOutlined />
      </IconButton>
    </Link>
  </Box>
);

export default ProposalListAction;
