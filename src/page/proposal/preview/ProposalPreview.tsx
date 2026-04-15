import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { InfoOutlined, ChatOutlined, ArrowBackOutlined } from "@mui/icons-material";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import PreviewMain from "../../../components/proposal/preview/PreviewMain";
import ProposalChat from "../../../components/proposal/preview/ProposalChat";
import { Button, Tab, TabList, TabItem, TabContent, Text, IconButton } from "../../../ui";
import { useGetProposalByIdQuery } from "../../../store/proposals/proposalsApi";

const ProposalPreview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);

  const { data: proposal, isLoading, isError } = useGetProposalByIdQuery(id!, { skip: !id });

  if (isLoading) {
    return (
        <Card>
          <Box padding={40} display="flex" justify="center">
            <Text secondary>Loading proposal…</Text>
          </Box>
        </Card>
    );
  }

  if (isError || !proposal) {
    return (

        <Card>
          <Box padding={40} display="flex" flexDirection="column" align="center" space={3}>
            <Text heading="h6">Proposal not found</Text>
            <Button varient="outlined" color="info" onClick={() => navigate("/proposal/list")}>
              Back to list
            </Button>
          </Box>
        </Card>

    );
  }

  return (

      <Tab value={activeTab}>
        <Card>
          <Box px={20} pt={16} display="flex" align="center" justify="space-between">
            <Box display="flex" align="center" space={2}>
              <IconButton varient="text" size={34} fontSize={20} onClick={() => navigate("/proposal/list")}>
                <ArrowBackOutlined />
              </IconButton>
              <TabList>
                <TabItem
                  value={1}
                  label="Info"
                  icon={<InfoOutlined />}
                  onClick={(v) => setActiveTab(v as number)}
                />
                <TabItem
                  value={2}
                  label="Chat"
                  icon={<ChatOutlined />}
                  onClick={(v) => setActiveTab(v as number)}
                />
              </TabList>
            </Box>
          </Box>

          <TabContent tabIndex={1}>
            <PreviewMain proposal={proposal} />
          </TabContent>

          <TabContent tabIndex={2}>
            <ProposalChat proposalId={proposal.id} />
          </TabContent>
        </Card>
      </Tab>

  );
};

export default ProposalPreview;
