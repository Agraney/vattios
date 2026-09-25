"use client";

import React, { useState, useMemo } from "react";
import {
  mockInvoices,
  Invoice,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { computeInvoiceBalances } from "@/lib/payment-engine";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, StatusVariant } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { FinancialConceptModal } from "@/components/shared/financial-concept-modal";
import { ConceptExplainerBanner } from "@/components/shared/concept-explainer-banner";
import {
  Search,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  X,
  Download,
  Scissors,
  BookOpen,
  Landmark,
  BadgePercent,
} from "lucide-react";

export default function ARAPPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoiceForRecon, setSelectedInvoiceForRecon] = useState<Invoice | null>(null);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<{
    show: boolean;
    invoiceNo: string;
    customer: string;
    amount: number;
    adjustmentsNote?: string;
  } | null>(null);

  const refDate = new Date("2026-08-25").getTime();

  // Helper to compute aging bucket
  const getAgingBucket = (inv: Invoice) => {
    const invDate = new Date(inv.date).getTime();
    const diffDays = Math.floor((refDate - invDate) / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) return { label: "0–30 Days", variant: "neutral" as StatusVariant, days: diffDays };
    if (diffDays <= 60) return { label: "31–60 Days", variant: "warning" as StatusVariant, days: diffDays };
    if (diffDays <= 90) return { label: "61–90 Days", variant: "destructive" as StatusVariant, days: diffDays };
    return { label: "90+ Days", variant: "destructive" as StatusVariant, days: diffDays };
  };

  // Receivables Data & Summaries (Strictly using genuine openBalance)
  const invoicesList = useMemo(() => {
    return mockInvoices.map((inv) => computeInvoiceBalances(inv));
  }, []);

  const receivablesSummary = useMemo(() => {
    const totalGross = invoicesList.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalCreditNotes = invoicesList.reduce((sum, inv) => sum + (inv.totalCreditNotes || 0), 0);
    const totalTds = invoicesList.reduce((sum, inv) => sum + (inv.totalTdsDeducted || 0), 0);
    const totalPaid = invoicesList.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
    const totalOpenBalance = invoicesList.reduce((sum, inv) => sum + inv.openBalance, 0);

    const overdueOpenAmount = invoicesList
      .filter((inv) => inv.status === "Overdue" || inv.status === "overdue")
      .reduce((sum, inv) => sum + inv.openBalance, 0);

    const avgDso = 38; // Days Sales Outstanding
    const totalInvoices = invoicesList.length;
    const unpaidCount = invoicesList.filter((inv) => inv.openBalance > 0).length;

    return {
      totalGross,
      totalCreditNotes,
      totalTds,
      totalPaid,
      totalOpenBalance,
      overdueOpenAmount,
      avgDso,
      totalInvoices,
      unpaidCount,
    };
  }, [invoicesList]);

  const filteredInvoices = useMemo(() => {
    return invoicesList.filter((inv) => {
      const matchesSearch =
        searchQuery === "" ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customerGstin && inv.customerGstin.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === "Closed") {
        matchesStatus = inv.openBalance === 0;
      } else if (statusFilter === "Partially Paid") {
        matchesStatus = inv.status === "Partially Paid" || inv.status === "partially_paid";
      } else if (statusFilter === "Overdue") {
        matchesStatus = inv.status === "Overdue" || inv.status === "overdue";
      } else if (statusFilter === "Sent") {
        matchesStatus = inv.status === "Sent" || inv.status === "sent" || inv.status === "pending";
      }

      return matchesSearch && matchesStatus;
    });
  }, [invoicesList, searchQuery, statusFilter]);

  // Handler for Reminder (Targets Real Open Balance Only)
  const handleSendReminder = (inv: Invoice) => {
    const adjNote =
      (inv.totalCreditNotes || 0) > 0 || (inv.totalTdsDeducted || 0) > 0
        ? `Net of ${formatCurrency((inv.totalCreditNotes || 0) + (inv.totalTdsDeducted || 0))} adjustments (CN & TDS)`
        : undefined;

    setReminderToast({
      show: true,
      invoiceNo: inv.invoiceNumber,
      customer: inv.customerName,
      amount: inv.openBalance,
      adjustmentsNote: adjNote,
    });
    setTimeout(() => {
      setReminderToast(null);
    }, 4500);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Concept Knowledge Modal */}
      <FinancialConceptModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
      />

      {/* Toast Notification for Send Reminder */}
      {reminderToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-white px-4 py-3 rounded-lg shadow-elevated border border-brand/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200 max-w-md">
          <div className="w-6 h-6 rounded-full bg-financial-positive flex items-center justify-center text-white shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-white">Smart WhatsApp & Email Reminder Queued</p>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Automated notice dispatched to <strong>{reminderToast.customer}</strong> for genuine open balance of{" "}
              <strong className="text-white">{formatCurrency(reminderToast.amount)}</strong>.
              {reminderToast.adjustmentsNote && (
                <span className="block text-amber-300 text-[10px] mt-0.5">
                  ({reminderToast.adjustmentsNote})
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReminderToast(null)}
            className="text-slate-400 hover:text-white ml-auto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Accounts Receivable & Collections"
        description="Customer credit ledger operations with real-time aging schedules, automated credit note offsets, buyer TDS tracking (Sec 194Q), and 1-click WhatsApp payment reminders."
        badge={<StatusBadge variant="positive" label="AR Ledger Active" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("ar_aging_dso")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn DSO & Aging Rules
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("buyer_tds_194q")}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn Sec 194Q TDS
          </Button>
          <Button variant="default" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5 text-white" />
            Export Aging Schedule
          </Button>
        </div>
      </PageHeader>

      {/* Explainer Banner */}
      <ConceptExplainerBanner
        conceptId="ar_aging_dso"
        onOpenFullModal={(id) => setSelectedConceptId(id)}
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-card">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
            Gross Billed
          </span>
          <span className="text-lg font-bold text-neutral-900 tabular-nums mt-1 block">
            {formatCurrency(receivablesSummary.totalGross)}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            {receivablesSummary.totalInvoices} sales invoices
          </span>
        </div>

        <div className="bg-amber-50/50 p-3.5 rounded-lg border border-amber-200/80 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
              Credit Notes
            </span>
            <button
              type="button"
              onClick={() => setSelectedConceptId("credit_notes")}
              className="text-amber-700 hover:text-amber-900"
              title="Learn how Credit Notes legally adjust receivables"
            >
              <BookOpen className="w-3 h-3" />
            </button>
          </div>
          <span className="text-lg font-bold text-amber-900 tabular-nums mt-1 block">
            -{formatCurrency(receivablesSummary.totalCreditNotes)}
          </span>
          <span className="text-[10px] text-amber-700 mt-0.5 block">
            Price revisions & allowances
          </span>
        </div>

        <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-neutral-600 tracking-wider block">
              Buyer TDS (194Q)
            </span>
            <button
              type="button"
              onClick={() => setSelectedConceptId("buyer_tds_194q")}
              className="text-neutral-500 hover:text-brand"
              title="Learn how 0.1% Buyer TDS works"
            >
              <ShieldCheck className="w-3 h-3" />
            </button>
          </div>
          <span className="text-lg font-bold text-neutral-800 tabular-nums mt-1 block">
            -{formatCurrency(receivablesSummary.totalTds)}
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5 block">
            Credited in Form 26AS
          </span>
        </div>

        <div className="bg-financial-positive-bg/40 p-3.5 rounded-lg border border-financial-positive-border shadow-card">
          <span className="text-[10px] uppercase font-bold text-financial-positive-text tracking-wider block">
            Paid & Settled
          </span>
          <span className="text-lg font-bold text-financial-positive tabular-nums mt-1 block">
            {formatCurrency(receivablesSummary.totalPaid)}
          </span>
          <span className="text-[10px] text-financial-positive-text/70 mt-0.5 block">
            Bank UTR verified
          </span>
        </div>

        <div className="bg-brand-subtle p-3.5 rounded-lg border border-neutral-300 shadow-card">
          <span className="text-[10px] uppercase font-bold text-brand tracking-wider block">
            Genuine Open AR
          </span>
          <span className="text-lg font-bold text-brand tabular-nums mt-1 block">
            {formatCurrency(receivablesSummary.totalOpenBalance)}
          </span>
          <span className="text-[10px] text-financial-destructive font-semibold mt-0.5 block">
            {formatCurrency(receivablesSummary.overdueOpenAmount)} overdue
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-neutral-200 shadow-card">
          <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
            Collection Velocity
          </span>
          <span className="text-lg font-bold text-brand tabular-nums mt-1 block">
            {receivablesSummary.avgDso} Days
          </span>
          <span className="text-[10px] text-financial-positive font-semibold mt-0.5 block">
            14 days faster than peer benchmark
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search customer, GSTIN, invoice #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "All Receivables", value: "all", count: invoicesList.length },
            { label: "Partially Paid", value: "Partially Paid", count: invoicesList.filter((i) => i.status === "Partially Paid").length },
            { label: "Overdue", value: "Overdue", count: invoicesList.filter((i) => i.status === "Overdue" || i.status === "overdue").length },
            { label: "Closed / Settled", value: "Closed", count: invoicesList.filter((i) => i.openBalance === 0).length },
            { label: "Sent / Pending", value: "Sent", count: invoicesList.filter((i) => i.status === "Sent" || i.status === "sent").length },
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
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Receivables Aging Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                  Invoice & Customer
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                  Aging Schedule
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  Gross Billed
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  Adjustments (CN / TDS)
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  Cash Inflow Settled
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  Genuine Open Balance
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-center">
                  Status
                </th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-center">
                  Collection Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No customer receivables match the applied filter.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const aging = getAgingBucket(inv);
                  const isClosed = inv.openBalance === 0;
                  const isOverdue = inv.status === "Overdue" || inv.status === "overdue";
                  const isPartiallyPaid = inv.status === "Partially Paid" || inv.status === "partially_paid";
                  const hasCN = (inv.totalCreditNotes || 0) > 0;
                  const hasTDS = (inv.totalTdsDeducted || 0) > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Customer & Invoice */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-brand">{inv.invoiceNumber}</div>
                        <div className="font-medium text-neutral-900 truncate max-w-xs mt-0.5">
                          {inv.customerName}
                        </div>
                        {inv.customerName === "ABC Metals" && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-brand bg-brand-subtle px-1.5 py-0.5 rounded border border-blue-200">
                              <BadgePercent className="w-2.5 h-2.5" />
                              <span>Active TOD Scheme (78.5% Fulfilled)</span>
                            </span>
                          </div>
                        )}
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          GSTIN: {inv.customerGstin || "Unregistered"} • Issued: {inv.date}
                        </div>
                      </td>

                      {/* Aging Schedule */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isClosed ? (
                          <span className="text-[11px] text-financial-positive font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Fully Settled
                          </span>
                        ) : (
                          <div>
                            <StatusBadge variant={aging.variant} label={aging.label} size="sm" />
                            <div className="text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-neutral-400" />
                              <span>Due: {inv.dueDate}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Gross Billed */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap text-neutral-900 font-medium">
                        {formatCurrency(inv.grandTotal)}
                      </td>

                      {/* Adjustments (CN / TDS) */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        {hasCN || hasTDS ? (
                          <div className="space-y-0.5">
                            {hasCN && (
                              <div className="text-amber-800 text-[10px] font-semibold flex items-center justify-end gap-1">
                                <Scissors className="w-2.5 h-2.5" />
                                <span>-CN: {formatCurrency(inv.totalCreditNotes || 0)}</span>
                              </div>
                            )}
                            {hasTDS && (
                              <div className="text-neutral-500 text-[10px] font-medium flex items-center justify-end gap-1">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                <span>-TDS: {formatCurrency(inv.totalTdsDeducted || 0)}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Cash Inflow Settled */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap text-financial-positive font-medium">
                        {(inv.totalPaid || 0) > 0 ? (
                          formatCurrency(inv.totalPaid || 0)
                        ) : (
                          <span className="text-neutral-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Genuine Open Balance */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        {isClosed ? (
                          <span className="font-bold text-financial-positive">₹0.00</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              isOverdue ? "text-financial-destructive" : isPartiallyPaid ? "text-amber-600" : "text-brand"
                            }`}
                          >
                            {formatCurrency(inv.openBalance)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <StatusBadge
                          variant={
                            isClosed
                              ? "positive"
                              : isOverdue
                              ? "destructive"
                              : isPartiallyPaid
                              ? "warning"
                              : "neutral"
                          }
                          label={isClosed ? "Closed" : isOverdue ? "Overdue" : isPartiallyPaid ? "Partially Paid" : "Sent"}
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isClosed ? (
                            <button
                              type="button"
                              onClick={() => handleSendReminder(inv)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-brand text-white hover:bg-brand-hover rounded transition-colors shadow-2xs"
                              title="Send instant WhatsApp & Email reminder referencing genuine open balance"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send Reminder</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceForRecon(inv)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded transition-colors"
                              title="View bank settlement UTR match"
                            >
                              <CheckCircle2 className="w-3 h-3 text-financial-positive" />
                              <span>View Match</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Match Details Modal */}
      {selectedInvoiceForRecon && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-elevated max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-financial-positive" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Bank Settlement Verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoiceForRecon(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-neutral-50 p-3 rounded-md space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Invoice Number:</span>
                  <span className="font-semibold text-brand">{selectedInvoiceForRecon.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-semibold text-neutral-900">{selectedInvoiceForRecon.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Original Gross Billed:</span>
                  <span className="font-medium text-neutral-900">{formatCurrency(selectedInvoiceForRecon.grandTotal)}</span>
                </div>
                {(selectedInvoiceForRecon.totalCreditNotes || 0) > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span>Credit Note Deductions:</span>
                    <span>-{formatCurrency(selectedInvoiceForRecon.totalCreditNotes || 0)}</span>
                  </div>
                )}
                {(selectedInvoiceForRecon.totalTdsDeducted || 0) > 0 && (
                  <div className="flex justify-between text-neutral-600">
                    <span>Buyer TDS (194Q @ 0.1%):</span>
                    <span>-{formatCurrency(selectedInvoiceForRecon.totalTdsDeducted || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-neutral-200 pt-1 font-bold">
                  <span>Net Settlement Inflow:</span>
                  <span className="text-financial-positive">{formatCurrency(selectedInvoiceForRecon.totalPaid)}</span>
                </div>
                <div className="flex justify-between font-bold text-financial-positive">
                  <span>Remaining Open Balance:</span>
                  <span>₹0.00 (Closed)</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/50 rounded-md border border-blue-100 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900 text-[11px]">
                  <Landmark className="w-3.5 h-3.5" />
                  <span>Settled via HDFC Current A/c #0194</span>
                </div>
                <p className="text-[11px] text-blue-700">
                  Bank Reference UTR: <strong className="font-mono">{selectedInvoiceForRecon.paymentAllocations?.[0]?.bankReferenceNumber || "CMS8492019482"}</strong>
                </p>
                <p className="text-[10px] text-blue-600">
                  Autonomous Double-Entry Posting: Dr. HDFC Bank A/c | Cr. Accounts Receivable
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setSelectedInvoiceForRecon(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
