"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Command,
  Calendar,
} from "lucide-react";

const routeTitleMap: Record<string, { title: string; category: string }> = {
  "/dashboard": { title: "Executive Dashboard", category: "Financial Intelligence" },
  "/invoicing": { title: "Invoicing & Revenue Operations", category: "Revenue Operations" },
  "/tod": { title: "Turnover Discount (TOD) Management", category: "Commercials & Sales" },
  "/ledger": { title: "General Ledger & Journal", category: "Core Accounting" },
  "/ar-ap": { title: "Accounts Receivable & Collections", category: "Working Capital" },
  "/bank-reconciliation": { title: "Inflow Reconciliation & Matching", category: "Cash & Treasury" },
  "/gst-returns": { title: "Tax, GST & ITR Intelligence", category: "Statutory Compliance" },
  "/copilot": { title: "Financial Copilot AI", category: "Autonomous Intelligence" },
};

interface TopbarProps {
  customTitle?: string;
  customCategory?: string;
}

export function Topbar({ customTitle, customCategory }: TopbarProps) {
  const pathname = usePathname();
  const [showNotifications, setShowNotifications] = useState(false);

  const activeMeta = routeTitleMap[pathname] || {
    title: customTitle || "Financial Overview",
    category: customCategory || "VittaOS Core",
  };

  const title = customTitle || activeMeta.title;
  const category = customCategory || activeMeta.category;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-sm border-b border-neutral-200 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Route Title & Breadcrumb */}
      <div className="flex flex-col justify-center min-w-0">
        <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider leading-none">
          {category}
        </span>
        <h1 className="text-base sm:text-lg font-bold text-brand tracking-tight leading-tight truncate">
          {title}
        </h1>
      </div>

      {/* Center / Right Toolbar */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Global Search Input */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search ledger, invoices, GSTINs..."
            className="w-full pl-9 pr-12 py-1.5 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white text-xs text-neutral-800 placeholder-neutral-400 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-white border border-neutral-200 rounded shadow-xs">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </div>
        </div>

        {/* Fiscal Year Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-50 border border-neutral-200 text-xs text-neutral-600 font-medium">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>FY 2026-27 (Q2)</span>
        </div>

        {/* Notifications Button with Unread Dot */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="w-8 h-8 rounded-md hover:bg-neutral-100 text-neutral-600 flex items-center justify-center transition-colors relative border border-neutral-200/80"
          >
            <Bell className="w-4 h-4" />
            {/* Unread dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-financial-destructive ring-2 ring-white" />
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-lg shadow-elevated z-50 p-2 text-xs">
                <div className="px-3 py-2 border-b border-neutral-100 flex items-center justify-between font-semibold text-brand">
                  <span>Notifications</span>
                  <span className="text-[10px] font-normal text-neutral-400">
                    2 Unread
                  </span>
                </div>
                <div className="py-2 space-y-1">
                  <div className="p-2.5 rounded-md hover:bg-neutral-50 transition-colors border-l-2 border-financial-warning bg-financial-warning-bg/30">
                    <p className="font-semibold text-neutral-900">
                      Bank Recon Mismatch
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      3 bank transactions from HDFC #8902 need matching rules.
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      10 mins ago
                    </span>
                  </div>
                  <div className="p-2.5 rounded-md hover:bg-neutral-50 transition-colors border-l-2 border-financial-positive bg-financial-positive-bg/30">
                    <p className="font-semibold text-neutral-900">
                      GSTR-1 Ready for Filing
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Summary generated for August 2026. All invoices validated.
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-1 block">
                      1 hour ago
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile / Organization Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-neutral-200">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold tracking-tight">
            AS
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-neutral-900 leading-tight">
              Aditya Sharma
            </span>
            <span className="text-[10px] text-neutral-400 font-medium leading-tight">
              Finance Director
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
