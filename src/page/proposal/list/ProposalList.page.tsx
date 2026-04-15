import { useState } from "react";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import CreateNewProposal from "../../../components/proposal/list/CreateNewProposal";
import ProposalTable from "../../../components/proposal/list/ProposalTable";
import DataGridFooter from "../../../components/data-grid-item/DataGridFooter";
import { GridInnerContainer, GridItem } from "../../../components/layout";
import { TextField } from "../../../ui";
import { useGetProposalListQuery } from "../../../store/proposals/proposalsApi";

const LIMIT_OPTIONS = [8, 20];

const ProposalList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useGetProposalListQuery({ page, limit });
  const allItems = data?.data ?? [];
  const total = data?.total ?? 0;

  const items = search
    ? allItems.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.id.toString().includes(q) ||
          item.manager.toLowerCase().includes(q) ||
          item.account.toLowerCase().includes(q) ||
          item.status.toLowerCase().includes(q)
        );
      })
    : allItems;

  const passed = (page - 1) * limit + 1;
  const next = Math.min(page * limit, total);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return (
    <Card>
      <Box display="flex" justify="space-between" padding={20}>
        <GridInnerContainer alignItems="center" justifyContent="space-between">
          <GridItem xs={12} md={6}>
            <TextField
              type="text"
              name="search-proposal"
              placeholder="Search proposal"
              sizes="small"
              maxWidth="280px"
              onChange={(e) => setSearch(e.target.value)}
            />
          </GridItem>
          <GridItem xs={12} md={6}>
            <Box display="flex" justify="flex-end">
              <CreateNewProposal />
            </Box>
          </GridItem>
        </GridInnerContainer>
      </Box>

      <ProposalTable items={items} isLoading={isLoading} />

      {total > 0 && (
        <DataGridFooter
          total={total}
          rowPerPage={limit}
          rowPerPageOptions={LIMIT_OPTIONS}
          currentPage={page}
          next={next}
          passed={passed}
          handlePagination={setPage}
          handleRowOptSelect={handleLimitChange}
        />
      )}
    </Card>
  );
};

export default ProposalList;
