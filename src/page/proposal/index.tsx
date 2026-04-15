import { Routes, Route } from "react-router-dom";
import PageNotFound from "../404/PageNotFound";
import ProposalAdd from "./add/ProposalAdd";
import ProposalEdit from "./edit/ProposalEdit.page";
import ProposalList from "./list/ProposalList.page";
import ProposalPreview from "./preview/ProposalPreview";
const Proposal = () => {
  return (
    <Routes>
      <Route path="/list/" element={<ProposalList />} />
      <Route path="/add/" element={<ProposalAdd />} />
      <Route path="/edit/:id" element={<ProposalEdit />} />
      <Route path="/preview/:id" element={<ProposalPreview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
export default Proposal;
