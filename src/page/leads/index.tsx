import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { fetchLeadData } from "../../store/leads/leadsSlice";
import { useAppDispatch } from "../../hooks";
import PageNotFound from "../404/PageNotFound";
import LeadAdd from "./add/LeadAdd";
import LeadEdit from "./edit/LeadEdit.page";
import LeadList from "./list/LeadList.page";
import LeadPreview from "./preview/LeadPreview";
const Leads = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchLeadData());
  }, []);
  return (
    <Routes>
      <Route path="/list/" element={<LeadList />} />
      <Route path="/add/" element={<LeadAdd />} />
      <Route path="/edit/*" element={<LeadEdit />} />
      <Route path="/preview/*" element={<LeadPreview />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};
export default Leads;
