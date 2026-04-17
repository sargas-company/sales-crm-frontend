import {
  PersonOutlined,
  LocationOnOutlined,
  AttachMoneyOutlined,
  CalendarTodayOutlined,
  ReplyOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  LinkOutlined,

} from "@mui/icons-material"

import Box from "../../box/Box";
import { Text, Chip, Divider } from "../../../ui";
import { GridInnerContainer, GridItem } from "../../layout";
import { formatDate } from "../../../utils/formatDate";
import type { LeadItem, ApiLeadStatus, ApiClientType } from "../../../store/leads/types/definition";

const statusLabel: Record<ApiLeadStatus, string> = {
  conversation_ongoing: "Conversation Ongoing",
  trial:                "Trial",
  hold:                 "Hold",
  contract_offer:       "Contract Offer",
  accept_contract:      "Accept Contract",
  start_contract:       "Start Contract",
  suspended:            "Suspended",
};

const statusColor: Record<ApiLeadStatus, string> = {
  conversation_ongoing: "info",
  trial:                "warning",
  hold:                 "#607D8B",
  contract_offer:       "#9155FD",
  accept_contract:      "success",
  start_contract:       "#00897B",
  suspended:            "#9E9E9E",
};

const clientTypeLabel: Record<ApiClientType, string> = {
  company:    "Company",
  individual: "Individual",
};

const clientTypeColor: Record<ApiClientType, string> = {
  company:    "#9155FD",
  individual: "#FF9F43",
};

const SectionLabel = ({ children }: { children: string }) => (
  <Text
    varient="caption"
    weight="medium"
    secondary
    styles={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
  >
    {children}
  </Text>
);

const InfoRow = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <Box display="flex" align="center" space={2} style={{ minHeight: 36 }}>
    <Box
      display="flex"
      align="center"
      space={1}
      style={{ minWidth: 160, color: "var(--text-secondary, #8A8D93)" }}
    >
      {icon}
      <Text varient="body2" secondary>
        {label}
      </Text>
    </Box>
    <Box>{children}</Box>
  </Box>
);

interface Props {
  lead: LeadItem;
}

const PreviewMain = ({ lead }: Props) => {

  return (
      <Box pt={4} pb={35} display="flex" flexDirection="column" space={2}>

      {/* ── Details ── */}
      <Box display="flex" flexDirection="column" space={3}>
        <SectionLabel>Details</SectionLabel>
        <GridInnerContainer spacing={1}>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<PersonOutlined style={{ fontSize: 18 }} />} label="Lead Name">
              <Text varient="body2">{lead.leadName ?? "—"}</Text>
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<LocationOnOutlined style={{ fontSize: 18 }} />} label="Location">
              <Text varient="body2">{lead.location ?? "—"}</Text>
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<AttachMoneyOutlined style={{ fontSize: 18 }} />} label="Rate">
              {lead.rate != null ? (
                <Chip label={`$${lead.rate} / hr`} skin="light" size="small" color="success"   styles={{ whiteSpace: "nowrap", color: "#000000" }}/>
              ) : (
                <Text varient="body2">—</Text>
              )}
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<PersonOutlined style={{ fontSize: 18 }} />} label="Client Type">
              {lead.clientType ? (
                <Chip
                  label={clientTypeLabel[lead.clientType]}
                  skin="light"
                  size="small"
                  color={clientTypeColor[lead.clientType]}
                  styles={{ whiteSpace: "nowrap", color: "#000000" }}
                />
              ) : (
                <Text varient="body2">—</Text>
              )}
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<CheckCircleOutlined style={{ fontSize: 18 }} />} label="Status">
              <Chip
                label={statusLabel[lead.status]}
                skin="light"
                size="small"
                color={statusColor[lead.status]}
                styles={{ whiteSpace: "nowrap", color: "#000000" }}
              />
            </InfoRow>
          </GridItem>

        </GridInnerContainer>
      </Box>

      <Divider />

      {/* ── Timeline ── */}
      <Box display="flex" flexDirection="column" space={3}>
        <SectionLabel>Timeline</SectionLabel>
        <GridInnerContainer spacing={1}>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<ReplyOutlined style={{ fontSize: 18 }} />} label="Replied At">
              <Text varient="body2">{formatDate(lead.repliedAt)}</Text>
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<CheckCircleOutlined style={{ fontSize: 18 }} />} label="Accepted At">
              <Text varient="body2">{formatDate(lead.acceptedAt)}</Text>
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<PauseCircleOutlined style={{ fontSize: 18 }} />} label="Hold At">
              <Text varient="body2">{formatDate(lead.holdAt)}</Text>
            </InfoRow>
          </GridItem>

          <GridItem xs={12} md={6}>
            <InfoRow icon={<CalendarTodayOutlined style={{ fontSize: 18 }} />} label="Created At">
              <Text varient="body2">{formatDate(lead.createdAt)}</Text>
            </InfoRow>
          </GridItem>

        </GridInnerContainer>
      </Box>

      {/* ── Linked Proposal ── */}
      {lead.proposalId && (
        <>
          <Divider />
          <Box display="flex" flexDirection="column" space={3}>
            <SectionLabel>Linked Proposal</SectionLabel>
            <InfoRow icon={<LinkOutlined style={{ fontSize: 18 }} />} label="Proposal ID">
              <Box display="flex" align="center" space={1}>
                <a
                    href={`${import.meta.env.VITE_APP_URL}/proposal/preview/${lead.proposalId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ wordBreak: "break-all" }}
                >
                  <Text varient="body2" skinColor>
                    {`${import.meta.env.VITE_APP_URL}/proposal/preview/${lead.proposalId}`}
                  </Text>
                </a>
              </Box>
            </InfoRow>
          </Box>
        </>
      )}

    </Box>
  );
};

export default PreviewMain;
