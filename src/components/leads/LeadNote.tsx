import { Text, TextField } from "../../ui";
import Box from "../box/Box";

const LeadNote = ({ note }: { note?: string }) => (
  <Box px={20}>
    <Text varient="body2" lineHeight="30px" secondary paragraph>
      Note:
    </Text>
    <TextField
      name="lead-note"
      defaultValue={
        note
          ? note
          : "It was a pleasure working with you and your team. We hope you will keep us in mind for future freelance projects. Thank You!"
      }
      multiRow
    />
  </Box>
);
export default LeadNote;
