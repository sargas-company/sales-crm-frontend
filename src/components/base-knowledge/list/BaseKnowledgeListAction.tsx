import { Link } from "react-router-dom";
import Box from "../../box/Box";
import { IconButton } from "../../../ui";
import { DeleteOutline, VisibilityOutlined, EditOutlined } from "@mui/icons-material";

interface Props {
  id: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BaseKnowledgeListAction = ({ id, onEdit, onDelete }: Props) => (
  <Box display="flex">
    <IconButton
      varient="text"
      size={30}
      fontSize={21}
      contentOpacity={5}
      onClick={() => onDelete(id)}
    >
      <DeleteOutline />
    </IconButton>
    <Link to={`/knowledge/preview/${id}`}>
      <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
        <VisibilityOutlined />
      </IconButton>
    </Link>
    <IconButton
      varient="text"
      size={30}
      fontSize={21}
      contentOpacity={5}
      onClick={() => onEdit(id)}
    >
      <EditOutlined />
    </IconButton>
  </Box>
);

export default BaseKnowledgeListAction;
