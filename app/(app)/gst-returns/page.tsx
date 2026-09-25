"use client";

import React, { useState, useMemo } from "react";
import {
  mockGSTSummaries,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { FinancialConceptModal } from "@/components/shared/financial-concept-modal";
import { ConceptExplainerBanner } from "@/components/shared/concept-explainer-banner";
import {
  ReceiptText,
  Calendar,
  CheckCircle2,
  FileCheck,
  ShieldCheck,
  Building2,
  BookOpen,
  Info,
} from "lucide-react";

type TaxTab = "gstr1" | "advance_tax" | "buyer_tds";

interface BuyerTDSCredit {
  id: string;
  buyerName: string;
  buyerTan: string;
  buyerPan: string;
  invoiceNumber: string;
  invoiceDate: string;
  grossAmount: number;
  tdsSection: "194Q";
  tdsRate: number;
  tdsAmount: number;
  quarter: "Q1 FY26" | "Q2 FY26";
  form26asStatus: "verified_in_26as" | "pending_challan";
}

const mockBuyerTDSCredits: BuyerTDSCredit[] = [
  {
    id: "btds-01",
    buyerName: "Arvind Lifestyle Brands Ltd",
    buyerTan: "AHMA12849F",
    buyerPan: "AAACA4829G",
    invoiceNumber: "INV/2026-27/048",
    invoiceDate: "2026-08-14",
    grossAmount: 350000,
    tdsSection: "194Q",
    tdsRate: 0.1,
    tdsAmount: 350,
    quarter: "Q2 FY26",
    form26asStatus: "verified_in_26as",
  },
  {
    id: "btds-02",
    buyerName: "Raymond Luxury Cottons Ltd",
    buyerTan: "MUMR09124K",
    buyerPan: "AAACR1294F",
    invoiceNumber: "INV/2026-27/047",
    invoiceDate: "2026-08-12",
    grossAmount: 113400,
    tdsSection: "194Q",
    tdsRate: 0.1,
    tdsAmount: 113,
    quarter: "Q2 FY26",
    form26asStatus: "verified_in_26as",
  },
  {
    id: "btds-03",
    buyerName: "Page Industries Ltd (Jockey India)",
    buyerTan: "BLRP84920E",
    buyerPan: "AAACP9102L",
    invoiceNumber: "INV/2026-27/046",
    invoiceDate: "2026-08-10",
    grossAmount: 309225,
    tdsSection: "194Q",
    tdsRate: 0.1,
    tdsAmount: 309,
    quarter: "Q2 FY26",
    form26asStatus: "verified_in_26as",
  },
  {
    id: "btds-04",
    buyerName: "Bombay Dyeing & Mfg Co Ltd",
    buyerTan: "MUMB04829L",
    buyerPan: "AAACB4920K",
    invoiceNumber: "INV/2026-27/041",
    invoiceDate: "2026-07-15",
    grossAmount: 485000,
    tdsSection: "194Q",
    tdsRate: 0.1,
    tdsAmount: 485,
    quarter: "Q2 FY26",
    form26asStatus: "verified_in_26as",
  },
  {
    id: "btds-05",
    buyerName: "FabIndia Overseas Pvt Ltd",
    buyerTan: "DELF93821M",
    buyerPan: "AAACF9301J",
    invoiceNumber: "INV/2026-27/038",
    invoiceDate: "2026-06-20",
    grossAmount: 580000,
    tdsSection: "194Q",
    tdsRate: 0.1,
    tdsAmount: 580,
    quarter: "Q1 FY26",
    form26asStatus: "verified_in_26as",
  },
];

export default function TaxReturnsPage() {
  const [activeTab, setActiveTab] = useState<TaxTab>("gstr1");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Aug 2026");
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
  const [showFilingModal, setShowFilingModal] = useState(false);

  const activeGST = useMemo(() => {
    return (
      mockGSTSummaries.find((g) => g.period === selectedPeriod) ||
      mockGSTSummaries[0]
    );
  }, [selectedPeriod]);

  // Corporate Advance Tax Computations (Q2 FY 2026-27)
  const advanceTaxData = useMemo(() => {
    const projectedProfit = 8500000; // ~₹85 Lakhs annual profit
    const taxRate = 0.26; // 25% base + 4% health & education cess
    const grossEstimatedTax = projectedProfit * taxRate; // ₹22,10,000

    const totalBuyerTdsCredits = mockBuyerTDSCredits.reduce((sum, b) => sum + b.tdsAmount, 0) + 182657; // ~₹1.84L total credits
    const netEstimatedTax = grossEstimatedTax - totalBuyerTdsCredits; // ₹20,25,500

    // Schedule under Section 211
    const q1Due = netEstimatedTax * 0.15; // 15% by 15 June (Paid)
    const q2Due = netEstimatedTax * 0.45; // 45% cumulative by 15 September
    const q2ChallanPayable = q2Due - q1Due; // Net installment for Q2

    return {
      projectedProfit,
      grossEstimatedTax,
      totalBuyerTdsCredits,
      netEstimatedTax,
      q1Due,
      q2Due,
      q2ChallanPayable,
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Concept Knowledge Modal */}
      <FinancialConceptModal
        conceptId={selectedConceptId}
        onClose={() => setSelectedConceptId(null)}
      />

      {/* Demo Filing Confirmation Modal */}
      {showFilingModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-neutral-200 shadow-elevated max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100">
              <div className="w-9 h-9 rounded-full bg-financial-positive-bg text-financial-positive flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  GSTR-1 Ready for GSTN Submission
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Period: {selectedPeriod} • Acme Textiles Pvt Ltd
                </p>
              </div>
            </div>

            <div className="bg-neutral-50 p-3 rounded-md text-xs space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-500">B2B e-Invoices:</span>
                <span className="font-bold text-brand">{activeGST.gstr1.invoiceCount} invoices</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Taxable Outward Value:</span>
                <span className="font-bold text-neutral-900">{formatCurrency(activeGST.gstr1.totalTaxable)}</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-1 font-bold">
                <span className="text-neutral-700">Total Output Tax Liability:</span>
                <span className="text-financial-positive">{formatCurrency(activeGST.gstr1.totalTax)}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 italic">
              Once submitted, all 12 invoices will auto-reflect in your buyers&apos; GSTR-2B so they can claim seamless ITC without withholding payments.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                onClick={() => setShowFilingModal(false)}
              >
                Close
              </Button>
              <Button
                variant="default"
                size="sm"
                className="text-xs bg-financial-positive hover:bg-financial-positive/90 text-white"
                onClick={() => {
                  setShowFilingModal(false);
                  alert("GSTR-1 filed successfully via GSTN Sandbox API! Digital Signature (DSC) verified.");
                }}
              >
                Simulate Portal Sign & File
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Tax, GST & Corporate ITR Intelligence"
        description="Comprehensive statutory tax command center: Outward GST (GSTR-1 & Rule 46), Corporate Advance Tax schedules (Section 211), and Buyer TDS credit tracking (Section 194Q / Form 26AS)."
        badge={<StatusBadge variant="positive" label="Tax Compliance Active" />}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("gst_mechanics")}
          >
            <BookOpen className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn GST Architecture
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("income_tax_advance_tax")}
          >
            <Building2 className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn Advance Tax & ITR
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="text-xs"
            onClick={() => setSelectedConceptId("buyer_tds_194q")}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-brand" />
            Learn 194Q TDS Credits
          </Button>
          <Button
            variant="default"
            size="sm"
            className="text-xs"
            onClick={() => setShowFilingModal(true)}
          >
            <FileCheck className="w-3.5 h-3.5 mr-1.5" />
            File GSTR-1
          </Button>
        </div>
      </PageHeader>

      {/* Concept Explainer Banner on GST Mechanics */}
      <ConceptExplainerBanner
        conceptId="gst_mechanics"
        onOpenFullModal={(id) => setSelectedConceptId(id)}
      />

      {/* Main 3 Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-neutral-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("gstr1")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "gstr1"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>Outward GST (GSTR-1 & Sales Tax)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("advance_tax")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "advance_tax"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Corporate Advance Tax & ITR-6</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white animate-pulse">
            Q2 Due Today
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("buyer_tds")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === "buyer_tds"
              ? "bg-brand text-white shadow-xs"
              : "bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Buyer TDS Credits (Form 26AS / AIS)</span>
        </button>
      </div>

      {/* TAB 1: OUTWARD GST (GSTR-1) */}
      {activeTab === "gstr1" && (
        <div className="space-y-5">
          {/* Period Selector Bar */}
          <div className="bg-white border border-neutral-200 rounded-lg p-3.5 shadow-card flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand" />
              <span className="text-xs font-semibold text-neutral-900">Tax Filing Period:</span>
              <div className="flex items-center gap-1">
                {mockGSTSummaries.map((g) => (
                  <button
                    key={g.period}
                    type="button"
                    onClick={() => setSelectedPeriod(g.period)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      selectedPeriod === g.period
                        ? "bg-brand text-white font-semibold shadow-xs"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200/80"
                    }`}
                  >
                    {g.period}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-neutral-500">
                Statutory GSTR-1 Deadline: <strong className="text-neutral-900">11th of succeeding month</strong>
              </span>
              <StatusBadge
                variant={activeGST.gstr1.status === "ready" ? "warning" : "positive"}
                label={activeGST.gstr1.status === "ready" ? "Ready for Portal Submission" : "Filed on Portal"}
              />
            </div>
          </div>

          {/* Stat Cards Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Total Taxable Outward Sales
              </span>
              <div className="text-xl font-bold text-brand tabular-nums mt-1">
                {formatCurrency(activeGST.gstr1.totalTaxable)}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                {activeGST.gstr1.invoiceCount} verified B2B e-Invoices
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Total Outward Output Tax
              </span>
              <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
                {formatCurrency(activeGST.gstr1.totalTax)}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                IGST: {formatCurrency(activeGST.gstr1.igst)} • CGST/SGST: {formatCurrency(activeGST.gstr1.cgst * 2)}
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                HSN Tax Slab Mix
              </span>
              <div className="text-xl font-bold text-neutral-900 mt-1">
                5% & 12% Woven Fabric
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                HSN 5208 (Cotton) & HSN 5407 (Synthetic)
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Credit Notes Declared (Table 9)
              </span>
              <div className="text-xl font-bold text-amber-700 tabular-nums mt-1">
                -₹15,400 (Net Tax: -₹770)
              </div>
              <span className="text-[11px] text-amber-800 mt-1 block">
                Arvind Lifestyle #CN-094 adjustment
              </span>
            </div>
          </div>

          {/* GSTR-1 Tables & Breakdown Card */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-neutral-900">
                  GSTR-1 Outward Supplies Summary by Return Table
                </h3>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedConceptId("gstr1_outward")}
                className="text-xs"
              >
                <BookOpen className="w-3.5 h-3.5 mr-1" />
                Explain GSTR-1 Tables
              </Button>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">GSTR-1 Return Table</th>
                    <th className="py-2.5 px-3">Category Description</th>
                    <th className="py-2.5 px-3 text-center">Invoices / Docs</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                    <th className="py-2.5 px-3 text-right">IGST</th>
                    <th className="py-2.5 px-3 text-right">CGST + SGST</th>
                    <th className="py-2.5 px-3 text-right">Total Output Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr className="hover:bg-neutral-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-brand">Table 4A</td>
                    <td className="py-2.5 px-3 font-medium text-neutral-900">
                      B2B Invoices (Inter-State Supplies to Raymond, FabIndia, Page)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">8</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(activeGST.gstr1.totalTaxable * 0.7)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(activeGST.gstr1.igst)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-neutral-300">—</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-neutral-900">{formatCurrency(activeGST.gstr1.igst)}</td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70">
                    <td className="py-2.5 px-3 font-mono font-bold text-brand">Table 4B</td>
                    <td className="py-2.5 px-3 font-medium text-neutral-900">
                      B2B Invoices (Intra-State Supplies within Maharashtra)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">4</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(activeGST.gstr1.totalTaxable * 0.3)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-neutral-300">—</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(activeGST.gstr1.cgst * 2)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-neutral-900">{formatCurrency(activeGST.gstr1.cgst * 2)}</td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 bg-amber-50/30">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-800">Table 9B</td>
                    <td className="py-2.5 px-3 font-medium text-amber-900">
                      Credit / Debit Notes Issued (Registered Taxable Persons)
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-amber-800">1 CN</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-amber-900">-₹15,400</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-amber-900">-₹770</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-neutral-300">—</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-amber-900">-₹770</td>
                  </tr>
                </tbody>
                <tfoot className="bg-neutral-50 border-t border-neutral-200 font-bold">
                  <tr>
                    <td colSpan={3} className="py-2.5 px-3 text-neutral-800">
                      Net Taxable Liability to be declared on GSTN:
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-brand">{formatCurrency(activeGST.gstr1.totalTaxable)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-brand">{formatCurrency(activeGST.gstr1.igst)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-brand">{formatCurrency(activeGST.gstr1.cgst * 2)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-financial-positive font-extrabold">{formatCurrency(activeGST.gstr1.totalTax)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CORPORATE INCOME TAX & ADVANCE TAX (ITR-6) */}
      {activeTab === "advance_tax" && (
        <div className="space-y-5">
          {/* Top Banner on Advance Tax Section 211 */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border border-amber-300 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900">
                    Q2 Advance Tax Installment (45% Cumulative)
                  </span>
                  <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500 text-white">
                    Deadline: 15 September 2026 (Today)
                  </span>
                </div>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Under Section 211 of Income Tax Act, corporate taxpayers must deposit 45% of estimated net tax liability by 15th September.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setSelectedConceptId("income_tax_advance_tax")}
              className="text-xs shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              How Advance Tax Works
            </Button>
          </div>

          {/* Advance Tax Computation Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Projected Annual Net Profit (PBT)
              </span>
              <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
                {formatCurrency(advanceTaxData.projectedProfit)}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Estimated for FY 2026-27 (AY 2027-28)
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Gross Estimated Tax (26%)
              </span>
              <div className="text-xl font-bold text-neutral-900 tabular-nums mt-1">
                {formatCurrency(advanceTaxData.grossEstimatedTax)}
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                25% Corporate Base + 4% HEC
              </span>
            </div>

            <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Less: Form 26AS Buyer TDS
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedConceptId("buyer_tds_194q")}
                  className="text-neutral-400 hover:text-brand"
                  title="Learn how 26AS TDS offsets Advance Tax"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-financial-positive" />
                </button>
              </div>
              <div className="text-xl font-bold text-financial-positive tabular-nums mt-1">
                -{formatCurrency(advanceTaxData.totalBuyerTdsCredits)}
              </div>
              <span className="text-[11px] text-financial-positive font-medium mt-1 block">
                Prepaid tax deducted by buyers (Sec 194Q)
              </span>
            </div>

            <div className="bg-brand-subtle border border-neutral-300 rounded-lg p-4 shadow-card">
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand">
                Q2 Challan 280 Due Today
              </span>
              <div className="text-xl font-bold text-brand tabular-nums mt-1">
                {formatCurrency(advanceTaxData.q2ChallanPayable)}
              </div>
              <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                Pay via Protean NSDL Challan 280
              </span>
            </div>
          </div>

          {/* Statutory 4-Quarter Advance Tax Schedule Card */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Statutory 4-Tranche Advance Tax Schedule (Section 211, Income Tax Act)
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">AY 2027-28 Assessment</span>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Installment</th>
                    <th className="py-2.5 px-3">Statutory Deadline</th>
                    <th className="py-2.5 px-3 text-center">Cumulative % Mandate</th>
                    <th className="py-2.5 px-3 text-right">Cumulative Target</th>
                    <th className="py-2.5 px-3 text-right">Quarter Installment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr className="hover:bg-neutral-50/70">
                    <td className="py-2.5 px-3 font-semibold text-neutral-900">Tranche 1 (Q1)</td>
                    <td className="py-2.5 px-3 font-mono">15 June 2026</td>
                    <td className="py-2.5 px-3 text-center font-mono">15%</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(advanceTaxData.q1Due)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(advanceTaxData.q1Due)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200">
                        Paid (Challan #84920) ✓
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 bg-amber-50/40">
                    <td className="py-2.5 px-3 font-bold text-amber-900">Tranche 2 (Q2)</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-900">15 September 2026 (Today)</td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-900">45%</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-amber-900">{formatCurrency(advanceTaxData.q2Due)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-extrabold text-brand">{formatCurrency(advanceTaxData.q2ChallanPayable)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                        Due Today
                      </span>
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 opacity-70">
                    <td className="py-2.5 px-3 font-semibold text-neutral-700">Tranche 3 (Q3)</td>
                    <td className="py-2.5 px-3 font-mono">15 December 2026</td>
                    <td className="py-2.5 px-3 text-center font-mono">75%</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(advanceTaxData.netEstimatedTax * 0.75)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(advanceTaxData.netEstimatedTax * 0.3)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-600">Upcoming</span>
                    </td>
                  </tr>

                  <tr className="hover:bg-neutral-50/70 opacity-70">
                    <td className="py-2.5 px-3 font-semibold text-neutral-700">Tranche 4 (Q4)</td>
                    <td className="py-2.5 px-3 font-mono">15 March 2027</td>
                    <td className="py-2.5 px-3 text-center font-mono">100%</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(advanceTaxData.netEstimatedTax)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{formatCurrency(advanceTaxData.netEstimatedTax * 0.25)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-100 text-neutral-600">Upcoming</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs text-neutral-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-brand shrink-0 mt-0.5" />
              <div>
                <strong className="text-neutral-900">Penalty Alert (Section 234C): </strong>
                Shortfall in Q2 payment below 45% attracts mandatory simple interest at 1% per month on the deficit for 3 months. Paying ₹6,07,650 today avoids interest.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BUYER TDS CREDITS (SECTION 194Q & FORM 26AS) */}
      {activeTab === "buyer_tds" && (
        <div className="space-y-5">
          {/* Top Explainer Notice */}
          <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-lg flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-brand shrink-0" />
              <div>
                <span className="font-bold text-neutral-900 text-sm">
                  Buyer Statutory TDS Withholding (Section 194Q) & Form 26AS
                </span>
                <p className="text-neutral-600 mt-0.5">
                  Large corporate buyers deduct 0.1% TDS on cumulative purchases above ₹50 Lakhs. This is prepaid income tax you claim as a credit in your annual ITR-6 or to reduce Advance Tax.
                </p>
              </div>
            </div>

            <Button
              variant="default"
              size="sm"
              onClick={() => setSelectedConceptId("buyer_tds_194q")}
              className="text-xs shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 mr-1" />
              Why Buyers Deduct TDS
            </Button>
          </div>

          {/* Buyer TDS Ledger Table */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-card overflow-hidden">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Verified Buyer TDS Certificates & Withholding Ledger
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Reconciled against Income Tax Annual Information Statement (AIS)
                </p>
              </div>
              <span className="text-xs font-mono font-semibold text-financial-positive bg-green-50 px-2 py-1 rounded border border-green-200">
                100% Reconciled to Form 26AS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold">
                  <tr>
                    <th className="py-2.5 px-4">Enterprise Buyer & TAN</th>
                    <th className="py-2.5 px-4">Invoice # & Date</th>
                    <th className="py-2.5 px-4 text-right">Gross Sales Billed</th>
                    <th className="py-2.5 px-4 text-center">Section & Rate</th>
                    <th className="py-2.5 px-4 text-right">TDS Credit Amount</th>
                    <th className="py-2.5 px-4 text-center">Quarter</th>
                    <th className="py-2.5 px-4 text-center">ITR Claim Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {mockBuyerTDSCredits.map((credit) => (
                    <tr key={credit.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-neutral-900">{credit.buyerName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          TAN: {credit.buyerTan} • PAN: {credit.buyerPan}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-mono text-neutral-700">
                        <div>{credit.invoiceNumber}</div>
                        <div className="text-[10px] text-neutral-400">{credit.invoiceDate}</div>
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums font-medium text-neutral-900">
                        {formatCurrency(credit.grossAmount)}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-neutral-100 text-neutral-700 font-bold border border-neutral-200">
                          Sec 194Q @ {credit.tdsRate}%
                        </span>
                      </td>

                      <td className="py-2.5 px-4 text-right tabular-nums font-bold text-financial-positive">
                        +{formatCurrency(credit.tdsAmount)}
                      </td>

                      <td className="py-2.5 px-4 text-center font-mono text-neutral-600">
                        {credit.quarter}
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-green-100 text-green-800 border border-green-200 flex items-center justify-center gap-1 w-fit mx-auto">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Matched in 26AS</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
