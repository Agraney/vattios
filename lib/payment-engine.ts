import {
  Invoice,
  BankTransaction,
  PaymentAllocation,
  PaymentLedgerEvent,
  ReconMatchType,
  InvoiceStatus,
} from "./types";

/**
 * Computes all dynamic running balances and status for an invoice.
 * Replaces binary flags with mathematically verified open balances.
 */
export function computeInvoiceBalances(invoice: Invoice, referenceDate: string = "2026-08-26"): Invoice {
  const creditNotes = invoice.creditNotes || [];
  const debitNotes = invoice.debitNotes || [];
  const paymentAllocations = invoice.paymentAllocations || [];

  const totalCreditNotes = creditNotes.reduce((sum, c) => sum + (c.totalAmount || c.amount || 0), 0);
  const totalDebitNotes = debitNotes.reduce((sum, d) => sum + (d.totalAmount || d.amount || 0), 0);
  const netPayable = Math.max(0, invoice.grandTotal - totalCreditNotes + totalDebitNotes);

  const totalPaid = paymentAllocations
    .filter((p) => p.type === "payment")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalTdsDeducted = paymentAllocations
    .filter((p) => p.type === "tds")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDeductionsAndPayments = totalPaid + totalTdsDeducted;
  const rawOpenBalance = netPayable - totalDeductionsAndPayments;
  const openBalance = rawOpenBalance <= 0.01 ? 0 : Math.round(rawOpenBalance * 100) / 100;

  // Determine computed status
  let status: InvoiceStatus = invoice.status;
  if (invoice.status === "draft" || invoice.status === "Draft") {
    status = "Draft";
  } else if (openBalance === 0) {
    status = "Closed";
  } else if (invoice.dueDate && referenceDate > invoice.dueDate) {
    status = "Overdue";
  } else if (totalDeductionsAndPayments > 0) {
    status = "Partially Paid";
  } else {
    status = "Sent";
  }

  return {
    ...invoice,
    creditNotes,
    debitNotes,
    paymentAllocations,
    netPayable,
    totalPaid,
    totalTdsDeducted,
    totalCreditNotes,
    totalDebitNotes,
    openBalance,
    // Deprecated compatibility fields
    amountPaid: totalPaid + totalTdsDeducted,
    balanceDue: openBalance,
    status,
  };
}

/**
 * Builds the chronological, immutable Payment Ledger for an invoice.
 * Shows every line event (invoice raised, credit note, TDS deduction, bank payments)
 * with the running balance after each line.
 */
export function getInvoicePaymentLedger(invoice: Invoice): PaymentLedgerEvent[] {
  const events: {
    date: string;
    type: "INVOICE_RAISED" | "CREDIT_NOTE" | "DEBIT_NOTE" | "TDS_DEDUCTION" | "BANK_PAYMENT";
    title: string;
    referenceNumber: string;
    reason?: string;
    debitAmount: number;
    creditAmount: number;
    details?: PaymentLedgerEvent["details"];
  }[] = [];

  // 1. Invoice Raised (Initial Receivable)
  events.push({
    date: invoice.date,
    type: "INVOICE_RAISED",
    title: `Tax Invoice Generated (${invoice.items.length} line items)`,
    referenceNumber: invoice.invoiceNumber,
    debitAmount: invoice.grandTotal,
    creditAmount: 0,
  });

  // 2. Credit Notes (Reduces Receivable)
  if (invoice.creditNotes && invoice.creditNotes.length > 0) {
    invoice.creditNotes.forEach((cn) => {
      events.push({
        date: cn.date,
        type: "CREDIT_NOTE",
        title: `Credit Note Issued: ${cn.creditNoteNumber}`,
        referenceNumber: cn.creditNoteNumber,
        reason: cn.reason,
        debitAmount: 0,
        creditAmount: cn.totalAmount,
      });
    });
  }

  // 3. Debit Notes (Increases Receivable)
  if (invoice.debitNotes && invoice.debitNotes.length > 0) {
    invoice.debitNotes.forEach((dn) => {
      events.push({
        date: dn.date,
        type: "DEBIT_NOTE",
        title: `Debit Note Issued: ${dn.debitNoteNumber}`,
        referenceNumber: dn.debitNoteNumber,
        reason: dn.reason,
        debitAmount: dn.totalAmount,
        creditAmount: 0,
      });
    });
  }

  // 4. Payment Allocations (TDS Deductions & Bank Payments)
  if (invoice.paymentAllocations && invoice.paymentAllocations.length > 0) {
    invoice.paymentAllocations.forEach((pa) => {
      if (pa.type === "tds") {
        events.push({
          date: pa.date,
          type: "TDS_DEDUCTION",
          title: `Buyer TDS Withholding (Sec ${pa.tdsSection || "194Q"} @ ${pa.tdsRate || 0.1}%)`,
          referenceNumber: `TDS-${pa.tdsSection || "194Q"}-${invoice.invoiceNumber.slice(-4)}`,
          reason: pa.notes || `Statutory tax deduction made by ${invoice.customerName} before remittance`,
          debitAmount: 0,
          creditAmount: pa.amount,
          details: {
            tdsSection: pa.tdsSection,
            tdsRate: pa.tdsRate,
          },
        });
      } else {
        events.push({
          date: pa.date,
          type: "BANK_PAYMENT",
          title: `Bank Settlement Received (${pa.paymentMode || "RTGS"})`,
          referenceNumber: pa.bankReferenceNumber || "BANK-UTR-VERIFIED",
          reason: pa.notes || "Inflow auto-matched against HDFC Current A/c #0194",
          debitAmount: 0,
          creditAmount: pa.amount,
          details: {
            paymentMode: pa.paymentMode,
            bankTransactionId: pa.bankTransactionId,
          },
        });
      }
    });
  }

  // Sort events chronologically (date ascending)
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Recompute running balance step by step
  let running = 0;
  return events.map((ev, index) => {
    running = running + ev.debitAmount - ev.creditAmount;
    // Fix floating point errors
    const roundedRunning = Math.abs(running) < 0.01 ? 0 : Math.round(running * 100) / 100;

    return {
      id: `ple-${index + 1}`,
      date: ev.date,
      type: ev.type,
      title: ev.title,
      referenceNumber: ev.referenceNumber,
      reason: ev.reason,
      debitAmount: ev.debitAmount,
      creditAmount: ev.creditAmount,
      runningBalance: roundedRunning,
      details: ev.details,
    };
  });
}

/**
 * Classifies a candidate bank transaction against an invoice.
 */
export function getMatchClassification(
  transactionAmount: number,
  invoice: Invoice
): {
  matchType: ReconMatchType;
  confidence: number;
  explanation: string;
  isExact: boolean;
  isPartial: boolean;
  isAdjusted: boolean;
} {
  const openBal = invoice.openBalance;
  const grandTotal = invoice.grandTotal;
  const cnTotal = invoice.totalCreditNotes || 0;
  const tdsTotal = invoice.totalTdsDeducted || 0;

  // Case 1: Exact Match on Current Open Balance
  if (Math.abs(transactionAmount - openBal) <= 1) {
    return {
      matchType: "exact",
      confidence: 100,
      explanation: `Exact match: Remittance of ₹${transactionAmount.toLocaleString("en-IN")} equals full open balance of ${invoice.invoiceNumber}.`,
      isExact: true,
      isPartial: false,
      isAdjusted: false,
    };
  }

  // Case 2: Adjusted Match (Matches Gross minus Credit Notes & TDS)
  const adjustedExpected = grandTotal - cnTotal - tdsTotal;
  if (Math.abs(transactionAmount - adjustedExpected) <= 5 && (cnTotal > 0 || tdsTotal > 0)) {
    const adjustments: string[] = [];
    if (cnTotal > 0) adjustments.push(`₹${cnTotal.toLocaleString("en-IN")} credit note`);
    if (tdsTotal > 0) adjustments.push(`₹${tdsTotal.toLocaleString("en-IN")} TDS`);

    return {
      matchType: "adjusted",
      confidence: 98,
      explanation: `Matches after ${adjustments.join(" + ")} adjustments on invoice total (₹${grandTotal.toLocaleString("en-IN")}).`,
      isExact: false,
      isPartial: false,
      isAdjusted: true,
    };
  }

  // Case 3: Partial Match
  if (transactionAmount < openBal && transactionAmount > 0) {
    const remaining = openBal - transactionAmount;
    return {
      matchType: "partial",
      confidence: 90,
      explanation: `Partial match: ₹${transactionAmount.toLocaleString("en-IN")} reduces open balance to ₹${remaining.toLocaleString("en-IN")} (Partially Paid).`,
      isExact: false,
      isPartial: true,
      isAdjusted: false,
    };
  }

  // Default / Manual Match
  return {
    matchType: "manual",
    confidence: 80,
    explanation: `Manual allocation of ₹${transactionAmount.toLocaleString("en-IN")} against ${invoice.invoiceNumber}.`,
    isExact: false,
    isPartial: false,
    isAdjusted: false,
  };
}

/**
 * Core Auto-Close & Payment Allocation Engine.
 * Central function called by both Bank Reconciliation and Invoice Payment Ledger.
 */
export function applyBankTransaction(
  transaction: BankTransaction,
  invoice: Invoice,
  options?: {
    customAmount?: number;
    tdsAmount?: number;
    tdsSection?: string;
    tdsRate?: number;
  }
): {
  updatedInvoice: Invoice;
  newAllocations: PaymentAllocation[];
  autoClosed: boolean;
  matchType: ReconMatchType;
  explanation: string;
  toastMessage: string;
} {
  const computedInv = computeInvoiceBalances(invoice);
  const allocatedAmount = options?.customAmount || Math.min(transaction.amount, computedInv.openBalance || transaction.amount);
  const newAllocations: PaymentAllocation[] = [];

  // 1. Add TDS allocation if specified and not already present
  if (options?.tdsAmount && options.tdsAmount > 0) {
    newAllocations.push({
      id: `pa-tds-${Date.now()}`,
      invoiceId: invoice.id,
      amount: options.tdsAmount,
      type: "tds",
      tdsSection: options.tdsSection || "194Q",
      tdsRate: options.tdsRate || 0.1,
      date: transaction.date,
      notes: `Buyer statutory TDS withheld under Section ${options.tdsSection || "194Q"}`,
      matchedBy: "auto_reconciled",
    });
  }

  // 2. Add Bank Payment allocation
  newAllocations.push({
    id: `pa-pay-${Date.now()}`,
    invoiceId: invoice.id,
    bankTransactionId: transaction.id,
    bankReferenceNumber: transaction.referenceNumber,
    paymentMode: transaction.mode,
    amount: allocatedAmount,
    type: "payment",
    date: transaction.date,
    notes: `Settlement via ${transaction.mode} (Ref: ${transaction.referenceNumber})`,
    matchedBy: "auto_reconciled",
  });

  const updatedAllocations = [...(computedInv.paymentAllocations || []), ...newAllocations];

  const candidateInv: Invoice = {
    ...computedInv,
    paymentAllocations: updatedAllocations,
  };

  const finalInvoice = computeInvoiceBalances(candidateInv, transaction.date);
  const classification = getMatchClassification(transaction.amount, computedInv);
  const autoClosed = finalInvoice.openBalance === 0;

  const toastMessage = autoClosed
    ? `Invoice ${finalInvoice.invoiceNumber} balance is ₹0 — Closed automatically.`
    : `Invoice ${finalInvoice.invoiceNumber} updated to Partially Paid (Remaining: ₹${finalInvoice.openBalance.toLocaleString("en-IN")}).`;

  return {
    updatedInvoice: finalInvoice,
    newAllocations,
    autoClosed,
    matchType: classification.matchType,
    explanation: classification.explanation,
    toastMessage,
  };
}
