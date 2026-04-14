import { LeadActionName } from "../types/action";

export const fetchLead = (lead: any) => ({
    type: LeadActionName.fetchLead,
    payload: lead
});

export const searchData = (qr: string) => ({
    type: LeadActionName.searchData,
    payload: qr
})
