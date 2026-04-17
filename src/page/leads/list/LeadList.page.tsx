import { useState } from "react";
import Box from "../../../components/box/Box";
import Card from "../../../components/card/Card";
import LeadTable from "../../../components/leads/list/LeadTable";
import LeadDeleteModal from "../../../components/leads/list/LeadDeleteModal";
import DataGridFooter from "../../../components/data-grid-item/DataGridFooter";
import { GridInnerContainer, GridItem } from "../../../components/layout";
import { TextField } from "../../../ui";
import { useGetLeadListQuery } from "../../../store/leads/leadsApi";
import CreateNewLead from '../../../components/leads/list/CreateNewLead'

interface DeleteTarget {
  id: string;
  title: string;
}

const LIMIT_OPTIONS = [8, 20];

const LeadList = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const { data, isLoading, refetch } = useGetLeadListQuery({ page, limit });
  const allItems = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleDelete = (id: string) => {
    const item = allItems.find((i) => i.id === id);
    if (item) setDeleteTarget({ id, title: [item.firstName, item.lastName].filter(Boolean).join(" ") || `Lead #${item.number}` });
  };

  const items = search
    ? allItems.filter((item) => {
        const q = search.toLowerCase();
        return (
          item.number.toString().includes(q) ||
          ([item.firstName, item.lastName].filter(Boolean).join(" ").toLowerCase().includes(q)) ||
          (item.companyName ?? "").toLowerCase().includes(q) ||
          (item.location ?? "").toLowerCase().includes(q) ||
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
    <>
      <Card padding={'30px'}>
        <Box display="flex" justify="space-between" padding={20}>
          <GridInnerContainer alignItems="center" justifyContent="space-between">
            <GridItem xs={12} md={6}>
              <TextField
                type="text"
                name="search-lead"
                placeholder="Search lead"
                sizes="small"
                maxWidth="280px"
                onChange={(e) => setSearch(e.target.value)}
              />
            </GridItem>
            <GridItem xs={12} md={6} />
          </GridInnerContainer>
        </Box>

        <LeadTable items={items} isLoading={isLoading} onDelete={handleDelete} />

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

      {deleteTarget && (
        <LeadDeleteModal
          id={deleteTarget.id}
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            if (allItems.length === 1 && page > 1) setPage(page - 1);
            else refetch();
          }}
        />
      )}
    </>
  );
};

export default LeadList;
