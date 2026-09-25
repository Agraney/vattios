"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  mockCompany,
  mockInvoices,
  mockBankTransactions,
  mockGSTSummaries,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { computeInvoiceBalances } from "@/lib/payment-engine";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { FinancialConceptModal } from "@/components/shared/financial-concept-modal";
import { ConceptExplainerBanner } from "@/components/shared/concept-explainer-banner";
import {
  Wallet,
  Receipt,
  TrendingUp,
  Landmark,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  ArrowDownLeft,
  BookOpen,
  FileCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DashboardPage() {
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  // 1. Calculate StatCard Values directly from Mock Data & Running Balances
  const currentBankBalance = 8942300; // Primary HDFC Liquid Balance

  const computedInvoices = useMemo(() => {
    return mockInvoices.map((inv) => computeInvoiceBalances(inv));
  }, []);

  // Revenue MTD (Aug 2026)
  const augRevenue = useMemo(() => {
    return computedInvoices
      .filter((inv) => inv.date.startsWith("2026-08") && inv.status !== "Draft")
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [computedInvoices]);

  const julRevenue = useMemo(() => {
    return computedInvoices
      .filter((inv) => inv.date.startsWith("2026-07"))
      .reduce((sum, inv) => sum + inv.grandTotal, 0);
  }, [computedInvoices]);

  const revenueMoM = julRevenue > 0 ? ((augRevenue - julRevenue) / julRevenue) * 100 : 8.5;

  // Genuine Open Outstanding Receivables (Net of Credit Notes & TDS)
  const totalOpenReceivables = useMemo(() => {
    return computedInvoices.reduce((sum, inv) => sum + inv.openBalance, 0);
  }, [computedInvoices]);

  const totalAdjustments = useMemo(() => {
    return computedInvoices.reduce(
      (sum, inv) => sum + (inv.totalCreditNotes || 0) + (inv.totalTdsDeducted || 0),
      0
    );
  }, [computedInvoices]);

  // Outward GST Liability (Current Aug 2026 Period)
  const currentGST = mockGSTSummaries[0];
  const gstNetPayable = currentGST.gstr3b.netTaxPayableCash;

  // 2. Receivables Aging Calculation on Genuine Open Balances (Reference date: 2026-08-25)
  const agingBuckets = useMemo(() => {
    const refDate = new Date("2026-08-25").getTime();
    let b0_30 = 0;
    let b31_60 = 0;
    let b61_90 = 0;
    let b90_plus = 0;

    computedInvoices.forEach((inv) => {
      if (inv.openBalance > 0) {
        const invDate = new Date(inv.date).getTime();
        const diffDays = Math.floor((refDate - invDate) / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
          b0_30 += inv.openBalance;
        } else if (diffDays <= 60) {
          b31_60 += inv.openBalance;
        } else if (diffDays <= 90) {
          b61_90 += inv.openBalance;
        } else {
          b90_plus += inv.openBalance;
        }
      }
    });

    const total = b0_30 + b31_60 + b61_90 + b90_plus || 1;
    return {
      b0_30,
      b31_60,
      b61_90,
      b90_plus,
      total,
      pct0_30: (b0_30 / total) * 100,
      pct31_60: (b31_60 / total) * 100,
      pct61_90: (b61_90 / total) * 100,
      pct90_plus: (b90_plus / total) * 100,
    };
  }, [computedInvoices]);

  // 3. 6-Month Invoiced Sales vs Realized Cash Inflows (Collection Velocity)
  const collectionsTrendData = useMemo(() => {
    return [
      { month: "Mar '26", billed: 3820000, collected: 3650000 },
      { month: "Apr '26", billed: 4150000, collected: 3920000 },
      { month: "May '26", billed: 3148000, collected: 3010000 },
      { month: "Jun '26", billed: 3925000, collected: 3780000 },
      { month: "Jul '26", billed: 3460500, collected: 3290000 },
      { month: "Aug '26", billed: augRevenue, collected: 1240000 },
    ];
  }, [augRevenue]);

  // 4. "Needs Attention" Inflow & Collection Items
  const overdueInvoices = useMemo(() => {
    return computedInvoices.filter((inv) => inv.status === "Overdue" || inv.status === "overdue");
  }, [computedInvoices]);

  const overdueOpenAmount = useMemo(() => {
    return overdueInvoices.reduce((sum, inv) => sum + inv.openBalance, 0);
  }, [overdueInvoices]);

  const unmatchedBankCredits = useMemo(() => {
    return mockBankTransactions.filter(
      (tx) => tx.type === "credit" && tx.status === "unmatched"
    ).length;
  }, []);

  // 5. 30-Day Customer Collections Schedule (Inflows Forecast: 25 Aug - 24 Sep)
  const collectionsForecast = useMemo(() => {
    const projectedInflow = computedInvoices
      .filter((inv) => inv.openBalance > 0 && inv.dueDate >= "2026-08-25" && inv.dueDate <= "2026-09-24")
      .reduce((sum, inv) => sum + inv.openBalance, 0);

    const stagedAdvances = 480000;
    const totalScheduledInflows = projectedInflow + stagedAdvances;

    return {
      projectedInflow,
      stagedAdvances,
      totalScheduledInflows,
    };
  }, [computedInvoices]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Concept Knowledge Modal */}
      <FinancialConceptModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
      />

      {/* Top Header / Context Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand">
              Good morning, Aditya
            </h1>
            <StatusBadge variant="positive" label="Inflows Reconciled" />
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            {mockCompany.name} • GSTIN: <span className="font-mono text-neutral-700">{mockCompany.gstin}</span> • HDFC Inflow Feed #0194
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("bank_reconciliation")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn Inflow Matching
          </Button>
          <Link href="/copilot">
            <Button variant="secondary" size="sm" className="text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-brand" />
              Ask Copilot
            </Button>
          </Link>
          <Link href="/invoicing">
            <Button variant="default" size="sm" className="text-xs">
              New Tax Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Concept Banner on Inflow Matching & Credit Operations */}
      <ConceptExplainerBanner
        conceptId="bank_reconciliation"
        onOpenFullModal={(id) => setSelectedConceptId(id)}
        defaultExpanded={false}
      />

      {/* Row 1: 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="Cash Inflow Balance (HDFC)"
          amount={currentBankBalance}
          icon={Wallet}
          change={{ value: 14.2, label: "vs last month", isPositive: true }}
          className="p-5 sm:p-6"
        />
        <StatCard
          title="Billed Invoices (MTD)"
          amount={augRevenue}
          icon={TrendingUp}
          change={{ value: Number(revenueMoM.toFixed(1)), label: "vs Jul '26", isPositive: revenueMoM >= 0 }}
          className="p-5 sm:p-6"
        />
        <StatCard
          title="Outstanding Receivables"
          amount={totalOpenReceivables}
          icon={Receipt}
          subtitle={`Net of ${formatCurrency(totalAdjustments)} CN & TDS`}
          className="p-5 sm:p-6"
        />
        <StatCard
          title="Outward GST Liability (Aug '26)"
          amount={gstNetPayable}
          icon={Landmark}
          subtitle="GSTR-3B payable by 20th Sep"
          className="p-5 sm:p-6"
        />
      </div>

      {/* Row 2: Charts & Core Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 6-Month Billed Revenue vs Realized Cash Inflows (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Billed Sales vs Realized Cash Inflows
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedConceptId("partial_payments")}
                  className="text-neutral-400 hover:text-brand"
                  title="Learn how partial and full remittances realize billed sales"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">Monthly collection velocity & realization (₹ Lakhs)</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-neutral-700">
                <span className="w-2.5 h-2.5 rounded-full bg-brand" />
                <span>Billed Invoices</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-financial-positive">
                <span className="w-2.5 h-2.5 rounded-full bg-financial-positive" />
                <span>Cash Inflow</span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={collectionsTrendData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorBilled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#13294B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#13294B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2E6F40" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2E6F40" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#64748B" }}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value) || 0), ""]}
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#E2E8F0",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="billed"
                  stroke="#13294B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBilled)"
                  name="Billed Invoices"
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke="#2E6F40"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCollected)"
                  name="Realized Cash Inflow"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-500">
            <span>Average Collection Realization: <strong className="text-financial-positive font-semibold">95.4%</strong></span>
            <span>Working Capital Velocity: <strong className="text-neutral-900 font-semibold">38 Days DSO</strong></span>
          </div>
        </div>

        {/* Right Column: Receivables Aging Breakdown on Genuine Open Balances (5 Cols) */}
        <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Genuine AR Aging Schedule
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedConceptId("ar_aging_dso")}
                    className="text-neutral-400 hover:text-brand"
                    title="Learn how aging buckets and MSME rules work"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">Net of Credit Notes & Buyer TDS deductions</p>
              </div>
              <Link
                href="/ar-ap"
                className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
              >
                <span>View AR</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="my-4">
              <div className="text-2xl font-bold text-brand tabular-nums">
                {formatCurrency(agingBuckets.total)}
              </div>
              <span className="text-xs text-neutral-500">
                Total genuine open receivables across all customers
              </span>
            </div>

            {/* Horizontal Segmented Bar */}
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex gap-0.5">
              <div
                style={{ width: `${agingBuckets.pct0_30}%` }}
                className="bg-brand transition-all"
                title={`0-30 Days: ${formatCurrency(agingBuckets.b0_30)}`}
              />
              <div
                style={{ width: `${agingBuckets.pct31_60}%` }}
                className="bg-neutral-400 transition-all"
                title={`31-60 Days: ${formatCurrency(agingBuckets.b31_60)}`}
              />
              <div
                style={{ width: `${agingBuckets.pct61_90}%` }}
                className="bg-financial-warning transition-all"
                title={`61-90 Days: ${formatCurrency(agingBuckets.b61_90)}`}
              />
              <div
                style={{ width: `${agingBuckets.pct90_plus}%` }}
                className="bg-financial-destructive transition-all"
                title={`90+ Days: ${formatCurrency(agingBuckets.b90_plus)}`}
              />
            </div>

            {/* Legend & Amounts Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-neutral-100 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-brand" />
                  0–30 Days
                </div>
                <div className="font-semibold text-neutral-900 tabular-nums mt-0.5">
                  {formatCurrency(agingBuckets.b0_30)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-neutral-400" />
                  31–60 Days
                </div>
                <div className="font-semibold text-neutral-900 tabular-nums mt-0.5">
                  {formatCurrency(agingBuckets.b31_60)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-financial-warning" />
                  61–90 Days
                </div>
                <div className="font-semibold text-financial-warning tabular-nums mt-0.5">
                  {formatCurrency(agingBuckets.b61_90)}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-financial-destructive" />
                  90+ Days
                </div>
                <div className="font-semibold text-financial-destructive tabular-nums mt-0.5">
                  {formatCurrency(agingBuckets.b90_plus)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Needs Attention List & 30-Day Collections Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Needs Attention Queue (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-financial-warning" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Inflow & Collection Tasks (3)
              </h2>
            </div>
            <span className="text-[11px] text-neutral-400">Action Queue</span>
          </div>

          <div className="divide-y divide-neutral-100 text-xs">
            {/* Item 1: Overdue Invoices */}
            <Link
              href="/ar-ap"
              className="py-3 flex items-center justify-between group hover:bg-neutral-50 -mx-2 px-2 rounded-md transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-7 h-7 rounded bg-financial-destructive-bg border border-financial-destructive-border flex items-center justify-center text-financial-destructive shrink-0 mt-0.5">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 group-hover:text-brand flex items-center gap-2">
                    <span>{overdueInvoices.length} Overdue Customer Invoices</span>
                    <StatusBadge variant="destructive" label="Overdue" size="sm" />
                  </div>
                  <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                    Arvind Lifestyle & Shree Shanti Silks totaling {formatCurrency(overdueOpenAmount)} (net of CN deductions)
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand shrink-0 ml-2" />
            </Link>

            {/* Item 2: Unmatched Bank Credit Remittances */}
            <Link
              href="/bank-reconciliation"
              className="py-3 flex items-center justify-between group hover:bg-neutral-50 -mx-2 px-2 rounded-md transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-7 h-7 rounded bg-financial-warning-bg border border-financial-warning-border flex items-center justify-center text-financial-warning shrink-0 mt-0.5">
                  <Landmark className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 group-hover:text-brand flex items-center gap-2">
                    <span>{unmatchedBankCredits} Customer Remittances to Match</span>
                    <StatusBadge variant="warning" label="Pending Match" size="sm" />
                  </div>
                  <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                    Incoming HDFC credits ready for exact, adjusted, or partial invoice matching.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand shrink-0 ml-2" />
            </Link>

            {/* Item 3: Outward GST GSTR-1 Declaration */}
            <Link
              href="/gst-returns"
              className="py-3 flex items-center justify-between group hover:bg-neutral-50 -mx-2 px-2 rounded-md transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-7 h-7 rounded bg-brand-subtle border border-neutral-300 flex items-center justify-center text-brand shrink-0 mt-0.5">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 group-hover:text-brand flex items-center gap-2">
                    <span>GSTR-1 Outward Supplies Ready</span>
                    <StatusBadge variant="positive" label="Ready to File" size="sm" />
                  </div>
                  <p className="text-neutral-500 text-[11px] truncate mt-0.5">
                    12 e-Invoices & Credit Notes verified for portal submission by 11th.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-brand shrink-0 ml-2" />
            </Link>
          </div>
        </div>

        {/* 30-Day Collections Forecast Strip (6 Cols) */}
        <div className="lg:col-span-6 bg-white border border-neutral-200 rounded-lg p-5 sm:p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  30-Day Inflow & Collections Forecast
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">25 Aug 2026 – 24 Sep 2026</p>
              </div>
              <StatusBadge variant="positive" label="98.4% Confidence" size="sm" />
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-brand">
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Scheduled AR</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-neutral-900 tabular-nums mt-1">
                  +{formatCurrency(collectionsForecast.projectedInflow)}
                </div>
                <span className="text-[10px] text-neutral-400">From upcoming due dates</span>
              </div>

              <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-financial-positive">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Milestone Advances</span>
                </div>
                <div className="text-base sm:text-lg font-bold text-neutral-900 tabular-nums mt-1">
                  +{formatCurrency(collectionsForecast.stagedAdvances)}
                </div>
                <span className="text-[10px] text-neutral-400">Contractual retainage</span>
              </div>

              <div className="bg-financial-positive-bg/40 p-3 rounded-lg border border-financial-positive-border">
                <div className="text-[11px] font-bold text-financial-positive">
                  Total Inflows Expected
                </div>
                <div className="text-base sm:text-lg font-bold text-financial-positive tabular-nums mt-1">
                  +{formatCurrency(collectionsForecast.totalScheduledInflows)}
                </div>
                <span className="text-[10px] text-financial-positive-text font-semibold">
                  100% Inflow Velocity
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>Projection Model: <strong className="text-neutral-900 font-semibold">Historical Payment Probability</strong></span>
            <Link href="/ar-ap" className="text-brand font-semibold hover:underline">
              Review Customer Aging →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
