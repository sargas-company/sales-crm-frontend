import Card from "../../../components/card/Card";
import AddMain from "../../../components/proposal/add/AddMain";
import ProposalAction from "../../../components/proposal/ProposalAction";
import ProposalOption from "../../../components/proposal/ProposalOption";
import ProposalLayout from "../../../components/proposal/layout/ProposalLayout";

const ProposalAdd = () => {
  return (
    <ProposalLayout>
      <AddMain />
      <>
        <Card padding="20px">
          <ProposalAction />
        </Card>
        <ProposalOption />
      </>
    </ProposalLayout>
  );
};
export default ProposalAdd;
