"use client";

import React, { useState, useMemo } from "react";
import { mockInvoices, Invoice } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { getInvoicePaymentLedger, computeInvoiceBalances } from "@/lib/payment-engine";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, StatusVariant } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { FinancialConceptModal } from "@/components/shared/financial-concept-modal";
import { ConceptExplainerBanner } from "@/components/shared/concept-explainer-banner";
import {
  FileText,
  Search,
  Plus,
  Download,
  CheckCircle2,
  Eye,
  X,
  Receipt,
  Scissors,
  Landmark,
  ShieldCheck,
  Clock,
  BookOpen,
  BadgePercent,
} from "lucide-react";

export default function InvoicingPage() {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  const [invoices] = useState<Invoice[]>(() =>
    mockInvoices.map((inv) => computeInvoiceBalances(inv))
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Summary Metrics computed from dynamic running balances
  const summary = useMemo(() => {
    const totalInvoices = invoices.length;
    const totalBilled = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalCreditNotes = invoices.reduce((sum, i) => sum + (i.totalCreditNotes || 0), 0);
    const totalTds = invoices.reduce((sum, i) => sum + (i.totalTdsDeducted || 0), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + (i.totalPaid || 0), 0);
    const totalOpenBalance = invoices.reduce((sum, i) => sum + i.openBalance, 0);

    const closedCount = invoices.filter((i) => i.status === "Closed" || i.status === "closed" || i.status === "paid").length;
    const partiallyPaidCount = invoices.filter((i) => i.status === "Partially Paid" || i.status === "partially_paid").length;
    const overdueCount = invoices.filter((i) => i.status === "Overdue" || i.status === "overdue").length;
    const sentCount = invoices.filter((i) => i.status === "Sent" || i.status === "sent" || i.status === "pending").length;

    return {
      totalInvoices,
      totalBilled,
      totalCreditNotes,
      totalTds,
      totalPaid,
      totalOpenBalance,
      closedCount,
      partiallyPaidCount,
      overdueCount,
      sentCount,
    };
  }, [invoices]);

  // Filtered List
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        searchQuery === "" ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.customerGstin && inv.customerGstin.toLowerCase().includes(searchQuery.toLowerCase())) ||
        inv.items.some((item) => item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesStatus = true;
      if (statusFilter === "Closed") {
        matchesStatus = inv.status === "Closed" || inv.status === "closed" || inv.status === "paid";
      } else if (statusFilter === "Partially Paid") {
        matchesStatus = inv.status === "Partially Paid" || inv.status === "partially_paid";
      } else if (statusFilter === "Overdue") {
        matchesStatus = inv.status === "Overdue" || inv.status === "overdue";
      } else if (statusFilter === "Sent") {
        matchesStatus = inv.status === "Sent" || inv.status === "sent" || inv.status === "pending";
      } else if (statusFilter === "Draft") {
        matchesStatus = inv.status === "Draft" || inv.status === "draft";
      }

      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper for Status Badge Variant
  const getStatusBadgeVariant = (status: string): StatusVariant => {
    switch (status) {
      case "Closed":
      case "closed":
      case "paid":
        return "positive";
      case "Partially Paid":
      case "partially_paid":
        return "warning";
      case "Overdue":
      case "overdue":
        return "destructive";
      case "Sent":
      case "sent":
      case "pending":
        return "neutral";
      default:
        return "neutral";
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Concept Knowledge Modal */}
      <FinancialConceptModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
      />

      {/* Floating Action Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand text-white px-4 py-3 rounded-lg shadow-elevated border border-brand/40 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 duration-200 text-xs">
          <CheckCircle2 className="w-4 h-4 text-financial-positive shrink-0" />
          <p className="font-medium text-slate-100">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Invoicing & Revenue Operations"
        description="Statutory GST tax invoicing (Rule 46), automated HSN tax determination, Credit Note adjustments (Sec 34), buyer TDS tracking, and autonomous running payment ledgers."
        badge={<StatusBadge variant="positive" label="GSTN Validated" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("gst_mechanics")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn GST Invoicing
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("credit_notes")}
          >
            <Scissors className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
            Learn Credit Notes
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => showToast("New e-Invoice draft initialized with HSN auto-lookup.")}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Create e-Invoice
          </Button>
        </div>
      </PageHeader>

      {/* Concept Explainer Banner on Credit Notes */}
      <ConceptExplainerBanner
        conceptId="credit_notes"
        onOpenFullModal={(id) => setSelectedConceptId(id)}
      />

      {/* Top StatCards (Clear Distinguishable Breakdown) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Gross Billed */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Gross Billed (YTD)
          </span>
          <div className="text-2xl font-bold text-brand tabular-nums mt-1">
            {formatCurrency(summary.totalBilled)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            {summary.totalInvoices} sales invoices generated
          </span>
        </div>

        {/* Card 2: Adjustments Tracked (Credit Notes & TDS) */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
              Adjustments Tracked
            </span>
            <button
              type="button"
              onClick={() => setSelectedConceptId("credit_notes")}
              className="text-neutral-400 hover:text-brand"
              title="Learn about statutory adjustments"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-2xl font-bold text-neutral-800 tabular-nums mt-1">
            -{formatCurrency(summary.totalCreditNotes + summary.totalTds)}
          </div>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            CN: {formatCurrency(summary.totalCreditNotes)} • TDS: {formatCurrency(summary.totalTds)}
          </span>
        </div>

        {/* Card 3: Auto-Closed Invoices */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Auto-Closed Invoices
          </span>
          <div className="text-2xl font-bold text-financial-positive tabular-nums mt-1">
            {summary.closedCount} Invoices
          </div>
          <span className="text-[11px] text-financial-positive font-medium mt-1 block">
            ₹0 open balance achieved
          </span>
        </div>

        {/* Card 4: Genuine Open Balance */}
        <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            Genuine Open Receivables
          </span>
          <div className="text-2xl font-bold text-brand tabular-nums mt-1">
            {formatCurrency(summary.totalOpenBalance)}
          </div>
          <span className="text-[11px] text-financial-destructive font-medium mt-1 block">
            {summary.partiallyPaidCount} partially paid • {summary.overdueCount} overdue
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-card">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by invoice #, customer name, HSN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { label: "All Invoices", value: "all", count: invoices.length },
            { label: "Partially Paid", value: "Partially Paid", count: summary.partiallyPaidCount },
            { label: "Overdue", value: "Overdue", count: summary.overdueCount },
            { label: "Closed", value: "Closed", count: summary.closedCount },
            { label: "Sent", value: "Sent", count: summary.sentCount },
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

      {/* Invoices Table */}
      <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">Invoice & Date</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">Customer & HSN</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">Gross Total</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">Adjustments</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">Paid & Settled</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">Open Balance</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-center">Status</th>
                <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No sales invoices found matching filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const hasCN = (inv.totalCreditNotes || 0) > 0;
                  const hasTDS = (inv.totalTdsDeducted || 0) > 0;
                  const isClosed = inv.openBalance === 0;

                  return (
                    <tr key={inv.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Invoice & Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-brand">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-neutral-400 font-mono">{inv.date}</div>
                      </td>

                      {/* Customer & HSN */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 truncate max-w-xs">
                          {inv.customerName}
                        </div>
                        {inv.customerName === "ABC Metals" && (
                          <div className="mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-brand bg-brand-subtle px-1.5 py-0.5 rounded border border-blue-200">
                              <BadgePercent className="w-2.5 h-2.5" />
                              <span>TOD Volume Scheme (₹10/MT)</span>
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                          <span className="font-mono bg-neutral-100 px-1 rounded">
                            HSN {inv.items[0]?.hsnCode || "5208"}
                          </span>
                          <span>•</span>
                          <span>Due: {inv.dueDate}</span>
                        </div>
                      </td>

                      {/* Gross Total */}
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

                      {/* Paid & Settled */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap text-financial-positive font-medium">
                        {(inv.totalPaid || 0) > 0 ? (
                          formatCurrency(inv.totalPaid || 0)
                        ) : (
                          <span className="text-neutral-300 font-mono">—</span>
                        )}
                      </td>

                      {/* Open Balance */}
                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap">
                        {isClosed ? (
                          <span className="font-bold text-financial-positive">₹0.00</span>
                        ) : (
                          <span
                            className={`font-bold ${
                              inv.status === "Overdue"
                                ? "text-financial-destructive"
                                : inv.status === "Partially Paid"
                                ? "text-amber-600"
                                : "text-brand"
                            }`}
                          >
                            {formatCurrency(inv.openBalance)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <StatusBadge
                          variant={getStatusBadgeVariant(inv.status)}
                          label={inv.status}
                          size="sm"
                        />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded transition-colors shadow-2xs"
                            title="Inspect payment & adjustment ledger"
                          >
                            <Eye className="w-3 h-3 text-neutral-500" />
                            <span>Inspect</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast(`Tax Invoice #${inv.invoiceNumber} downloaded.`)}
                            className="p-1 hover:bg-neutral-100 text-neutral-500 hover:text-brand rounded transition-colors"
                            title="Download Tax Invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
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

      {/* Invoice Detail Modal with PROMINENT PAYMENT & ADJUSTMENT LEDGER */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-elevated max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand" />
                  <h3 className="text-base font-bold text-brand">
                    Tax Invoice #{selectedInvoice.invoiceNumber}
                  </h3>
                  <StatusBadge
                    variant={getStatusBadgeVariant(selectedInvoice.status)}
                    label={selectedInvoice.status}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Issued: {selectedInvoice.date} • Due Date: {selectedInvoice.dueDate} • Customer: {selectedInvoice.customerName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Top 4-Block Balance Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                  Original Gross Total
                </span>
                <span className="text-base font-bold text-neutral-900 tabular-nums">
                  {formatCurrency(selectedInvoice.grandTotal)}
                </span>
              </div>

              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-200/80">
                <span className="text-[10px] text-amber-800 uppercase tracking-wider block font-semibold">
                  Credit Notes / Deductions
                </span>
                <span className="text-base font-bold text-amber-900 tabular-nums">
                  -{formatCurrency((selectedInvoice.totalCreditNotes || 0) + (selectedInvoice.totalTdsDeducted || 0))}
                </span>
              </div>

              <div className="bg-financial-positive-bg/40 p-3 rounded-lg border border-financial-positive-border">
                <span className="text-[10px] text-financial-positive-text uppercase tracking-wider block font-semibold">
                  Bank Payments Inflow
                </span>
                <span className="text-base font-bold text-financial-positive tabular-nums">
                  -{formatCurrency(selectedInvoice.totalPaid || 0)}
                </span>
              </div>

              <div
                className={`p-3 rounded-lg border ${
                  selectedInvoice.openBalance === 0
                    ? "bg-financial-positive-bg border-financial-positive-border"
                    : selectedInvoice.status === "Overdue"
                    ? "bg-red-50 border-red-200"
                    : "bg-brand-subtle border-neutral-300"
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider block font-semibold text-neutral-600">
                  Current Open Balance
                </span>
                <span
                  className={`text-base font-extrabold tabular-nums ${
                    selectedInvoice.openBalance === 0
                      ? "text-financial-positive"
                      : selectedInvoice.status === "Overdue"
                      ? "text-financial-destructive"
                      : "text-brand"
                  }`}
                >
                  {formatCurrency(selectedInvoice.openBalance)}
                </span>
              </div>
            </div>

            {/* Context Notice on Running Balance Ledger */}
            <div className="bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 text-[11px] text-neutral-600 flex items-center justify-between">
              <div>
                💡 <strong className="text-neutral-800">Autonomous Audit Trail: </strong>
                Running balance accounts for Credit Notes (Sec 34) and Buyer TDS (Sec 194Q) before computing open debt.
              </div>
              <button
                type="button"
                onClick={() => setSelectedConceptId("credit_notes")}
                className="text-brand font-semibold hover:underline shrink-0 ml-2"
              >
                Why Credit Notes?
              </button>
            </div>

            {/* SECTION: COMMERCIAL TOD SCHEME LINKAGE */}
            {selectedInvoice.customerName === "ABC Metals" && (
              <div className="p-3 bg-brand-subtle/50 border border-blue-200 rounded-lg text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-brand">
                    <BadgePercent className="w-4 h-4" />
                    <span>Commercial TOD Scheme: FY 2026-27 Volume Scheme</span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand text-white">
                    Rebate Rate: ₹10/MT
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 text-neutral-700">
                  <div>Invoice Billing Rate: <span className="font-semibold font-mono">₹70/MT</span></div>
                  <div>Commercial Net Rate: <span className="font-semibold font-mono text-brand">₹60/MT</span></div>
                  <div>Accrued TOD Rebate: <span className="font-semibold font-mono text-emerald-700">{formatCurrency((selectedInvoice.items[0]?.quantity || 1000) * 10)}</span></div>
                </div>
                <p className="text-[10px] text-neutral-500 pt-0.5">
                  The original tax invoice remains at ₹70/MT. Commercial TOD discount is settled via linked Credit Note upon target achievement.
                </p>
              </div>
            )}

            {/* SECTION: PROMINENT PAYMENT & ADJUSTMENT RUNNING LEDGER */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-brand" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand">
                    Payment & Adjustment Ledger (Running Balance)
                  </h4>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">
                  Autonomous Double-Entry Trail
                </span>
              </div>

              <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Event / Transaction Description</th>
                      <th className="py-2.5 px-3">Reference / Reason</th>
                      <th className="py-2.5 px-3 text-right">Debit (+)</th>
                      <th className="py-2.5 px-3 text-right">Credit (-)</th>
                      <th className="py-2.5 px-3 text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {getInvoicePaymentLedger(selectedInvoice).map((event) => {
                      const isInvoice = event.type === "INVOICE_RAISED";
                      const isCN = event.type === "CREDIT_NOTE";
                      const isTDS = event.type === "TDS_DEDUCTION";
                      const isPayment = event.type === "BANK_PAYMENT";

                      return (
                        <tr
                          key={event.id}
                          className={`hover:bg-neutral-50/70 transition-colors ${
                            isCN ? "bg-amber-50/30" : isPayment ? "bg-green-50/20" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-neutral-600 text-[11px]">
                            {event.date}
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                              {isInvoice && <FileText className="w-3.5 h-3.5 text-brand shrink-0" />}
                              {isCN && <Scissors className="w-3.5 h-3.5 text-amber-700 shrink-0" />}
                              {isTDS && <ShieldCheck className="w-3.5 h-3.5 text-neutral-600 shrink-0" />}
                              {isPayment && <Landmark className="w-3.5 h-3.5 text-financial-positive shrink-0" />}
                              <span>{event.title}</span>
                            </div>
                            {event.reason && (
                              <div className="text-[11px] text-neutral-500 mt-0.5 italic">
                                &quot;{event.reason}&quot;
                              </div>
                            )}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-600">
                            {event.referenceNumber}
                          </td>

                          <td className="py-2.5 px-3 text-right tabular-nums font-medium text-neutral-900">
                            {event.debitAmount > 0 ? formatCurrency(event.debitAmount) : "—"}
                          </td>

                          <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-financial-positive">
                            {event.creditAmount > 0 ? `-${formatCurrency(event.creditAmount)}` : "—"}
                          </td>

                          <td className="py-2.5 px-3 text-right tabular-nums font-bold text-brand">
                            {formatCurrency(event.runningBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Ledger Summary Footer */}
                  <tfoot className="bg-neutral-50 border-t-2 border-neutral-200">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 font-bold text-neutral-700 text-right">
                        Final Status & Open Balance:
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {selectedInvoice.openBalance === 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-financial-positive-bg text-financial-positive border border-financial-positive-border font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Balance: ₹0.00 — Closed automatically</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                            <Clock className="w-3.5 h-3.5 text-financial-warning" />
                            <span>Remaining: {formatCurrency(selectedInvoice.openBalance)}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Line Items Details */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 block">
                Invoice Goods & Services Line Items
              </span>
              <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                    <tr>
                      <th className="py-2 px-3">Description</th>
                      <th className="py-2 px-3">HSN</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Rate</th>
                      <th className="py-2 px-3 text-right">Taxable</th>
                      <th className="py-2 px-3 text-right">GST Rate</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {selectedInvoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-2 px-3 font-medium text-neutral-900">{item.description}</td>
                        <td className="py-2 px-3 font-mono text-neutral-500">{item.hsnCode}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{item.quantity} {item.unit}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-2 px-3 text-right tabular-nums font-medium">{formatCurrency(item.taxableAmount)}</td>
                        <td className="py-2 px-3 text-right tabular-nums">{item.gstRate}%</td>
                        <td className="py-2 px-3 text-right tabular-nums font-bold text-neutral-900">{formatCurrency(item.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
              <span className="text-neutral-400 font-mono text-[10px]">
                IRN: {selectedInvoice.irn || "IRN-PENDING-E-INVOICE-PORTAL-SYNC"}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => showToast(`Invoice #${selectedInvoice.invoiceNumber} PDF downloaded.`)}
                  className="text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Download PDF
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedInvoice(null)}
                  className="text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
