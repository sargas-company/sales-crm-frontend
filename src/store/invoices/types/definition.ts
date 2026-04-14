
export type InvoiceStatus = "Draft" | "Sent" | "Viewed" | "Replied";

export type AvatarColor = "error" | "info" | "warning" | "success"

export type AccountName = "Dmytro" | "Artem" | "Vadym";

export type Platform = "Upwork" | "LinkedIn" | "Jobble";

export interface InvoiceList {
    id: number;
    jobId: string;
    account: AccountName;
    platform: Platform;
    coverLetter: string;
    issuedDate: string;
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
    status: InvoiceStatus;
    balance: string | 0;
    dueDate: string;
}

export interface InvoiceState {
    data: Array<InvoiceList>;
    allData: Array<InvoiceList>;
    total: number;
}