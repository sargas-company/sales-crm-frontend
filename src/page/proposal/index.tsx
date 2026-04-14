import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { fetchProposalData } from "../../store/proposals/proposalsSlice";
import { useAppDispatch } from "../../hooks";
import PageNotFound from "../404/PageNotFound";
import ProposalAdd from "./add/ProposalAdd";
import ProposalEdit from "./edit/ProposalEdit.page";
import ProposalList from "./list/ProposalList.page";
import ProposalPreview from "./preview/ProposalPreview";
const Proposal = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchProposalData());
  }, []);
  return (
    <Routes>
      <Route path="/list/" element={<ProposalList />} />
      <Route path="/add/" element={<ProposalAdd />} />
      <Route path="/edit/*" element={<ProposalEdit />} />
      <Route path="/preview/*" element={<ProposalPreview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
export default Proposal;
