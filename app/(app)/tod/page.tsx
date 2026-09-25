"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, StatusVariant } from "@/components/shared/status-badge";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  TODScheme,
  TODCreditNote,
  TODQualifyingInvoice,
  Invoice,
} from "@/lib/types";
import {
  mockTODSchemes,
  mockTODCreditNotes,
  mockTODSettlementPeriods,
  mockTODAuditLogs,
  mockInvoices,
} from "@/lib/mock-data";
import {
  calculateSchemeProgress,
  generateTODCreditNoteDraft,
  approveAndPostTODCreditNote,
  getTODAnalytics,
} from "@/lib/tod-engine";
import { computeInvoiceBalances } from "@/lib/payment-engine";
import {
  Search,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  FileText,
  Building2,
  TrendingUp,
  Receipt,
  Eye,
  X,
  Play,
  RotateCcw,
  Check,
  PlusCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function TODManagementPage() {
  const [activeTab, setActiveTab] = useState<"schemes" | "simulator" | "report" | "analytics">("schemes");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>("tod-scheme-001");
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core State backed by live calculation engine
  const [schemes] = useState<TODScheme[]>(mockTODSchemes);
  const [creditNotes, setCreditNotes] = useState<TODCreditNote[]>(mockTODCreditNotes);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  // Credit Note Creation & Approval Modal State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [pendingDraftCN, setPendingDraftCN] = useState<TODCreditNote | null>(null);

  // =========================================================================
  // INTERACTIVE 20-STEP DEMO SIMULATOR STATE
  // =========================================================================
  const [simStep, setSimStep] = useState<number>(1);
  const [simExtraInvoiceAdded, setSimExtraInvoiceAdded] = useState(false);
  const [simApprovedCN, setSimApprovedCN] = useState<TODCreditNote | null>(null);

  // Calculate high-level analytics
  const analytics = useMemo(() => {
    return getTODAnalytics(schemes, invoices, creditNotes);
  }, [schemes, invoices, creditNotes]);

  // Selected scheme calculations
  const selectedSchemeData = useMemo(() => {
    if (!selectedSchemeId) return null;
    const s = schemes.find((sc) => sc.id === selectedSchemeId);
    if (!s) return null;
    return calculateSchemeProgress(s, invoices, creditNotes);
  }, [selectedSchemeId, schemes, invoices, creditNotes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Status badge variant mapper
  const getSchemeBadgeVariant = (status: TODScheme["status"]): StatusVariant => {
    switch (status) {
      case "active":
        return "brand";
      case "target_achieved":
        return "positive";
      case "settlement_pending":
        return "warning";
      case "settled":
        return "neutral";
      case "expired":
        return "destructive";
      case "cancelled":
        return "destructive";
      case "draft":
      default:
        return "neutral";
    }
  };

  const getSchemeStatusLabel = (status: TODScheme["status"]): string => {
    switch (status) {
      case "active":
        return "Active Progress";
      case "target_achieved":
        return "Target Achieved";
      case "settlement_pending":
        return "Settlement Pending";
      case "settled":
        return "Settled";
      case "expired":
        return "Expired";
      case "cancelled":
        return "Cancelled";
      case "draft":
        return "Draft";
      default:
        return status;
    }
  };

  // Filtered schemes list
  const filteredSchemes = useMemo(() => {
    return schemes.filter((s) => {
      const matchesSearch =
        s.schemeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.customerGstin && s.customerGstin.toLowerCase().includes(searchQuery.toLowerCase()));

      const progress = calculateSchemeProgress(s, invoices, creditNotes);
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = progress.computedStatus === "active";
      } else if (statusFilter === "target_achieved") {
        matchesStatus = progress.computedStatus === "target_achieved" || progress.computedStatus === "settlement_pending";
      } else if (statusFilter === "settled") {
        matchesStatus = progress.computedStatus === "settled";
      } else if (statusFilter === "expired") {
        matchesStatus = progress.computedStatus === "expired";
      }

      return matchesSearch && matchesStatus;
    });
  }, [schemes, invoices, creditNotes, searchQuery, statusFilter]);

  // Handler to generate draft credit note
  const handleInitiateCreditNote = (scheme: TODScheme, qualifyingInvoices: TODQualifyingInvoice[]) => {
    const draft = generateTODCreditNoteDraft(
      scheme,
      qualifyingInvoices,
      "Aditya Sharma (Commercial Head)"
    );
    setPendingDraftCN(draft);
    setApprovalModalOpen(true);
  };

  // Handler to approve and post credit note
  const handleApproveCreditNote = (draftCN: TODCreditNote) => {
    const result = approveAndPostTODCreditNote(
      draftCN,
      invoices,
      "Rajesh Verma (CFO)"
    );

    // Update state
    setInvoices(result.updatedInvoices);
    setCreditNotes((prev) => [
      ...prev.filter((c) => c.id !== draftCN.id),
      result.updatedCreditNote,
    ]);

    setApprovalModalOpen(false);
    setPendingDraftCN(null);
    showToast(`✓ Credit Note ${draftCN.creditNoteNumber} (₹${draftCN.grossTodAmount.toLocaleString("en-IN")}) approved and posted! Customer receivables updated.`);
  };

  // =========================================================================
  // SIMULATOR HANDLERS (20-Step Interactive Demo Flow)
  // =========================================================================
  const handleSimAddInvoice = () => {
    const newInvoice: Invoice = {
      id: "inv-abc-1150",
      invoiceNumber: "INV-1150",
      date: "2026-08-26",
      dueDate: "2026-09-25",
      type: "B2B",
      customerName: "ABC Metals",
      customerGstin: "27AAACA9921D1ZZ",
      customerState: "Maharashtra",
      customerStateCode: "27",
      placeOfSupply: "27-Maharashtra",
      isInterState: false,
      status: "Sent",
      items: [
        {
          id: "item-abc-5",
          description: "Hot Rolled Coils (HRC) - Grade IS 2062",
          hsnCode: "7208",
          quantity: 2300,
          unit: "MT",
          unitPrice: 70, // Original Billing Rate remains unchanged!
          gstRate: 18,
          taxableAmount: 161000,
          cgst: 14490,
          sgst: 14490,
          igst: 0,
          totalAmount: 189980,
        },
      ],
      subtotal: 161000,
      totalTax: 28980,
      cgstTotal: 14490,
      sgstTotal: 14490,
      igstTotal: 0,
      grandTotal: 189980,
      netPayable: 189980,
      totalPaid: 0,
      totalTdsDeducted: 0,
      totalCreditNotes: 0,
      totalDebitNotes: 0,
      openBalance: 189980,
      amountPaid: 0,
      balanceDue: 189980,
      paymentTerms: "Net 30",
    };

    const computed = computeInvoiceBalances(newInvoice);
    setInvoices((prev) => [computed, ...prev]);
    setSimExtraInvoiceAdded(true);
    setSimStep(8);
    showToast("✓ Invoice INV-1150 (2,300 MT @ ₹70/MT) raised! TOD progress updated automatically.");
  };

  const handleSimCreateCreditNote = () => {
    const abcScheme = schemes.find((s) => s.id === "tod-scheme-001")!;
    const calc = calculateSchemeProgress(abcScheme, invoices, creditNotes);
    const draft = generateTODCreditNoteDraft(
      abcScheme,
      calc.qualifyingInvoices,
      "Aditya Sharma (Commercial Head)",
      { customAmount: 100000, notes: "Agreed ₹10/MT volume discount on fulfillment of 10,000 MT target." }
    );
    setPendingDraftCN(draft);
    setApprovalModalOpen(true);
    setSimStep(10);
  };

  const handleSimApprove = () => {
    if (!pendingDraftCN) return;
    const result = approveAndPostTODCreditNote(
      pendingDraftCN,
      invoices,
      "Rajesh Verma (CFO)"
    );

    setInvoices(result.updatedInvoices);
    setCreditNotes((prev) => [...prev, result.updatedCreditNote]);
    setSimApprovedCN(result.updatedCreditNote);
    setApprovalModalOpen(false);
    setPendingDraftCN(null);
    setSimStep(15);
    showToast(`✓ Credit Note ${result.updatedCreditNote.creditNoteNumber} posted! Customer receivable reduced by ₹1,00,000.`);
  };

  const handleSimReset = () => {
    setInvoices(mockInvoices);
    setCreditNotes(mockTODCreditNotes);
    setSimExtraInvoiceAdded(false);
    setSimApprovedCN(null);
    setSimStep(1);
    showToast("Simulator reset to initial baseline state.");
  };

  // Chart data for Analytics Tab
  const monthlyTODChartData = [
    { month: "Apr 2026", grossSales: 7.8, todIssued: 0.18, netSales: 7.62 },
    { month: "May 2026", grossSales: 9.4, todIssued: 0.22, netSales: 9.18 },
    { month: "Jun 2026", grossSales: 10.2, todIssued: 0.28, netSales: 9.92 },
    { month: "Jul 2026", grossSales: 11.5, todIssued: 0.32, netSales: 11.18 },
    { month: "Aug 2026", grossSales: 9.3, todIssued: 0.24, netSales: 9.06 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-brand text-white text-xs font-medium rounded-lg shadow-elevated animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-financial-positive shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Turnover Discount (TOD) Management"
        description="Commercial volume rebate schemes, target accrual tracking, multi-invoice credit note generation, and receivable synchronization without altering original billing rates."
        badge={<StatusBadge variant="brand" label="Commercial Engine Active" />}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("simulator")}
            className="border-brand text-brand hover:bg-brand-subtle flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Interactive Demo Simulator</span>
          </Button>
        </div>
      </PageHeader>

      {/* Stat Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active TOD Schemes"
          formattedValue={analytics.activeSchemesCount.toString()}
          subtitle="Across 5 Enterprise Accounts"
        />
        <StatCard
          title="Pending Settlements"
          formattedValue={schemes.filter((s) => calculateSchemeProgress(s, invoices, creditNotes).pendingSettlementTod > 0).length.toString()}
          subtitle="Awaiting CFO Credit Note Approval"
        />
        <StatCard
          title="Potential TOD Accrued"
          amount={analytics.totalPotentialTod}
          currency={true}
          subtitle="Accrued from qualifying volume"
        />
        <StatCard
          title="TOD Settled (YTD)"
          amount={analytics.todAlreadySettled > 0 ? analytics.todAlreadySettled : 1120000}
          currency={true}
          subtitle={`Net Sales: ${formatCurrency(analytics.netSalesFY)}`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-neutral-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab("schemes")}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "schemes"
                ? "border-brand text-brand"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>TOD Schemes & Customer Profiles</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "simulator"
                ? "border-brand text-brand"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-brand" />
            <span>Interactive Demo (20-Step Flow)</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-brand-subtle text-brand">Demo</span>
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "report"
                ? "border-brand text-brand"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Customer-Wise TOD Report</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`pb-3 px-2 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-brand text-brand"
                : "border-transparent text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Commercial Analytics & P&L</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SCHEMES OVERVIEW & CUSTOMER PROFILES */}
      {/* ========================================================================= */}
      {activeTab === "schemes" && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scheme, customer, GSTIN..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
              {["all", "active", "target_achieved", "settled", "expired"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize transition-colors ${
                    statusFilter === st
                      ? "bg-brand text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {st === "all" ? "All Schemes" : st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Schemes Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSchemes.map((scheme) => {
              const calc = calculateSchemeProgress(scheme, invoices, creditNotes);
              const badgeVariant = getSchemeBadgeVariant(calc.computedStatus);
              const statusText = getSchemeStatusLabel(calc.computedStatus);

              return (
                <div
                  key={scheme.id}
                  className={`bg-white border rounded-lg p-5 shadow-card transition-all hover:shadow-md flex flex-col justify-between ${
                    calc.isTargetAchieved && calc.pendingSettlementTod > 0
                      ? "border-emerald-300 ring-1 ring-emerald-200 bg-emerald-50/10"
                      : "border-neutral-200"
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          {scheme.todType === "quantity" ? "Volume Based (MT)" : "Turnover Based (₹)"}
                        </span>
                        <h3 className="font-bold text-sm text-neutral-900 mt-0.5">
                          {scheme.customerName}
                        </h3>
                        <p className="text-xs text-neutral-500 font-medium line-clamp-1">
                          {scheme.schemeName}
                        </p>
                      </div>
                      <StatusBadge variant={badgeVariant} label={statusText} />
                    </div>

                    {/* Target & Achieved Metrics */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2.5 bg-neutral-50 rounded-md text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-400">Target</span>
                        <div className="font-bold text-neutral-800">
                          {scheme.todType === "quantity"
                            ? `${scheme.target.toLocaleString("en-IN")} ${scheme.targetUnit}`
                            : formatCurrency(scheme.target)}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400">Achieved</span>
                        <div className="font-bold text-brand">
                          {scheme.todType === "quantity"
                            ? `${calc.achievedQuantity.toLocaleString("en-IN")} ${scheme.targetUnit}`
                            : formatCurrency(calc.achievedTurnover)}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-3">
                      <div className="flex justify-between text-[11px] font-medium">
                        <span className="text-neutral-500">Progress</span>
                        <span className={`font-bold ${calc.isTargetAchieved ? "text-emerald-700" : "text-brand"}`}>
                          {calc.progressPercentage}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            calc.isTargetAchieved ? "bg-emerald-600" : "bg-brand"
                          }`}
                          style={{ width: `${Math.min(100, calc.progressPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Commercial Terms */}
                    <div className="flex items-center justify-between text-xs py-1 border-t border-neutral-100">
                      <span className="text-neutral-500">Agreed TOD Rate:</span>
                      <span className="font-bold text-neutral-800">
                        {scheme.todType === "quantity"
                          ? `₹${scheme.todRate} / ${scheme.targetUnit}`
                          : `${scheme.todRate}% of Turnover`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-neutral-500">Potential TOD:</span>
                      <span className="font-bold text-brand">
                        {formatCurrency(calc.totalPotentialTod)}
                      </span>
                    </div>

                    {calc.settledTod > 0 && (
                      <div className="flex items-center justify-between text-xs py-1 text-emerald-700">
                        <span>Settled TOD:</span>
                        <span className="font-semibold">{formatCurrency(calc.settledTod)}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSchemeId(scheme.id);
                        setDetailModalOpen(true);
                      }}
                      className="text-xs h-8 flex-1"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      <span>View Invoices & Details</span>
                    </Button>

                    {calc.isTargetAchieved && calc.pendingSettlementTod > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleInitiateCreditNote(scheme, calc.qualifyingInvoices)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8"
                      >
                        <span>Create Credit Note</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INTERACTIVE 20-STEP DEMO SIMULATOR */}
      {/* ========================================================================= */}
      {activeTab === "simulator" && (
        <div className="space-y-6">
          {/* Simulator Banner */}
          <div className="bg-gradient-to-r from-brand via-brand-hover to-slate-900 text-white p-5 rounded-lg shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  Live Operational Simulation
                </span>
                <h2 className="text-base sm:text-lg font-bold mt-1">
                  Complete End-to-End TOD Lifecycle (ABC Metals)
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                  Demonstrates real-time target accumulation, invoice qualification, threshold detection, credit note generation, and native receivable balance reduction.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSimReset}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  <span>Reset Demo</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Stepper Visualizer */}
          <div className="bg-white p-4 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between text-xs font-semibold text-neutral-500 mb-2">
              <span>Stage 1: Active Scheme</span>
              <span>Stage 2: Automatic Accumulation</span>
              <span>Stage 3: Target Fulfilled</span>
              <span>Stage 4: Credit Note Posted</span>
            </div>
            <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-300"
                style={{
                  width:
                    simStep >= 15
                      ? "100%"
                      : simStep >= 10
                      ? "75%"
                      : simStep >= 8
                      ? "50%"
                      : "25%",
                }}
              />
            </div>
          </div>

          {/* Scheme State Card */}
          {(() => {
            const abcScheme = schemes.find((s) => s.id === "tod-scheme-001")!;
            const calc = calculateSchemeProgress(abcScheme, invoices, creditNotes);
            const abcInvoices = invoices.filter((i) => i.customerName === "ABC Metals");
            const totalOutstanding = abcInvoices.reduce((sum, i) => sum + i.openBalance, 0);

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: ABC Metals Active Profile */}
                <div className="lg:col-span-1 bg-white border border-neutral-200 rounded-lg p-5 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400">Customer Profile</span>
                      <h3 className="font-bold text-base text-neutral-900">ABC Metals</h3>
                    </div>
                    <StatusBadge
                      variant={calc.isTargetAchieved ? "positive" : "brand"}
                      label={calc.isTargetAchieved ? "TARGET ACHIEVED" : "ACTIVE SCHEME"}
                    />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">TOD Scheme:</span>
                      <span className="font-semibold text-neutral-800">FY 2026-27 Volume Scheme</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Target Commitment:</span>
                      <span className="font-bold text-neutral-800">10,000 MT</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Achieved Volume:</span>
                      <span className={`font-bold ${calc.isTargetAchieved ? "text-emerald-700" : "text-brand"}`}>
                        {calc.achievedQuantity.toLocaleString("en-IN")} MT
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Remaining to Target:</span>
                      <span className="font-semibold text-neutral-800">
                        {calc.remaining.toLocaleString("en-IN")} MT
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Agreed TOD Rate:</span>
                      <span className="font-bold text-neutral-900">₹10 / MT</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-neutral-100">
                      <span className="text-neutral-500">Potential Commercial Rebate:</span>
                      <span className="font-bold text-brand">
                        {formatCurrency(calc.totalPotentialTod)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-neutral-500">Customer Open Receivables:</span>
                      <span className="font-bold text-neutral-900">
                        {formatCurrency(totalOutstanding)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Accumulation Progress</span>
                      <span className={calc.isTargetAchieved ? "text-emerald-700" : "text-brand"}>
                        {calc.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          calc.isTargetAchieved ? "bg-emerald-600" : "bg-brand"
                        }`}
                        style={{ width: `${Math.min(100, calc.progressPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Interactive Action Controls */}
                  <div className="pt-3 border-t border-neutral-100 space-y-2">
                    {!simExtraInvoiceAdded ? (
                      <Button
                        onClick={handleSimAddInvoice}
                        className="w-full bg-brand hover:bg-brand-hover text-white text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <PlusCircle className="w-4 h-4" />
                        <span>Step 6: Raise Invoice INV-1150 (2,300 MT @ ₹70/MT)</span>
                      </Button>
                    ) : !simApprovedCN ? (
                      <div className="space-y-2">
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span><strong>TOD TARGET ACHIEVED!</strong> Customer exceeded 10,000 MT threshold (10,150 MT achieved).</span>
                        </div>
                        <Button
                          onClick={handleSimCreateCreditNote}
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs py-2 flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <Receipt className="w-4 h-4" />
                          <span>Step 10: Create TOD Credit Note (₹1,00,000)</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>TOD Settlement Successfully Reconciled!</span>
                        </div>
                        <p className="text-neutral-600 text-[11px]">
                          Credit Note <strong>{simApprovedCN.creditNoteNumber}</strong> has reduced the customer&apos;s open receivable ledger by ₹1,00,000.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Qualifying Invoices Ledger */}
                <div className="lg:col-span-2 bg-white border border-neutral-200 rounded-lg p-5 shadow-card space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-neutral-900">
                        Qualifying Invoices Contributing to Scheme
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Invoices billed at normal market rates (₹70/MT) tracked separately by the TOD engine.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-mono">
                      {calc.qualifyingInvoices.length} Invoices
                    </span>
                  </div>

                  <div className="overflow-x-auto border border-neutral-200 rounded-md">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                        <tr>
                          <th className="p-2.5">Invoice #</th>
                          <th className="p-2.5">Date</th>
                          <th className="p-2.5">Quantity</th>
                          <th className="p-2.5">Billing Rate</th>
                          <th className="p-2.5">Invoice Value</th>
                          <th className="p-2.5">TOD Rate</th>
                          <th className="p-2.5">Potential TOD</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {calc.qualifyingInvoices.map((inv) => (
                          <tr
                            key={inv.invoiceId}
                            className={`hover:bg-neutral-50 ${
                              inv.invoiceNumber === "INV-1150" ? "bg-emerald-50/40 font-medium" : ""
                            }`}
                          >
                            <td className="p-2.5 font-semibold text-brand flex items-center gap-1">
                              <span>{inv.invoiceNumber}</span>
                              {inv.invoiceNumber === "INV-1150" && (
                                <span className="text-[9px] font-bold px-1 bg-emerald-600 text-white rounded">NEW</span>
                              )}
                            </td>
                            <td className="p-2.5 text-neutral-500">{inv.invoiceDate}</td>
                            <td className="p-2.5 font-mono">{inv.quantity.toLocaleString("en-IN")} MT</td>
                            <td className="p-2.5 font-mono">₹{inv.billingRate}/MT</td>
                            <td className="p-2.5 font-mono">{formatCurrency(inv.invoiceValue)}</td>
                            <td className="p-2.5 font-mono text-neutral-600">₹{inv.todRate}/MT</td>
                            <td className="p-2.5 font-mono font-bold text-brand">{formatCurrency(inv.potentialTod)}</td>
                            <td className="p-2.5">
                              {simApprovedCN ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                  Settled
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 text-neutral-600">
                                  Pending CN
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-neutral-50 border-t border-neutral-200 font-bold text-neutral-900">
                        <tr>
                          <td colSpan={2} className="p-2.5">TOTAL ACCUMULATED</td>
                          <td className="p-2.5 font-mono text-brand">{calc.achievedQuantity.toLocaleString("en-IN")} MT</td>
                          <td className="p-2.5 text-neutral-400">—</td>
                          <td className="p-2.5 font-mono">{formatCurrency(calc.achievedTurnover)}</td>
                          <td className="p-2.5 text-neutral-400">—</td>
                          <td className="p-2.5 font-mono text-brand">{formatCurrency(calc.totalPotentialTod)}</td>
                          <td className="p-2.5">
                            <span className="text-[10px] text-neutral-500">
                              {calc.isTargetAchieved ? "Eligible" : "Accruing"}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Accounting Truth Comparison */}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-xs space-y-1">
                    <div className="font-semibold text-neutral-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-brand" />
                      <span>Accounting Verification (Indian GAAP & GST Rule 53)</span>
                    </div>
                    <p className="text-neutral-600 text-[11px] leading-relaxed">
                      Original invoices remain recorded at <strong>₹70/MT</strong>. Commercial TOD of <strong>₹10/MT</strong> is credited via Section 34 Credit Note, reducing customer receivable from <strong>₹1,11,510</strong> down to <strong>₹11,510</strong> (or net ledger zero). No price modification occurs in historical invoices.
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOMER-WISE TOD REPORT (Requirement 13) */}
      {/* ========================================================================= */}
      {activeTab === "report" && (
        <div className="space-y-4 bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-neutral-200 pb-3">
            <div>
              <h3 className="font-bold text-base text-neutral-900">Customer-Wise Commercial TOD Report</h3>
              <p className="text-xs text-neutral-500">
                Consolidated report of targets, volume realized, potential rebates, and settlement statuses across enterprise accounts.
              </p>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              FY 2026-27 (As of 26 Aug 2026)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                <tr>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Scheme</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Achieved</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3">TOD Rate</th>
                  <th className="p-3">Potential TOD</th>
                  <th className="p-3">Settled TOD</th>
                  <th className="p-3">Pending TOD</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {schemes.map((s) => {
                  const calc = calculateSchemeProgress(s, invoices, creditNotes);
                  const badgeVariant = getSchemeBadgeVariant(calc.computedStatus);
                  const statusLabel = getSchemeStatusLabel(calc.computedStatus);

                  return (
                    <tr key={s.id} className="hover:bg-neutral-50">
                      <td className="p-3 font-semibold text-neutral-900">
                        {s.customerName}
                        <div className="text-[10px] text-neutral-400 font-mono">{s.customerGstin}</div>
                      </td>
                      <td className="p-3 text-neutral-600 max-w-[180px] truncate" title={s.schemeName}>
                        {s.schemeName}
                      </td>
                      <td className="p-3 font-mono">
                        {s.todType === "quantity"
                          ? `${s.target.toLocaleString("en-IN")} ${s.targetUnit}`
                          : formatCurrency(s.target)}
                      </td>
                      <td className="p-3 font-mono font-semibold text-brand">
                        {s.todType === "quantity"
                          ? `${calc.achievedQuantity.toLocaleString("en-IN")} ${s.targetUnit}`
                          : formatCurrency(calc.achievedTurnover)}
                      </td>
                      <td className="p-3 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <span>{calc.progressPercentage}%</span>
                          <div className="w-12 bg-neutral-200 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${calc.isTargetAchieved ? "bg-emerald-600" : "bg-brand"}`}
                              style={{ width: `${Math.min(100, calc.progressPercentage)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        {s.todType === "quantity"
                          ? `₹${s.todRate}/${s.targetUnit}`
                          : `${s.todRate}%`}
                      </td>
                      <td className="p-3 font-mono font-bold text-neutral-800">
                        {formatCurrency(calc.totalPotentialTod)}
                      </td>
                      <td className="p-3 font-mono text-emerald-700">
                        {formatCurrency(calc.settledTod)}
                      </td>
                      <td className="p-3 font-mono text-amber-700 font-semibold">
                        {formatCurrency(calc.pendingSettlementTod)}
                      </td>
                      <td className="p-3">
                        <StatusBadge variant={badgeVariant} label={statusLabel} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TOD ANALYTICS & FINANCIAL VISIBILITY (Requirement 11 & 12) */}
      {/* ========================================================================= */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Executive P&L Strip */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
            <h3 className="font-bold text-sm text-neutral-900 mb-1">
              Commercial Financial Visibility (FY 2026-27)
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Real commercial revenue realization net of negotiated volume rebates and turnover discounts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-lg border border-neutral-200 text-center">
              <div>
                <span className="text-xs text-neutral-500 uppercase font-semibold">Gross Billed Sales</span>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">₹48.20 Cr</div>
                <span className="text-[11px] text-neutral-400">Total Invoiced Billing</span>
              </div>
              <div className="border-t sm:border-t-0 sm:border-l sm:border-r border-neutral-200 pt-3 sm:pt-0">
                <span className="text-xs text-amber-600 uppercase font-semibold">TOD Rebates Issued</span>
                <div className="text-xl sm:text-2xl font-bold text-amber-700 mt-1">-₹1.24 Cr</div>
                <span className="text-[11px] text-neutral-400">2.57% Commercial Concession</span>
              </div>
              <div className="border-t sm:border-t-0 pt-3 sm:pt-0">
                <span className="text-xs text-emerald-700 uppercase font-semibold">Net Commercial Revenue</span>
                <div className="text-xl sm:text-2xl font-bold text-emerald-800 mt-1">₹46.96 Cr</div>
                <span className="text-[11px] text-emerald-600 font-medium">Actual Realized Inflows</span>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-neutral-200 rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-bold text-sm text-neutral-900">Monthly Gross vs Net Revenue Trend (₹ Crores)</h4>
                <p className="text-xs text-neutral-500">Month-on-month comparison of billed revenue vs TOD discount issued</p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTODChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} unit=" Cr" />
                  <Tooltip
                    formatter={(value) => [`₹${Number(value) || 0} Cr`, ""]}
                    contentStyle={{ fontSize: "12px", borderRadius: "6px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="grossSales" name="Gross Invoiced Sales" fill="#0A2540" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="todIssued" name="TOD Rebates Issued" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="netSales" name="Net Realized Sales" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCHEME DETAIL DRAWER / MODAL */}
      {/* ========================================================================= */}
      {detailModalOpen && selectedSchemeData && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-elevated border border-neutral-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-start justify-between gap-3 bg-neutral-50">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-neutral-900">
                    {selectedSchemeData.scheme.customerName}
                  </h3>
                  <StatusBadge
                    variant={getSchemeBadgeVariant(selectedSchemeData.computedStatus)}
                    label={getSchemeStatusLabel(selectedSchemeData.computedStatus)}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedSchemeData.scheme.schemeName} • {selectedSchemeData.scheme.customerGstin}
                </p>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* Progress Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Target</span>
                  <div className="font-bold text-sm text-neutral-900 mt-0.5">
                    {selectedSchemeData.scheme.todType === "quantity"
                      ? `${selectedSchemeData.scheme.target.toLocaleString("en-IN")} ${selectedSchemeData.scheme.targetUnit}`
                      : formatCurrency(selectedSchemeData.scheme.target)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Achieved</span>
                  <div className="font-bold text-sm text-brand mt-0.5">
                    {selectedSchemeData.scheme.todType === "quantity"
                      ? `${selectedSchemeData.achievedQuantity.toLocaleString("en-IN")} ${selectedSchemeData.scheme.targetUnit}`
                      : formatCurrency(selectedSchemeData.achievedTurnover)}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">TOD Rate</span>
                  <div className="font-bold text-sm text-neutral-900 mt-0.5">
                    {selectedSchemeData.scheme.todType === "quantity"
                      ? `₹${selectedSchemeData.scheme.todRate}/${selectedSchemeData.scheme.targetUnit}`
                      : `${selectedSchemeData.scheme.todRate}%`}
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                  <span className="text-[10px] text-neutral-400 uppercase font-semibold">Potential TOD</span>
                  <div className="font-bold text-sm text-brand mt-0.5">
                    {formatCurrency(selectedSchemeData.totalPotentialTod)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-neutral-600">Fulfillment Progress</span>
                  <span className={selectedSchemeData.isTargetAchieved ? "text-emerald-700" : "text-brand"}>
                    {selectedSchemeData.progressPercentage}% ({selectedSchemeData.remaining > 0 ? `${selectedSchemeData.remaining.toLocaleString("en-IN")} remaining` : "Target Satisfied"})
                  </span>
                </div>
                <div className="w-full bg-neutral-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${selectedSchemeData.isTargetAchieved ? "bg-emerald-600" : "bg-brand"}`}
                    style={{ width: `${Math.min(100, selectedSchemeData.progressPercentage)}%` }}
                  />
                </div>
              </div>

              {/* Qualifying Invoices Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-neutral-900">
                  Qualifying Invoices ({selectedSchemeData.qualifyingInvoices.length})
                </h4>
                <div className="overflow-x-auto border border-neutral-200 rounded-md">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 border-b border-neutral-200 font-semibold text-neutral-600">
                      <tr>
                        <th className="p-2.5">Invoice #</th>
                        <th className="p-2.5">Date</th>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5">Quantity</th>
                        <th className="p-2.5">Billing Rate</th>
                        <th className="p-2.5">Invoice Value</th>
                        <th className="p-2.5">Potential TOD</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {selectedSchemeData.qualifyingInvoices.map((q) => (
                        <tr key={q.invoiceId} className="hover:bg-neutral-50">
                          <td className="p-2.5 font-semibold text-brand">{q.invoiceNumber}</td>
                          <td className="p-2.5 text-neutral-500">{q.invoiceDate}</td>
                          <td className="p-2.5 text-neutral-700 max-w-[150px] truncate">{q.product}</td>
                          <td className="p-2.5 font-mono">{q.quantity.toLocaleString("en-IN")} {q.unit}</td>
                          <td className="p-2.5 font-mono">₹{q.billingRate}/{q.unit}</td>
                          <td className="p-2.5 font-mono">{formatCurrency(q.invoiceValue)}</td>
                          <td className="p-2.5 font-mono font-bold text-brand">{formatCurrency(q.potentialTod)}</td>
                          <td className="p-2.5 capitalize">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-700">
                              {q.creditNoteStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Settlement Periods Breakdown */}
              {mockTODSettlementPeriods[selectedSchemeData.scheme.id] && (
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-neutral-900">Periodic Settlement Milestones</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mockTODSettlementPeriods[selectedSchemeData.scheme.id].map((period) => (
                      <div key={period.id} className="p-2.5 border border-neutral-200 rounded-md bg-white">
                        <div className="font-semibold text-neutral-800 text-[11px]">{period.periodLabel}</div>
                        <div className="text-[10px] text-neutral-500 mt-1">
                          Qty: {period.qualifyingQty.toLocaleString("en-IN")} MT
                        </div>
                        <div className="font-bold text-brand mt-0.5">
                          {formatCurrency(period.todAmount)}
                        </div>
                        <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] uppercase font-semibold bg-neutral-100 text-neutral-600">
                          {period.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Trail */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-neutral-900">Scheme Audit Trail</h4>
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md space-y-2 max-h-36 overflow-y-auto">
                  {mockTODAuditLogs
                    .filter((log) => log.schemeId === selectedSchemeData.scheme.id)
                    .map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-[11px]">
                        <span className="text-neutral-400 font-mono shrink-0">{log.timestamp}</span>
                        <span className="font-semibold text-neutral-800 shrink-0">{log.userName}:</span>
                        <span className="text-neutral-600">{log.details}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailModalOpen(false)}
              >
                Close
              </Button>

              {selectedSchemeData.isTargetAchieved && selectedSchemeData.pendingSettlementTod > 0 && (
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailModalOpen(false);
                    handleInitiateCreditNote(selectedSchemeData.scheme, selectedSchemeData.qualifyingInvoices);
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Receipt className="w-3.5 h-3.5 mr-1" />
                  <span>Create TOD Credit Note</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CREDIT NOTE REVIEW & APPROVAL MODAL */}
      {/* ========================================================================= */}
      {approvalModalOpen && pendingDraftCN && (
        <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-elevated border border-neutral-200 w-full max-w-2xl flex flex-col overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-neutral-200 flex items-start justify-between bg-neutral-50">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Commercial Settlement Authorization</span>
                <h3 className="font-bold text-base text-neutral-900 mt-0.5">
                  Review TOD Credit Note ({pendingDraftCN.creditNoteNumber})
                </h3>
              </div>
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="w-7 h-7 rounded-md hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-md">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase">Customer</span>
                  <div className="font-bold text-neutral-900">{pendingDraftCN.customerName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase">Scheme</span>
                  <div className="font-medium text-neutral-700">{pendingDraftCN.schemeName}</div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase">Qualifying Volume</span>
                  <div className="font-mono font-semibold text-neutral-800">
                    {pendingDraftCN.qualifyingQuantity.toLocaleString("en-IN")} MT
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase">Rebate Term</span>
                  <div className="font-medium text-neutral-700">{pendingDraftCN.todRateDescription}</div>
                </div>
              </div>

              {/* Linked Invoices */}
              <div className="space-y-1">
                <span className="font-semibold text-neutral-800">Linked Contributing Invoices ({pendingDraftCN.linkedInvoiceNumbers.length}):</span>
                <div className="flex flex-wrap gap-1.5 p-2.5 bg-neutral-50 border border-neutral-200 rounded-md font-mono text-[11px] text-brand">
                  {pendingDraftCN.linkedInvoiceNumbers.map((no) => (
                    <span key={no} className="px-2 py-0.5 rounded bg-white border border-neutral-200">
                      {no}
                    </span>
                  ))}
                </div>
              </div>

              {/* Financial Amount */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-semibold uppercase">Total Credit Note Payable</span>
                  <p className="text-[11px] text-emerald-600">Will reduce customer receivables via standard payment engine</p>
                </div>
                <div className="text-xl font-bold text-emerald-800 font-mono">
                  {formatCurrency(pendingDraftCN.grossTodAmount)}
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-md text-[11px] text-neutral-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <span>
                  Approval applies this credit note to linked invoices and reduces customer open balances using VittaOS&apos;s standard <code>computeInvoiceBalances()</code> logic.
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setApprovalModalOpen(false)}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setApprovalModalOpen(false);
                    showToast("Credit note request rejected / deferred.");
                  }}
                  className="text-financial-destructive border-neutral-200 hover:bg-red-50 text-xs"
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (simStep === 10) {
                      handleSimApprove();
                    } else {
                      handleApproveCreditNote(pendingDraftCN);
                    }
                  }}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Approve & Post Credit Note</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
