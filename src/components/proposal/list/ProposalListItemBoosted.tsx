import { BoostedStatus } from "../../../store/proposals/types/definition";
import { Chip } from "../../../ui";

const boostedColor: Record<BoostedStatus, string> = {
  Boosted: "success",
  "Not Boosted": "#8A8D93",
  "Boosted Outbid": "error",
};

const ProposalListItemBoosted = ({ itemBoosted }: { itemBoosted: BoostedStatus }) => (
  <Chip
    label={itemBoosted}
    skin="light"
    size="small"
    color={boostedColor[itemBoosted]}
    styles={{ whiteSpace: "nowrap", color: "#000000" }}
  />
);

export default ProposalListItemBoosted;
