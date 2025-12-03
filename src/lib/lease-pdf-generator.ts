import jsPDF from "jspdf";
import { LeaseTerms } from "./lease-templates";

export function generateLeasePDF(terms: LeaseTerms, leaseNumber: string): jsPDF {
  const doc = new jsPDF();
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.text("LEASE AGREEMENT", 105, yPos, { align: "center" });
  yPos += 10;

  doc.setFontSize(12);
  doc.text(`Lease Number: ${leaseNumber}`, 105, yPos, { align: "center" });
  yPos += 15;

  // Lease Terms
  doc.setFontSize(14);
  doc.text("LEASE TERMS", 20, yPos);
  yPos += 10;

  doc.setFontSize(11);
  doc.text(`Monthly Rent: $${terms.monthlyRent.toLocaleString()}`, 20, yPos);
  yPos += 7;

  if (terms.deposit || terms.securityDeposit) {
    const deposit = terms.deposit || terms.securityDeposit || 0;
    doc.text(`Security Deposit: $${deposit.toLocaleString()}`, 20, yPos);
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
      doc.text(`Pet Deposit: $${terms.petDeposit.toLocaleString()}`, 30, yPos);
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
      doc.text(`Late Fee: $${terms.lateFeePolicy.flatFee} flat fee`, 20, yPos);
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

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: "center" }
    );
  }

  return doc;
}
