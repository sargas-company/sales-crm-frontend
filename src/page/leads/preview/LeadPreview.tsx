import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../../hooks";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import LeadLayout from "../../../components/leads/layout/LeadLayout";
import PreviewMain from "../../../components/leads/preview/PreviewMain";
import LeadChat from "../../../components/leads/preview/LeadChat";
import { Button, Tab, TabList, TabItem, TabContent } from "../../../ui";
import { RootState } from "../../../store/store";
import { InfoOutlined, ChatOutlined } from "@mui/icons-material";

const selectLeadItem = (state: RootState, id?: number) =>
  id
    ? state.lead.allData.find((item) => item.id === id)
    : state.lead.allData[0];

const LeadPreview = () => {
  const { pathname } = useLocation();
  const [activeTab, setActiveTab] = useState(1);
  const pathChunk = pathname.match(/\w+/g);
  if (pathChunk!.length > 3) {
    return <></>;
  }
  const currentLeadItem = useAppSelector((state) =>
    selectLeadItem(state, +pathChunk?.pop()!)
  );
  if (!currentLeadItem) {
    return <></>;
  }
  return (
    <LeadLayout>
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
            <PreviewMain {...currentLeadItem} />
          </TabContent>
          <TabContent tabIndex={2}>
            <LeadChat />
          </TabContent>
        </Card>
      </Tab>
      <Card padding="1.2rem">
        <Box display="flex" flexDirection="column" space={1}>
          <Button color="error">send lead</Button>
          <Button varient="outlined" color="info">
            edit lead
          </Button>
        </Box>
      </Card>
    </LeadLayout>
  );
};
export default LeadPreview;
