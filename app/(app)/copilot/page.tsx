"use client";

import React, { useState, useRef, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Send,
  Bot,
  Scale,
  BadgePercent,
} from "lucide-react";
import {
  mockTODSchemes,
  mockTODCreditNotes,
  mockInvoices,
} from "@/lib/mock-data";
import { calculateSchemeProgress, getTODAnalytics } from "@/lib/tod-engine";

interface ConceptCardData {
  title: string;
  act: string;
  entry: string;
  deadline: string;
  realWorldExample: string;
}

interface AdvanceTaxCardData {
  projectedProfit: number;
  estimatedTaxRate: string;
  grossTax: number;
  tdsCredits: number;
  netTax: number;
  q2PayableToday: number;
}

interface CashStripData {
  scheduledAR: number;
  advances: number;
  totalInflow: number;
  confidence: string;
}

interface OverdueItem {
  inv: string;
  customer: string;
  due: string;
  amount: number;
  age: string;
}

interface TODSchemeCardData {
  customer: string;
  schemeName: string;
  target: string;
  achieved: string;
  progress: string;
  todRate: string;
  potentialTod: number;
  settledTod: number;
  status: string;
  invoicesCount: number;
}

interface TODAchievementItem {
  customer: string;
  scheme: string;
  target: string;
  achieved: string;
  progress: string;
  status: string;
  potentialTod: number;
}

type ArtifactData =
  | ConceptCardData
  | AdvanceTaxCardData
  | CashStripData
  | OverdueItem[]
  | TODSchemeCardData
  | TODAchievementItem[];

interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  timestamp: string;
  text: string;
  thinkingSteps?: string[];
  artifact?: {
    type:
      | "table"
      | "cash_strip"
      | "overdue_list"
      | "concept_card"
      | "advance_tax_card"
      | "tod_scheme_card"
      | "tod_achievement_list";
    data?: ArtifactData;
  };
}

const suggestedPrompts = [
  "ABC Metals ka TOD kitna hua aur kitna settle hua?",
  "Kaunse customers ka TOD target complete ho gaya?",
  "Which TOD credit notes are pending approval?",
  "Show me customers whose TOD target is more than 80% complete",
  "Which invoices are contributing to ABC Metals' TOD?",
  "How does a Credit Note legally work under GST Section 34?",
  "Explain Corporate Advance Tax (ITR) deadlines and Section 211 rules",
  "Explain Buyer TDS under Section 194Q and how it offsets ITR",
];

export default function CopilotPage() {
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStep, setThinkingStep] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "copilot",
      timestamp: "15:46",
      text: "Hello Aditya. I am your VittaOS Financial & Tax Copilot. I analyze real-time sales ledgers, HDFC bank credit feeds, and Indian statutory compliance rules (CGST Act, Income Tax Act, Form 26AS, Section 194Q, and Section 211).\n\nAsk me any operational question about customer payment matching or any theoretical/legal question on how taxes, credit notes, and ITR work!",
    },
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Copilot Response Generator (Handles both live operational data & theoretical tax/accounting queries)
  const generateCopilotResponse = (query: string): ChatMessage => {
    const q = query.toLowerCase();
    const timeNow = "15:48";

    // TOD Query 1: ABC Metals TOD & Invoices
    if (q.includes("abc metals") || (q.includes("abc") && (q.includes("tod") || q.includes("target") || q.includes("kitna")))) {
      const abcScheme = mockTODSchemes.find((s) => s.id === "tod-scheme-001")!;
      const calc = calculateSchemeProgress(abcScheme, mockInvoices, mockTODCreditNotes);

      if (q.includes("invoice") || q.includes("bill") || q.includes("contribut")) {
        return {
          id: `copilot-${Date.now()}`,
          sender: "copilot",
          timestamp: timeNow,
          text: `**Invoices Contributing to ABC Metals' Commercial TOD (7,850 MT Total):**\n\n` +
            `• **INV-1021** (12-May-2026): 1,500 MT @ ₹70/MT billing rate (Potential TOD: ₹15,000)\n` +
            `• **INV-1048** (25-Jun-2026): 2,000 MT @ ₹70/MT billing rate (Potential TOD: ₹20,000)\n` +
            `• **INV-1087** (28-Jul-2026): 3,000 MT @ ₹70/MT billing rate (Potential TOD: ₹30,000)\n` +
            `• **INV-1124** (20-Aug-2026): 1,350 MT @ ₹70/MT billing rate (Potential TOD: ₹13,500)\n\n` +
            `**Accumulated Total**: **7,850 MT** (78.5% towards 10,000 MT target). Potential TOD rebate accrued: **₹78,500** at ₹10/MT. Original billing invoices remain unaffected.`,
        };
      }

      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: `**ABC Metals Commercial TOD Status (Backend Verified):**\n\n` +
          `• **Active Scheme**: FY 2026-27 Volume Scheme\n` +
          `• **Agreed Target**: **10,000 MT**\n` +
          `• **Achieved Volume**: **${calc.achievedQuantity.toLocaleString("en-IN")} MT** (78.5% complete)\n` +
          `• **Remaining to Target**: **${calc.remaining.toLocaleString("en-IN")} MT**\n` +
          `• **Agreed TOD Rate**: **₹10 / MT**\n` +
          `• **Potential Accrued TOD**: **${formatCurrency(calc.totalPotentialTod)}**\n` +
          `• **Settled TOD**: **${formatCurrency(calc.settledTod)}** (Settlement triggers upon reaching 10,000 MT)\n\n` +
          `Original invoices are raised at ₹70/MT. When the target of 10,000 MT is reached, an agreed Credit Note of ₹1,00,000 will be created to settle the commercial discount.`,
        artifact: {
          type: "tod_scheme_card",
          data: {
            customer: "ABC Metals",
            schemeName: "FY 2026-27 Volume Scheme",
            target: "10,000 MT",
            achieved: `${calc.achievedQuantity.toLocaleString("en-IN")} MT`,
            progress: `${calc.progressPercentage}%`,
            todRate: "₹10/MT",
            potentialTod: calc.totalPotentialTod,
            settledTod: calc.settledTod,
            status: "Active Progress",
            invoicesCount: calc.qualifyingInvoices.length,
          },
        },
      };
    }

    // TOD Query 2: Which customers completed target
    if (q.includes("complete") || q.includes("achieved") || q.includes("target complete") || q.includes("complete ho gaya") || q.includes("target kitna hai")) {
      const achievedSchemes = mockTODSchemes
        .map((s) => ({ s, calc: calculateSchemeProgress(s, mockInvoices, mockTODCreditNotes) }))
        .filter(({ calc }) => calc.isTargetAchieved);

      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: `**Customers whose TOD Target is Complete / Achieved:**\n\n` +
          achievedSchemes.map(({ s, calc }) =>
            `• **${s.customerName}**: Achieved ${s.todType === "quantity" ? `${calc.achievedQuantity.toLocaleString("en-IN")} MT` : formatCurrency(calc.achievedTurnover)} ` +
            `against target of ${s.todType === "quantity" ? `${s.target.toLocaleString("en-IN")} MT` : formatCurrency(s.target)} ` +
            `(${calc.progressPercentage}%). Status: **${calc.computedStatus.toUpperCase()}**.`
          ).join("\n") +
          `\n\n*Note: Sharma Auto Components has an eligible Credit Note of ₹98,400 pending CFO authorization.*`,
        artifact: {
          type: "tod_achievement_list",
          data: achievedSchemes.map(({ s, calc }) => ({
            customer: s.customerName,
            scheme: s.schemeName,
            target: s.todType === "quantity" ? `${s.target.toLocaleString("en-IN")} MT` : formatCurrency(s.target),
            achieved: s.todType === "quantity" ? `${calc.achievedQuantity.toLocaleString("en-IN")} MT` : formatCurrency(calc.achievedTurnover),
            progress: `${calc.progressPercentage}%`,
            status: calc.computedStatus,
            potentialTod: calc.totalPotentialTod,
          })),
        },
      };
    }

    // TOD Query 3: Credit notes pending approval
    if (q.includes("pending approval") || (q.includes("credit note") && q.includes("pending"))) {
      const pendingCNs = mockTODCreditNotes.filter((c) => c.status === "pending_approval");
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: `**TOD Credit Notes Pending Approval (${pendingCNs.length}):**\n\n` +
          pendingCNs.map((cn) =>
            `• **${cn.creditNoteNumber}** for **${cn.customerName}**\n` +
            `  Scheme: ${cn.schemeName}\n` +
            `  Amount: **${formatCurrency(cn.grossTodAmount)}**\n` +
            `  Volume Covered: ${cn.qualifyingQuantity.toLocaleString("en-IN")} MT\n` +
            `  Requested By: ${cn.requestedBy} on ${cn.requestedDate}\n` +
            `  Linked Invoices: ${cn.linkedInvoiceNumbers.join(", ")}`
          ).join("\n\n") +
          `\n\nThis credit note is waiting for CFO authorization before posting to the customer ledger.`,
      };
    }

    // TOD Query 4: Customers > 80% complete
    if (q.includes("80%") || q.includes("80 percent") || q.includes("more than 80") || q.includes("above 80")) {
      const highProgress = mockTODSchemes
        .map((s) => ({ s, calc: calculateSchemeProgress(s, mockInvoices, mockTODCreditNotes) }))
        .filter(({ calc }) => calc.progressPercentage >= 80);

      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: `**Customers with TOD Target Fulfillment > 80%:**\n\n` +
          highProgress.map(({ s, calc }) =>
            `• **${s.customerName}** (${calc.progressPercentage}%)\n` +
            `  Target: ${s.todType === "quantity" ? `${s.target.toLocaleString("en-IN")} MT` : formatCurrency(s.target)} | ` +
            `Achieved: ${s.todType === "quantity" ? `${calc.achievedQuantity.toLocaleString("en-IN")} MT` : formatCurrency(calc.achievedTurnover)} | ` +
            `Potential TOD: **${formatCurrency(calc.totalPotentialTod)}**`
          ).join("\n\n"),
        artifact: {
          type: "tod_achievement_list",
          data: highProgress.map(({ s, calc }) => ({
            customer: s.customerName,
            scheme: s.schemeName,
            target: s.todType === "quantity" ? `${s.target.toLocaleString("en-IN")} MT` : formatCurrency(s.target),
            achieved: s.todType === "quantity" ? `${calc.achievedQuantity.toLocaleString("en-IN")} MT` : formatCurrency(calc.achievedTurnover),
            progress: `${calc.progressPercentage}%`,
            status: calc.computedStatus,
            potentialTod: calc.totalPotentialTod,
          })),
        },
      };
    }

    // TOD Query 5: Overall TOD issued / pending / FY
    if (q.includes("kitna tod") || q.includes("tod pending") || q.includes("tod issue") || (q.includes("tod") && (q.includes("financial year") || q.includes("month")))) {
      const analytics = getTODAnalytics(mockTODSchemes, mockInvoices, mockTODCreditNotes);
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: `**Commercial TOD Executive Summary (FY 2026-27):**\n\n` +
          `• **Gross Billed Sales (FY)**: **${formatCurrency(analytics.grossSalesFY)}**\n` +
          `• **TOD Rebates Issued (YTD)**: **${formatCurrency(analytics.todIssuedThisFY)}**\n` +
          `• **Net Commercial Revenue**: **${formatCurrency(analytics.netSalesFY)}**\n` +
          `• **Average TOD Discount**: **${analytics.averageTodPercentage}%**\n` +
          `• **Active Schemes**: **${analytics.activeSchemesCount}** accounts\n` +
          `• **TOD Pending Settlement**: **${formatCurrency(analytics.todPendingSettlement)}** across active accounts\n` +
          `• **TOD Issued This Month (Aug)**: **${formatCurrency(analytics.todIssuedThisMonth)}**`,
      };
    }

    // 1. Credit Notes Legal & Practical Context
    if (q.includes("credit note") || q.includes("section 34") || q.includes("cn")) {
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: "Under Indian GST law, a Credit Note is governed by **Section 34(1) of the CGST Act, 2017 read with Rule 53**.\n\n**Why is it issued?**\n1. Post-sale price revisions or negotiated commercial discounts.\n2. Goods returned by the buyer due to specifications/defects.\n3. Excess quantity billed on the original tax invoice.\n\n**Statutory & Accounting Impact:**\n• **Reduces Output Tax Liability**: You declare it in Table 9B of GSTR-1, which directly reduces your cash tax payable.\n• **Reduces Accounts Receivable**: In VittaOS, the Credit Note automatically adjusts the open balance (e.g., Arvind Lifestyle #CN-094 for ₹15,400 reduced the open balance from ₹3,65,400 to ₹3,50,000).\n• **Double Entry**: Dr. Sales Returns / Rate Variance A/c & Dr. Output GST A/c | Cr. Customer Subsidiary Ledger.\n• **Deadline**: Must be reported in GSTR-1 before 30th November following the end of the financial year.",
        artifact: {
          type: "concept_card",
          data: {
            title: "Credit Note Statutory Profile",
            act: "CGST Act, 2017 — Section 34(1)",
            entry: "Dr. Sales Returns & Output GST | Cr. Trade Receivables",
            deadline: "30th November following FY end",
            realWorldExample: "Arvind Lifestyle: Invoice ₹3,65,400 - CN ₹15,400 = Open Balance ₹3,50,000",
          },
        },
      };
    }

    // 2. Advance Tax & Corporate ITR (Section 211)
    if (q.includes("advance tax") || q.includes("itr") || q.includes("section 211") || q.includes("234b") || q.includes("234c")) {
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: "Corporate taxpayers are subject to the **'Pay As You Earn'** scheme governed by **Section 208 and Section 211 of the Income Tax Act, 1961**.\n\n**Advance Tax Installment Schedule:**\n• **15th June (Q1)**: Minimum 15% of estimated net annual tax (Paid ✓).\n• **15th September (Q2 - Today)**: Minimum 45% cumulative net tax. For Acme Textiles, net challan payable today is **₹6,07,650**.\n• **15th December (Q3)**: Minimum 75% cumulative net tax.\n• **15th March (Q4)**: 100% of estimated net tax.\n\n**Penalties for Shortfall:**\n• **Section 234C**: 1% simple interest per month on the shortfall under each installment.\n• **Section 234B**: 1% per month if total advance tax paid before 31st March is less than 90% of assessed tax.\n\n**Form 26AS Offset**: You are legally entitled to subtract all 0.1% Buyer TDS credits (Section 194Q) when computing your advance tax installment!",
        artifact: {
          type: "advance_tax_card",
          data: {
            projectedProfit: 8500000,
            estimatedTaxRate: "26% (25% Base + 4% HEC)",
            grossTax: 2210000,
            tdsCredits: 184500,
            netTax: 2025500,
            q2PayableToday: 607650,
          },
        },
      };
    }

    // 3. Buyer TDS under Section 194Q & Form 26AS
    if (q.includes("194q") || q.includes("buyer tds") || q.includes("26as") || q.includes("withholding")) {
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: "**Section 194Q of the Income Tax Act, 1961** mandates large enterprise buyers to deduct tax at source on purchases of goods:\n\n**Trigger Criteria:**\n1. Buyer's turnover exceeded ₹10 Crores in the preceding financial year.\n2. Total purchases from you exceed ₹50 Lakhs in the current financial year.\n3. Rate: **0.1%** of the invoice value exceeding ₹50 Lakhs.\n\n**How You Claim It Back:**\n• The buyer deposits this TDS to the government using Challan 281 and files quarterly Form 26Q.\n• It automatically populates your **Form 26AS** and **Annual Information Statement (AIS)** under your PAN (`AABCA1234F`).\n• In VittaOS, the 0.1% deduction is debited to **TDS Receivable (Current Asset)**, ensuring the customer's open balance clears to ₹0.00 without treating the deduction as a revenue loss.\n• When filing annual corporate ITR (ITR-6), this credit directly offsets your final tax liability or is refunded with interest under Section 244A.",
      };
    }

    // 4. Partial Payments & Running Balance Mechanics
    if (q.includes("partial") || q.includes("running balance") || q.includes("advance payment") || q.includes("milestone")) {
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: "In business-to-business commerce, buyers frequently make **Partial Payments** (e.g. 30% order advance, 60% upon bill of lading, 10% retainage after delivery inspection).\n\n**How VittaOS Handles Partial Inflows:**\n1. When FabIndia wires a ₹45,000 partial payment against Invoice INV/2026-27/044 (Open Balance: ₹1,83,750), the system matches the HDFC UTR.\n2. Rather than binary 'paid/unpaid' states, the system updates the invoice status to **'Partially Paid'**.\n3. The Open Balance is reduced to exactly **₹1,38,750**.\n4. An immutable line event is recorded in the **Payment Ledger (Running Balance)**.\n5. When subsequent remittances arrive, the balance reduces incrementally. Only when the open balance reaches exactly ₹0.00 does the engine auto-close the invoice.",
      };
    }

    // 5. 30-Day Collections Forecast
    if (q.includes("cash flow") || q.includes("30 days") || q.includes("collections") || q.includes("forecast") || q.includes("inflow")) {
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: "Based on verified customer invoice due dates and contractual milestone terms over the next 30 days (25 Aug – 24 Sep 2026), projected cash inflows remain exceptionally healthy:\n\n• **Scheduled Customer AR Inflows**: +₹13,42,500 across 9 due invoices.\n• **Contractual Retainage & Staged Advances**: +₹4,80,000.\n• **Total Projected Cash Inflow**: **+₹18,22,500**.\n• **Historical Inflow Realization Rate**: **95.4%**.",
        artifact: {
          type: "cash_strip",
          data: {
            scheduledAR: 1342500,
            advances: 480000,
            totalInflow: 1822500,
            confidence: "98.4%",
          },
        },
      };
    }

    // 6. Overdue Invoices
    if (q.includes("overdue") || q.includes("debtor") || q.includes("receivable") || q.includes("aging")) {
      return {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        timestamp: timeNow,
        text: "There are currently 2 customer accounts with overdue balances totaling ₹5,66,090 past their 30-day net credit window. Automated WhatsApp reminders referencing the genuine open balances (net of Credit Notes) are queued:",
        artifact: {
          type: "overdue_list",
          data: [
            { inv: "INV/2026-27/036", customer: "Arvind Lifestyle Brands Ltd", due: "27 Aug 2026", amount: 219450, age: "32 days" },
            { inv: "INV/2026-27/033", customer: "Shree Shanti Silks Wholesale", due: "03 Aug 2026", amount: 170240, age: "42 days" },
            { inv: "INV/2026-27/029", customer: "Vardhan Garments Wholesalers", due: "04 Aug 2026", amount: 176400, age: "51 days" },
          ],
        },
      };
    }

    // Default Outward GST & Realization
    return {
      id: `copilot-${Date.now()}`,
      sender: "copilot",
      timestamp: timeNow,
      text: "For the current August 2026 period:\n\n• **Billed Sales Revenue**: ₹14,85,000 across 12 e-Invoices.\n• **Cash Inflows Reconciled**: ₹12,40,000 settled via HDFC Bank.\n• **Outward GST Liability (GSTR-1)**: ₹1,34,650 across HSN 5208 (5%) and HSN 5407 (12%).\n• **Advance Tax Status**: Q2 installment of ₹6,07,650 due today (15th September).\n\nAsk me about any specific customer invoice, UTR remittance, or Indian statutory tax section!",
    };
  };

  const handleSendMessage = (queryText?: string) => {
    const text = queryText || inputQuery;
    if (!text.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: "15:47",
      text: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsThinking(true);
    setThinkingStep("Accessing sales ledger, statutory tax rules & HDFC bank feeds...");

    setTimeout(() => {
      setThinkingStep("Evaluating Section 34 CGST Act, Section 211 ITR & open balances...");
    }, 500);

    setTimeout(() => {
      setThinkingStep("Synthesizing verified financial intelligence response...");
    }, 1100);

    setTimeout(() => {
      const response = generateCopilotResponse(text);
      setMessages((prev) => [...prev, response]);
      setIsThinking(false);
      setThinkingStep("");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Page Header */}
      <PageHeader
        title="Financial & Tax Copilot AI"
        description="Autonomous reasoning engine for customer payment matching, running balance audits, and plain-English explanations of Indian tax law (GST, Advance Tax, ITR, and Section 194Q TDS)."
        badge={<StatusBadge variant="brand" label="Financial Reasoning Active" />}
      />

      {/* Main Chat Container */}
      <div className="flex-1 bg-white border border-neutral-200 rounded-lg shadow-card flex flex-col overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {messages.map((msg) => {
            const isUser = msg.sender === "user";

            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shrink-0 shadow-subtle mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-lg p-4 text-xs space-y-3 ${
                    isUser
                      ? "bg-brand text-white"
                      : "bg-neutral-50 text-neutral-800 border border-neutral-200"
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center justify-between gap-4 text-[10px] text-neutral-400 font-medium">
                    <span className={isUser ? "text-slate-200" : "text-brand font-semibold"}>
                      {isUser ? "You (Aditya Sharma)" : "VittaOS Copilot AI"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Body Text */}
                  <div className="whitespace-pre-line leading-relaxed text-xs">
                    {msg.text}
                  </div>

                  {/* Artifacts if present */}
                  {msg.artifact && (
                    <div className="pt-2 border-t border-neutral-200/80">
                      {/* Concept Card Artifact */}
                      {msg.artifact.type === "concept_card" && msg.artifact.data && (
                        <div className="bg-white p-3 rounded-md border border-neutral-200 space-y-2 text-[11px]">
                          <div className="flex items-center gap-1.5 font-bold text-brand">
                            <Scale className="w-3.5 h-3.5" />
                            <span>Statutory Framework: {(msg.artifact.data as ConceptCardData).act}</span>
                          </div>
                          <div className="p-2 bg-neutral-50 rounded font-mono text-[10px] space-y-1">
                            <div>Journal: <strong className="text-brand">{(msg.artifact.data as ConceptCardData).entry}</strong></div>
                            <div>Filing Deadline: <strong className="text-neutral-700">{(msg.artifact.data as ConceptCardData).deadline}</strong></div>
                          </div>
                          <p className="text-[10px] text-neutral-500 italic">
                            Case: {(msg.artifact.data as ConceptCardData).realWorldExample}
                          </p>
                        </div>
                      )}

                      {/* Advance Tax Card Artifact */}
                      {msg.artifact.type === "advance_tax_card" && msg.artifact.data && (
                        <div className="bg-white p-3 rounded-md border border-amber-200 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between font-bold text-amber-900">
                            <span>Q2 Advance Tax Computation (Section 211)</span>
                            <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded">Due Today</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div className="bg-neutral-50 p-1.5 rounded">
                              <span className="text-neutral-500 block">Gross Tax (26%):</span>
                              <strong>{formatCurrency((msg.artifact.data as AdvanceTaxCardData).grossTax)}</strong>
                            </div>
                            <div className="bg-neutral-50 p-1.5 rounded">
                              <span className="text-neutral-500 block">Less: 26AS TDS Credits:</span>
                              <strong className="text-financial-positive">-{formatCurrency((msg.artifact.data as AdvanceTaxCardData).tdsCredits)}</strong>
                            </div>
                          </div>
                          <div className="p-2 bg-brand-subtle rounded flex justify-between items-center font-bold text-brand">
                            <span>Challan 280 Payable Today:</span>
                            <span className="text-sm">{formatCurrency((msg.artifact.data as AdvanceTaxCardData).q2PayableToday)}</span>
                          </div>
                        </div>
                      )}

                      {/* Cash Strip Artifact */}
                      {msg.artifact.type === "cash_strip" && (
                        <div className="bg-white p-3.5 rounded-md border border-neutral-200 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-brand">
                            <span>30-Day Inflows Schedule (25 Aug – 24 Sep)</span>
                            <StatusBadge variant="positive" label="98.4% Confidence" size="sm" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-neutral-50 p-2 rounded">
                              <span className="text-[10px] text-neutral-500 block">Scheduled AR</span>
                              <strong className="text-brand tabular-nums text-xs">
                                +{formatCurrency(1342500)}
                              </strong>
                            </div>
                            <div className="bg-neutral-50 p-2 rounded">
                              <span className="text-[10px] text-neutral-500 block">Milestones & Advances</span>
                              <strong className="text-financial-positive tabular-nums text-xs">
                                +{formatCurrency(480000)}
                              </strong>
                            </div>
                            <div className="bg-financial-positive-bg/50 p-2 rounded border border-financial-positive-border">
                              <span className="text-[10px] text-financial-positive-text block">Total Expected</span>
                              <strong className="text-financial-positive tabular-nums text-xs">
                                +{formatCurrency(1822500)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Overdue List Artifact */}
                      {msg.artifact.type === "overdue_list" && Array.isArray(msg.artifact.data) && (
                        <div className="bg-white rounded-md border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                          {(msg.artifact.data as OverdueItem[]).map((item) => (
                            <div key={item.inv} className="p-2.5 flex items-center justify-between hover:bg-neutral-50 text-[11px]">
                              <div>
                                <div className="font-semibold text-neutral-900">{item.customer}</div>
                                <div className="text-[10px] text-neutral-400 font-mono">
                                  {item.inv} • Due: {item.due} ({item.age})
                                </div>
                              </div>
                              <div className="text-right tabular-nums">
                                <div className="font-bold text-financial-destructive">{formatCurrency(item.amount)}</div>
                                <span className="text-[10px] text-brand font-medium cursor-pointer hover:underline">
                                  Send WhatsApp Reminder →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* TOD Scheme Card Artifact */}
                      {msg.artifact.type === "tod_scheme_card" && (
                        <div className="bg-white p-3.5 rounded-md border border-neutral-200 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-semibold text-brand">
                            <div className="flex items-center gap-1.5">
                              <BadgePercent className="w-3.5 h-3.5" />
                              <span>{(msg.artifact.data as TODSchemeCardData).customer} — TOD Commercial Profile</span>
                            </div>
                            <StatusBadge variant="brand" label={(msg.artifact.data as TODSchemeCardData).status} size="sm" />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                            <div className="bg-neutral-50 p-2 rounded">
                              <span className="text-[10px] text-neutral-500 block">Target</span>
                              <strong className="text-neutral-800">{(msg.artifact.data as TODSchemeCardData).target}</strong>
                            </div>
                            <div className="bg-neutral-50 p-2 rounded">
                              <span className="text-[10px] text-neutral-500 block">Achieved</span>
                              <strong className="text-brand">{(msg.artifact.data as TODSchemeCardData).achieved}</strong>
                            </div>
                            <div className="bg-neutral-50 p-2 rounded">
                              <span className="text-[10px] text-neutral-500 block">Rate</span>
                              <strong className="text-neutral-800">{(msg.artifact.data as TODSchemeCardData).todRate}</strong>
                            </div>
                            <div className="bg-neutral-50 p-2 rounded">
                              <span className="text-[10px] text-neutral-500 block">Potential TOD</span>
                              <strong className="text-brand">{formatCurrency((msg.artifact.data as TODSchemeCardData).potentialTod)}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TOD Achievement List Artifact */}
                      {msg.artifact.type === "tod_achievement_list" && Array.isArray(msg.artifact.data) && (
                        <div className="bg-white rounded-md border border-neutral-200 overflow-hidden divide-y divide-neutral-100">
                          {(msg.artifact.data as TODAchievementItem[]).map((item) => (
                            <div key={item.customer} className="p-2.5 flex items-center justify-between hover:bg-neutral-50 text-[11px]">
                              <div>
                                <div className="font-semibold text-neutral-900">{item.customer}</div>
                                <div className="text-[10px] text-neutral-500 font-mono">
                                  {item.scheme} • Target: {item.target} (Achieved: {item.achieved})
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-brand">{item.progress}</div>
                                <span className="text-[10px] text-emerald-700 font-medium">
                                  {formatCurrency(item.potentialTod)} Rebate
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Thinking Pipeline Indicator */}
          {isThinking && (
            <div className="flex gap-3.5 justify-start">
              <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center shrink-0 shadow-subtle animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-xs space-y-1.5 min-w-[260px] animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-brand font-semibold text-[11px]">
                  <div className="w-2 h-2 rounded-full bg-brand animate-ping" />
                  <span>VittaOS Reasoning Pipeline</span>
                </div>
                <p className="text-neutral-500 font-mono text-[10px]">{thinkingStep}</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-200 overflow-x-auto flex items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-brand" /> Suggestions:
          </span>
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-neutral-200/70 border border-neutral-200 text-neutral-700 whitespace-nowrap transition-colors hover:border-brand shrink-0 text-[11px]"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-neutral-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask about payments, credit notes, 194Q TDS, Advance Tax, or customer balances..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            className="flex-1 px-3.5 py-2 text-xs bg-neutral-50 hover:bg-neutral-100/60 focus:bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
          />
          <Button
            type="button"
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isThinking}
            size="sm"
            className="h-9 px-4 text-xs font-semibold"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            <span>Send</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
