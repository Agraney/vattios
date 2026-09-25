# VittaOS (vattiOS) — System Architecture & Complete Functional Guide

## 1. Project Overview & Vision

**VittaOS** is an AI-native Financial Operating System and Autonomous Enterprise Resource Planning (ERP) platform purpose-built for Indian enterprises, mid-market manufacturers, and high-growth SMEs.

### Core Problems Solved
- **15-Day Month-End Close Lag**: Replaced by an instantaneous, continuous double-entry ledger that updates P&L and Balance Sheet reports in real time.
- **Manual Bank Reconciliation**: Cuts 40 hours of monthly manual reconciliation down to under 4 hours via an autonomous multi-tier matching engine (89.4% auto-match rate).
- **Indian GST & TDS Friction**: Native e-Invoicing with IRN/HSN support, 2-way GSTR-2B purchase reconciliation to prevent lost Input Tax Credit (ITC), and automated TDS tracking across Sections 194C, 194J, 194I, and 194Q.
- **Working Capital & Cash Flow Drag**: Reduces Days Sales Outstanding (DSO) via real-time aging buckets and 1-click WhatsApp payment reminders.
- **Executive Visibility Blind Spots**: A conversational Financial Copilot AI that answers CFO and founder queries with verified ledger metrics.

---

## 2. Directory Structure & Key Files

```
vattiOS/
├── app/
│   ├── (app)/                          # Authenticated application shell
│   │   ├── layout.tsx                  # Global app shell with responsive Sidebar & Topbar
│   │   ├── dashboard/page.tsx          # Executive Command Center (KPIs, Charts, AR aging)
│   │   ├── invoicing/page.tsx          # Sales e-Invoicing & verified running payment ledger
│   │   ├── ar-ap/page.tsx              # Working Capital (AR Aging, WhatsApp reminders, AP TDS)
│   │   ├── bank-reconciliation/page.tsx# Autonomous Bank Recon (Exact, Partial, Adjusted matches)
│   │   ├── ledger/page.tsx             # Double-entry Journal, COA, Live P&L, Balance Sheet
│   │   ├── gst-returns/page.tsx        # GSTR-1, GSTR-2B 2-way recon, ITC mismatches, GSTR-3B
│   │   └── copilot/page.tsx            # Financial Copilot AI with neural reasoning & rich cards
│   ├── globals.css                     # Design tokens and base styles
│   ├── layout.tsx                      # Root HTML layout with Inter font
│   └── page.tsx                        # Redirects to /dashboard
├── components/
│   ├── shared/
│   │   ├── sidebar.tsx                 # Responsive navigation sidebar with entity switcher
│   │   ├── topbar.tsx                  # Sticky header with breadcrumbs, search & notifications
│   │   ├── stat-card.tsx               # Metric cards with percentage comparisons & trends
│   │   ├── status-badge.tsx            # Financial status badges (Positive, Warning, Destructive)
│   │   ├── page-header.tsx             # Standardized page header component
│   │   ├── empty-state.tsx             # Fallback UI for zero-state tables
│   │   └── data-table-shell.tsx        # Filterable, sortable table wrapper
│   └── ui/
│       ├── button.tsx                  # Accessible button variants (CVA)
│       └── card.tsx                    # Card and container components
├── lib/
│   ├── types.ts                        # TypeScript domain schemas (Double-entry, GST, TDS, Bank)
│   ├── utils.ts                        # Lakh/Crore Indian currency formatting & styling helpers
│   ├── payment-engine.ts               # Running balance math, bank matching classifier, auto-close
│   └── mock-data/
│       ├── company.ts                  # Acme Textiles Pvt Ltd profile (GSTIN, PAN, HDFC bank)
│       ├── invoices.ts                 # B2B/B2C sales invoices with credit notes & payments
│       ├── bills.ts                    # Vendor procurement bills with TDS classifications
│       ├── bank-transactions.ts        # HDFC Bank current account statement feed
│       ├── chart-of-accounts.ts        # 5 standard accounting heads (Assets, Liab, Equity, Rev, Exp)
│       ├── gst-returns.ts              # Monthly GSTR-1, 2B, and 3B compliance records
│       ├── tds.ts                      # Statutory tax withholding entries (194C, 194J, 194I, 194Q)
│       ├── journal-entries.ts          # Immutable double-entry ledger journal lines
│       └── index.ts                    # Central barrel export
├── tailwind.config.ts                  # Custom palette (#13294B navy, financial greens, ambers, reds)
├── package.json                        # Next.js 14, Recharts, Lucide, Tailwind
└── DEMO_SCRIPT.md                      # 4-5 minute executive walkthrough script
```

---

## 3. Detailed Screen & Feature Breakdown

### Screen 1: Executive Dashboard (`/dashboard`)
- **Real-Time StatCards**:
  1. *Cash Balance*: ₹89.42 Lakhs in primary HDFC Current Account (`+14.2%` MoM).
  2. *Revenue (MTD)*: August 2026 performance with month-over-month trend.
  3. *Genuine Open Receivables*: ₹35.48 Lakhs net of Credit Notes and buyer TDS deductions.
  4. *GST Liability*: August 2026 GSTR-3B cash payable by September 20th.
- **6-Month Area Chart**: Revenue vs Operating Expenses, calculating EBITDA margin (29.4%) and break-even monthly run rate.
- **AR Aging Segmented Bar**: Visual 0–30, 31–60, 61–90, and 90+ day distribution of open collections.
- **Needs Attention Queue**: Priority action cards for overdue invoices, unposted bank credits, and vendor ITC disputes.
- **30-Day Cash Flow Forecast**: Inflows (`+₹13.42L`) vs committed outflows (`-₹9.69L`) projecting a closing liquidity of `₹93.15L`.

### Screen 2: Invoicing & Revenue Operations (`/invoicing`)
- **GST Invoicing**: Generates B2B, B2C, Export, and SEZ invoices with automatic HSN tax determination (e.g. HSN 5208 at 5%).
- **Accurate Running Balances**: Computes `Net Payable = Grand Total - Credit Notes + Debit Notes`, subtracting payments and buyer TDS.
- **Chronological Payment Ledger Drawer**: Clicking any invoice opens a comprehensive audit trail showing the original invoice, credit notes issued, buyer statutory TDS withholdings, and bank settlement receipts with the running balance after each entry.

### Screen 3: Accounts Receivable & Accounts Payable (`/ar-ap`)
- **Receivables (AR)**:
  - Tracks customer collections with DSO monitored at **38 days**.
  - **1-Click WhatsApp Payment Reminder**: Generates pre-formatted payment notices with invoice number, verified balance due, and remittance details.
  - **Match Inspector**: Displays the verified bank UTR receipt for any settled transaction.
- **Payables (AP)**:
  - Tracks vendor obligations with DPO at **28 days**.
  - **Statutory TDS Withholding Badges**: Inline tags showing withheld tax under Sections 194C (2%), 194J (10%), 194I (10%), and 194Q (0.1%).

### Screen 4: Bank Reconciliation Engine (`/bank-reconciliation`)
- **89.4% Auto-Match Engine**:
  - **Exact Match (100%)**: Remittance equals invoice open balance (e.g., Page Industries ₹3,09,225).
  - **Adjusted Match (96–98%)**: Remittance matches after factoring in credit notes and buyer TDS withholdings (e.g., Arvind Lifestyle Brands ₹1,85,000).
  - **Partial Match (90–92%)**: Remittance is less than the balance due (e.g., FabIndia ₹45,000 advance).
  - **Manual Match**: Searchable drawer allowing manual settlement against invoices, bills, or direct ledger expenses.
- **Auto-Close Mechanics**: When an invoice balance drops to zero, the engine automatically marks it as *Closed* and posts balancing entries to the General Ledger.

### Screen 5: General Ledger & Live Financial Statements (`/ledger`)
- **General Ledger**: Filterable double-entry journal with real-time debit and credit reconciliation.
- **Chart of Accounts (COA)**: Standard 5-tier classification (Assets, Liabilities, Equity, Revenue, Expenses).
- **Live P&L Statement**: Real-time Gross Margin (40.5%) and Net EBITDA Margin (29.4%) calculated dynamically.
- **Live Balance Sheet**: Verified balance check ensuring Assets equal Liabilities plus Equity with ₹0.00 variance.

### Screen 6: GST Returns & 2-Way ITC Reconciliation (`/gst-returns`)
- **GSTR-1, GSTR-2B & GSTR-3B**: Monthly return lifecycle tracking.
- **2-Way ITC Reconciliation**: Identifies supplier non-filing (e.g., Gujarat Ambuja Cottons missing ₹19,000 ITC in July 2026).
- **Automated Vendor Nudge**: Dispatches notification requesting suppliers to file Table 9 invoice amendments.
- **Filing Readiness Checklist**: 4-point verification leading to simulated portal submission.

### Screen 7: Financial Copilot AI (`/copilot`)
- **Autonomous Financial Assistant**: Answers natural language queries regarding cash runway, tax liabilities, vendor cost spikes, and margins.
- **Neural Reasoning Trace**: Shows real-time intermediate thinking steps.
- **Structured Artifact Cards**: Renders interactive financial components (cash strips, breakdown tables, GST liability cards).

---

## 4. How Calculations Work (`lib/payment-engine.ts`)

```typescript
// 1. Genuine Open Balance
netPayable = grandTotal - totalCreditNotes + totalDebitNotes
openBalance = Math.max(0, netPayable - (totalPaid + totalTdsDeducted))

// 2. Reconciliation Classifier
if (|txAmount - openBalance| <= 1.0) -> EXACT_MATCH (100%)
if (|txAmount - (grandTotal - totalCreditNotes - totalTdsDeducted)| <= 5.0) -> ADJUSTED_MATCH (96-98%)
if (txAmount < openBalance && txAmount > 0) -> PARTIAL_MATCH (90%)
else -> MANUAL_MATCH
```

---

## 5. Production Transition Roadmap

1. **Database & Persistence**:
   - Migrate mock datasets to PostgreSQL with Prisma/Drizzle.
   - Implement immutable journal tables with row-level security per tenant.
2. **Bank Feeds & Payments**:
   - Integrate Account Aggregator (AA) frameworks (Setu, Decentro) or bank webhook APIs for live HDFC/ICICI feeds.
3. **GSTN & e-Invoicing**:
   - Connect to GSP APIs (ClearTax, Sandbox) for live IRN generation and automatic GSTR-2B syncing.
4. **WhatsApp Business API**:
   - Wire 1-click reminders to Meta WhatsApp Cloud API via Twilio or Gupshup.
5. **Production AI Copilot**:
   - Connect LLM backend (Gemini 1.5 Pro / Claude 3.5 Sonnet) with SQL generation and Tool Calling over read-replica databases.
