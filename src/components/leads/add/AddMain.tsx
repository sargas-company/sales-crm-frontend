import { FC } from "react";

import { Divider } from "../../../ui";
import Box from "../../box/Box";
import Card from "../../card/Card";
import { GridInnerContainer, GridItem } from "../../layout";
import AddNewItem from "../item/AddNewItem";
import BillingDetail from "../BillingDetail";
import LeadDate from "../LeadDate";
import LeadNote from "../LeadNote";
import LeadNumber from "../LeadNumber";
import LeadTo from "../LeadTo";
import OragnizationDetail from "../OrganizationDetails";
import type { Lead } from "../../../page/leads/add/type";

const AddMain: FC<Partial<Lead>> = (props) => {
  const {
    leadNo,
    leadTo,
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
      {/* Lead number */}
      <Box display="flex" flexDirection="column" space={1} my={12}>
        <LeadNumber value={leadNo ? leadNo : 2001} />
        <LeadDate dateDue={dateDue} dateIssue={dateIssue} />
      </Box>

      <Divider styles={{ margin: "1rem 0rem" }} />
      {/* Lead to */}
      <GridInnerContainer>
        <GridItem xs={12} md={7}>
          <LeadTo id={leadTo!} />
        </GridItem>
        <GridItem xs={12} md={5}>
          <BillingDetail />
        </GridItem>
      </GridInnerContainer>
      <Divider styles={{ margin: "2rem 0rem 3rem 0rem" }} />
      {/* Add Item */}
      <AddNewItem items={items} salesperson={salesperson} msgLeave={msgLeave} />
      <Divider styles={{ margin: "2rem 0" }} />
      <LeadNote note={note} />
    </Card>
  );
};
export default AddMain;
