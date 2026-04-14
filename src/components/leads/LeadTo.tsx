import { memo, useState } from "react";
import { Select, SelectItem, Text } from "../../ui";
import Box from "../box/Box";

const leadTo = {
  1: {
    name: "Wonder-Land, LLC",
    address: "37843 Valkary Monden",
    phone: "+977-98-3498439",
    mail: "valand@email.com",
  },
  2: {
    name: "Sky Fox, FL",
    address: "24354 Matsu Hudson",
    phone: "+977-98-326434",
    mail: "foxiy@email.com",
  },
  3: {
    name: "Skia XOXO, Corp",
    address: "349294, Neverthland",
    phone: "+977-98-1875",
    mail: "kiasa@email.com",
  },
};
type LeadKey = typeof leadTo;
const LeadTo = ({ id }: { id: number }) => {
  const [selected, setSelected] = useState<any>(id);
  const handleSelectLead = (val: string) => {
    setSelected(+val);
  };
  return (
    <Box display="flex" flexDirection="column" space={0.8} px={20}>
      <Text varient="body2" weight="bold" paragraph>
        Lead To:{" "}
      </Text>
      <Select
        defaultValue={selected?.toString()!}
        onChange={handleSelectLead}
        sizes="small"
        width="250px"
        labelWidth="250px"
        containerWidth="250px"
      >
        <SelectItem value="1" label="John Doe" />
        <SelectItem value="2" label="Jack Frag" />
        <SelectItem value="3" label="Tomo Graphic" />
      </Select>
      {selected && (
        <Box my={12} display="flex" flexDirection="column" space={0.2}>
          <Text varient="body2">
            {leadTo[selected as keyof LeadKey].name}
          </Text>
          <Text varient="body2">
            {leadTo[selected as keyof LeadKey].address}
          </Text>
          <Text varient="body2">
            {leadTo[selected as keyof LeadKey].phone}
          </Text>
          <Text varient="body2">
            {leadTo[selected as keyof LeadKey].mail}
          </Text>
        </Box>
      )}
    </Box>
  );
};
export default memo(LeadTo);
