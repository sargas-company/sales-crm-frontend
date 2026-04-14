import { AttachMoney } from "@mui/icons-material";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import AddMain from "../../../components/proposal/add/AddMain";
import ProposalAction from "../../../components/proposal/ProposalAction";
import ProposalOption from "../../../components/proposal/ProposalOption";
import ProposalLayout from "../../../components/proposal/layout/ProposalLayout";
import { Button } from "../../../ui";

const InvoiceEdit = () => {
  return (
    <ProposalLayout>
      <AddMain />
      <Box>
        <Card padding="20px">
          <ProposalAction />
          <Button color="success" styles={{ width: "100%", marginTop: 16 }}>
            <AttachMoney fontSize="small" /> Add Payment
          </Button>
        </Card>
        <ProposalOption />
      </Box>
    </ProposalLayout>
  );
};
export default InvoiceEdit;
