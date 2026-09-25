"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  ArrowLeftRight,
  Landmark,
  ReceiptText,
  Sparkles,
  ChevronDown,
  Building2,
  Check,
  ShieldCheck,
  BadgePercent,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeVariant?: "brand" | "positive" | "warning";
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Invoicing",
    href: "/invoicing",
    icon: FileText,
  },
  {
    name: "TOD Schemes",
    href: "/tod",
    icon: BadgePercent,
    badge: "Commercial",
    badgeVariant: "brand",
  },
  {
    name: "Ledger",
    href: "/ledger",
    icon: BookOpen,
  },
  {
    name: "Receivables",
    href: "/ar-ap",
    icon: ArrowLeftRight,
  },
  {
    name: "Bank Reconciliation",
    href: "/bank-reconciliation",
    icon: Landmark,
    badge: "3 pending",
    badgeVariant: "warning",
  },
  {
    name: "Tax & ITR",
    href: "/gst-returns",
    icon: ReceiptText,
  },
  {
    name: "Copilot",
    href: "/copilot",
    icon: Sparkles,
    badge: "AI",
    badgeVariant: "brand",
  },
];

interface Entity {
  id: string;
  name: string;
  gstin: string;
  state: string;
  isDefault?: boolean;
}

const sampleEntities: Entity[] = [
  {
    id: "e-1",
    name: "Acme Textiles Pvt Ltd",
    gstin: "29AABCA1234F1Z5",
    state: "Karnataka",
    isDefault: true,
  },
  {
    id: "e-2",
    name: "Acme Exports LLP",
    gstin: "27AABCA5678G2Z1",
    state: "Maharashtra",
  },
  {
    id: "e-3",
    name: "Acme Retail Tech Ltd",
    gstin: "06AAACD3456N1Z5",
    state: "Haryana",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [selectedEntity, setSelectedEntity] = useState<Entity>(sampleEntities[0]);
  const [isEntityDropdownOpen, setIsEntityDropdownOpen] = useState(false);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-neutral-200 transition-all duration-200 w-16 lg:w-64 select-none">
      {/* Brand Header / Logo */}
      <div className="h-16 flex items-center px-4 lg:px-6 border-b border-neutral-200 justify-center lg:justify-start">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-md bg-brand text-white flex items-center justify-center font-bold text-base shadow-subtle shrink-0 group-hover:bg-brand-hover transition-colors">
            V
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="font-bold tracking-tight text-base text-brand leading-none">
              VittaOS
            </span>
            <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mt-0.5">
              Autonomous Finance
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2.5 lg:px-4 py-4 space-y-1.5 overflow-y-auto">
        <div className="hidden lg:block px-2 pb-2 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
          Core Financials
        </div>

        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.name}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-100 group relative",
                isActive
                  ? "bg-brand text-white shadow-subtle font-semibold"
                  : "text-neutral-600 hover:text-brand hover:bg-neutral-100/80"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-transform duration-100 group-hover:scale-105",
                  isActive ? "text-white" : "text-neutral-500 group-hover:text-brand"
                )}
              />

              <span className="hidden lg:inline truncate flex-1">{item.name}</span>

              {item.badge && (
                <span
                  className={cn(
                    "hidden lg:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-tight tabular-nums",
                    isActive
                      ? "bg-white/20 text-white"
                      : item.badgeVariant === "brand"
                      ? "bg-brand-subtle text-brand"
                      : item.badgeVariant === "warning"
                      ? "bg-financial-warning-bg text-financial-warning-text border border-financial-warning-border"
                      : "bg-neutral-100 text-neutral-600"
                  )}
                >
                  {item.badge}
                </span>
              )}

              {/* Active Route Indicator Bar for collapsed sidebar */}
              {isActive && (
                <span className="lg:hidden absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Entity Switcher at Bottom */}
      <div className="p-2 lg:p-3 border-t border-neutral-200 relative bg-neutral-50/50">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsEntityDropdownOpen(!isEntityDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-md hover:bg-white hover:border-neutral-300 border border-transparent transition-colors text-left group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded bg-neutral-200/80 text-neutral-700 flex items-center justify-center shrink-0 border border-neutral-300">
                <Building2 className="w-4 h-4 text-neutral-600" />
              </div>
              <div className="hidden lg:flex flex-col min-w-0">
                <span className="text-xs font-semibold text-neutral-900 truncate">
                  {selectedEntity.name}
                </span>
                <span className="text-[10px] text-neutral-500 font-mono truncate">
                  {selectedEntity.gstin}
                </span>
              </div>
            </div>

            <ChevronDown className="hidden lg:block w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-700 shrink-0" />
          </button>

          {/* Entity Dropdown Menu */}
          {isEntityDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsEntityDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-elevated z-50 p-1.5 text-xs">
                <div className="px-2.5 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 flex items-center justify-between">
                  <span>Switch Entity</span>
                  <ShieldCheck className="w-3 h-3 text-neutral-400" />
                </div>
                <div className="py-1 space-y-0.5">
                  {sampleEntities.map((entity) => {
                    const isCurrent = entity.id === selectedEntity.id;
                    return (
                      <button
                        key={entity.id}
                        onClick={() => {
                          setSelectedEntity(entity);
                          setIsEntityDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between p-2 rounded-md transition-colors text-left",
                          isCurrent
                            ? "bg-brand-subtle text-brand font-medium"
                            : "hover:bg-neutral-50 text-neutral-700"
                        )}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="font-medium truncate">
                            {entity.name}
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {entity.gstin} • {entity.state}
                          </span>
                        </div>
                        {isCurrent && (
                          <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Persistent Demo Data Indicator */}
      <div className="px-2 lg:px-3 py-2 bg-neutral-100/80 border-t border-neutral-200 text-center">
        <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-semibold text-neutral-500 bg-neutral-200/80 border border-neutral-300 font-mono tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-financial-warning" />
          DEMO DATA • ACME TEXTILES
        </span>
        <span className="lg:hidden text-[9px] font-bold text-neutral-500 font-mono" title="Demo Data Mode">
          DEMO
        </span>
      </div>
    </aside>
  );
}
