
export type ProposalStatus = "Draft" | "Sent" | "Viewed" | "Replied";

export type Platform = "Upwork" | "LinkedIn" | "Jobble";

export type ProposalType = "Bid" | "Invite" | "Direct Message";

export type BoostedStatus = "Boosted" | "Not Boosted" | "Boosted Outbid";

export interface ProposalItem {
  id: string;
  title: string;
  jobUrl: string | null;
  status: ProposalStatus;
  manager: string;
  account: string;
  platform: Platform;
  proposalType: ProposalType;
  boosted: boolean;
  connects: number;
  createdAt: string;
  sentAt: string | null;
  coverLetter: string;
  vacancy?: string;
  comment?: string;
  context?: string;
}

export interface ProposalPage {
  data: ProposalItem[];
  total: number;
}

export interface ProposalListParams {
  page: number;
  limit: number;
}

// Legacy — kept for backward compatibility with proposalsSlice (mock data)
export type ProposalList = ProposalItem;

export interface ProposalState {
    data: Array<ProposalList>;
    allData: Array<ProposalList>;
    total: number;
}
