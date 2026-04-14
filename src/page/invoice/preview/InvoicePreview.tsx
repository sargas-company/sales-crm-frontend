import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useAppSelector } from "../../../hooks";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import InvoiceLayout from "../../../components/invoice/layout/InvoiceLayout";
import PreviewMain from "../../../components/invoice/preview/PreviewMain";
import { Button, Tab, TabList, TabItem, TabContent } from "../../../ui";
import { RootState } from "../../../store/store";
import { InfoOutlined, ChatOutlined } from "@mui/icons-material";

const selectInvoiceItem = (state: RootState, id?: number) =>
  id
    ? state.invoice.allData.find((item) => item.id === id)
    : state.invoice.allData[0];

const InvoicePreview = () => {
  const { pathname } = useLocation();
  const [activeTab, setActiveTab] = useState(1);
  const pathChunk = pathname.match(/\w+/g);
  if (pathChunk!.length > 3) {
    return <></>;
  }
  const currentInvoiceItem = useAppSelector((state) =>
    selectInvoiceItem(state, +pathChunk?.pop()!)
  );
  if (!currentInvoiceItem) {
    return <></>;
  }
  return (
    <InvoiceLayout>
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
            <PreviewMain {...currentInvoiceItem} />
          </TabContent>
          <TabContent tabIndex={2}>
            <Box padding={20}>
              {/* Chat content will go here */}
            </Box>
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
    </InvoiceLayout>
  );
};
export default InvoicePreview;
