// Complete VittaOS Domain & Accounting Types

export interface Organization {
  id: string;
  name: string;
  tradeName?: string;
  gstin: string;
  pan: string;
  state: string;
  stateCode: string;
  currency: string;
  fiscalYear: string;
  annualRevenue: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    branch: string;
    accountType: "current" | "savings" | "cash_credit";
  };
}

export type GSTSlab = 0 | 5 | 12 | 18 | 28;

export interface InvoiceItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  gstRate: GSTSlab;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;
  invoiceId: string;
  linkedInvoiceIds?: string[]; // Multi-invoice linking for TOD settlements
  linkedInvoiceNumbers?: string[];
  reason: string;
  amount: number; // Taxable value
  gstAmount: number;
  totalAmount: number; // Amount + GST deducted
  date: string;
  approvedBy?: string;
  todSchemeId?: string;
  todSettlementId?: string;
  isTodCreditNote?: boolean;
}

// ==========================================
// TURNOVER DISCOUNT (TOD) MANAGEMENT TYPES
// ==========================================

export type TODType = "quantity" | "turnover";

export type TODSettlementFrequency =
  | "monthly"
  | "quarterly"
  | "half_yearly"
  | "annual"
  | "on_target_achievement";

export type TODSchemeStatus =
  | "draft"
  | "active"
  | "target_achieved"
  | "settlement_pending"
  | "settled"
  | "expired"
  | "cancelled";

export interface TODScheme {
  id: string;
  customerId: string;
  customerName: string;
  customerGstin?: string;
  schemeName: string;
  startDate: string;
  endDate: string;
  todType: TODType;
  target: number; // e.g. 10000 MT or ₹5,00,00,000 turnover
  targetUnit: string; // e.g. "MT", "INR"
  todRate: number; // e.g. 10 (for ₹10/MT) or 2 (for 2%)
  todRateType: "per_unit" | "percentage";
  settlementFrequency: TODSettlementFrequency;
  eligibleProducts: string[];
  status: TODSchemeStatus;
  notes?: string;
  createdAt: string;
  createdBy: string;
  lastModifiedAt?: string;
  lastModifiedBy?: string;
}

export interface TODQualifyingInvoice {
  invoiceId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  product: string;
  quantity: number;
  unit: string;
  billingRate: number;
  invoiceValue: number;
  todRate: number;
  todRateType: "per_unit" | "percentage";
  potentialTod: number;
  creditNoteStatus: "pending" | "approved" | "settled" | "ineligible";
  linkedCreditNoteId?: string;
}

export interface TODSettlementPeriod {
  id: string;
  periodLabel: string; // e.g. "Q1 (Apr–Jun 2026)"
  qualifyingQty: number;
  qualifyingValue: number;
  todAmount: number;
  settledAmount: number;
  status: "pending" | "credit_note_generated" | "settled";
  creditNoteId?: string;
}

export interface TODCreditNote {
  id: string;
  creditNoteNumber: string;
  schemeId: string;
  schemeName: string;
  customerId: string;
  customerName: string;
  qualifyingQuantity: number;
  qualifyingTurnover: number;
  todRateDescription: string;
  grossTodAmount: number;
  gstRate: number;
  gstAmount: number;
  totalCreditNoteAmount: number;
  linkedInvoiceIds: string[];
  linkedInvoiceNumbers: string[];
  status: "draft" | "pending_approval" | "approved" | "rejected" | "posted";
  requestedDate: string;
  requestedBy: string;
  approvedDate?: string;
  approvedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface TODAuditLog {
  id: string;
  schemeId: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface TODAnalytics {
  activeSchemesCount: number;
  customersWithTodCount: number;
  totalPotentialTod: number;
  todPendingSettlement: number;
  todAlreadySettled: number;
  todIssuedThisMonth: number;
  todIssuedThisFY: number;
  averageTodPercentage: number;
  grossSalesFY: number;
  netSalesFY: number;
}


export interface DebitNote {
  id: string;
  debitNoteNumber: string;
  invoiceId: string;
  reason: string;
  amount: number;
  gstAmount: number;
  totalAmount: number;
  date: string;
}

export interface PaymentAllocation {
  id: string;
  invoiceId: string;
  bankTransactionId?: string;
  bankReferenceNumber?: string;
  paymentMode?: BankPaymentMode;
  amount: number;
  type: "payment" | "tds";
  tdsSection?: string;
  tdsRate?: number;
  date: string;
  notes?: string;
  matchedBy?: "auto_reconciled" | "manual_match" | "user_confirmed";
}

export type InvoiceStatus =
  | "Draft"
  | "Sent"
  | "Partially Paid"
  | "Closed"
  | "Overdue"
  | "paid"
  | "pending"
  | "overdue"
  | "draft"
  | "closed"
  | "partially_paid"
  | "sent";

export type InvoiceType = "B2B" | "B2C" | "EXPORT" | "SEZ";

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  type: InvoiceType;
  customerName: string;
  customerGstin?: string;
  customerState: string;
  customerStateCode: string;
  placeOfSupply: string;
  isInterState: boolean;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number; // Original Invoice Total
  
  // Smart Payment Matching & Open Balance Ledger
  creditNotes?: CreditNote[];
  debitNotes?: DebitNote[];
  paymentAllocations?: PaymentAllocation[];
  
  netPayable: number; // grandTotal - creditNotes + debitNotes
  totalPaid: number; // Sum of paymentAllocations (type: payment)
  totalTdsDeducted: number; // Sum of paymentAllocations (type: tds)
  totalCreditNotes: number; // Sum of creditNotes
  totalDebitNotes: number; // Sum of debitNotes
  openBalance: number; // netPayable - (totalPaid + totalTdsDeducted)
  
  // Deprecated/Legacy compatibility aliases
  amountPaid: number;
  balanceDue: number;
  
  irn?: string;
  ackNo?: string;
  paymentTerms: string;
  paidAt?: string;
}

export interface PaymentLedgerEvent {
  id: string;
  date: string;
  type: "INVOICE_RAISED" | "CREDIT_NOTE" | "DEBIT_NOTE" | "TDS_DEDUCTION" | "BANK_PAYMENT";
  title: string;
  referenceNumber: string;
  reason?: string;
  debitAmount: number; // Increases receivable (+)
  creditAmount: number; // Decreases receivable (-)
  runningBalance: number;
  details?: {
    paymentMode?: BankPaymentMode;
    tdsSection?: string;
    tdsRate?: number;
    bankTransactionId?: string;
  };
}

export type BillStatus = "paid" | "pending" | "overdue" | "draft";
export type BillCategory =
  | "Raw Materials"
  | "Dyeing & Chemical Processing"
  | "Freight & Logistics"
  | "Packaging"
  | "Cloud & Software"
  | "Utilities & Power"
  | "Factory Maintenance"
  | "Professional & Legal";

export interface BillItem {
  id: string;
  description: string;
  hsnCode: string;
  amount: number;
  gstRate: GSTSlab;
  taxAmount: number;
  tdsSection?: string;
  tdsRate?: number;
  tdsAmount?: number;
}

export interface VendorBill {
  id: string;
  billNumber: string;
  vendorName: string;
  vendorGstin?: string;
  vendorPan?: string;
  date: string;
  dueDate: string;
  category: BillCategory;
  items: BillItem[];
  subtotal: number;
  taxTotal: number;
  tdsTotal: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  status: BillStatus;
  isItcEligible: boolean;
  paymentReference?: string;
}

export type BankTransactionType = "credit" | "debit";
export type BankPaymentMode = "UPI" | "NEFT" | "RTGS" | "CHEQUE" | "INTERNAL_TRANSFER" | "AUTO_DEBIT";
export type ReconStatus = "matched" | "unmatched" | "review_required" | "manual_entry";
export type ReconMatchType = "exact" | "partial" | "adjusted" | "manual";

export interface BankTransaction {
  id: string;
  date: string;
  valueDate: string;
  description: string;
  referenceNumber: string;
  mode: BankPaymentMode;
  type: BankTransactionType;
  amount: number;
  runningBalance: number;
  status: ReconStatus;
  matchType?: ReconMatchType;
  matchedEntityName?: string;
  matchedDocumentType?: "invoice" | "bill" | "salary" | "tax_challan" | "bank_charges";
  matchedDocumentId?: string;
  matchedDocumentNumber?: string;
  matchConfidence?: number; // 0 to 100 percentage
  reconciliationNotes?: string;
  matchExplanation?: string;
  appliedAllocations?: {
    invoiceId: string;
    invoiceNumber: string;
    allocatedAmount: number;
    remainingOpenBalance: number;
    autoClosed: boolean;
  }[];
}

export type AccountCategory = "asset" | "liability" | "equity" | "income" | "expense";

export interface ChartOfAccount {
  code: string;
  name: string;
  category: AccountCategory;
  subHead: string;
  parentCode?: string;
  openingBalance: number;
  currentBalance: number;
  normalBalance: "debit" | "credit";
  description?: string;
}

export interface GSTSummaryItem {
  period: string; // e.g. "Jul 2026", "Jun 2026"
  financialYear: string;
  gstr1: {
    status: "filed" | "ready" | "pending";
    b2bTaxable: number;
    b2cTaxable: number;
    totalTaxable: number;
    igst: number;
    cgst: number;
    sgst: number;
    totalTax: number;
    invoiceCount: number;
    filedDate?: string;
  };
  gstr2b: {
    itcAvailableIgst: number;
    itcAvailableCgst: number;
    itcAvailableSgst: number;
    totalItcAvailable: number;
    ineligibleItc: number;
    matchedBillCount: number;
    mismatchCount: number;
  };
  gstr3b: {
    status: "filed" | "ready" | "pending";
    outputTaxDue: number;
    itcClaimed: number;
    netTaxPayableCash: number;
    interestAndLateFee: number;
    totalCashPaid: number;
    filedDate?: string;
  };
  reconciliationNotes?: string;
}

export interface TDSEntry {
  id: string;
  section: "194C" | "194J" | "194I" | "194Q" | "194H";
  sectionDescription: string;
  vendorName: string;
  vendorPan: string;
  billNumber: string;
  billDate: string;
  grossAmount: number;
  tdsRate: number;
  tdsAmount: number;
  deductionDate: string;
  depositDueDate: string;
  challanBSR?: string;
  challanNumber?: string;
  status: "deposited" | "pending_deposit" | "overdue";
}
