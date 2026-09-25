/**
 * Automated Verification Suite for Turnover Discount (TOD) Management System in VittaOS
 * Run via: npx tsx scripts/test-tod.ts
 */

import {
  calculateSchemeProgress,
  generateTODCreditNoteDraft,
  approveAndPostTODCreditNote,
  handleInvoiceReversal,
  getTODAnalytics,
} from "../lib/tod-engine";
import { computeInvoiceBalances } from "../lib/payment-engine";
import {
  TODScheme,
  TODCreditNote,
  Invoice,
} from "../lib/types";

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    if (details) console.error(`    Details: ${details}`);
  }
}

console.log("==========================================================");
console.log("VITTAOS TURNOVER DISCOUNT (TOD) TEST SUITE");
console.log("==========================================================\n");

// -----------------------------------------------------------------------------
// TEST SUITE 1: Quantity-Based TOD Calculation (ABC Metals)
// -----------------------------------------------------------------------------
console.log("TEST 1: Quantity-Based TOD Calculation (10,000 MT @ ₹10/MT)");

const abcScheme: TODScheme = {
  id: "tod-scheme-test-01",
  customerId: "cust-abc-01",
  customerName: "ABC Metals",
  schemeName: "FY 2026-27 Volume Scheme",
  startDate: "2026-04-01",
  endDate: "2027-03-31",
  todType: "quantity",
  target: 10000,
  targetUnit: "MT",
  todRate: 10,
  todRateType: "per_unit",
  settlementFrequency: "annual",
  eligibleProducts: ["All Products"],
  status: "active",
  createdAt: "2026-04-01",
  createdBy: "Aditya Sharma",
};

const rawHistoricalInvoices: Invoice[] = [
  {
    id: "inv-test-1021",
    invoiceNumber: "INV-1021",
    date: "2026-05-12",
    dueDate: "2026-06-11",
    type: "B2B",
    customerName: "ABC Metals",
    customerState: "Maharashtra",
    customerStateCode: "27",
    placeOfSupply: "27-Maharashtra",
    isInterState: false,
    status: "Closed",
    items: [{ id: "i-1", description: "Hot Rolled Coils (HRC)", hsnCode: "7208", quantity: 1500, unit: "MT", unitPrice: 70, gstRate: 18, taxableAmount: 105000, cgst: 9450, sgst: 9450, igst: 0, totalAmount: 123900 }],
    paymentAllocations: [{ id: "pa-1", invoiceId: "inv-test-1021", amount: 123900, type: "payment", date: "2026-05-25" }],
    subtotal: 105000, totalTax: 18900, cgstTotal: 9450, sgstTotal: 9450, igstTotal: 0, grandTotal: 123900, netPayable: 123900, totalPaid: 123900, totalTdsDeducted: 0, totalCreditNotes: 0, totalDebitNotes: 0, openBalance: 0, amountPaid: 123900, balanceDue: 0, paymentTerms: "Net 30",
  },
  {
    id: "inv-test-1048",
    invoiceNumber: "INV-1048",
    date: "2026-06-25",
    dueDate: "2026-07-25",
    type: "B2B",
    customerName: "ABC Metals",
    customerState: "Maharashtra",
    customerStateCode: "27",
    placeOfSupply: "27-Maharashtra",
    isInterState: false,
    status: "Closed",
    items: [{ id: "i-2", description: "Hot Rolled Coils (HRC)", hsnCode: "7208", quantity: 2000, unit: "MT", unitPrice: 70, gstRate: 18, taxableAmount: 140000, cgst: 12600, sgst: 12600, igst: 0, totalAmount: 165200 }],
    paymentAllocations: [{ id: "pa-2", invoiceId: "inv-test-1048", amount: 165200, type: "payment", date: "2026-07-10" }],
    subtotal: 140000, totalTax: 25200, cgstTotal: 12600, sgstTotal: 12600, igstTotal: 0, grandTotal: 165200, netPayable: 165200, totalPaid: 165200, totalTdsDeducted: 0, totalCreditNotes: 0, totalDebitNotes: 0, openBalance: 0, amountPaid: 165200, balanceDue: 0, paymentTerms: "Net 30",
  },
  {
    id: "inv-test-1087",
    invoiceNumber: "INV-1087",
    date: "2026-07-28",
    dueDate: "2026-08-27",
    type: "B2B",
    customerName: "ABC Metals",
    customerState: "Maharashtra",
    customerStateCode: "27",
    placeOfSupply: "27-Maharashtra",
    isInterState: false,
    status: "Closed",
    items: [{ id: "i-3", description: "Steel Rebars", hsnCode: "7214", quantity: 3000, unit: "MT", unitPrice: 70, gstRate: 18, taxableAmount: 210000, cgst: 18900, sgst: 18900, igst: 0, totalAmount: 247800 }],
    paymentAllocations: [{ id: "pa-3", invoiceId: "inv-test-1087", amount: 247800, type: "payment", date: "2026-08-15" }],
    subtotal: 210000, totalTax: 37800, cgstTotal: 18900, sgstTotal: 18900, igstTotal: 0, grandTotal: 247800, netPayable: 247800, totalPaid: 247800, totalTdsDeducted: 0, totalCreditNotes: 0, totalDebitNotes: 0, openBalance: 0, amountPaid: 247800, balanceDue: 0, paymentTerms: "Net 30",
  },
  {
    id: "inv-test-1124",
    invoiceNumber: "INV-1124",
    date: "2026-08-20",
    dueDate: "2026-09-19",
    type: "B2B",
    customerName: "ABC Metals",
    customerState: "Maharashtra",
    customerStateCode: "27",
    placeOfSupply: "27-Maharashtra",
    isInterState: false,
    status: "Sent",
    items: [{ id: "i-4", description: "Hot Rolled Coils (HRC)", hsnCode: "7208", quantity: 1350, unit: "MT", unitPrice: 70, gstRate: 18, taxableAmount: 94500, cgst: 8505, sgst: 8505, igst: 0, totalAmount: 111510 }],
    paymentAllocations: [],
    subtotal: 94500, totalTax: 17010, cgstTotal: 8505, sgstTotal: 8505, igstTotal: 0, grandTotal: 111510, netPayable: 111510, totalPaid: 0, totalTdsDeducted: 0, totalCreditNotes: 0, totalDebitNotes: 0, openBalance: 111510, amountPaid: 0, balanceDue: 111510, paymentTerms: "Net 30",
  },
];
const historicalInvoices: Invoice[] = rawHistoricalInvoices.map((inv) => computeInvoiceBalances(inv));

const progress1 = calculateSchemeProgress(abcScheme, historicalInvoices);

assert(progress1.achievedQuantity === 7850, "Achieved volume equals 7,850 MT (1500 + 2000 + 3000 + 1350)");
assert(progress1.remaining === 2150, "Remaining volume equals 2,150 MT (10,000 - 7,850)");
assert(progress1.progressPercentage === 78.5, "Progress percentage equals exactly 78.5%");
assert(progress1.totalPotentialTod === 78500, "Potential TOD equals ₹78,500 (7,850 MT × ₹10/MT)");
assert(progress1.isTargetAchieved === false, "Target is not yet achieved at 7,850 MT");
assert(progress1.computedStatus === "active", "Scheme status remains 'active'");

// -----------------------------------------------------------------------------
// TEST SUITE 2: Duplicate Invoice Prevention
// -----------------------------------------------------------------------------
console.log("\nTEST 2: Duplicate Invoice Prevention");

const duplicatedInvoices = [...historicalInvoices, historicalInvoices[0], historicalInvoices[1]];
const progressDup = calculateSchemeProgress(abcScheme, duplicatedInvoices);

assert(progressDup.achievedQuantity === 7850, "Duplicate invoices are ignored by Set deduplication");
assert(progressDup.qualifyingInvoices.length === 4, "Qualifying invoices list has exactly 4 unique entries");

// -----------------------------------------------------------------------------
// TEST SUITE 3: Target Achievement & Threshold Crossing
// -----------------------------------------------------------------------------
console.log("\nTEST 3: Target Achievement Detection (Adding Invoice INV-1150 for 2,300 MT)");

const newInvoiceINV1150: Invoice = computeInvoiceBalances({
  id: "inv-test-1150",
  invoiceNumber: "INV-1150",
  date: "2026-08-26",
  dueDate: "2026-09-25",
  type: "B2B",
  customerName: "ABC Metals",
  customerState: "Maharashtra",
  customerStateCode: "27",
  placeOfSupply: "27-Maharashtra",
  isInterState: false,
  status: "Sent",
  items: [{ id: "i-5", description: "Hot Rolled Coils (HRC)", hsnCode: "7208", quantity: 2300, unit: "MT", unitPrice: 70, gstRate: 18, taxableAmount: 161000, cgst: 14490, sgst: 14490, igst: 0, totalAmount: 189980 }],
  paymentAllocations: [],
  subtotal: 161000, totalTax: 28980, cgstTotal: 14490, sgstTotal: 14490, igstTotal: 0, grandTotal: 189980, netPayable: 189980, totalPaid: 0, totalTdsDeducted: 0, totalCreditNotes: 0, totalDebitNotes: 0, openBalance: 189980, amountPaid: 0, balanceDue: 189980, paymentTerms: "Net 30",
});

const allInvoicesWithNew = [...historicalInvoices, newInvoiceINV1150];
const progressAchieved = calculateSchemeProgress(abcScheme, allInvoicesWithNew);

assert(progressAchieved.achievedQuantity === 10150, "Achieved volume rises to 10,150 MT (7,850 + 2,300)");
assert(progressAchieved.isTargetAchieved === true, "isTargetAchieved flags true when 10,150 >= 10,000");
assert(progressAchieved.progressPercentage === 101.5, "Progress percentage is 101.5%");
assert(progressAchieved.totalPotentialTod === 101500, "Total potential TOD rises to ₹1,01,500");
assert(progressAchieved.computedStatus === "target_achieved", "Scheme status automatically transitions to 'target_achieved'");

// -----------------------------------------------------------------------------
// TEST SUITE 4: Turnover-Based TOD Calculation (XYZ Industries: ₹5 Cr Target @ 2%)
// -----------------------------------------------------------------------------
console.log("\nTEST 4: Turnover-Based TOD Calculation (₹5.00 Cr Target @ 2%)");

const xyzScheme: TODScheme = {
  id: "tod-scheme-test-02",
  customerId: "cust-xyz-01",
  customerName: "XYZ Industries",
  schemeName: "Turnover Growth Incentive Scheme FY27",
  startDate: "2026-04-01",
  endDate: "2027-03-31",
  todType: "turnover",
  target: 50000000, // ₹5.00 Crores
  targetUnit: "INR",
  todRate: 2,
  todRateType: "percentage",
  settlementFrequency: "annual",
  eligibleProducts: ["All Products"],
  status: "active",
  createdAt: "2026-04-01",
  createdBy: "Aditya Sharma",
};

const xyzInvoices: Invoice[] = [
  {
    id: "inv-xyz-01",
    invoiceNumber: "INV-XYZ-01",
    date: "2026-05-15",
    dueDate: "2026-06-15",
    type: "B2B",
    customerName: "XYZ Industries",
    customerState: "Karnataka",
    customerStateCode: "29",
    placeOfSupply: "29-Karnataka",
    isInterState: true,
    status: "Closed",
    items: [{ id: "x-1", description: "Specialized Structural Steel", hsnCode: "7216", quantity: 5000, unit: "MT", unitPrice: 54000, gstRate: 18, taxableAmount: 54000000, cgst: 0, sgst: 0, igst: 9720000, totalAmount: 63720000 }],
    subtotal: 54000000, totalTax: 9720000, cgstTotal: 0, sgstTotal: 0, igstTotal: 9720000, grandTotal: 63720000, netPayable: 63720000, totalPaid: 63720000, totalTdsDeducted: 0, totalCreditNotes: 0, totalDebitNotes: 0, openBalance: 0, amountPaid: 63720000, balanceDue: 0, paymentTerms: "Net 30",
  },
];

const progressTurnover = calculateSchemeProgress(xyzScheme, xyzInvoices);

assert(progressTurnover.achievedTurnover === 54000000, "Turnover achieved is ₹5.40 Crores");
assert(progressTurnover.isTargetAchieved === true, "Target achieved for ₹5.4 Cr >= ₹5 Cr");
assert(progressTurnover.progressPercentage === 108, "Progress is 108%");
assert(progressTurnover.totalPotentialTod === 1080000, "2% of ₹5.40 Cr equals exactly ₹10,80,000 (₹10.8 Lakhs)");

// -----------------------------------------------------------------------------
// TEST SUITE 5: Credit Note Draft Generation & Linking
// -----------------------------------------------------------------------------
console.log("\nTEST 5: Credit Note Draft Generation with Multi-Invoice Linkage");

const draftCN = generateTODCreditNoteDraft(
  abcScheme,
  progressAchieved.qualifyingInvoices,
  "Aditya Sharma (Commercial Head)",
  { customAmount: 100000 }
);

assert(draftCN.status === "pending_approval", "Credit note draft starts in 'pending_approval' status");
assert(draftCN.grossTodAmount === 100000, "Draft credit note amount equals agreed ₹1,00,000");
assert(draftCN.linkedInvoiceIds.length === 5, "Draft credit note links to all 5 contributing invoices");
assert(draftCN.linkedInvoiceNumbers.includes("INV-1021"), "Linked invoice numbers include INV-1021");
assert(draftCN.linkedInvoiceNumbers.includes("INV-1150"), "Linked invoice numbers include INV-1150");

// -----------------------------------------------------------------------------
// TEST SUITE 6: Credit Note Approval & Native Receivables Adjustment
// -----------------------------------------------------------------------------
console.log("\nTEST 6: Credit Note Approval & Native Receivables Balance Reduction");

// INV-1124 had open balance: ₹1,11,510
// INV-1150 had open balance: ₹1,89,980
// Total customer open receivables: ₹3,01,490
const initialCustomerOpenBalance = allInvoicesWithNew
  .filter((i) => i.customerName === "ABC Metals")
  .reduce((sum, i) => sum + i.openBalance, 0);

assert(initialCustomerOpenBalance === 301490, `Initial ABC Metals open balance is ₹3,01,490 (found: ₹${initialCustomerOpenBalance})`);

const approvalResult = approveAndPostTODCreditNote(draftCN, allInvoicesWithNew, "Rajesh Verma (CFO)");

assert(approvalResult.updatedCreditNote.status === "approved", "TOD Credit Note marked as 'approved'");
assert(approvalResult.postedCreditNotes.length > 0, "Native VittaOS CreditNote records generated and linked");

const postApprovalCustomerOpenBalance = approvalResult.updatedInvoices
  .filter((i) => i.customerName === "ABC Metals")
  .reduce((sum, i) => sum + i.openBalance, 0);

const reduction = initialCustomerOpenBalance - postApprovalCustomerOpenBalance;
assert(reduction === 100000, `Customer open receivables reduced by exactly ₹1,00,000 (from ₹${initialCustomerOpenBalance} to ₹${postApprovalCustomerOpenBalance})`);

// Verify invoice INV-1124 balance was adjusted from ₹1,11,510 to ₹11,510
const updatedINV1124 = approvalResult.updatedInvoices.find((i) => i.invoiceNumber === "INV-1124")!;
assert(updatedINV1124.openBalance === 11510, `Invoice INV-1124 open balance reduced to ₹11,510 (found: ₹${updatedINV1124.openBalance})`);
assert(updatedINV1124.totalCreditNotes === 100000, `Invoice INV-1124 reflects ₹1,00,000 credit note total`);

// -----------------------------------------------------------------------------
// TEST SUITE 7: Re-evaluation of Scheme Status after Settlement
// -----------------------------------------------------------------------------
console.log("\nTEST 7: Scheme Status after Credit Note Settlement");

const progressPostSettlement = calculateSchemeProgress(
  abcScheme,
  approvalResult.updatedInvoices,
  [approvalResult.updatedCreditNote]
);

assert(progressPostSettlement.settledTod === 100000, "Settled TOD tracks ₹1,00,000 posted credit note");
assert(progressPostSettlement.computedStatus === "settled" || progressPostSettlement.computedStatus === "target_achieved", "Settlement tracked without double-counting");

// -----------------------------------------------------------------------------
// TEST SUITE 8: Invoice Cancellation & Reversal Handling
// -----------------------------------------------------------------------------
console.log("\nTEST 8: Invoice Cancellation & TOD Recalculation");

// If INV-1150 is cancelled / reversed, progress should drop back to 7,850 MT
const progressReversed = handleInvoiceReversal("inv-test-1150", abcScheme, allInvoicesWithNew);

assert(progressReversed.achievedQuantity === 7850, "After reversal, achieved volume drops back to 7,850 MT");
assert(progressReversed.isTargetAchieved === false, "After reversal, isTargetAchieved drops back to false");

// -----------------------------------------------------------------------------
// TEST SUITE 9: Partial Payment Compatibility
// -----------------------------------------------------------------------------
console.log("\nTEST 9: Partial Payment & Ledger Integrity");

const partiallyPaidInvoice: Invoice = computeInvoiceBalances({
  ...updatedINV1124,
  paymentAllocations: [
    {
      id: "pa-part-01",
      invoiceId: updatedINV1124.id,
      amount: 5000,
      type: "payment",
      date: "2026-08-26",
      notes: "Part-payment via NEFT",
    },
  ],
});

assert(partiallyPaidInvoice.openBalance === 6510, `Open balance after ₹5,000 part-payment is ₹6,510 (found: ₹${partiallyPaidInvoice.openBalance})`);
assert(partiallyPaidInvoice.status === "Partially Paid", "Status is correctly computed as 'Partially Paid'");

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log("\n==========================================================");
console.log(`TEST EXECUTION SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log("==========================================================");

if (passedTests === totalTests) {
  console.log("ALL TOD BUSINESS LOGIC & ACCOUNTING ASSERTIONS VERIFIED SUCCESSFULLY!\n");
  process.exit(0);
} else {
  console.error("SOME TESTS FAILED!\n");
  process.exit(1);
}
