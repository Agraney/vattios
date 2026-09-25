import { Organization } from "@/lib/types";

export const mockCompany: Organization = {
  id: "org-acme-01",
  name: "Acme Textiles Pvt Ltd",
  tradeName: "Acme Fabrics & Apparels",
  gstin: "27AABCA1234F1Z5",
  pan: "AABCA1234F",
  state: "Maharashtra",
  stateCode: "27",
  currency: "INR",
  fiscalYear: "2026-2027",
  annualRevenue: 52400000, // ~₹5.24 Cr
  bankAccount: {
    bankName: "HDFC Bank Ltd",
    accountNumber: "50200084920194",
    ifscCode: "HDFC0000128",
    branch: "Lower Parel, Mumbai",
    accountType: "current",
  },
};
