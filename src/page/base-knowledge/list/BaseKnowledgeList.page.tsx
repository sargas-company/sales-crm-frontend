import {useState} from "react"
import Card from "../../../components/card/Card"
import Box from "../../../components/box/Box"
import CreateKnowledgeButton from "../../../components/base-knowledge/list/CreateKnowledgeButton"
import BaseKnowledgeTable from "../../../components/base-knowledge/list/BaseKnowledgeTable"
import BaseKnowledgeFormModal from "../../../components/base-knowledge/form/BaseKnowledgeFormModal"
import BaseKnowledgeEditModal from "../../../components/base-knowledge/form/BaseKnowledgeEditModal"
import BaseKnowledgeDeleteModal from "../../../components/base-knowledge/form/BaseKnowledgeDeleteModal"
import DataGridFooter from "../../../components/data-grid-item/DataGridFooter"
import {GridInnerContainer, GridItem} from "../../../components/layout"
import useModal from "../../../hooks/useModal"
import {useGetBaseKnowledgeListQuery} from "../../../store/baseKnowledge/baseKnowledgeApi"
import {TextField} from '../../../ui'

const LIMIT_OPTIONS = [10, 20];

interface DeleteTarget {
  id: string;
  title: string;
}

const BaseKnowledgeList = () => {
  const createModal = useModal();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(LIMIT_OPTIONS[0]);

  const { data, isLoading, refetch } = useGetBaseKnowledgeListQuery({ page, limit });
  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleDelete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) setDeleteTarget({ id, title: item.title });
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  const passed = (page - 1) * limit + 1;
  const next = Math.min(page * limit, total);

  return (
    <>
      <Card>
        <Box display="flex" justify="space-between" padding={20}>
          <GridInnerContainer alignItems="center" justifyContent="space-between">
            <GridItem xs={12} md={6}>
              {/*<TextField*/}
              {/*    type="text"*/}
              {/*    name="search-base-knowledge"*/}
              {/*    placeholder="Search knowleadge"*/}
              {/*    sizes="small"*/}
              {/*    maxWidth="280px"*/}
              {/*    onChange={()=>{}}*/}
              {/*/>*/}
            </GridItem>
            <GridItem xs={12} md={6}>
              <Box display="flex" justify="flex-end">
              <CreateKnowledgeButton onClick={createModal.toggleModal} />
              </Box>
            </GridItem>
          </GridInnerContainer>
        </Box>

        <BaseKnowledgeTable
          items={items}
          isLoading={isLoading}
          onEdit={(id) => setEditId(id)}
          onDelete={handleDelete}
        />

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

      {createModal.show && (
        <BaseKnowledgeFormModal onClose={createModal.hideModal} onSuccess={refetch} />
      )}

      {editId && (
        <BaseKnowledgeEditModal
          id={editId}
          onClose={() => setEditId(null)}
          onSuccess={refetch}
        />
      )}

      {deleteTarget && (
        <BaseKnowledgeDeleteModal
          id={deleteTarget.id}
          title={deleteTarget.title}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            if (items.length === 1 && page > 1) setPage(page - 1);
            else refetch();
          }}
        />
      )}
    </>
  );
};

export default BaseKnowledgeList;
