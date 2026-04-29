"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { CompanyDocument } from "@/types";

// ── Data ──────────────────────────────────────────────────────────────────────

type Party = "Sponsor Attorney" | "Closing Attorney" | "Investor" | "Tax Attorney";
type Phase = "pre" | "post";

interface ClosingItem {
  id: string;
  label: string;
  party: Party;
  optional?: boolean;
}

interface ClosingSection {
  num: number | string; // "0" for the unnumbered org docs
  title: string;
  phase: Phase;
  items: ClosingItem[];
}

const SECTIONS: ClosingSection[] = [
  // ── PRE-CLOSING ────────────────────────────────────────────────────────────
  {
    num: 0, title: "Pre-Closing Organizational Documents", phase: "pre",
    items: [
      { id: "0-a", label: "Organizational Chart", party: "Sponsor Attorney" },
      { id: "0-b", label: "Signature Blocks", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 1, title: "Letter of Intent / Commitment Letters", phase: "pre",
    items: [
      { id: "1-a", label: "Letter of Intent", party: "Investor" },
      { id: "1-b", label: "Post-IRC Letter / Conditional Commitment", party: "Investor" },
    ],
  },
  {
    num: 2, title: "Investor Approval of Final Projections", phase: "pre",
    items: [
      { id: "2-a", label: "Final Projections Approval", party: "Closing Attorney" },
    ],
  },
  {
    num: 3, title: "Partnership Agreement Documents", phase: "pre",
    items: [
      { id: "3-a", label: "Development Fee Agreement", party: "Closing Attorney" },
      { id: "3-b", label: "Guaranty Agreement", party: "Closing Attorney" },
      { id: "3-c", label: "Purchase Option and Right of First Refusal", party: "Closing Attorney" },
      { id: "3-d", label: "Special Purpose Reserve Agreement", party: "Closing Attorney", optional: true },
    ],
  },
  {
    num: 4, title: "Disbursement Documents", phase: "pre",
    items: [
      { id: "4-a", label: "Closing Escrow Deposit Instructions", party: "Closing Attorney" },
      { id: "4-b", label: "Evidence of Managing Member Capital Contribution", party: "Sponsor Attorney" },
      { id: "4-c", label: "Wiring Instructions on Managing Member Letterhead", party: "Investor" },
    ],
  },
  {
    num: 5, title: "Site Control and Related Documents", phase: "pre",
    items: [
      { id: "5-a", label: "Purchase Agreement / Option / Ground Lease", party: "Sponsor Attorney" },
      { id: "5-b", label: "Transfer Deed to Seller (Acquisition Credits Only)", party: "Sponsor Attorney", optional: true },
      { id: "5-c", label: "Settlement Statement", party: "Sponsor Attorney" },
      { id: "5-d", label: "Ground Lease / Master Lease", party: "Sponsor Attorney", optional: true },
      { id: "5-e", label: "Transfer Deed to Project Company", party: "Sponsor Attorney" },
      { id: "5-f", label: "Evidence of Zoning Compliance", party: "Sponsor Attorney" },
      { id: "5-g", label: "Tax Exemption or Abatement Documents (PILOT)", party: "Sponsor Attorney", optional: true },
      { id: "5-h", label: "Chain of Title (Acquisition Credits Only)", party: "Sponsor Attorney", optional: true },
      { id: "5-i", label: "Transfer Tax Documentation", party: "Sponsor Attorney" },
      { id: "5-j", label: "Development Services Agreement", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 6, title: "Property Analysis Documents", phase: "pre",
    items: [
      { id: "6-a", label: "Appraisal and Update", party: "Investor" },
      { id: "6-b", label: "Market Study", party: "Investor" },
      { id: "6-c", label: "Capital Needs Assessment (Rehab Projects)", party: "Investor", optional: true },
    ],
  },
  {
    num: 7, title: "Title Insurance Documents", phase: "pre",
    items: [
      { id: "7-a", label: "Title Insurance Commitment", party: "Sponsor Attorney" },
      { id: "7-b", label: "Final Owner's Title Policy", party: "Sponsor Attorney" },
      { id: "7-c", label: "Recorded Encumbrances and Exceptions", party: "Sponsor Attorney" },
      { id: "7-d", label: "Easements", party: "Sponsor Attorney", optional: true },
    ],
  },
  {
    num: 8, title: "Survey", phase: "pre",
    items: [
      { id: "8-a", label: "ALTA Survey (start of construction)", party: "Sponsor Attorney" },
      { id: "8-b", label: "Flood Zone Certification", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 9, title: "Environmental Documents", phase: "pre",
    items: [
      { id: "9-a", label: "Phase I Environmental Site Assessment", party: "Investor" },
      { id: "9-b", label: "Phase I Update", party: "Investor", optional: true },
      { id: "9-c", label: "Phase II Environmental", party: "Investor", optional: true },
      { id: "9-d", label: "Reliance Letter(s) to Project Company", party: "Sponsor Attorney" },
      { id: "9-e", label: "Environmental Memo (Preliminary and Final)", party: "Closing Attorney" },
    ],
  },
  {
    num: 10, title: "Federal Tax Credit Documents", phase: "pre",
    items: [
      { id: "10-a", label: "Tax Credit Application", party: "Investor" },
      { id: "10-b", label: "Reservation Letter / 42(m) Letter (Bond Deals)", party: "Investor", optional: true },
      { id: "10-c", label: "Allocation Letter / 10% Certification", party: "Investor" },
      { id: "10-d", label: "Election of Applicable Percentage", party: "Investor" },
      { id: "10-e", label: "Bond Counsel Opinion (Tax-Exempt Bonds)", party: "Sponsor Attorney", optional: true },
      { id: "10-f", label: "Carryover Allocation Documents", party: "Closing Attorney" },
      { id: "10-g", label: "130% Boost Documentation (QCT/DDA)", party: "Sponsor Attorney", optional: true },
      { id: "10-h", label: "IRS Form 8609s (Resyndication Deals)", party: "Sponsor Attorney", optional: true },
      { id: "10-i", label: "LURA (Land Use Restrictive Agreement)", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 11, title: "State Tax Credit Documents", phase: "pre",
    items: [
      { id: "11-a", label: "State Tax Credit Application and Award Letter", party: "Sponsor Attorney", optional: true },
    ],
  },
  {
    num: 12, title: "Historic Tax Credit Documents", phase: "pre",
    items: [
      { id: "12-a", label: "Federal Historic Tax Credit Application (Parts I, II, III)", party: "Sponsor Attorney", optional: true },
      { id: "12-b", label: "State Historic Tax Credit Application", party: "Sponsor Attorney", optional: true },
    ],
  },
  {
    num: 13, title: "Evidence of Grants", phase: "pre",
    items: [
      { id: "13-a", label: "Grant Award Letters and Agreements", party: "Investor", optional: true },
    ],
  },
  {
    num: 14, title: "Construction Documents", phase: "pre",
    items: [
      { id: "14-a", label: "Architect's Agreement", party: "Sponsor Attorney" },
      { id: "14-b", label: "Construction Contract / CM Agreement", party: "Sponsor Attorney" },
      { id: "14-c", label: "Payment and Performance Bond", party: "Sponsor Attorney" },
      { id: "14-d", label: "Building Permit(s) or Ready to Issue Letter", party: "Sponsor Attorney" },
      { id: "14-e", label: "Notice to Proceed", party: "Sponsor Attorney" },
      { id: "14-f", label: "Construction Risk Management Sign-Off", party: "Investor" },
      { id: "14-g", label: "Utilities — Will Serve Letters", party: "Investor" },
      { id: "14-h", label: "Third-Party Construction Monitor Agreement", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 15, title: "Insurance Documents", phase: "pre",
    items: [
      { id: "15-a", label: "Insurance Risk Management Sign-Off", party: "Investor" },
      { id: "15-b", label: "Builder's Risk Insurance", party: "Sponsor Attorney" },
      { id: "15-c", label: "General Liability Insurance", party: "Sponsor Attorney" },
      { id: "15-d", label: "Workers Compensation Insurance", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 16, title: "Tax Opinion and Related Documents", phase: "pre",
    items: [
      { id: "16-a", label: "Tax Opinion", party: "Tax Attorney" },
    ],
  },
  {
    num: 17, title: "Company Opinion Letter", phase: "pre",
    items: [
      { id: "17-a", label: "Company Opinion Letter (include tax abatement if applicable)", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 18, title: "Affidavits", phase: "pre",
    items: [
      { id: "18-a", label: "Guarantor Affidavit (Entity)", party: "Sponsor Attorney" },
      { id: "18-b", label: "Guarantor Affidavit (Individual)", party: "Sponsor Attorney" },
      { id: "18-c", label: "Managing Member Affidavit", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 19, title: "Property Management", phase: "pre",
    items: [
      { id: "19-a", label: "Property Management Agreement", party: "Sponsor Attorney" },
      { id: "19-b", label: "Addendum to Property Management Agreement", party: "Sponsor Attorney" },
      { id: "19-c", label: "Management Plan (job titles, personnel, first year budget)", party: "Sponsor Attorney" },
      { id: "19-d", label: "Asset Manager Approval", party: "Investor" },
    ],
  },
  {
    num: 20, title: "Guarantor Organizational Documents", phase: "pre",
    items: [
      { id: "20-a", label: "Guarantor Resolution / Incumbency Certificate", party: "Sponsor Attorney" },
      { id: "20-b", label: "Articles of Organization (Guarantor)", party: "Sponsor Attorney" },
      { id: "20-c", label: "Operating Agreement (Guarantor)", party: "Sponsor Attorney" },
      { id: "20-d", label: "Certificate of Good Standing — Guarantor (within 30 days)", party: "Sponsor Attorney" },
      { id: "20-e", label: "FEIN / IRS Confirmation Letter (Guarantor)", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 21, title: "Managing Member Organizational Documents", phase: "pre",
    items: [
      { id: "21-a", label: "Managing Member Resolution / Incumbency Certificate", party: "Sponsor Attorney" },
      { id: "21-b", label: "Articles of Organization and Amendments (Managing Member)", party: "Sponsor Attorney" },
      { id: "21-c", label: "Operating Agreement (Managing Member)", party: "Sponsor Attorney" },
      { id: "21-d", label: "Certificate of Good Standing — Managing Member (within 30 days)", party: "Sponsor Attorney" },
      { id: "21-e", label: "FEIN / IRS Confirmation Letter (Managing Member)", party: "Sponsor Attorney" },
      { id: "21-f", label: "Entity Classification Election (Form 8832)", party: "Sponsor Attorney", optional: true },
    ],
  },
  {
    num: 22, title: "Construction Mortgage Loan", phase: "pre",
    items: [
      { id: "22-a", label: "Construction Loan Commitment Letter", party: "Investor" },
      { id: "22-b", label: "Construction Promissory Note", party: "Sponsor Attorney" },
      { id: "22-c", label: "Construction Loan Agreement", party: "Sponsor Attorney" },
      { id: "22-d", label: "Deed of Trust / Mortgage (Construction)", party: "Sponsor Attorney" },
      { id: "22-e", label: "Construction Disbursement Agreement", party: "Sponsor Attorney" },
      { id: "22-f", label: "Security Agreement", party: "Sponsor Attorney" },
      { id: "22-g", label: "Environmental Indemnity", party: "Sponsor Attorney" },
      { id: "22-h", label: "Subordination Agreement", party: "Sponsor Attorney" },
      { id: "22-i", label: "Replacement Reserve Agreement", party: "Sponsor Attorney" },
      { id: "22-j", label: "Assignment of Contracts, Plans and Specifications", party: "Sponsor Attorney" },
      { id: "22-k", label: "Completion Guaranty", party: "Sponsor Attorney" },
      { id: "22-l", label: "Payment Guaranty", party: "Sponsor Attorney" },
      { id: "22-m", label: "UCC Filing", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 23, title: "Tax-Exempt Bond Documents", phase: "pre",
    items: [
      { id: "23-a", label: "Regulatory Agreement and Declaration of Restrictive Covenants (Bonds)", party: "Sponsor Attorney", optional: true },
      { id: "23-b", label: "Trust Indenture", party: "Sponsor Attorney", optional: true },
      { id: "23-c", label: "Bond Loan Agreement", party: "Sponsor Attorney", optional: true },
      { id: "23-d", label: "TEFRA Hearing Resolution", party: "Sponsor Attorney", optional: true },
    ],
  },
  {
    num: 24, title: "Permanent Loan", phase: "pre",
    items: [
      { id: "24-a", label: "Permanent Loan Commitment Letter", party: "Investor" },
      { id: "24-b", label: "Permanent Promissory Note", party: "Sponsor Attorney" },
      { id: "24-c", label: "Permanent Loan Agreement", party: "Sponsor Attorney" },
      { id: "24-d", label: "Deed of Trust / Mortgage (Permanent)", party: "Sponsor Attorney" },
      { id: "24-e", label: "Permanent Regulatory Agreement / Restrictive Covenants", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 25, title: "Subordinate Loans (repeat for each source)", phase: "pre",
    items: [
      { id: "25-a", label: "Subordinate Commitment Letter / Award Letter", party: "Investor" },
      { id: "25-b", label: "Subordinate Promissory Note", party: "Sponsor Attorney" },
      { id: "25-c", label: "Subordinate Loan Agreement", party: "Sponsor Attorney" },
      { id: "25-d", label: "Deed of Trust / Mortgage (Subordinate)", party: "Sponsor Attorney" },
      { id: "25-e", label: "Subordinate Regulatory Agreement / Restrictive Covenants", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 26, title: "HUD Documents", phase: "pre",
    items: [
      { id: "26-a", label: "Agreement to Enter HAP Contract (AHAP)", party: "Investor", optional: true },
      { id: "26-b", label: "Housing Assistance Payments Contract (HAP)", party: "Investor", optional: true },
      { id: "26-c", label: "Annual Contributions Contract", party: "Sponsor Attorney", optional: true },
      { id: "26-d", label: "Mixed Financing Approval Letter", party: "Sponsor Attorney", optional: true },
      { id: "26-e", label: "HUD Regulatory Agreement / Restrictive Covenants", party: "Sponsor Attorney", optional: true },
    ],
  },
  {
    num: 27, title: "Project Company Organizational Documents", phase: "pre",
    items: [
      { id: "27-a", label: "Articles of Organization (Project Company)", party: "Sponsor Attorney" },
      { id: "27-b", label: "Certificate of Good Standing — Project Company (within 30 days)", party: "Sponsor Attorney" },
      { id: "27-c", label: "FEIN / IRS Confirmation Letter (Project Company)", party: "Sponsor Attorney" },
    ],
  },
  {
    num: 28, title: "Operating Agreement", phase: "pre",
    items: [
      { id: "28-a", label: "Original Operating Agreement", party: "Sponsor Attorney" },
      { id: "28-b", label: "Amended and Restated Operating Agreement", party: "Closing Attorney" },
    ],
  },
  {
    num: 29, title: "Other Pre-Closing Documents", phase: "pre",
    items: [
      { id: "29-a", label: "Lien and Litigation Searches", party: "Investor" },
      { id: "29-b", label: "Post-Closing Document Delivery Agreement", party: "Closing Attorney" },
    ],
  },
  // ── POST-CLOSING ───────────────────────────────────────────────────────────
  {
    num: 30, title: "Site Control (Post-Closing)", phase: "post",
    items: [
      { id: "30-a", label: "Tax Exemption or Abatement Documents (post-closing)", party: "Investor", optional: true },
      { id: "30-b", label: "Condo / Vertical Subdivision Documents", party: "Investor", optional: true },
    ],
  },
  {
    num: 31, title: "Title Insurance (Post-Closing)", phase: "post",
    items: [
      { id: "31-a", label: "Updated Title Policy / Title Report", party: "Investor" },
    ],
  },
  {
    num: 32, title: "Survey (Post-Closing)", phase: "post",
    items: [
      { id: "32-a", label: "ALTA \"As-Built\" Survey", party: "Investor" },
    ],
  },
  {
    num: 33, title: "Environmental (Post-Closing)", phase: "post",
    items: [
      { id: "33-a", label: "Managing Member Environmental Certification", party: "Investor" },
      { id: "33-b", label: "No Further Action Letter", party: "Investor", optional: true },
    ],
  },
  {
    num: 34, title: "Tax Credit Documents (Post-Closing)", phase: "post",
    items: [
      { id: "34-a", label: "Cost Certification Letter", party: "Investor" },
      { id: "34-b", label: "IRS Form 8609", party: "Investor" },
      { id: "34-c", label: "Extended Use Agreement", party: "Investor" },
    ],
  },
  {
    num: 35, title: "Historic Credits (Post-Closing)", phase: "post",
    items: [
      { id: "35-a", label: "Federal Historic Tax Credit Part III Application and Approval", party: "Investor", optional: true },
    ],
  },
  {
    num: 36, title: "Construction (Post-Closing)", phase: "post",
    items: [
      { id: "36-a", label: "Temporary Certificates of Occupancy", party: "Investor" },
      { id: "36-b", label: "Final Certificates of Occupancy", party: "Investor" },
      { id: "36-c", label: "Architect's Certification of Substantial Completion", party: "Investor" },
      { id: "36-d", label: "Unconditional / Final Lien Waivers", party: "Investor" },
    ],
  },
  {
    num: 37, title: "Accountant's Documents (Post-Closing)", phase: "post",
    items: [
      { id: "37-a", label: "10% Certification / 50% Test (Tax-Exempt Bond Deals)", party: "Investor", optional: true },
    ],
  },
  {
    num: 38, title: "Property Management (Post-Closing)", phase: "post",
    items: [
      { id: "38-a", label: "Final Management Agreement / Addendum", party: "Investor" },
    ],
  },
  {
    num: 39, title: "HUD Documents (Post-Closing)", phase: "post",
    items: [
      { id: "39-a", label: "Housing Assistance Payments Contract (HAP) — Post-Closing", party: "Investor", optional: true },
    ],
  },
];

const FOLDER_PATH = "lihtc-closing";
const TOTAL_ITEMS = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

// The key we store in document_name to uniquely identify a checklist upload
function docKey(item: ClosingItem) {
  return `[LIHTC] ${item.id}: ${item.label}`;
}

const PARTY_COLORS: Record<Party, string> = {
  "Sponsor Attorney":  "bg-teal-900/40 text-teal-300 border-teal-700/40",
  "Closing Attorney":  "bg-blue-900/40 text-blue-300 border-blue-700/40",
  "Investor":          "bg-purple-900/40 text-purple-300 border-purple-700/40",
  "Tax Attorney":      "bg-amber-900/40 text-amber-300 border-amber-700/40",
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

// ── Upload hook for a single item ─────────────────────────────────────────────

interface UseItemUploadReturn {
  uploading: boolean;
  upload: (file: File) => Promise<void>;
}

function useItemUpload(
  item: ClosingItem,
  onDone: (doc: CompanyDocument) => void
): UseItemUploadReturn {
  const [uploading, setUploading] = useState(false);

  const upload = useCallback(async (file: File) => {
    setUploading(true);
    try {
      // 1. Get a signed upload URL
      const urlRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content_type: file.type || "application/octet-stream" }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { upload_url, file_path } = await urlRes.json() as { upload_url: string; file_path: string };

      // 2. PUT file to storage
      const putRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!putRes.ok) throw new Error("Storage upload failed");

      // 3. Create document record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_name: docKey(item),
          file_path,
          file_size: file.size,
          folder_path: FOLDER_PATH,
          document_type: "other",
        }),
      });
      if (!docRes.ok) throw new Error("Failed to save document record");
      const { document } = await docRes.json() as { document: CompanyDocument };
      onDone(document);
    } finally {
      setUploading(false);
    }
  }, [item, onDone]);

  return { uploading, upload };
}

// ── Item row ──────────────────────────────────────────────────────────────────

interface ItemRowProps {
  item: ClosingItem;
  uploadedDoc: CompanyDocument | undefined;
  onUploaded: (doc: CompanyDocument) => void;
  onDeleteDoc: (docId: string, itemId: string) => void;
}

function ItemRow({ item, uploadedDoc, onUploaded, onDeleteDoc }: ItemRowProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { uploading, upload } = useItemUpload(item, onUploaded);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      await upload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    // Reset file input so the same file can be re-uploaded if needed
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className={`px-4 py-2.5 flex items-start gap-3 group transition-colors ${
      uploadedDoc ? "bg-teal-950/20" : "hover:bg-slate-800/20"
    }`}>
      {/* Status indicator */}
      <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
        uploadedDoc
          ? "bg-teal-700 border-teal-600"
          : "bg-slate-800 border-slate-700"
      }`}>
        {uploadedDoc && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm leading-snug ${uploadedDoc ? "text-slate-300" : "text-slate-300"}`}>
          {item.label}
          {item.optional && (
            <span className="ml-1.5 text-[10px] text-slate-600 font-medium">(if applicable)</span>
          )}
        </p>
        {uploadedDoc && (
          <p className="text-[10px] text-teal-600 mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {uploadedDoc.file_size ? fmtBytes(uploadedDoc.file_size) : "Uploaded"}
          </p>
        )}
        {error && <p className="text-[10px] text-red-400 mt-0.5">{error}</p>}
      </div>

      {/* Party badge */}
      <span className={`shrink-0 hidden sm:inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${PARTY_COLORS[item.party]}`}>
        {item.party}
      </span>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        {uploadedDoc ? (
          <>
            {uploadedDoc.signed_url && (
              <a
                href={uploadedDoc.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-slate-500 hover:text-teal-400 hover:bg-teal-900/20 transition-colors"
                title="View document"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            <button
              onClick={() => onDeleteDoc(uploadedDoc.id, item.id)}
              className="p-1.5 rounded-md text-slate-600 hover:text-red-400 hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
              title="Remove document"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors opacity-0 group-hover:opacity-100"
              title="Replace document"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </button>
          </>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-teal-900/40 hover:text-teal-300 border border-slate-700 hover:border-teal-700/50 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload
              </>
            )}
          </button>
        )}
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
      </div>
    </div>
  );
}

// ── Section accordion ─────────────────────────────────────────────────────────

interface SectionAccordionProps {
  section: ClosingSection;
  uploadedDocs: Map<string, CompanyDocument>;
  onUploaded: (doc: CompanyDocument) => void;
  onDeleteDoc: (docId: string, itemId: string) => void;
  defaultOpen?: boolean;
}

function SectionAccordion({ section, uploadedDocs, onUploaded, onDeleteDoc, defaultOpen }: SectionAccordionProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const uploadedCount = section.items.filter((item) => uploadedDocs.has(item.id)).length;
  const total = section.items.length;
  const allDone = uploadedCount === total;
  const pct = total > 0 ? (uploadedCount / total) * 100 : 0;

  return (
    <div className={`border rounded-xl overflow-hidden transition-colors ${
      allDone
        ? "border-teal-800/40 bg-teal-950/10"
        : "border-slate-800 bg-[#0F1729]"
    }`}>
      {/* Section header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition-colors"
      >
        {/* Number badge */}
        <span className={`shrink-0 w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center ${
          allDone
            ? "bg-teal-700 text-white"
            : "bg-slate-800 text-slate-400 border border-slate-700"
        }`}>
          {section.num === 0 ? "—" : section.num}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-slate-200">{section.title}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              uploadedCount === 0
                ? "bg-slate-800 text-slate-500"
                : allDone
                ? "bg-teal-800/60 text-teal-300"
                : "bg-amber-900/40 text-amber-300"
            }`}>
              {uploadedCount}/{total}
            </span>
          </div>
          {/* Mini progress bar */}
          {uploadedCount > 0 && !allDone && (
            <div className="mt-1 h-0.5 bg-slate-800 rounded-full overflow-hidden w-32">
              <div
                className="h-full bg-teal-600 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        <svg
          className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Items */}
      {open && (
        <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
          {section.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              uploadedDoc={uploadedDocs.get(item.id)}
              onUploaded={onUploaded}
              onDeleteDoc={onDeleteDoc}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LIHTCClosingPage() {
  const [docs, setDocs] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"pre" | "post">("pre");
  const [expandAll, setExpandAll] = useState(false);

  // Build a map: item.id → CompanyDocument
  const uploadedMap = new Map<string, CompanyDocument>();
  for (const doc of docs) {
    // Match by document_name prefix "[LIHTC] {itemId}:"
    const match = doc.document_name.match(/^\[LIHTC\] ([^:]+):/);
    if (match) uploadedMap.set(match[1], doc);
  }

  const preSections = SECTIONS.filter((s) => s.phase === "pre");
  const postSections = SECTIONS.filter((s) => s.phase === "post");
  const visibleSections = phase === "pre" ? preSections : postSections;

  const uploadedTotal = uploadedMap.size;
  const pctTotal = Math.round((uploadedTotal / TOTAL_ITEMS) * 100);

  useEffect(() => {
    fetch(`/api/documents?folder_path=${FOLDER_PATH}`)
      .then((r) => r.json())
      .then((d: { documents?: CompanyDocument[] }) => setDocs(d.documents ?? []))
      .finally(() => setLoading(false));
  }, []);

  function handleUploaded(doc: CompanyDocument) {
    setDocs((prev) => [doc, ...prev]);
  }

  async function handleDeleteDoc(docId: string, _itemId: string) {
    const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
    if (res.ok) setDocs((prev) => prev.filter((d) => d.id !== docId));
  }

  return (
    <div className="min-h-screen text-white">
      {/* Page header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-300 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white">LIHTC Closing Checklist</h1>
              <p className="text-xs text-slate-500 mt-0.5">Low-Income Housing Tax Credit Development — Closing Document Tracker</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Overall progress */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${pctTotal}%` }}
                />
              </div>
              <span className="font-semibold text-slate-300">{uploadedTotal}/{TOTAL_ITEMS}</span>
              <span className="text-slate-600">docs uploaded</span>
            </div>
            {/* Download template */}
            <a
              href="/templates/LIHTC_Closing_Checklist_Template.dotx"
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download .dotx Template
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Items", value: TOTAL_ITEMS, color: "text-slate-300" },
            { label: "Uploaded", value: uploadedTotal, color: "text-teal-400" },
            { label: "Remaining", value: TOTAL_ITEMS - uploadedTotal, color: "text-amber-400" },
            { label: "Complete", value: `${pctTotal}%`, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
              <div className={`text-2xl font-bold font-serif ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Party legend */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs text-slate-600 mr-1">Responsible party:</span>
          {(Object.entries(PARTY_COLORS) as [Party, string][]).map(([party, cls]) => (
            <span key={party} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
              {party}
            </span>
          ))}
        </div>

        {/* Phase tabs + expand toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex bg-slate-900 rounded-xl border border-slate-800 p-1 gap-1">
            {(["pre", "post"] as const).map((p) => {
              const secs = p === "pre" ? preSections : postSections;
              const cnt = secs.reduce((sum, s) => sum + s.items.filter((i) => uploadedMap.has(i.id)).length, 0);
              const tot = secs.reduce((sum, s) => sum + s.items.length, 0);
              return (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    phase === p
                      ? "bg-teal-700 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {p === "pre" ? "Pre-Closing" : "Post-Closing"}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    phase === p ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-500"
                  }`}>
                    {cnt}/{tot}
                  </span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setExpandAll((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {expandAll ? "Collapse all" : "Expand all"}
          </button>
        </div>

        {/* Notes */}
        <div className="mb-5 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-400">Notes: </span>
            (1) The Responsible Party shall prepare or collect the identified documents and forward to the Closing Attorney.
            (2) Tax Exemption or Abatement Documents may be post-closing items.
            (3) Post-closing items should be forwarded to the Investor's Legal Department.
            (4) This template is provided by RipeSpot Development, LLC — customize for your specific project and legal requirements.
            Uploaded documents are stored in your{" "}
            <Link href="/dashboard/documents" className="text-teal-500 hover:text-teal-400 underline underline-offset-2">
              Document Repository
            </Link>.
          </p>
        </div>

        {/* Sections */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading documents…</div>
        ) : (
          <div className="space-y-2">
            {visibleSections.map((section) => (
              <SectionAccordion
                key={section.num}
                section={section}
                uploadedDocs={uploadedMap}
                onUploaded={handleUploaded}
                onDeleteDoc={handleDeleteDoc}
                defaultOpen={expandAll}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
