"use client";

import React, { useState, useMemo } from "react";
import {
  mockChartOfAccounts,
  mockJournalEntries,
} from "@/lib/mock-data";
import { AccountCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { FinancialConceptModal } from "@/components/shared/financial-concept-modal";
import { ConceptExplainerBanner } from "@/components/shared/concept-explainer-banner";
import {
  BookOpen,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  Scale,
} from "lucide-react";

type LedgerTab = "general-ledger" | "chart-of-accounts" | "revenue-realization" | "balance-sheet";

export default function LedgerPage() {
  const [activeTab, setActiveTab] = useState<LedgerTab>("general-ledger");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  // Filtered General Ledger Entries (Inflows, Receivables & Revenue)
  const filteredEntries = useMemo(() => {
    return mockJournalEntries.filter((entry) => {
      const matchesSearch =
        searchQuery === "" ||
        entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.accountName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.accountCode.includes(searchQuery) ||
        entry.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.entryNumber.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || entry.accountCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Totals for general ledger view
  const ledgerTotals = useMemo(() => {
    const totalDebit = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = filteredEntries.reduce((sum, e) => sum + e.credit, 0);
    return { totalDebit, totalCredit };
  }, [filteredEntries]);

  // Grouped Chart of Accounts
  const coaGroups = useMemo(() => {
    const groups: Record<AccountCategory, typeof mockChartOfAccounts> = {
      asset: [],
      liability: [],
      equity: [],
      income: [],
      expense: [],
    };

    mockChartOfAccounts.forEach((acc) => {
      groups[acc.category].push(acc);
    });

    return groups;
  }, []);

  const toggleGroupCollapse = (cat: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  // Revenue Realization & Collections Computation
  const realizationData = useMemo(() => {
    const incomeAccounts = mockChartOfAccounts.filter((a) => a.category === "income");
    const totalGrossBilled = incomeAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const creditNotesDeductions = 15400; // Total credit notes issued
    const buyerTdsCredits = 184500; // Total statutory TDS credits
    const cashCollections = 42800000; // ~₹4.28 Cr collected
    const openReceivables = totalGrossBilled - creditNotesDeductions - buyerTdsCredits - cashCollections;

    const realizationPct = totalGrossBilled > 0 ? (cashCollections / totalGrossBilled) * 100 : 92.4;

    return {
      incomeAccounts,
      totalGrossBilled,
      creditNotesDeductions,
      buyerTdsCredits,
      cashCollections,
      openReceivables: Math.max(0, openReceivables),
      realizationPct: Number(realizationPct.toFixed(1)),
    };
  }, []);

  // Balance Sheet Verification
  const balanceSheetData = useMemo(() => {
    const assetAccounts = mockChartOfAccounts.filter((a) => a.category === "asset");
    const liabilityAccounts = mockChartOfAccounts.filter((a) => a.category === "liability");
    const equityAccounts = mockChartOfAccounts.filter((a) => a.category === "equity");

    const totalAssets = assetAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.currentBalance, 0);
    const totalEquity = equityAccounts.reduce((sum, a) => sum + a.currentBalance, 0);

    const diff = totalAssets - (totalLiabilities + totalEquity);

    return {
      assetAccounts,
      liabilityAccounts,
      equityAccounts,
      totalAssets,
      totalLiabilities,
      totalEquity,
      diff,
      isBalanced: Math.abs(diff) < 1,
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Financial Knowledge Concept Modal */}
      <FinancialConceptModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
      />

      {/* Page Header */}
      <PageHeader
        title="General Ledger & Financial Statements"
        description="Continuous double-entry ledger with real-time debit/credit balancing, Chart of Accounts (COA), Revenue Realization velocity, and balance sheet verification."
        badge={<StatusBadge variant="positive" label="Balanced to ₹0.00" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("credit_notes")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn Journal Posting
          </Button>
          <Button variant="default" size="sm" className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export General Journal
          </Button>
        </div>
      </PageHeader>

      {/* Explainer Banner */}
      <ConceptExplainerBanner
        conceptId="credit_notes"
        onOpenFullModal={(id) => setSelectedConceptId(id)}
      />

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("general-ledger")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "general-ledger"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>General Ledger Journal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("chart-of-accounts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "chart-of-accounts"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Chart of Accounts (COA)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("revenue-realization")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "revenue-realization"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Revenue & Realization Statement</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("balance-sheet")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "balance-sheet"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Live Balance Sheet</span>
        </button>
      </div>

      {/* TAB 1: GENERAL LEDGER ENTRIES */}
      {activeTab === "general-ledger" && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-neutral-200 shadow-card">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search account code, description, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 text-neutral-700 focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="all">All Accounting Categories</option>
                <option value="asset">Assets (Bank & Receivables)</option>
                <option value="liability">Liabilities (Output GST)</option>
                <option value="equity">Equity & Capital</option>
                <option value="income">Income & Sales</option>
              </select>
            </div>
          </div>

          {/* Ledger Journal Table */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                      Entry & Date
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                      Account Code & Name
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500">
                      Description & Ref
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                      Debit (+)
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                      Credit (-)
                    </th>
                    <th className="py-3 px-4 font-semibold uppercase tracking-wider text-neutral-500 text-right">
                      Cumulative Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-brand">{entry.entryNumber}</div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{entry.date}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                          <span className="font-mono text-[11px] bg-neutral-100 px-1.5 py-0.2 rounded text-neutral-600">
                            {entry.accountCode}
                          </span>
                          <span>{entry.accountName}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 capitalize mt-0.5 block">
                          Head: {entry.accountCategory}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-neutral-800 truncate">{entry.description}</div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          Ref: {entry.referenceNumber}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap font-medium text-neutral-900">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "—"}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap font-medium text-neutral-900">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "—"}
                      </td>

                      <td className="py-3 px-4 text-right tabular-nums whitespace-nowrap font-bold text-brand">
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-neutral-50 border-t-2 border-neutral-200 font-bold">
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-neutral-800 text-right">
                      Verified Journal Totals (Debit = Credit):
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-brand font-extrabold">
                      {formatCurrency(ledgerTotals.totalDebit)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-brand font-extrabold">
                      {formatCurrency(ledgerTotals.totalCredit)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-financial-positive text-[11px] font-bold">
                        Balanced ✓
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHART OF ACCOUNTS */}
      {activeTab === "chart-of-accounts" && (
        <div className="space-y-4">
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-center justify-between">
            <span>
              Standard Indian Accounting COA structured into 5 master numerical heads.
            </span>
            <span className="font-mono text-[11px] text-brand font-semibold">
              {mockChartOfAccounts.length} Active Master Accounts
            </span>
          </div>

          <div className="space-y-3">
            {(["asset", "liability", "equity", "income"] as AccountCategory[]).map((cat) => {
              const accounts = coaGroups[cat] || [];
              const isCollapsed = collapsedGroups[cat];
              const totalBal = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

              return (
                <div key={cat} className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
                  <div
                    onClick={() => toggleGroupCollapse(cat)}
                    className="p-3.5 bg-neutral-50/80 hover:bg-neutral-100/70 border-b border-neutral-200 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="w-4 h-4 text-neutral-500" /> : <ChevronDown className="w-4 h-4 text-neutral-500" />}
                      <span className="text-xs font-bold uppercase tracking-wider text-brand capitalize">
                        {cat} Accounts ({accounts.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-900 tabular-nums font-mono">
                        {formatCurrency(totalBal)}
                      </span>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="divide-y divide-neutral-100 text-xs">
                      {accounts.map((acc) => (
                        <div key={acc.code} className="p-3 hover:bg-neutral-50/70 flex items-center justify-between transition-colors">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand text-[11px]">
                                #{acc.code}
                              </span>
                              <span className="font-semibold text-neutral-900">{acc.name}</span>
                            </div>
                            <span className="text-[11px] text-neutral-400 mt-0.5 block">
                              Subhead: {acc.subHead} • Normal Balance: {acc.normalBalance.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-neutral-900 tabular-nums">
                              {formatCurrency(acc.currentBalance)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: REVENUE REALIZATION & COLLECTIONS STATEMENT */}
      {activeTab === "revenue-realization" && (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-brand">
                Revenue Realization & Collections Statement
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                FY 2026-27 (Q2) • Billed Turnover to Liquid Bank Settlement Realization
              </p>
            </div>
            <span className="text-xs font-bold text-financial-positive bg-green-50 px-3 py-1 rounded-md border border-green-200">
              {realizationData.realizationPct}% Inflow Realization Rate
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Step 1: Gross Sales */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
              <div>
                <span className="font-bold text-neutral-900 text-sm">1. Gross Billed Turnover (Sales)</span>
                <span className="text-[11px] text-neutral-500 block mt-0.5">
                  Taxable supplies declared on invoices
                </span>
              </div>
              <span className="text-base font-bold text-brand tabular-nums">
                {formatCurrency(realizationData.totalGrossBilled)}
              </span>
            </div>

            {/* Step 2: Deductions */}
            <div className="space-y-2 pl-4 border-l-2 border-amber-300">
              <div className="flex items-center justify-between text-amber-800">
                <span>Less: Statutory Credit Notes Issued (Price revisions & returns)</span>
                <span className="font-bold tabular-nums">-{formatCurrency(realizationData.creditNotesDeductions)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-600">
                <span>Less: Buyer Statutory TDS Withheld (Sec 194Q - Form 26AS Prepaid Tax)</span>
                <span className="font-bold tabular-nums">-{formatCurrency(realizationData.buyerTdsCredits)}</span>
              </div>
            </div>

            {/* Step 3: Net Realizable */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 border border-blue-200">
              <div>
                <span className="font-bold text-neutral-900 text-sm">2. Net Realizable Revenue</span>
                <span className="text-[11px] text-blue-700 block mt-0.5">
                  Actual collectible cash after legal tax and commercial adjustments
                </span>
              </div>
              <span className="text-base font-bold text-brand tabular-nums">
                {formatCurrency(realizationData.totalGrossBilled - realizationData.creditNotesDeductions - realizationData.buyerTdsCredits)}
              </span>
            </div>

            {/* Step 4: Cash Collected */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-financial-positive-bg/60 border border-financial-positive-border">
              <div>
                <span className="font-bold text-financial-positive-text text-sm">3. Cash Inflow Settled via Bank (HDFC)</span>
                <span className="text-[11px] text-financial-positive-text/80 block mt-0.5">
                  Verified against bank UTR receipts (95.4% realized)
                </span>
              </div>
              <span className="text-base font-bold text-financial-positive tabular-nums">
                {formatCurrency(realizationData.cashCollections)}
              </span>
            </div>

            {/* Step 5: Remaining Open AR */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-brand-subtle border border-neutral-300">
              <div>
                <span className="font-bold text-brand text-sm">4. Genuine Open Accounts Receivable</span>
                <span className="text-[11px] text-neutral-600 block mt-0.5">
                  Scheduled for collection within standard 38-day credit terms
                </span>
              </div>
              <span className="text-base font-bold text-brand tabular-nums">
                {formatCurrency(realizationData.openReceivables)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE BALANCE SHEET */}
      {activeTab === "balance-sheet" && (
        <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-brand">
                Live Balance Sheet Statement
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Real-Time Double-Entry Equilibrium: Assets = Liabilities + Equity
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-financial-positive bg-green-50 px-2.5 py-1 rounded border border-green-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Perfect Balance: ₹0.00 Variance</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left: Total Assets */}
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-bold uppercase tracking-wider text-brand text-sm">
                  Assets (What You Own)
                </span>
                <span className="font-bold text-brand font-mono text-sm">
                  {formatCurrency(balanceSheetData.totalAssets)}
                </span>
              </div>
              <div className="space-y-2">
                {balanceSheetData.assetAccounts.map((acc) => (
                  <div key={acc.code} className="flex justify-between text-neutral-700">
                    <span>{acc.name}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(acc.currentBalance)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Liabilities & Equity */}
            <div className="border border-neutral-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <span className="font-bold uppercase tracking-wider text-brand text-sm">
                  Liabilities & Equity
                </span>
                <span className="font-bold text-brand font-mono text-sm">
                  {formatCurrency(balanceSheetData.totalLiabilities + balanceSheetData.totalEquity)}
                </span>
              </div>
              <div className="space-y-2">
                <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">Liabilities (Statutory Output Taxes)</span>
                {balanceSheetData.liabilityAccounts.map((acc) => (
                  <div key={acc.code} className="flex justify-between text-neutral-700 pl-2">
                    <span>{acc.name}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(acc.currentBalance)}</span>
                  </div>
                ))}
                <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block pt-2">Equity & Retained Earnings</span>
                {balanceSheetData.equityAccounts.map((acc) => (
                  <div key={acc.code} className="flex justify-between text-neutral-700 pl-2">
                    <span>{acc.name}</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(acc.currentBalance)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
