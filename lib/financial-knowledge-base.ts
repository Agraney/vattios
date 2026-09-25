// Comprehensive Financial & Indian Statutory Knowledge Base
// Contains regulatory citations, plain-English explanations, accounting entries, and business context.

export interface FinancialConcept {
  id: string;
  title: string;
  subtitle: string;
  category: "Tax & GST" | "Invoicing & Adjustments" | "Payments & Reconciliation" | "Income Tax & ITR" | "Working Capital";
  iconName: string;
  summary: string;
  howItWorks: string[];
  regulatoryFramework: {
    lawOrAct: string;
    sectionOrRule: string;
    citation: string;
    complianceDeadlines?: string;
  };
  accountingTreatment: {
    debitAccount: string;
    creditAccount: string;
    explanation: string;
  };
  realWorldScenario: string;
  proTips: string[];
}

export const FINANCIAL_KNOWLEDGE_BASE: Record<string, FinancialConcept> = {
  credit_notes: {
    id: "credit_notes",
    title: "Credit Notes (CN)",
    subtitle: "Formal instrument for post-sale price adjustments, discounts, and returned goods",
    category: "Invoicing & Adjustments",
    iconName: "Scissors",
    summary:
      "A Credit Note is a statutory document issued by a seller to a buyer to legally reduce the taxable value and GST liability of a previously issued tax invoice.",
    howItWorks: [
      "When goods are delivered with slight quality defects, excess quantities are billed, price revisions occur post-shipment, or a customer returns merchandise, a Credit Note is raised.",
      "The Credit Note explicitly references the original Tax Invoice number and date.",
      "It reduces the Accounts Receivable (the amount the customer owes you) and concurrently reduces your Output GST liability payable to the government.",
      "In modern accounting platforms like VittaOS, a Credit Note automatically adjusts the open balance without needing to delete or alter the original invoice."
    ],
    regulatoryFramework: {
      lawOrAct: "Central Goods and Services Tax (CGST) Act, 2017",
      sectionOrRule: "Section 34(1) read with Rule 53 of CGST Rules",
      citation: "Where a tax invoice has been issued and the taxable value or tax charged exceeds the actual amount, or goods supplied are returned, the supplier may issue a credit note.",
      complianceDeadlines: "Must be declared in GSTR-1 on or before 30th November following the end of the financial year, or the date of furnishing the annual return (GSTR-9), whichever is earlier."
    },
    accountingTreatment: {
      debitAccount: "Sales Returns / Discounts Allowed A/c (and Output GST A/c)",
      creditAccount: "Trade Receivables (Customer Ledger)",
      explanation: "Debiting Revenue/Tax reduces income and output tax; crediting the customer reduces their outstanding debt."
    },
    realWorldScenario:
      "Acme Textiles invoices Arvind Lifestyle for ₹3,65,400 of cotton shirting. Upon inspection, 100 meters had minor dye variations. Acme issues Credit Note #CN-094 for ₹15,400. Arvind's payable is reduced from ₹3,65,400 to ₹3,50,000, and Acme saves ₹770 in GST liability.",
    proTips: [
      "Never delete an unpaid invoice to reflect a discount; always issue a numbered Credit Note to maintain a legal audit trail.",
      "Both parties must reflect the Credit Note in GSTR-1 and GSTR-2B to prevent tax credit disputes."
    ]
  },

  debit_notes: {
    id: "debit_notes",
    title: "Debit Notes (DN)",
    subtitle: "Statutory instrument to increase invoice value or bill supplementary charges",
    category: "Invoicing & Adjustments",
    iconName: "FilePlus2",
    summary:
      "A Debit Note is issued by a supplier when the taxable value or tax charged in the original invoice is found to be less than the actual value (e.g., due to price escalation or unbilled freight).",
    howItWorks: [
      "If a supplier undercharged on an initial invoice, or agreed-upon price escalations take effect after dispatch, a Debit Note is raised.",
      "It increases the Accounts Receivable balance due from the buyer.",
      "It creates an additional Output GST liability that must be reported in the supplier's GSTR-1 of the current month.",
      "The buyer can claim additional Input Tax Credit (ITC) based on this Debit Note."
    ],
    regulatoryFramework: {
      lawOrAct: "Central Goods and Services Tax (CGST) Act, 2017",
      sectionOrRule: "Section 34(3) read with Rule 53",
      citation: "Where a tax invoice has been issued and the taxable value or tax charged is found to be less than the tax payable, the registered supplier shall issue a debit note.",
      complianceDeadlines: "Must be declared in the GSTR-1 for the month in which the debit note was issued."
    },
    accountingTreatment: {
      debitAccount: "Trade Receivables (Customer Ledger)",
      creditAccount: "Revenue from Supplementary Charges / Output GST A/c",
      explanation: "Debiting customer increases their debt; crediting revenue and tax records the supplementary gain and tax liability."
    },
    realWorldScenario:
      "Acme Textiles shipped custom jacquard weave fabric to Raymond Luxury Cottons. Due to an agreed diesel surcharge clause, additional freight of ₹12,000 + 5% GST was incurred. Acme issues Debit Note #DN-012, raising Raymond's receivable by ₹12,600.",
    proTips: [
      "Under GST law, the time limit for buyers to claim ITC on Debit Notes is decoupled from the original invoice and linked directly to the financial year of the Debit Note itself."
    ]
  },

  partial_payments: {
    id: "partial_payments",
    title: "Partial Payments & Running Balances",
    subtitle: "Managing milestone disbursements, advances, and multi-tranche settlements",
    category: "Payments & Reconciliation",
    iconName: "PieChart",
    summary:
      "Partial payments occur when a buyer remits an amount smaller than the invoice's net payable value, typically due to staged milestones, retainage clauses, or cash flow scheduling.",
    howItWorks: [
      "Rather than treating invoices as binary 'paid' or 'unpaid', an enterprise ERP must maintain an auditable Running Balance ledger.",
      "When a customer pays an advance or first installment (e.g., 30% advance on PO dispatch), the payment is allocated against the invoice.",
      "The invoice status transitions to 'Partially Paid', and the Open Balance decreases by the exact amount received.",
      "When subsequent remittances arrive via NEFT/RTGS, they are credited against the remaining balance until it reaches ₹0.00, at which point the invoice auto-closes."
    ],
    regulatoryFramework: {
      lawOrAct: "Indian Contract Act, 1872 & Accounting Standards (AS-9 / Ind AS 115)",
      sectionOrRule: "Sections 59–61 (Appropriation of Payments)",
      citation: "Where a debtor owes several distinct debts and makes a payment with an express indication, the payment must be applied accordingly. Absent indication, creditor may apply it at discretion.",
      complianceDeadlines: "Bank entries must be reconciled within the same monthly financial close cycle."
    },
    accountingTreatment: {
      debitAccount: "Bank Current Account (e.g., HDFC Bank)",
      creditAccount: "Trade Receivables (Customer Subsidiary Ledger)",
      explanation: "Debiting Bank increases cash; crediting Receivables partially reduces customer outstanding while leaving remaining balance open."
    },
    realWorldScenario:
      "FabIndia places a seasonal order of ₹1,83,750 (Invoice INV/2026-27/044). Under contract terms, they wire ₹45,000 as an advance payment. VittaOS matches the ₹45,000 HDFC bank credit, shifts invoice status to 'Partially Paid', and updates the Open Balance to ₹1,38,750.",
    proTips: [
      "Always capture the Bank UTR number against each partial installment so both parties can reconcile partial statements without disputes.",
      "Overdue interest clock should only tick on the remaining open balance, never the original gross amount."
    ]
  },

  bank_reconciliation: {
    id: "bank_reconciliation",
    title: "Bank Reconciliation & UTR Matching",
    subtitle: "Autonomous validation between external bank feeds and internal books of accounts",
    category: "Payments & Reconciliation",
    iconName: "Landmark",
    summary:
      "Bank Reconciliation is the process of comparing bank statement deposits against general ledger records to ensure every single rupee that hits the bank account is accounted for.",
    howItWorks: [
      "In India, interbank fund transfers occur via NEFT, RTGS, and IMPS, each generating a Unique Transaction Reference (UTR) number (e.g., CMS28491048201).",
      "VittaOS ingests live bank feeds and runs an autonomous 3-tier matching engine:",
      "1. Exact Match (100%): Remittance amount exactly equals invoice open balance.",
      "2. Adjusted Match (96–98%): Remittance matches gross minus Credit Notes and Buyer statutory TDS withholdings.",
      "3. Partial Match (90–92%): Deposit is less than open balance, recording an advance installment.",
      "Once confirmed, the invoice balance is updated and journal entries post to the general ledger automatically."
    ],
    regulatoryFramework: {
      lawOrAct: "Companies Act, 2013 & ICAI Guidance Note on Bank Reconciliation",
      sectionOrRule: "Section 128 (Books of Account to be kept by Company)",
      citation: "Every company shall prepare and keep at its registered office books of account and financial statements that give a true and fair view of the state of affairs.",
      complianceDeadlines: "Statutory audit mandates complete reconciliation of all bank accounts at fiscal year-end and quarterly closes."
    },
    accountingTreatment: {
      debitAccount: "Bank Account (HDFC Current A/c #0194)",
      creditAccount: "Trade Receivables / Customer Account",
      explanation: "Recognizes the inflow of liquid funds and relieves the debtor of liability."
    },
    realWorldScenario:
      "Page Industries (Jockey India) settles invoice INV/2026-27/046 for ₹3,09,225 via RTGS. The HDFC feed records a credit of ₹3,09,225 with UTR 'CMS8492019482'. The VittaOS engine instantly matches it with 100% confidence, auto-closing the invoice to ₹0.00.",
    proTips: [
      "Autonomous matching prevents the classic 'unallocated cash' problem where money sits in the bank account but sales teams continue chasing the customer."
    ]
  },

  gst_mechanics: {
    id: "gst_mechanics",
    title: "GST Architecture in India",
    subtitle: "Dual GST system: Intra-state (CGST + SGST) vs Inter-state (IGST) and Destination principle",
    category: "Tax & GST",
    iconName: "ReceiptText",
    summary:
      "India implements a dual Goods and Services Tax (GST) system where both the Central and State Governments concurrently levy tax on the supply of goods and services.",
    howItWorks: [
      "GST is a destination-based consumption tax: tax revenue accrues to the state where goods are consumed, not where manufactured.",
      "Intra-State Supply (within same state): Levied as CGST (Central GST) + SGST (State GST) in equal halves (e.g., 5% total = 2.5% CGST + 2.5% SGST).",
      "Inter-State Supply (between different states): Levied as IGST (Integrated GST) equal to the full rate (e.g., 5% IGST).",
      "HSN (Harmonized System of Nomenclature): Every product is assigned a 4, 6, or 8-digit HSN code that dictates its statutory tax slab (0%, 5%, 12%, 18%, or 28%).",
      "Tax Invoices must comply with Rule 46 of CGST Rules, containing GSTINs, Place of Supply, HSN code, and tax itemization."
    ],
    regulatoryFramework: {
      lawOrAct: "Central Goods and Services Tax Act, 2017 & IGST Act, 2017",
      sectionOrRule: "Section 7, 8 & 9 (Levy and Collection of Tax, Place of Supply)",
      citation: "There shall be levied a tax called the central goods and services tax on all intra-State supplies of goods or services. Integrated tax shall be levied on inter-State supply.",
      complianceDeadlines: "GSTR-1 due by 11th of succeeding month; GSTR-3B due by 20th of succeeding month."
    },
    accountingTreatment: {
      debitAccount: "Trade Receivables (Customer A/c for Gross Total)",
      creditAccount: "Sales Revenue A/c (Taxable Value) AND Output CGST/SGST/IGST Payable A/c",
      explanation: "Revenue is recorded at taxable net value; the tax collected is a statutory balance-sheet liability owed to the Government."
    },
    realWorldScenario:
      "Acme Textiles (Maharashtra, code 27) sells woven cotton (HSN 5208, 5% GST) to Bombay Dyeing (Maharashtra). It bills 2.5% CGST + 2.5% SGST. On the same day, it sells to FabIndia (Delhi, code 07) and bills 5.0% IGST.",
    proTips: [
      "The 'Place of Supply' dictates taxability. If you mistakenly bill CGST/SGST on an inter-state sale, you cannot adjust it against IGST without filing a refund application under Section 77."
    ]
  },

  gstr1_outward: {
    id: "gstr1_outward",
    title: "GSTR-1: Outward Supplies & Tax Invoicing",
    subtitle: "Statutory monthly declaration of all B2B and B2C sales and invoice amendments",
    category: "Tax & GST",
    iconName: "FileCheck",
    summary:
      "GSTR-1 is the monthly or quarterly return filed by registered taxpayers detailing all outward supplies of goods and services made during the tax period.",
    howItWorks: [
      "GSTR-1 reports B2B invoices at an invoice-by-invoice level (including buyer GSTIN, invoice date, value, tax rate).",
      "Table 4: Taxable B2B outward supplies to registered buyers.",
      "Table 7: B2C supplies aggregated state-wise and rate-wise.",
      "Table 9: Credit Notes, Debit Notes, and invoice amendments issued during the period.",
      "Table 12: HSN-wise summary of outward supplies.",
      "Data filed in your GSTR-1 automatically populates your buyers' GSTR-2B, enabling them to claim Input Tax Credit."
    ],
    regulatoryFramework: {
      lawOrAct: "Central Goods and Services Tax (CGST) Rules, 2017",
      sectionOrRule: "Section 37 read with Rule 59",
      citation: "Every registered person shall furnish electronically the details of outward supplies of goods or services during a tax period on or before the eleventh day of the month succeeding the tax period.",
      complianceDeadlines: "11th of every month (for monthly filers) or 13th of month succeeding quarter (under QRMP scheme)."
    },
    accountingTreatment: {
      debitAccount: "N/A (Filing Statement)",
      creditAccount: "Reconciles General Ledger Output Tax Accounts against Portal Liability",
      explanation: "Ensures the general ledger Output Tax balance matches the exact figures reported to the GSTN portal."
    },
    realWorldScenario:
      "In August 2026, Acme Textiles generates 12 e-Invoices totaling ₹1.48 Crores with ₹1,34,650 in output tax liability. Filing GSTR-1 by September 11th ensures all buyers see their ITC in GSTR-2B without disputes.",
    proTips: [
      "Late filing of GSTR-1 attracts statutory late fees under Section 47 and blocks your e-Way Bill generation facility."
    ]
  },

  income_tax_advance_tax: {
    id: "income_tax_advance_tax",
    title: "Income Tax, Advance Tax & Corporate ITR",
    subtitle: "Pay-as-you-earn income tax installments for enterprises and annual ITR-6 compliance",
    category: "Income Tax & ITR",
    iconName: "Building2",
    summary:
      "Under Indian tax law, businesses cannot wait until year-end to pay corporate income tax. They must pay tax as income is earned across four mandatory Advance Tax installments.",
    howItWorks: [
      "Applicability: Any enterprise whose estimated annual income tax liability exceeds ₹10,000 must pay Advance Tax.",
      "Installment Schedule (Section 211 of Income Tax Act):",
      "• On or before 15th June: At least 15% of estimated total tax liability.",
      "• On or before 15th September: At least 45% of estimated total tax liability (cumulative).",
      "• On or before 15th December: At least 75% of estimated total tax liability (cumulative).",
      "• On or before 15th March: 100% of estimated total tax liability.",
      "Defaults trigger mandatory penal interest under Section 234C (1% per month on shortfall) and Section 234B.",
      "Corporate ITR (ITR-6) is filed annually before 31st October with an audited Tax Audit Report (Form 3CD)."
    ],
    regulatoryFramework: {
      lawOrAct: "Income Tax Act, 1961",
      sectionOrRule: "Sections 208, 209, 211, 234B & 234C",
      citation: "Advance tax shall be payable during a financial year in respect of the total income of the assessee which would be chargeable to tax for the assessment year.",
      complianceDeadlines: "15 June (15%), 15 September (45%), 15 December (75%), 15 March (100%). Annual ITR-6: 31st October."
    },
    accountingTreatment: {
      debitAccount: "Advance Income Tax Paid A/c (Current Assets)",
      creditAccount: "Bank Account (HDFC Current A/c)",
      explanation: "Advance tax payments sit on the Balance Sheet as a Current Asset until year-end, when they offset the Provision for Income Tax."
    },
    realWorldScenario:
      "Acme Textiles projects an annual net taxable profit of ₹85 Lakhs, resulting in an estimated corporate tax of ₹21,25,000 (at 25% + cess). By September 15th (Q2 deadline), Acme must have paid at least 45% (₹9,56,250) minus any TDS deducted by buyers.",
    proTips: [
      "Always subtract the Buyer TDS credits shown in your Form 26AS/AIS when computing how much Advance Tax cash to deposit!"
    ]
  },

  buyer_tds_194q: {
    id: "buyer_tds_194q",
    title: "Buyer TDS Withholding (Section 194Q) & Form 26AS",
    subtitle: "Statutory tax deducted by enterprise buyers before remitting payment to you",
    category: "Income Tax & ITR",
    iconName: "ShieldCheck",
    summary:
      "Under Section 194Q, large buyers purchasing goods exceeding ₹50 Lakhs in a financial year are mandated to deduct 0.1% TDS before remitting payment to the seller.",
    howItWorks: [
      "Trigger: Buyer has turnover > ₹10 Crores in the preceding financial year AND purchase value from a seller exceeds ₹50 Lakhs.",
      "Rate: 0.1% of the value exceeding ₹50 Lakhs (or 5% if seller does not furnish PAN).",
      "Deduction Point: Deducted at the time of credit to the seller's account or payment, whichever is earlier.",
      "How Seller Gets the Money Back: The buyer deposits this TDS with the Income Tax Department and files Form 26Q.",
      "The tax credit reflects in the seller's Form 26AS and Annual Information Statement (AIS).",
      "When filing annual corporate ITR (ITR-6), the seller claims this TDS credit to directly reduce their final tax liability or claim a cash refund."
    ],
    regulatoryFramework: {
      lawOrAct: "Income Tax Act, 1961",
      sectionOrRule: "Section 194Q read with Section 206AA",
      citation: "Any person being a buyer responsible for paying any sum to any resident seller for purchase of any goods of value exceeding fifty lakh rupees shall deduct 0.1% as income-tax.",
      complianceDeadlines: "Buyer must deposit TDS by 7th of following month and issue Form 16A quarterly."
    },
    accountingTreatment: {
      debitAccount: "TDS Receivable A/c (Current Asset - Tax Credits)",
      creditAccount: "Trade Receivables (Customer Ledger)",
      explanation: "Debiting TDS Receivable records your statutory tax credit with the Government; crediting Customer Receivables balances their invoice without treating it as a loss."
    },
    realWorldScenario:
      "Arvind Lifestyle Brands buys ₹3,50,000 of fabrics from Acme Textiles. Since cumulative purchases exceed ₹50L, Arvind deducts 0.1% TDS (₹350) and remits ₹3,49,650. In VittaOS, the ₹350 is recorded as TDS Receivable, ensuring the invoice is 100% balanced and cleared.",
    proTips: [
      "Quarterly cross-reference your internal TDS Receivable ledger against your Income Tax portal Form 26AS to confirm buyers actually deposited the withheld money."
    ]
  },

  ar_aging_dso: {
    id: "ar_aging_dso",
    title: "AR Aging Schedules & Days Sales Outstanding (DSO)",
    subtitle: "The quantitative framework for working capital velocity and collection risk",
    category: "Working Capital",
    iconName: "Clock",
    summary:
      "An Accounts Receivable Aging schedule categorizes unpaid customer invoices by the number of days they have been outstanding, serving as the primary predictor of cash conversion and bad debts.",
    howItWorks: [
      "Standard Aging Brackets:",
      "• 0–30 Days: Current healthy debt; standard credit terms (98%+ collection probability).",
      "• 31–60 Days: Mild delay; polite follow-up required (90% collection probability).",
      "• 61–90 Days: High delinquency risk; phone escalations and dispatch holds (75% collection probability).",
      "• 90+ Days: Severe risk of bad debt; statutory legal notice under MSME Samadhaan Act or Section 138 (Cheque Bounce).",
      "DSO Formula: (Total Receivables / Total Credit Sales) × 365 Days.",
      "A lower DSO means faster cash conversion, lower working capital borrowing costs, and higher enterprise valuation."
    ],
    regulatoryFramework: {
      lawOrAct: "Micro, Small and Medium Enterprises Development (MSMED) Act, 2006",
      sectionOrRule: "Sections 15 & 16 (Mandatory Payment Timeline)",
      citation: "Where any buyer buys goods from an MSME supplier, payment shall not exceed 45 days where agreed in writing. Failure triggers compound interest at 3x the RBI Bank Rate.",
      complianceDeadlines: "Statutory half-yearly MSME-1 return filed with Ministry of Corporate Affairs (MCA)."
    },
    accountingTreatment: {
      debitAccount: "Provision for Doubtful Debts (if delinquent > 90 days)",
      creditAccount: "Allowance for Credit Losses",
      explanation: "Prudential accounting under Ind AS 109 requires recognizing Expected Credit Losses (ECL) on aging receivables."
    },
    realWorldScenario:
      "Acme Textiles maintains an average DSO of 38 days, well ahead of the textile sector benchmark of 52 days. Automated 1-click WhatsApp reminders deployed at day 31 accelerate remittance cycles by 14 days, unlocking over ₹20 Lakhs in free liquidity.",
    proTips: [
      "Under Section 43B(h) of the Income Tax Act, buyers cannot claim tax deductions for purchases from MSMEs unless payment is cleared within 45 days. Mentioning Section 43B(h) in reminders instantly accelerates corporate payments!"
    ]
  }
};
