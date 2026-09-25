import { GSTSummaryItem } from "@/lib/types";

export const mockGSTSummaries: GSTSummaryItem[] = [
  // AUGUST 2026 (In Progress / Ready to File)
  {
    period: "Aug 2026",
    financialYear: "2026-27",
    gstr1: {
      status: "ready",
      b2bTaxable: 2712500,
      b2cTaxable: 26500,
      totalTaxable: 2739000,
      igst: 85250,
      cgst: 24700,
      sgst: 24700,
      totalTax: 134650,
      invoiceCount: 12,
    },
    gstr2b: {
      itcAvailableIgst: 68400,
      itcAvailableCgst: 24350,
      itcAvailableSgst: 24350,
      totalItcAvailable: 117100,
      ineligibleItc: 0,
      matchedBillCount: 6,
      mismatchCount: 0,
    },
    gstr3b: {
      status: "ready",
      outputTaxDue: 134650,
      itcClaimed: 117100,
      netTaxPayableCash: 17550,
      interestAndLateFee: 0,
      totalCashPaid: 0,
    },
    reconciliationNotes: "August 2026 GSTR-1 summary ready. All e-Invoices pushed to IRP portal with valid IRNs.",
  },

  // JULY 2026 (FILED WITH RECONCILIATION MISMATCH CASE)
  {
    period: "Jul 2026",
    financialYear: "2026-27",
    gstr1: {
      status: "filed",
      b2bTaxable: 3418500,
      b2cTaxable: 42000,
      totalTaxable: 3460500,
      igst: 104200,
      cgst: 32400,
      sgst: 32400,
      totalTax: 169000,
      invoiceCount: 14,
      filedDate: "2026-08-11",
    },
    gstr2b: {
      itcAvailableIgst: 72100,
      itcAvailableCgst: 28500,
      itcAvailableSgst: 28500,
      totalItcAvailable: 129100, // Expected in books: ₹1,48,100 (₹19,000 mismatch)
      ineligibleItc: 4250,
      matchedBillCount: 7,
      mismatchCount: 2, // 2 vendor mismatches
    },
    gstr3b: {
      status: "filed",
      outputTaxDue: 169000,
      itcClaimed: 129100,
      netTaxPayableCash: 39900,
      interestAndLateFee: 0,
      totalCashPaid: 39900,
      filedDate: "2026-08-20",
    },
    reconciliationNotes: "Discrepancy detected: Gujarat Ambuja Cottons (GSTIN: 24AABCG9018P1Z8) omitted Bill #GAC/JUL/26/110 in GSTR-1. ₹19,000 ITC deferred.",
  },

  // JUNE 2026 (CLEAN FILED)
  {
    period: "Jun 2026",
    financialYear: "2026-27",
    gstr1: {
      status: "filed",
      b2bTaxable: 3890000,
      b2cTaxable: 35000,
      totalTaxable: 3925000,
      igst: 121400,
      cgst: 38200,
      sgst: 38200,
      totalTax: 197800,
      invoiceCount: 16,
      filedDate: "2026-07-10",
    },
    gstr2b: {
      itcAvailableIgst: 89400,
      itcAvailableCgst: 35600,
      itcAvailableSgst: 35600,
      totalItcAvailable: 160600,
      ineligibleItc: 0,
      matchedBillCount: 8,
      mismatchCount: 0,
    },
    gstr3b: {
      status: "filed",
      outputTaxDue: 197800,
      itcClaimed: 160600,
      netTaxPayableCash: 37200,
      interestAndLateFee: 0,
      totalCashPaid: 37200,
      filedDate: "2026-07-19",
    },
    reconciliationNotes: "100% matched with 2B Auto-drafted ITC. Return filed via GSTN API token.",
  },

  // MAY 2026 (CLEAN FILED)
  {
    period: "May 2026",
    financialYear: "2026-27",
    gstr1: {
      status: "filed",
      b2bTaxable: 3120000,
      b2cTaxable: 28000,
      totalTaxable: 3148000,
      igst: 98500,
      cgst: 29400,
      sgst: 29400,
      totalTax: 157300,
      invoiceCount: 11,
      filedDate: "2026-06-11",
    },
    gstr2b: {
      itcAvailableIgst: 76200,
      itcAvailableCgst: 29800,
      itcAvailableSgst: 29800,
      totalItcAvailable: 135800,
      ineligibleItc: 0,
      matchedBillCount: 6,
      mismatchCount: 0,
    },
    gstr3b: {
      status: "filed",
      outputTaxDue: 157300,
      itcClaimed: 135800,
      netTaxPayableCash: 21500,
      interestAndLateFee: 0,
      totalCashPaid: 21500,
      filedDate: "2026-06-20",
    },
    reconciliationNotes: "Fully settled with Electronic Cash & Credit Ledgers.",
  },
];
