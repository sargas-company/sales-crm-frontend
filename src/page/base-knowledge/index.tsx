import { Routes, Route } from "react-router-dom";
import PageNotFound from "../404/PageNotFound";
import BaseKnowledgeList from "./list/BaseKnowledgeList.page";
import BaseKnowledgePreview from "./preview/BaseKnowledgePreview";

const BaseKnowledge = () => {
  return (
    <Routes>
      <Route path="/list/" element={<BaseKnowledgeList />} />
      <Route path="/list" element={<BaseKnowledgeList />} />
      <Route path="/preview/:id" element={<BaseKnowledgePreview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
export default BaseKnowledge;
