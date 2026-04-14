import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../../hooks";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import ProposalLayout from "../../../components/proposal/layout/ProposalLayout";
import PreviewMain from "../../../components/proposal/preview/PreviewMain";
import ProposalChat from "../../../components/proposal/preview/ProposalChat";
import { Button, Tab, TabList, TabItem, TabContent } from "../../../ui";
import { RootState } from "../../../store/store";
import { InfoOutlined, ChatOutlined } from "@mui/icons-material";

const selectProposalItem = (state: RootState, id?: number) =>
  id
    ? state.proposal.allData.find((item) => item.id === id)
    : state.proposal.allData[0];

const ProposalPreview = () => {
  const { pathname } = useLocation();
  const [activeTab, setActiveTab] = useState(1);
  const pathChunk = pathname.match(/\w+/g);
  if (pathChunk!.length > 3) {
    return <></>;
  }
  const currentProposalItem = useAppSelector((state) =>
    selectProposalItem(state, +pathChunk?.pop()!)
  );
  if (!currentProposalItem) {
    return <></>;
  }
  return (
    <ProposalLayout>
      <Tab value={activeTab}>
        <Card>
          <Box px={20} pt={16}>
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
          <TabContent tabIndex={1}>
            <PreviewMain {...currentProposalItem} />
          </TabContent>
          <TabContent tabIndex={2}>
            <ProposalChat />
          </TabContent>
        </Card>
      </Tab>
      <Card padding="1.2rem">
        <Box display="flex" flexDirection="column" space={1}>
          <Button color="error">send invoice</Button>
          <Button varient="outlined" color="info">
            edit invoice
          </Button>
        </Box>
      </Card>
    </ProposalLayout>
  );
};
export default ProposalPreview;
