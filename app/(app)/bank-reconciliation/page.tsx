"use client";

import React, { useState, useMemo } from "react";
import {
  fullBankTransactionsList,
  mockInvoices,
  BankTransaction,
  Invoice,
  ReconMatchType,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
  applyBankTransaction,
  computeInvoiceBalances,
  getMatchClassification,
} from "@/lib/payment-engine";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { FinancialConceptModal } from "@/components/shared/financial-concept-modal";
import { ConceptExplainerBanner } from "@/components/shared/concept-explainer-banner";
import {
  Search,
  CheckCircle2,
  RefreshCw,
  Check,
  X,
  Link as LinkIcon,
  Scissors,
  BookOpen,
  PieChart,
} from "lucide-react";

interface ReconTransaction extends BankTransaction {
  suggestedMatch?: {
    type: "invoice";
    id: string;
    number: string;
    entityName: string;
    amount: number;
    confidence: number;
    matchType: ReconMatchType;
    matchReason: string;
    adjustmentsExplanation?: string;
    openBalanceBefore?: number;
    projectedRemainingBalance?: number;
  };
}

export default function BankReconciliationPage() {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  const [invoicesState, setInvoicesState] = useState<Invoice[]>(() =>
    mockInvoices.map((inv) => computeInvoiceBalances(inv))
  );

  // Initialize state with customer credit remittances only (Inflows)
  const [transactions, setTransactions] = useState<ReconTransaction[]>(() => {
    // Filter for credits / customer inflows only
    const creditTxs = fullBankTransactionsList.filter((tx) => tx.type === "credit");

    return creditTxs.map((tx) => {
      // 1. Partial Match Example: FabIndia Order Advance (Advances/Milestone installments)
      if (tx.id === "tx-recon-002") {
        return {
          ...tx,
          status: "review_required",
          matchType: "partial",
          suggestedMatch: {
            type: "invoice",
            id: "inv-2026-044",
            number: "INV/2026-27/044",
            entityName: "FabIndia Overseas Pvt Ltd",
            amount: 45000,
            confidence: 92,
            matchType: "partial",
            matchReason: "Partial advance remittance of ₹45,000 against open balance of ₹1,83,750",
            openBalanceBefore: 183750,
            projectedRemainingBalance: 138750,
          },
        };
      }

      // 2. Adjusted Match Example: Arvind Lifestyle Brands (Net of Credit Note + TDS)
      if (tx.id === "tx-recon-005") {
        return {
          ...tx,
          status: "review_required",
          matchType: "adjusted",
          suggestedMatch: {
            type: "invoice",
            id: "inv-2026-048",
            number: "INV/2026-27/048",
            entityName: "Arvind Lifestyle Brands Ltd",
            amount: 185000,
            confidence: 96,
            matchType: "adjusted",
            matchReason: "Matches after ₹15,400 credit note (Rate revision) + ₹350 TDS adjustment",
            adjustmentsExplanation:
              "Invoice total ₹3,65,400 minus ₹15,400 Credit Note #CN-094 minus ₹350 TDS (Sec 194Q). Remittance of ₹1,85,000 leaves ₹1,64,650 open balance.",
            openBalanceBefore: 350000,
            projectedRemainingBalance: 164650,
          },
        };
      }

      // 3. Exact Match Example: Page Industries (100% open balance -> Auto-close)
      if (tx.id === "tx-recon-006") {
        return {
          ...tx,
          status: "review_required",
          matchType: "exact",
          suggestedMatch: {
            type: "invoice",
            id: "inv-2026-046",
            number: "INV/2026-27/046",
            entityName: "Page Industries Ltd (Jockey India)",
            amount: 309225,
            confidence: 99,
            matchType: "exact",
            matchReason: "Exact match: Remittance of ₹3,09,225 equals 100% open balance",
            openBalanceBefore: 309225,
            projectedRemainingBalance: 0,
          },
        };
      }

      return tx;
    });
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manualMatchModalTx, setManualMatchModalTx] = useState<ReconTransaction | null>(null);
  const [manualPickerSearch, setManualPickerSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Metrics computation for Customer Inflows
  const metrics = useMemo(() => {
    const totalTransactions = transactions.length;
    const matchedCount = transactions.filter((tx) => tx.status === "matched").length;
    const reviewCount = transactions.filter((tx) => tx.status === "review_required").length;
    const unmatchedCount = transactions.filter((tx) => tx.status === "unmatched").length;

    const totalInflowAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
    const matchedInflowAmount = transactions
      .filter((tx) => tx.status === "matched")
      .reduce((sum, tx) => sum + tx.amount, 0);

    const autoMatchRate =
      totalTransactions > 0
        ? ((matchedCount + reviewCount * 0.8) / totalTransactions) * 100
        : 89.4;

    return {
      totalTransactions,
      matchedCount,
      reviewCount,
      unmatchedCount,
      totalInflowAmount,
      matchedInflowAmount,
      autoMatchRate: Number(autoMatchRate.toFixed(1)),
    };
  }, [transactions]);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        searchQuery === "" ||
        tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.suggestedMatch &&
          (tx.suggestedMatch.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tx.suggestedMatch.number.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (tx.matchedEntityName &&
          tx.matchedEntityName.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === "matched") matchesStatus = tx.status === "matched";
      else if (statusFilter === "review_required") matchesStatus = tx.status === "review_required";
      else if (statusFilter === "unmatched") matchesStatus = tx.status === "unmatched";

      return matchesSearch && matchesStatus;
    });
  }, [transactions, searchQuery, statusFilter]);

  // Handler for Confirming a Match (Automates Open Balance Recomputation & Auto-Close)
  const handleConfirmMatch = (txId: string) => {
    const targetTx = transactions.find((tx) => tx.id === txId);
    if (!targetTx || !targetTx.suggestedMatch) return;

    const matchedDoc = targetTx.suggestedMatch;
    const targetInvoice = invoicesState.find((inv) => inv.id === matchedDoc.id);

    if (targetInvoice) {
      const result = applyBankTransaction(targetTx, targetInvoice);

      // 1. Update Invoices State with newly calculated balance & status
      setInvoicesState((prev) =>
        prev.map((inv) => (inv.id === targetInvoice.id ? result.updatedInvoice : inv))
      );

      // 2. Mark Transaction as Matched
      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.id === txId) {
            return {
              ...tx,
              status: "matched",
              matchType: result.matchType,
              matchedEntityName: matchedDoc.entityName,
              matchedDocumentType: "invoice",
              matchedDocumentId: matchedDoc.id,
              matchedDocumentNumber: matchedDoc.number,
              matchConfidence: 100,
              reconciliationNotes: `Confirmed: ${matchedDoc.matchReason}`,
              suggestedMatch: undefined,
            };
          }
          return tx;
        })
      );

      showToast(result.toastMessage);
      return;
    }

    showToast(`Inflow matched and posted against ${matchedDoc.number}.`);
  };

  const handleRejectMatch = (txId: string) => {
    setTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          return {
            ...tx,
            status: "unmatched",
            suggestedMatch: undefined,
            reconciliationNotes: "Suggested match dismissed by user.",
          };
        }
        return tx;
      })
    );
    showToast("Suggested match dismissed. Inflow moved to manual allocation queue.");
  };

  // Handler for Manual Match Picker
  const handleManualMatchSelect = (docId: string, docNumber: string, entityName: string) => {
    if (!manualMatchModalTx) return;

    const targetInvoice = invoicesState.find((inv) => inv.id === docId);
    if (targetInvoice) {
      const result = applyBankTransaction(manualMatchModalTx, targetInvoice);
      setInvoicesState((prev) =>
        prev.map((inv) => (inv.id === targetInvoice.id ? result.updatedInvoice : inv))
      );

      setTransactions((prev) =>
        prev.map((tx) => {
          if (tx.id === manualMatchModalTx.id) {
            return {
              ...tx,
              status: "matched",
              matchType: result.matchType,
              matchedEntityName: entityName,
              matchedDocumentType: "invoice",
              matchedDocumentId: docId,
              matchedDocumentNumber: docNumber,
              matchConfidence: 100,
              reconciliationNotes: `Manually matched: ${result.explanation}`,
              suggestedMatch: undefined,
            };
          }
          return tx;
        })
      );

      setManualMatchModalTx(null);
      showToast(result.toastMessage);
    }
  };

  // Match Type Tag Helper
  const renderMatchTypeBadge = (matchType?: ReconMatchType) => {
    switch (matchType) {
      case "exact":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 border border-green-300">
            Exact Match (100%)
          </span>
        );
      case "adjusted":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Scissors className="w-2.5 h-2.5" />
            <span>Net of CN/TDS</span>
          </span>
        );
      case "partial":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            Partial Advance
          </span>
        );
      case "manual":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            Manual Match
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Financial Knowledge Concept Modal */}
      <FinancialConceptModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-white px-4 py-3 rounded-lg shadow-elevated border border-brand/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md text-xs">
          <div className="w-6 h-6 rounded-full bg-financial-positive flex items-center justify-center text-white shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <p className="font-medium text-slate-100">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Inflow Reconciliation & Payment Matching"
        description="Autonomous matching of customer bank deposits (NEFT, RTGS, UPI) against sales invoices with full support for exact settlements, credit note adjustments, buyer TDS withholding, and partial advance payments."
        badge={<StatusBadge variant="positive" label="HDFC Bank Live Feed" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("bank_reconciliation")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn UTR Matching
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("partial_payments")}
          >
            <PieChart className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn Partial Settlements
          </Button>
          <Button variant="default" size="sm" className="text-xs">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Sync HDFC Feed
          </Button>
        </div>
      </PageHeader>

      {/* Explainer Banner on Bank Reconciliation */}
      <ConceptExplainerBanner
        conceptId="bank_reconciliation"
        onOpenFullModal={(id) => setSelectedConceptId(id)}
      />

      {/* Reconciliation KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Autonomous Inflow Match Rate
          </span>
          <div className="text-2xl font-bold text-financial-positive tabular-nums mt-1 flex items-baseline gap-2">
            <span>{metrics.autoMatchRate}%</span>
            <span className="text-xs font-medium text-neutral-400">of total inflows</span>
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            40h labor reduced to &lt;4h monthly close
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Pending Suggested Matches
          </span>
          <div className="text-2xl font-bold text-amber-600 tabular-nums mt-1">
            {metrics.reviewCount} Remittances
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Exact, partial & adjusted matches ready for 1-click confirmation
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Unmatched Inflow Deposits
          </span>
          <div className="text-2xl font-bold text-brand tabular-nums mt-1">
            {metrics.unmatchedCount} Deposits
          </div>
          <span className="text-[11px] text-neutral-400 mt-1 block">
            Require manual customer invoice allocation
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Customer Inflows Reconciled
          </span>
          <div className="text-2xl font-bold text-brand tabular-nums mt-1">
            {formatCurrency(metrics.matchedInflowAmount)}
          </div>
          <span className="text-[11px] text-financial-positive font-semibold mt-1 block">
            Directly posted to General Ledger
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search remittance, UTR, customer, invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "All Inflows", value: "all" },
            { label: "Needs Confirmation", value: "review_required" },
            { label: "Auto-Closed / Matched", value: "matched" },
            { label: "Unmatched", value: "unmatched" },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === tab.value
                  ? "bg-brand text-white shadow-xs"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                  Date & UTR Reference
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                  Bank Narration & Customer
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  Inflow Amount
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                  Matched Customer Invoice & Classification
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-center">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  Reconciliation Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No customer bank remittances found matching filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isReview = tx.status === "review_required";
                  const isMatched = tx.status === "matched";
                  const isUnmatched = tx.status === "unmatched";
                  const match = tx.suggestedMatch;

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isReview ? "bg-amber-50/20" : isMatched ? "bg-green-50/10" : ""
                      }`}
                    >
                      {/* Date & UTR Reference */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-neutral-900">{tx.date}</div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          UTR: {tx.referenceNumber}
                        </div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-mono bg-neutral-100 text-neutral-600">
                          {tx.mode}
                        </span>
                      </td>

                      {/* Bank Narration */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-neutral-900 truncate">
                          {tx.description}
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5">
                          HDFC Current A/c #0194
                        </div>
                      </td>

                      {/* Inflow Amount */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap font-bold text-financial-positive">
                        +{formatCurrency(tx.amount)}
                      </td>

                      {/* Matched Customer Invoice & Classification */}
                      <td className="py-3 px-4">
                        {isReview && match && (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900">
                                {match.entityName}
                              </span>
                              {renderMatchTypeBadge(match.matchType)}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              Invoice: <strong className="text-brand">{match.number}</strong>
                            </div>
                            <p className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                              {match.matchReason}
                            </p>
                            {match.projectedRemainingBalance !== undefined && (
                              <div className="text-[10px] text-neutral-500">
                                Remaining Open Balance after allocation:{" "}
                                <strong
                                  className={
                                    match.projectedRemainingBalance === 0
                                      ? "text-financial-positive"
                                      : "text-amber-700"
                                  }
                                >
                                  {formatCurrency(match.projectedRemainingBalance)}
                                  {match.projectedRemainingBalance === 0 ? " (Will Auto-Close)" : " (Partially Paid)"}
                                </strong>
                              </div>
                            )}
                          </div>
                        )}

                        {isMatched && (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-900">
                                {tx.matchedEntityName}
                              </span>
                              {renderMatchTypeBadge(tx.matchType)}
                            </div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              Settled against <strong className="text-brand">{tx.matchedDocumentNumber}</strong>
                            </div>
                            {tx.reconciliationNotes && (
                              <p className="text-[10px] text-neutral-400 italic">
                                {tx.reconciliationNotes}
                              </p>
                            )}
                          </div>
                        )}

                        {isUnmatched && (
                          <span className="text-neutral-400 italic text-[11px]">
                            No matching customer invoice found. Allocate manually.
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <StatusBadge
                          variant={isMatched ? "positive" : isReview ? "warning" : "neutral"}
                          label={isMatched ? "Matched" : isReview ? "Action Needed" : "Unmatched"}
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {isReview && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleConfirmMatch(tx.id)}
                              className="h-7 px-2.5 text-[11px] bg-financial-positive hover:bg-financial-positive/90 text-white shadow-xs"
                              title="Confirm match, allocate inflow, and recompute open balance"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              <span>Confirm (✓)</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleRejectMatch(tx.id)}
                              className="h-7 px-2 text-[11px] text-neutral-500 hover:text-financial-destructive"
                              title="Reject suggested match"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}

                        {isUnmatched && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setManualMatchModalTx(tx)}
                            className="h-7 px-2.5 text-[11px] border-neutral-300 hover:border-brand text-brand"
                          >
                            <LinkIcon className="w-3 h-3 mr-1" />
                            Match to Invoice
                          </Button>
                        )}

                        {isMatched && (
                          <span className="text-[11px] text-financial-positive font-mono font-medium flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reconciled ✓</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Match Picker Modal (Invoices only) */}
      {manualMatchModalTx && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-elevated max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-brand flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-brand" />
                  Manual Invoice Allocation & Auto-Close
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Select candidate sales invoice to allocate remittance and update running open balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManualMatchModalTx(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Transaction Summary Card */}
            <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-neutral-500">Bank Narration:</span>
                <span className="font-semibold text-neutral-900 font-mono">{manualMatchModalTx.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">UTR / Reference:</span>
                <span className="font-mono text-neutral-700">{manualMatchModalTx.referenceNumber}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-neutral-200">
                <span className="text-neutral-500">Inflow Deposit:</span>
                <span className="font-bold text-financial-positive tabular-nums">
                  +{formatCurrency(manualMatchModalTx.amount)}
                </span>
              </div>
            </div>

            {/* Search Input for Open Invoices */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search open invoices by customer name, invoice #..."
                value={manualPickerSearch}
                onChange={(e) => setManualPickerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* List of Open Invoices */}
            <div className="max-h-64 overflow-y-auto space-y-2 border border-neutral-200 rounded-lg p-2 divide-y divide-neutral-100 text-xs">
              <div className="px-2 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                Candidate Open Sales Invoices (Accounts Receivable)
              </div>

              {invoicesState
                .filter(
                  (inv) =>
                    inv.openBalance > 0 &&
                    (manualPickerSearch === "" ||
                      inv.invoiceNumber.toLowerCase().includes(manualPickerSearch.toLowerCase()) ||
                      inv.customerName.toLowerCase().includes(manualPickerSearch.toLowerCase()))
                )
                .map((inv) => {
                  const matchInfo = getMatchClassification(manualMatchModalTx.amount, inv);

                  return (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-md hover:bg-neutral-50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <span>{inv.customerName}</span>
                          {renderMatchTypeBadge(matchInfo.matchType)}
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {inv.invoiceNumber} • Gross: {formatCurrency(inv.grandTotal)} • Due: {inv.dueDate}
                        </div>
                        {(inv.totalCreditNotes || 0) > 0 && (
                          <div className="text-[10px] text-amber-800 flex items-center gap-1 mt-0.5">
                            <Scissors className="w-2.5 h-2.5" />
                            <span>Includes -{formatCurrency(inv.totalCreditNotes || 0)} Credit Note</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right tabular-nums">
                          <div className="font-bold text-brand">{formatCurrency(inv.openBalance)}</div>
                          <span className="text-[10px] text-neutral-400">Open Balance</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleManualMatchSelect(inv.id, inv.invoiceNumber, inv.customerName)
                          }
                          className="text-xs h-7 px-2.5"
                        >
                          Allocate & Settle
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setManualMatchModalTx(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
