// Frontend-only wallet store using React state (no backend)
// This provides mock data and in-memory state for the wallet system

export interface WalletTransaction {
  id: string;
  companyId: string;
  type: "topup" | "parcel_fee" | "sms_fee" | "adjustment";
  referenceId: string;
  amount: number; // positive = credit, negative = debit
  balanceAfter: number;
  description: string;
  createdAt: string;
  createdBy: string;
}

export interface CompanyWallet {
  companyId: string;
  companyName: string;
  balance: number;
  totalCredits: number;
  totalDeductions: number;
  status: "active" | "suspended";
}

export const PARCEL_PROCESSING_FEE = 5; // KES per parcel

// Mock wallet data for all companies
export const mockWallets: CompanyWallet[] = [
  { companyId: "c1", companyName: "Nairobi Express", balance: 12450, totalCredits: 85000, totalDeductions: 72550, status: "active" },
  { companyId: "c2", companyName: "Kisumu Transit", balance: 3200, totalCredits: 52000, totalDeductions: 48800, status: "active" },
  { companyId: "c3", companyName: "Mombasa Cargo", balance: 890, totalCredits: 41000, totalDeductions: 40110, status: "active" },
  { companyId: "c4", companyName: "Eldoret Link", balance: 0, totalCredits: 32000, totalDeductions: 32000, status: "active" },
  { companyId: "c5", companyName: "Nakuru Shuttle", balance: 15600, totalCredits: 28000, totalDeductions: 12400, status: "suspended" },
];

// Mock transactions for "Nairobi Express" (current company)
export const mockTransactions: WalletTransaction[] = [
  { id: "wt-001", companyId: "c1", type: "topup", referenceId: "MPESA-RK12AB34", amount: 10000, balanceAfter: 22450, description: "M-Pesa Top-Up", createdAt: "2024-02-20T10:30:00Z", createdBy: "Super Admin" },
  { id: "wt-002", companyId: "c1", type: "parcel_fee", referenceId: "NBO-KSM-34521", amount: -5, balanceAfter: 22445, description: "Parcel booking fee", createdAt: "2024-02-20T11:05:00Z", createdBy: "System" },
  { id: "wt-003", companyId: "c1", type: "parcel_fee", referenceId: "NBO-MSA-34522", amount: -5, balanceAfter: 22440, description: "Parcel booking fee", createdAt: "2024-02-20T11:12:00Z", createdBy: "System" },
  { id: "wt-004", companyId: "c1", type: "sms_fee", referenceId: "SMS-8821", amount: -2, balanceAfter: 22438, description: "SMS notification fee", createdAt: "2024-02-20T11:13:00Z", createdBy: "System" },
  { id: "wt-005", companyId: "c1", type: "parcel_fee", referenceId: "NBO-ELD-34523", amount: -5, balanceAfter: 22433, description: "Parcel booking fee", createdAt: "2024-02-20T12:00:00Z", createdBy: "System" },
  { id: "wt-006", companyId: "c1", type: "adjustment", referenceId: "ADJ-001", amount: -9983, balanceAfter: 12450, description: "Balance correction – Feb audit", createdAt: "2024-02-19T09:00:00Z", createdBy: "Super Admin" },
  { id: "wt-007", companyId: "c1", type: "topup", referenceId: "MPESA-QW56CD78", amount: 15000, balanceAfter: 22433, description: "M-Pesa Top-Up", createdAt: "2024-02-18T14:20:00Z", createdBy: "Super Admin" },
  { id: "wt-008", companyId: "c1", type: "parcel_fee", referenceId: "NBO-KSM-34500", amount: -5, balanceAfter: 7433, description: "Parcel booking fee", createdAt: "2024-02-18T08:45:00Z", createdBy: "System" },
  { id: "wt-009", companyId: "c1", type: "parcel_fee", referenceId: "NBO-NKR-34499", amount: -5, balanceAfter: 7438, description: "Parcel booking fee", createdAt: "2024-02-17T16:30:00Z", createdBy: "System" },
  { id: "wt-010", companyId: "c1", type: "topup", referenceId: "BANK-TXN-9912", amount: 5000, balanceAfter: 7443, description: "Bank Transfer Top-Up", createdAt: "2024-02-15T10:00:00Z", createdBy: "Super Admin" },
];

// Current company wallet (for company admin / branch views)
export const getCurrentWallet = (): CompanyWallet => mockWallets[0];

export const canBookParcel = (wallet: CompanyWallet): boolean => wallet.balance >= PARCEL_PROCESSING_FEE;
