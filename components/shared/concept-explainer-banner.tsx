"use client";

import React, { useState } from "react";
import { FINANCIAL_KNOWLEDGE_BASE } from "@/lib/financial-knowledge-base";
import { BookOpen, ChevronDown, ChevronUp, Scale, ArrowRight, Sparkles } from "lucide-react";

interface ConceptExplainerBannerProps {
  conceptId: string;
  onOpenFullModal?: (id: string) => void;
  defaultExpanded?: boolean;
}

export function ConceptExplainerBanner({
  conceptId,
  onOpenFullModal,
  defaultExpanded = false,
}: ConceptExplainerBannerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const concept = FINANCIAL_KNOWLEDGE_BASE[conceptId];

  if (!concept) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-neutral-50 border border-blue-200/80 rounded-lg p-3.5 shadow-2xs transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded bg-brand text-white flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-900 truncate">
                Concept & Rule: {concept.title}
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-blue-200 text-brand">
                {concept.regulatoryFramework.sectionOrRule}
              </span>
            </div>
            <p className="text-[11px] text-neutral-600 truncate mt-0.5">
              {concept.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenFullModal && (
            <button
              type="button"
              onClick={() => onOpenFullModal(conceptId)}
              className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-1 bg-white px-2 py-1 rounded border border-neutral-200 shadow-2xs hover:bg-neutral-50 transition-colors"
            >
              <span>Full Guide</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-neutral-500 hover:text-neutral-800 rounded hover:bg-neutral-100 transition-colors"
            aria-label="Toggle explanation details"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-blue-200/60 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs animate-in fade-in duration-150">
          <div className="space-y-1 bg-white/80 p-2.5 rounded border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand" /> Practical Execution
            </span>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              {concept.howItWorks[0]} {concept.howItWorks[1]}
            </p>
          </div>

          <div className="space-y-1 bg-white/80 p-2.5 rounded border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider flex items-center gap-1">
              <Scale className="w-3 h-3 text-brand" /> Governing Law & Rule
            </span>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              <strong className="text-neutral-900">{concept.regulatoryFramework.lawOrAct}</strong> — {concept.regulatoryFramework.sectionOrRule}. {concept.regulatoryFramework.citation}
            </p>
          </div>

          <div className="space-y-1 bg-white/80 p-2.5 rounded border border-neutral-200">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
              Double-Entry Entry
            </span>
            <div className="text-[11px] text-neutral-700 space-y-0.5 font-mono">
              <div>Dr: <span className="text-brand font-semibold">{concept.accountingTreatment.debitAccount}</span></div>
              <div>Cr: <span className="text-brand font-semibold">{concept.accountingTreatment.creditAccount}</span></div>
            </div>
            <p className="text-[10px] text-neutral-500 italic mt-0.5">
              {concept.accountingTreatment.explanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
