import { FC } from "react";

import { Divider } from "../../../ui";
import Box from "../../box/Box";
import Card from "../../card/Card";
import { GridInnerContainer, GridItem } from "../../layout";
import AddNewItem from "../item/AddNewItem";
import BillingDetail from "../BillingDetail";
import ProposalDate from "../ProposalDate";
import ProposalNote from "../ProposalNote";
import ProposalNumber from "../ProposalNumber";
import ProposalTo from "../ProposalTo";
import OragnizationDetail from "../OrganizationDetails";
import type { Proposal } from "../../../page/proposal/add/type";

const AddMain: FC<Partial<Proposal>> = (props) => {
  const {
    proposalNo,
    proposalTo,
    dateDue,
    dateIssue,
    salesperson,
    items,
    msgLeave,
    note,
  } = props;
  return (
    <Card py="1rem">
      <OragnizationDetail />
      {/* Proposal number */}
      <Box display="flex" flexDirection="column" space={1} my={12}>
        <ProposalNumber value={proposalNo ? proposalNo : 2001} />
        <ProposalDate dateDue={dateDue} dateIssue={dateIssue} />
      </Box>

      <Divider styles={{ margin: "1rem 0rem" }} />
      {/* Proposal to */}
      <GridInnerContainer>
        <GridItem xs={12} md={7}>
          <ProposalTo id={proposalTo!} />
        </GridItem>
        <GridItem xs={12} md={5}>
          <BillingDetail />
        </GridItem>
      </GridInnerContainer>
      <Divider styles={{ margin: "2rem 0rem 3rem 0rem" }} />
      {/* Add Item */}
      <AddNewItem items={items} salesperson={salesperson} msgLeave={msgLeave} />
      <Divider styles={{ margin: "2rem 0" }} />
      <ProposalNote note={note} />
    </Card>
  );
};
export default AddMain;
