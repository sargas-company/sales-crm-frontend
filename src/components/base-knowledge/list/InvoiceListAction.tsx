import { Link } from "react-router-dom";
import Box from "../../box/Box";
import { IconButton } from "../../../ui";

import {
  DeleteOutline,
  VisibilityOutlined,
  EditOutlined,
} from "@mui/icons-material";

const InvoiceListAction = ({ invoiceId }: { invoiceId: number }) => (
  <Box display="flex">
    <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
      <DeleteOutline />
    </IconButton>
    <Link to={`/knowlage/preview/${invoiceId}`}>
      <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
        <VisibilityOutlined />
      </IconButton>
    </Link>
    <Link to={`/knowlage/edit/${invoiceId}`}>
      <IconButton varient="text" size={30} fontSize={21} contentOpacity={5}>
        <EditOutlined />
      </IconButton>
    </Link>
  </Box>
);
export default InvoiceListAction;
