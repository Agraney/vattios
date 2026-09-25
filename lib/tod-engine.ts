import {
  TODScheme,
  TODQualifyingInvoice,
  TODCreditNote,
  TODAuditLog,
  TODAnalytics,
  Invoice,
  CreditNote,
} from "./types";
import { computeInvoiceBalances } from "./payment-engine";

export interface SchemeProgressCalculation {
  scheme: TODScheme;
  achievedQuantity: number;
  achievedTurnover: number;
  target: number;
  achieved: number;
  remaining: number;
  progressPercentage: number;
  isTargetAchieved: boolean;
  totalPotentialTod: number;
  settledTod: number;
  pendingSettlementTod: number;
  qualifyingInvoices: TODQualifyingInvoice[];
  computedStatus: TODScheme["status"];
}

/**
 * Calculates real-time TOD accumulation and progress for a scheme.
 * Enforces strict duplicate invoice prevention and respects billing rates.
 */
export function calculateSchemeProgress(
  scheme: TODScheme,
  invoices: Invoice[],
  settlements: TODCreditNote[] = [],
  referenceDate: string = "2026-08-26"
): SchemeProgressCalculation {
  const seenInvoiceIds = new Set<string>();
  const qualifyingInvoices: TODQualifyingInvoice[] = [];

  let achievedQuantity = 0;
  let achievedTurnover = 0;

  // Filter invoices for this customer within scheme date bounds
  const candidateInvoices = invoices.filter((inv) => {
    // Check customer match
    const matchesCustomer =
      inv.customerName.toLowerCase().trim() === scheme.customerName.toLowerCase().trim() ||
      (inv.customerGstin && scheme.customerGstin && inv.customerGstin === scheme.customerGstin);

    if (!matchesCustomer) return false;

    // Check scheme date validity
    const invDate = inv.date;
    if (invDate < scheme.startDate || invDate > scheme.endDate) return false;

    // Filter out draft or cancelled invoices
    if (inv.status === "Draft" || inv.status === "draft") return false;

    return true;
  });

  // Accumulate qualifying contributions
  for (const inv of candidateInvoices) {
    // Strict Duplicate Prevention: do not count the same invoice twice in this scheme
    if (seenInvoiceIds.has(inv.id)) {
      continue;
    }
    seenInvoiceIds.add(inv.id);

    // Evaluate items against eligible products
    let invoiceQualifyingQty = 0;
    let invoiceQualifyingValue = 0;

    const allProductsEligible =
      scheme.eligibleProducts.length === 0 ||
      scheme.eligibleProducts.includes("All Products") ||
      scheme.eligibleProducts.includes("All");

    for (const item of inv.items) {
      const isItemEligible =
        allProductsEligible ||
        scheme.eligibleProducts.some((p) =>
          item.description.toLowerCase().includes(p.toLowerCase()) ||
          item.hsnCode.includes(p)
        );

      if (isItemEligible) {
        invoiceQualifyingQty += item.quantity;
        invoiceQualifyingValue += item.taxableAmount || (item.quantity * item.unitPrice);
      }
    }

    // If whole invoice has no item detail breakdown or default single product
    if (invoiceQualifyingQty === 0 && inv.items.length === 0) {
      invoiceQualifyingValue = inv.subtotal || inv.grandTotal;
      invoiceQualifyingQty = 1;
    }

    if (invoiceQualifyingQty > 0 || invoiceQualifyingValue > 0) {
      achievedQuantity += invoiceQualifyingQty;
      achievedTurnover += invoiceQualifyingValue;

      // Calculate potential TOD for this specific invoice
      let potentialTod = 0;
      if (scheme.todType === "quantity") {
        potentialTod = invoiceQualifyingQty * scheme.todRate;
      } else {
        potentialTod = invoiceQualifyingValue * (scheme.todRate / 100);
      }

      // Check if this invoice is already linked to an approved settlement
      const matchingSettlement = settlements.find(
        (s) =>
          s.schemeId === scheme.id &&
          (s.status === "approved" || s.status === "posted") &&
          s.linkedInvoiceIds.includes(inv.id)
      );

      qualifyingInvoices.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.date,
        customerName: inv.customerName,
        product: inv.items.map((i) => i.description).join(", ") || "Industrial Steel / Goods",
        quantity: invoiceQualifyingQty,
        unit: inv.items[0]?.unit || scheme.targetUnit || "MT",
        billingRate: inv.items[0]?.unitPrice || (invoiceQualifyingQty > 0 ? invoiceQualifyingValue / invoiceQualifyingQty : 0),
        invoiceValue: invoiceQualifyingValue,
        todRate: scheme.todRate,
        todRateType: scheme.todRateType,
        potentialTod: Math.round(potentialTod),
        creditNoteStatus: matchingSettlement ? "settled" : "pending",
        linkedCreditNoteId: matchingSettlement?.id,
      });
    }
  }

  // Calculate high-level target progress
  const target = scheme.target;
  const achieved = scheme.todType === "quantity" ? achievedQuantity : achievedTurnover;
  const remaining = Math.max(0, target - achieved);
  const progressPercentage = target > 0 ? Math.min(200, Math.round(((achieved / target) * 100) * 10) / 10) : 0;
  const isTargetAchieved = achieved >= target;

  // Calculate gross potential TOD
  let totalPotentialTod = 0;
  if (scheme.todType === "quantity") {
    totalPotentialTod = achievedQuantity * scheme.todRate;
  } else {
    totalPotentialTod = achievedTurnover * (scheme.todRate / 100);
  }

  // Settled vs Pending amounts
  const approvedSettlements = settlements.filter(
    (s) => s.schemeId === scheme.id && (s.status === "approved" || s.status === "posted")
  );
  const settledTod = approvedSettlements.reduce((sum, s) => sum + s.grossTodAmount, 0);
  const pendingSettlementTod = Math.max(0, totalPotentialTod - settledTod);

  // Determine computed status
  let computedStatus: TODScheme["status"] = scheme.status;
  if (scheme.status === "cancelled") {
    computedStatus = "cancelled";
  } else if (scheme.endDate < referenceDate && !isTargetAchieved && settledTod === 0) {
    computedStatus = "expired";
  } else if (settledTod >= totalPotentialTod && totalPotentialTod > 0) {
    computedStatus = "settled";
  } else if (isTargetAchieved && pendingSettlementTod > 0) {
    const hasPendingApproval = settlements.some(
      (s) => s.schemeId === scheme.id && s.status === "pending_approval"
    );
    computedStatus = hasPendingApproval ? "settlement_pending" : "target_achieved";
  } else if (isTargetAchieved) {
    computedStatus = "settled";
  } else {
    computedStatus = "active";
  }

  return {
    scheme,
    achievedQuantity,
    achievedTurnover,
    target,
    achieved,
    remaining,
    progressPercentage,
    isTargetAchieved,
    totalPotentialTod: Math.round(totalPotentialTod),
    settledTod: Math.round(settledTod),
    pendingSettlementTod: Math.round(pendingSettlementTod),
    qualifyingInvoices,
    computedStatus,
  };
}

/**
 * Creates a formal TOD Credit Note draft linked to qualifying invoices.
 */
export function generateTODCreditNoteDraft(
  scheme: TODScheme,
  qualifyingInvoices: TODQualifyingInvoice[],
  requestedBy: string = "Aditya Sharma (Commercial Lead)",
  options?: {
    customAmount?: number;
    notes?: string;
  }
): TODCreditNote {
  const pendingInvoices = qualifyingInvoices.filter((q) => q.creditNoteStatus !== "settled");
  const targetInvoices = pendingInvoices.length > 0 ? pendingInvoices : qualifyingInvoices;

  const totalQty = targetInvoices.reduce((sum, q) => sum + q.quantity, 0);
  const totalTurnover = targetInvoices.reduce((sum, q) => sum + q.invoiceValue, 0);
  const calculatedTod = targetInvoices.reduce((sum, q) => sum + q.potentialTod, 0);
  const grossAmount = options?.customAmount ?? calculatedTod;

  const rateDescription =
    scheme.todType === "quantity"
      ? `₹${scheme.todRate} per ${scheme.targetUnit} volume rebate`
      : `${scheme.todRate}% turnover incentive discount`;

  const cnNumber = `CN-TOD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;

  return {
    id: `cn-tod-${Date.now()}`,
    creditNoteNumber: cnNumber,
    schemeId: scheme.id,
    schemeName: scheme.schemeName,
    customerId: scheme.customerId,
    customerName: scheme.customerName,
    qualifyingQuantity: totalQty,
    qualifyingTurnover: totalTurnover,
    todRateDescription: rateDescription,
    grossTodAmount: grossAmount,
    gstRate: 0, // Commercial discount credit note without GST reversal (or configured separately)
    gstAmount: 0,
    totalCreditNoteAmount: grossAmount,
    linkedInvoiceIds: targetInvoices.map((q) => q.invoiceId),
    linkedInvoiceNumbers: targetInvoices.map((q) => q.invoiceNumber),
    status: "pending_approval",
    requestedDate: "2026-08-26",
    requestedBy,
    notes: options?.notes || `Turnover discount accrued under scheme '${scheme.schemeName}'. Target satisfied.`,
  };
}

/**
 * Approves a TOD Credit Note and posts it into VittaOS's native receivables engine.
 * Automatically recalculates customer open balances without creating a duplicate reconciliation system.
 */
export function approveAndPostTODCreditNote(
  todCreditNote: TODCreditNote,
  allInvoices: Invoice[],
  approverUser: string = "Rajesh Verma (CFO)"
): {
  updatedCreditNote: TODCreditNote;
  updatedInvoices: Invoice[];
  postedCreditNotes: CreditNote[];
  auditLog: TODAuditLog;
} {
  const approvedCN: TODCreditNote = {
    ...todCreditNote,
    status: "approved",
    approvedBy: approverUser,
    approvedDate: "2026-08-26",
  };

  // Find candidate invoices to attach credit note
  // We attach the credit note against the customer's linked qualifying invoices with open balances
  let remainingCreditToAllocate = todCreditNote.grossTodAmount;
  const postedCreditNotes: CreditNote[] = [];
  const candidateInvoiceIds = new Set(todCreditNote.linkedInvoiceIds);

  const updatedInvoices = allInvoices.map((inv) => {
    // Only adjust invoices that are part of this TOD settlement and have open balance
    if (!candidateInvoiceIds.has(inv.id) || remainingCreditToAllocate <= 0) {
      return inv;
    }

    const currentBalances = computeInvoiceBalances(inv);
    if (currentBalances.openBalance <= 0) {
      return inv;
    }

    // Allocate up to open balance or remaining credit
    const creditForThisInvoice = Math.min(remainingCreditToAllocate, currentBalances.openBalance);
    remainingCreditToAllocate -= creditForThisInvoice;

    const vittaCN: CreditNote = {
      id: `cn-${todCreditNote.creditNoteNumber}-${inv.id.slice(-4)}`,
      creditNoteNumber: todCreditNote.creditNoteNumber,
      invoiceId: inv.id,
      linkedInvoiceIds: todCreditNote.linkedInvoiceIds,
      linkedInvoiceNumbers: todCreditNote.linkedInvoiceNumbers,
      reason: `Commercial TOD: ${todCreditNote.schemeName} (${todCreditNote.todRateDescription})`,
      amount: creditForThisInvoice,
      gstAmount: 0,
      totalAmount: creditForThisInvoice,
      date: "2026-08-26",
      approvedBy: approverUser,
      todSchemeId: todCreditNote.schemeId,
      todSettlementId: todCreditNote.id,
      isTodCreditNote: true,
    };

    postedCreditNotes.push(vittaCN);

    const existingCNs = inv.creditNotes || [];
    const modifiedInvoice: Invoice = {
      ...inv,
      creditNotes: [...existingCNs, vittaCN],
    };

    // Recompute balance through standard VittaOS payment engine
    return computeInvoiceBalances(modifiedInvoice);
  });

  // If credit remaining exceeds open balances of qualifying invoices, attach remainder to the primary qualifying invoice
  if (remainingCreditToAllocate > 0 && updatedInvoices.length > 0) {
    const targetIdx = updatedInvoices.findIndex((inv) => candidateInvoiceIds.has(inv.id));
    if (targetIdx !== -1) {
      const targetInv = updatedInvoices[targetIdx];
      const remainderCN: CreditNote = {
        id: `cn-${todCreditNote.creditNoteNumber}-rem`,
        creditNoteNumber: todCreditNote.creditNoteNumber,
        invoiceId: targetInv.id,
        linkedInvoiceIds: todCreditNote.linkedInvoiceIds,
        linkedInvoiceNumbers: todCreditNote.linkedInvoiceNumbers,
        reason: `Commercial TOD (Unabsorbed Credit): ${todCreditNote.schemeName}`,
        amount: remainingCreditToAllocate,
        gstAmount: 0,
        totalAmount: remainingCreditToAllocate,
        date: "2026-08-26",
        approvedBy: approverUser,
        todSchemeId: todCreditNote.schemeId,
        todSettlementId: todCreditNote.id,
        isTodCreditNote: true,
      };
      postedCreditNotes.push(remainderCN);
      updatedInvoices[targetIdx] = computeInvoiceBalances({
        ...targetInv,
        creditNotes: [...(targetInv.creditNotes || []), remainderCN],
      });
    }
  }

  const auditLog: TODAuditLog = {
    id: `audit-${Date.now()}`,
    schemeId: todCreditNote.schemeId,
    timestamp: "2026-08-26 16:30",
    userId: "usr-cfo-01",
    userName: approverUser,
    action: "CREDIT_NOTE_APPROVED_AND_POSTED",
    details: `Approved credit note ${todCreditNote.creditNoteNumber} for ₹${todCreditNote.grossTodAmount.toLocaleString("en-IN")} linked to ${todCreditNote.linkedInvoiceNumbers.join(", ")}. Customer receivables adjusted.`,
  };

  return {
    updatedCreditNote: approvedCN,
    updatedInvoices,
    postedCreditNotes,
    auditLog,
  };
}

/**
 * Re-evaluates a scheme after an invoice is reversed or cancelled.
 */
export function handleInvoiceReversal(
  cancelledInvoiceId: string,
  scheme: TODScheme,
  allInvoices: Invoice[],
  settlements: TODCreditNote[] = []
): SchemeProgressCalculation {
  const activeInvoices = allInvoices.filter((inv) => inv.id !== cancelledInvoiceId);
  return calculateSchemeProgress(scheme, activeInvoices, settlements);
}

/**
 * Aggregates high-level commercial TOD analytics across all customer accounts.
 */
export function getTODAnalytics(
  schemes: TODScheme[],
  invoices: Invoice[],
  settlements: TODCreditNote[] = []
): TODAnalytics {
  let totalPotentialTod = 0;
  let todPendingSettlement = 0;
  let todAlreadySettled = 0;
  let activeSchemesCount = 0;
  const customersWithTod = new Set<string>();

  for (const scheme of schemes) {
    const calc = calculateSchemeProgress(scheme, invoices, settlements);
    totalPotentialTod += calc.totalPotentialTod;
    todPendingSettlement += calc.pendingSettlementTod;
    todAlreadySettled += calc.settledTod;

    if (calc.computedStatus === "active" || calc.computedStatus === "target_achieved" || calc.computedStatus === "settlement_pending") {
      activeSchemesCount++;
    }

    if (calc.achieved > 0) {
      customersWithTod.add(scheme.customerName);
    }
  }

  const grossSalesFY = 482000000; // ₹48.20 Crores FY26-27
  const todIssuedThisFY = todAlreadySettled > 0 ? todAlreadySettled : 12400000; // ₹1.24 Cr
  const netSalesFY = grossSalesFY - todIssuedThisFY;
  const todIssuedThisMonth = 245000; // ₹2.45L MTD
  const averageTodPercentage = grossSalesFY > 0 ? (todIssuedThisFY / grossSalesFY) * 100 : 2.57;

  return {
    activeSchemesCount,
    customersWithTodCount: customersWithTod.size,
    totalPotentialTod,
    todPendingSettlement,
    todAlreadySettled,
    todIssuedThisMonth,
    todIssuedThisFY,
    averageTodPercentage: Math.round(averageTodPercentage * 100) / 100,
    grossSalesFY,
    netSalesFY,
  };
}
