import type { LeadItem } from "../../../components/leads/item/type";
export interface Lead {
    leadNo: number;
    dateIssue: Date;
    dateDue: Date;
    leadTo: number;
    salesperson: string;
    msgLeave: string;
    note: string;
    items: LeadItem[];
}
