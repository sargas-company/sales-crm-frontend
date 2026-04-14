import { AttachMoney } from "@mui/icons-material";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import AddMain from "../../../components/leads/add/AddMain";
import LeadAction from "../../../components/leads/LeadAction";
import LeadOption from "../../../components/leads/LeadOption";
import LeadLayout from "../../../components/leads/layout/LeadLayout";
import { Button } from "../../../ui";

const LeadEdit = () => {
  return (
    <LeadLayout>
      <AddMain />
      <Box>
        <Card padding="20px">
          <LeadAction />
          <Button color="success" styles={{ width: "100%", marginTop: 16 }}>
            <AttachMoney fontSize="small" /> Add Payment
          </Button>
        </Card>
        <LeadOption />
      </Box>
    </LeadLayout>
  );
};
export default LeadEdit;
