import { Tooltip } from "@mui/material";
import {
  ContentCopy, OpenInNew,
  PersonOutlined, BusinessOutlined,
  CalendarTodayOutlined, SendOutlined,
  FlashOnOutlined, LinkOutlined,
} from "@mui/icons-material";
import Box from "../../box/Box";
import { Text, Chip, DividerWithLabel, IconButton } from "../../../ui";
import { GridInnerContainer, GridItem } from "../../layout";
import ProposalListItemStatus from "../list/ProposalListItemStatus";
import ProposalListItemType from "../list/ProposalListItemType";
import ProposalListItemBoosted from "../list/ProposalListItemBoosted";
import { shortUuid, formatDate } from "../../../utils/formatDate";
import type { ProposalItem } from "../../../store/proposals/types/definition";

import upworkLogo from "../../../image/logo/upwork2.png";

const InfoRow = ({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) => (
  <Box display="flex" align="center" space={2} style={{ minHeight: 36 }}>
    <Box display="flex" align="center" space={1} style={{ minWidth: 140, color: "var(--text-secondary, #8A8D93)" }}>
      {icon}
      <Text varient="body2" secondary>{label}</Text>
    </Box>
    <Box>{children}</Box>
  </Box>
);

interface Props {
  proposal: ProposalItem;
}

const PreviewMain = ({ proposal }: Props) => {
  const handleCopy = (text: string) => navigator.clipboard.writeText(text);

  return (
    <Box px={30} py={20} display="flex" flexDirection="column" space={4}>

      {/* ── Header ──────────────────────────────────────────── */}
      <Box display="flex" align="center" justify="space-between" style={{ flexWrap: "wrap", gap: 12 }}>
        <Box display="flex" align="center" space={3}>
          <img src={upworkLogo} alt={proposal.platform} style={{ width: 32, height: 32, objectFit: "contain" }} />
          <Box>
            <Box display="flex" align="center" space={2}>
              <Tooltip title={proposal.id} placement="top">
                <span>
                  <Text heading="h5" style={{ fontFamily: "monospace" }}>
                    #{shortUuid(proposal.id)}
                  </Text>
                </span>
              </Tooltip>
              <IconButton varient="text" size={26} fontSize={16} contentOpacity={5} onClick={() => handleCopy(proposal.id)}>
                <ContentCopy style={{ fontSize: 14 }} />
              </IconButton>
            </Box>
            <Text varient="caption" secondary>{proposal.platform}</Text>
          </Box>
        </Box>
        <Box display="flex" align="center" space={2}>
          <ProposalListItemStatus itemStatus={proposal.status} />
          <ProposalListItemType itemType={proposal.proposalType} />
          <ProposalListItemBoosted itemBoosted={proposal.boosted ? "Boosted" : "Not Boosted"} />
        </Box>
      </Box>

      {/* ── Main Info ────────────────────────────────────────── */}
      <Box>
        <DividerWithLabel label="Details" />
        <Box mt={3}>
          <GridInnerContainer spacing={1}>
            <GridItem xs={12} md={6}>
              <InfoRow icon={<PersonOutlined style={{ fontSize: 18 }} />} label="Manager">
                <Text varient="body2">{proposal.manager}</Text>
              </InfoRow>
            </GridItem>
            <GridItem xs={12} md={6}>
              <InfoRow icon={<BusinessOutlined style={{ fontSize: 18 }} />} label="Account">
                <Text varient="body2">{proposal.account}</Text>
              </InfoRow>
            </GridItem>
            <GridItem xs={12} md={6}>
              <InfoRow icon={<CalendarTodayOutlined style={{ fontSize: 18 }} />} label="Created">
                <Text varient="body2">{formatDate(proposal.createdAt)}</Text>
              </InfoRow>
            </GridItem>
            <GridItem xs={12} md={6}>
              <InfoRow icon={<SendOutlined style={{ fontSize: 18 }} />} label="Sent At">
                <Text varient="body2">{formatDate(proposal.sentAt)}</Text>
              </InfoRow>
            </GridItem>
            <GridItem xs={12} md={6}>
              <InfoRow icon={<FlashOnOutlined style={{ fontSize: 18 }} />} label="Connects">
                <Chip label={String(proposal.connects)} skin="light" size="small" color="info" />
              </InfoRow>
            </GridItem>
            {proposal.jobUrl && (
              <GridItem xs={12}>
                <InfoRow icon={<LinkOutlined style={{ fontSize: 18 }} />} label="Job URL">
                  <Box display="flex" align="center" space={1}>
                    <Text varient="body2" skinColor style={{ wordBreak: "break-all" }}>
                      {proposal.jobUrl}
                    </Text>
                    <IconButton varient="text" size={26} fontSize={16} contentOpacity={5} onClick={() => handleCopy(proposal.jobUrl!)}>
                      <ContentCopy style={{ fontSize: 14 }} />
                    </IconButton>
                    <a href={proposal.jobUrl} target="_blank" rel="noopener noreferrer">
                      <IconButton varient="text" size={26} fontSize={16} contentOpacity={5}>
                        <OpenInNew style={{ fontSize: 14 }} />
                      </IconButton>
                    </a>
                  </Box>
                </InfoRow>
              </GridItem>
            )}
          </GridInnerContainer>
        </Box>
      </Box>

      {/* ── Content ─────────────────────────────────────────── */}
      {(proposal.vacancy || proposal.coverLetter || proposal.comment || proposal.context) && (
        <Box display="flex" flexDirection="column" space={3}>
          {proposal.vacancy && (
            <Box>
              <DividerWithLabel label="Vacancy" />
              <Box mt={2} style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "12px 16px" }}>
                <Text varient="body2" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                  {proposal.vacancy}
                </Text>
              </Box>
            </Box>
          )}

          {proposal.coverLetter && (
            <Box>
              <DividerWithLabel label="Cover Letter" />
              <Box mt={2} style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "12px 16px" }}>
                <Text varient="body2" style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
                  {proposal.coverLetter}
                </Text>
              </Box>
            </Box>
          )}

          {(proposal.comment || proposal.context) && (
            <Box>
              <DividerWithLabel label="Notes" />
              <Box mt={2}>
                <GridInnerContainer spacing={2}>
                  {proposal.comment && (
                    <GridItem xs={12} md={6}>
                      <Text varient="body2" weight="medium" style={{ marginBottom: 6 }}>Comment</Text>
                      <Box style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "10px 14px" }}>
                        <Text varient="body2" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                          {proposal.comment}
                        </Text>
                      </Box>
                    </GridItem>
                  )}
                  {proposal.context && (
                    <GridItem xs={12} md={6}>
                      <Text varient="body2" weight="medium" style={{ marginBottom: 6 }}>Context</Text>
                      <Box style={{ background: "rgba(0,0,0,0.03)", borderRadius: 8, padding: "10px 14px" }}>
                        <Text varient="body2" style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                          {proposal.context}
                        </Text>
                      </Box>
                    </GridItem>
                  )}
                </GridInnerContainer>
              </Box>
            </Box>
          )}
        </Box>
      )}

    </Box>
  );
};

export default PreviewMain;
