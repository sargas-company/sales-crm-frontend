import { FC, memo } from "react";
import { Select, SelectItem } from "../../../ui";

const LeadFilter: FC<Props> = ({ changeFilter, status }) => {
  return (
    <>
      <Select
        defaultValue={status}
        width="100%"
        labelWidth="100%"
        containerWidth="80%"
        label="Lead Status"
        onChange={changeFilter}
      >
        <SelectItem value="" label="none" />
        <SelectItem value="downloaded" label="downloaded" />
        <SelectItem value="draft" label="draft" />
        <SelectItem value="paid" label="paid" />
        <SelectItem value="past due" label="past due" />
        <SelectItem value="partial payment" label="partial payment" />
      </Select>
    </>
  );
};
export default memo(LeadFilter);

interface Props {
  changeFilter: (status: string) => void;
  status: string;
}
