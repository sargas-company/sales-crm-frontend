
export type ProposalStatus = "Draft" | "Sent" | "Viewed" | "Replied";

export type AvatarColor = "error" | "info" | "warning" | "success"

export type AccountName = "Dmytro Sarafaniuk" | "Artem Kovalenko" | "Vadym Petrenko";

export type Platform = "Upwork" | "LinkedIn" | "Jobble";

export type ProposalType = "Bid" | "Invite" | "Direct Message";

export type BoostedStatus = "Boosted" | "Not Boosted" | "Boosted Outbid";

export interface ProposalList {
    id: number;
    jobId: string;
    manager: string;
    account: AccountName;
    platform: Platform;
    proposalType: ProposalType;
    boosted: BoostedStatus;
    connects: number;
    coverLetter: string;
    createdAt: string;
    sentAt: string;
    address: string;
    company: string;
    companyEmail: string;
    country: string;
    contact: string;
    name: string;
    service: string;
    total: number;
    avatar: string | undefined;
    avatarColor?: AvatarColor;
    status: ProposalStatus;
    balance: string | 0;
    dueDate: string;
}

export interface ProposalState {
    data: Array<ProposalList>;
    allData: Array<ProposalList>;
    total: number;
}