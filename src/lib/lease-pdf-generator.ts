import jsPDF from "jspdf";
import { LeaseTerms } from "./lease-templates";

export interface LeasePdfMetadata {
  tenantName?: string | null;
  tenantEmail?: string | null;
  propertyTitle?: string | null;
  propertyAddress?: string | null;
  leaseType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  monthlyRent?: number | null;
  deposit?: number | null;
  currency?: string | null;
  ownerSignatureDataUrl?: string | null;
  tenantSignatureDataUrl?: string | null;
  ownerLabel?: string;
  tenantLabel?: string;
}

export function generateLeasePDF(
  terms: LeaseTerms,
  leaseNumber: string,
  metadata: LeasePdfMetadata = {}
): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  const currency = metadata.currency || terms.currency || "USD";
  const formatMoney = (amount: number | null | undefined): string =>
    amount != null ? `${currency} ${amount.toLocaleString()}` : `${currency} 0`;

  // Header
  doc.setFontSize(20);
  doc.text("LEASE AGREEMENT", 105, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.text(`Lease Number: ${leaseNumber}`, 105, yPos, { align: "center" });
  yPos += 8;

  if (metadata.tenantName || metadata.propertyAddress) {
    const tenantLine = metadata.tenantName
      ? `Tenant: ${metadata.tenantName}${metadata.tenantEmail ? ` <${metadata.tenantEmail}>` : ""}`
      : "";
    const propertyLine = metadata.propertyTitle || metadata.propertyAddress
      ? `Property: ${metadata.propertyTitle || metadata.propertyAddress}`
      : "";

    if (tenantLine) {
      doc.text(tenantLine, 20, yPos);
      yPos += 6;
    }
    if (propertyLine) {
      doc.text(propertyLine, 20, yPos);
      yPos += 6;
    }
  }

  if (metadata.startDate || metadata.endDate) {
    const datesLine = `Term: ${metadata.startDate || "N/A"} to ${metadata.endDate || "N/A"}`;
    doc.text(datesLine, 20, yPos);
    yPos += 8;
  } else {
    yPos += 4;
  }

  // Lease Terms
  doc.setFontSize(14);
  doc.text("LEASE TERMS", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.text(`Monthly Rent: ${formatMoney(metadata.monthlyRent ?? terms.monthlyRent)}`, 20, yPos);
  yPos += 7;

  const depositValue =
    metadata.deposit != null ? metadata.deposit : terms.deposit || terms.securityDeposit || 0;
  if (depositValue) {
    doc.text(`Security Deposit: ${formatMoney(depositValue)}`, 20, yPos);
    yPos += 7;
  }

  if (terms.utilities && terms.utilities.length > 0) {
    doc.text(`Utilities Included: ${terms.utilities.join(", ")}`, 20, yPos);
    yPos += 7;
  }

  if (terms.petsAllowed !== undefined) {
    doc.text(`Pets Allowed: ${terms.petsAllowed ? "Yes" : "No"}`, 20, yPos);
    yPos += 7;
    if (terms.petsAllowed && terms.petDeposit) {
      doc.text(`Pet Deposit: ${formatMoney(terms.petDeposit)}`, 30, yPos);
      yPos += 7;
    }
  }

  if (terms.lateFeePolicy) {
    yPos += 5;
    doc.setFontSize(12);
    doc.text("Late Fee Policy:", 20, yPos);
    yPos += 7;
    doc.setFontSize(11);
    doc.text(`Grace Period: ${terms.lateFeePolicy.gracePeriodDays} days`, 20, yPos);
    yPos += 7;
    if (terms.lateFeePolicy.flatFee) {
      doc.text(`Late Fee: ${formatMoney(terms.lateFeePolicy.flatFee)}`, 20, yPos);
      yPos += 7;
    } else if (terms.lateFeePolicy.percentage) {
      doc.text(`Late Fee: ${terms.lateFeePolicy.percentage}% of rent`, 20, yPos);
      yPos += 7;
    }
  }

  // Additional Terms
  if (terms.additionalTerms) {
    yPos += 10;
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(12);
    doc.text("Additional Terms:", 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(terms.additionalTerms, 170);
    doc.text(splitText, 20, yPos);
    yPos += splitText.length * 5;
  }

  // Move to last page for signatures and footer
  const pageCountBefore = doc.getNumberOfPages();
  doc.setPage(pageCountBefore);

  const pageHeight = doc.internal.pageSize.height || 297;
  const signatureAreaTop = pageHeight - 50;

  // Signature labels
  doc.setFontSize(11);
  const ownerLabel = metadata.ownerLabel || "Agent / Owner Signature";
  const tenantLabel = metadata.tenantLabel || "Tenant Signature";

  doc.text(ownerLabel, 20, signatureAreaTop + 22);
  doc.text(tenantLabel, 130, signatureAreaTop + 22);

  // Signature images (agent left bottom, tenant right bottom)
  if (metadata.ownerSignatureDataUrl) {
    try {
      doc.addImage(metadata.ownerSignatureDataUrl, "PNG", 20, signatureAreaTop, 60, 20);
    } catch {
      // Ignore image errors so PDF generation still succeeds
    }
  }

  if (metadata.tenantSignatureDataUrl) {
    try {
      doc.addImage(metadata.tenantSignatureDataUrl, "PNG", 130, signatureAreaTop, 60, 20);
    } catch {
      // Ignore image errors so PDF generation still succeeds
    }
  }

  // Footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      (doc.internal.pageSize.height || pageHeight) - 10,
      { align: "center" }
    );
  }

  return doc;
}
