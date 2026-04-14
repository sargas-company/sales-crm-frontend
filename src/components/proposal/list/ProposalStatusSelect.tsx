import { useState } from "react";
import { Menu, MenuItem } from "@mui/material";
import { KeyboardArrowDown } from "@mui/icons-material";
import { ProposalStatus } from "../../../store/proposals/types/definition";
import { Chip } from "../../../ui";

const statusColor: Record<ProposalStatus, string> = {
  Draft: "warning",
  Sent: "info",
  Viewed: "#9155FD",
  Replied: "success",
};

const allStatuses: ProposalStatus[] = ["Draft", "Sent", "Viewed", "Replied"];

interface Props {
  status: ProposalStatus;
  onChange: (status: ProposalStatus) => void;
}

const ProposalStatusSelect = ({ status, onChange }: Props) => {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setAnchor(e.currentTarget);
  };

  const handleSelect = (s: ProposalStatus) => {
    onChange(s);
    setAnchor(null);
  };

  return (
    <>
      <span
        onClick={handleOpen}
        style={{ display: "inline-flex", alignItems: "center", cursor: "pointer", gap: 2 }}
      >
        <Chip label={status} skin="light" size="small" color={statusColor[status]} />
        <KeyboardArrowDown style={{ fontSize: 16, opacity: 0.6 }} />
      </span>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { style: { padding: "4px 0" } } }}
      >
        {allStatuses.map((s) => (
          <MenuItem
            key={s}
            selected={s === status}
            onClick={() => handleSelect(s)}
            style={{ padding: "6px 12px" }}
          >
            <Chip label={s} skin="light" size="small" color={statusColor[s]} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default ProposalStatusSelect;
