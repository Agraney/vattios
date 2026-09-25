"use client";

import React, { useState } from "react";
import { FINANCIAL_KNOWLEDGE_BASE } from "@/lib/financial-knowledge-base";
import {
  X,
  BookOpen,
  Scale,
  ArrowLeftRight,
  Sparkles,
  AlertCircle,
  Clock,
} from "lucide-react";

interface ConceptModalProps {
  conceptId: string | null;
  onClose: () => void;
}

export function FinancialConceptModal({ conceptId, onClose }: ConceptModalProps) {
  const [activeTab, setActiveTab] = useState<"practice" | "legal" | "accounting" | "example">("practice");

  if (!conceptId) return null;
  const concept = FINANCIAL_KNOWLEDGE_BASE[conceptId];
  if (!concept) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-elevated max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-subtle text-brand flex items-center justify-center shrink-0 mt-0.5 border border-neutral-200">
              <BookOpen className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand/10 text-brand">
                  {concept.category}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  Regulatory & Concept Master
                </span>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mt-1">
                {concept.title}
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                {concept.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Executive Summary Card */}
        <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 text-xs text-neutral-700 leading-relaxed font-medium">
          💡 <span className="font-semibold text-neutral-900">Executive Summary: </span>
          {concept.summary}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-b border-neutral-200 pb-2 overflow-x-auto text-xs">
          {[
            { id: "practice", label: "How It Works", icon: BookOpen },
            { id: "legal", label: "Statutory Law & Rules", icon: Scale },
            { id: "accounting", label: "Double-Entry Impact", icon: ArrowLeftRight },
            { id: "example", label: "Real Enterprise Case", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-brand text-white shadow-xs"
                    : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: How It Works */}
        {activeTab === "practice" && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-neutral-900 uppercase tracking-wider text-[11px]">
              Business Mechanics & Execution Steps
            </h4>
            <ul className="space-y-2.5">
              {concept.howItWorks.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 text-neutral-600 leading-relaxed">
                  <div className="w-5 h-5 rounded-full bg-brand-subtle text-brand font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <span>{step}</span>
                </li>
              ))}
            </ul>

            {concept.proTips.length > 0 && (
              <div className="bg-financial-warning-bg/40 border border-financial-warning-border p-3 rounded-lg mt-4 space-y-1">
                <span className="text-[11px] font-bold text-financial-warning-text flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertCircle className="w-3.5 h-3.5" /> CFO Best Practice & Pro-Tip
                </span>
                {concept.proTips.map((tip, i) => (
                  <p key={i} className="text-xs text-neutral-700 leading-relaxed">
                    • {tip}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Legal & Statutory Framework */}
        {activeTab === "legal" && (
          <div className="space-y-4 text-xs">
            <div className="bg-neutral-50 p-3.5 rounded-lg border border-neutral-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Governing Legislation
                </span>
                <span className="text-[11px] font-mono font-bold text-brand bg-white px-2 py-0.5 rounded border border-neutral-200">
                  {concept.regulatoryFramework.sectionOrRule}
                </span>
              </div>
              <div className="text-sm font-bold text-neutral-900">
                {concept.regulatoryFramework.lawOrAct}
              </div>
              <p className="text-xs text-neutral-600 italic border-l-2 border-brand pl-3 py-1 bg-white/60 rounded-r">
                &ldquo;{concept.regulatoryFramework.citation}&rdquo;
              </p>
            </div>

            {concept.regulatoryFramework.complianceDeadlines && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-200 text-blue-900">
                <Clock className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[11px] uppercase tracking-wider block">
                    Statutory Timelines & Deadlines
                  </span>
                  <p className="text-xs text-neutral-700 mt-0.5">
                    {concept.regulatoryFramework.complianceDeadlines}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Double-Entry Impact */}
        {activeTab === "accounting" && (
          <div className="space-y-4 text-xs">
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <div className="bg-neutral-100 p-2.5 border-b border-neutral-200 font-bold text-neutral-800 text-[11px] uppercase tracking-wider">
                Double-Entry General Ledger Posting
              </div>
              <div className="p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <span className="font-semibold text-neutral-700">Debit (+)</span>
                  <span className="font-mono font-bold text-brand">{concept.accountingTreatment.debitAccount}</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-neutral-50 border border-neutral-200">
                  <span className="font-semibold text-neutral-700">Credit (-)</span>
                  <span className="font-mono font-bold text-brand">{concept.accountingTreatment.creditAccount}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              <span className="font-semibold text-neutral-900">Accounting Rationale: </span>
              {concept.accountingTreatment.explanation}
            </p>
          </div>
        )}

        {/* Tab 4: Real Enterprise Case */}
        {activeTab === "example" && (
          <div className="space-y-3 text-xs">
            <div className="bg-brand-subtle/50 p-4 rounded-lg border border-neutral-200 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand block">
                Enterprise Case Study (Acme Textiles Pvt Ltd)
              </span>
              <p className="text-xs text-neutral-800 leading-relaxed">
                {concept.realWorldScenario}
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md text-xs font-semibold bg-brand text-white hover:bg-brand-hover transition-colors"
          >
            Got it, close
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper Trigger Button for any screen to open the concept modal.
 */
export function ConceptExplainerButton({
  conceptId,
  label = "Explain how this works",
  className = "",
  onClick,
}: {
  conceptId: string;
  label?: string;
  className?: string;
  onClick: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(conceptId)}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 border border-neutral-200 transition-colors shadow-2xs ${className}`}
      title="View complete financial, accounting, and Indian legal context"
    >
      <BookOpen className="w-3 h-3 text-brand" />
      <span>{label}</span>
    </button>
  );
}
