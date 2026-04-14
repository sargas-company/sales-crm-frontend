import { SendOutlined } from "@mui/icons-material";
import { Button } from "../../ui";
import Box from "../box/Box";

const ProposalAction = () => {
  return (
    <Box display="flex" flexDirection="column" space={1}>
      <Button>
        <SendOutlined style={{ marginRight: 8 }} />
        send invoice
      </Button>
      <Button varient="outlined">Preview</Button>
      <Button varient="outlined">Save</Button>
    </Box>
  );
};
export default ProposalAction;
