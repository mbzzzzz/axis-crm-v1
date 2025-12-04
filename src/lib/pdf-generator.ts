import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency } from './utils';
import type { CurrencyCode } from './currency-formatter';

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  
  // Property Details
  propertyAddress?: string;
  propertyUnit?: string;
  propertyType?: string;
  
  // Client/Tenant Details
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  clientPhone?: string;
  
  // Agent Details
  agentName?: string;
  agentAgency?: string;
  agentEmail?: string;
  agentPhone?: string;
  
  // Owner Details
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  
  // Financial Details
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  
  // Additional
  notes?: string;
  paymentTerms?: string;
  lateFeePolicy?: string;
  currency?: string; // Currency code (USD, INR, etc.) - defaults to USD

  // Branding (optional)
  logoMode?: 'image' | 'text';
  logoDataUrl?: string;
  logoWidth?: number; // treated as mm width in PDF context
  companyName?: string;
  companyTagline?: string;
}

export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Get currency code (default to USD)
  const currencyCode = (data.currency || 'USD') as CurrencyCode;
  
  // Colors
  const primaryColor: [number, number, number] = [52, 73, 94]; // Dark blue
  const accentColor: [number, number, number] = [41, 128, 185]; // Light blue
  const textColor: [number, number, number] = [44, 62, 80];
  
  let yPosition = 20;
  
  // Header - Company Branding
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  const companyName = data.companyName || 'AXIS CRM';
  const companyTagline = data.companyTagline || 'Real Estate Management';
  const headerPaddingX = 20;

  // Decide between image logo vs text logo
  const useImageLogo = (data.logoMode === 'image' && !!data.logoDataUrl);

  if (useImageLogo) {
    try {
      // Determine format from data URL; default to PNG
      const match = data.logoDataUrl!.match(/^data:image\/(png|jpeg|jpg)/i);
      const format = match && match[1] ? (match[1].toUpperCase().includes('JPG') ? 'JPEG' : match[1].toUpperCase()) : 'PNG';
      const desiredWidth = Math.min(60, Math.max(20, data.logoWidth || 40)); // mm
      // Get image props to keep aspect ratio
      const props = (doc as any).getImageProperties(data.logoDataUrl);
      const ratio = props && props.width ? props.height / props.width : 1;
      const imgW = desiredWidth;
      const imgH = imgW * (ratio || 1);
      const imgX = headerPaddingX;
      const imgY = 8 + (30 - Math.min(30, imgH)) / 2; // vertically center in header band
      doc.addImage(data.logoDataUrl!, format as any, imgX, imgY, imgW, Math.min(30, imgH));
    } catch (e) {
      // Fallback to text logo if image embedding fails
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text(companyName, headerPaddingX, 25);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(companyTagline, headerPaddingX, 32);
    }
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName, headerPaddingX, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(companyTagline, headerPaddingX, 32);
  }
  
  // Invoice Number and Dates (right side)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INVOICE', pageWidth - 20, 18, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${data.invoiceNumber}`, pageWidth - 20, 26, { align: 'right' });
  doc.text(`Date: ${new Date(data.invoiceDate).toLocaleDateString()}`, pageWidth - 20, 32, { align: 'right' });
  doc.text(`Due: ${new Date(data.dueDate).toLocaleDateString()}`, pageWidth - 20, 38, { align: 'right' });
  
  yPosition = 55;
  doc.setTextColor(...textColor);
  
  // Property Information Section
  if (data.propertyAddress) {
    doc.setFillColor(245, 245, 245);
    doc.rect(15, yPosition, pageWidth - 30, 25, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('PROPERTY DETAILS', 20, yPosition + 7);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.setFontSize(9);
    doc.text(data.propertyAddress, 20, yPosition + 14);
    if (data.propertyUnit) {
      doc.text(`Unit: ${data.propertyUnit}`, 20, yPosition + 19);
    }
    if (data.propertyType) {
      doc.text(`Type: ${data.propertyType.replace(/_/g, ' ').toUpperCase()}`, pageWidth / 2, yPosition + 14);
    }
    
    yPosition += 30;
  }
  
  // Three columns: Client, Agent, Owner
  const columnWidth = (pageWidth - 40) / 3;
  
  // Client/Tenant Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('BILL TO', 20, yPosition);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.text(data.clientName, 20, yPosition + 7);
  doc.text(data.clientEmail, 20, yPosition + 12);
  if (data.clientAddress) {
    const addressLines = doc.splitTextToSize(data.clientAddress, columnWidth - 5);
    doc.text(addressLines, 20, yPosition + 17);
  }
  if (data.clientPhone) {
    doc.text(data.clientPhone, 20, yPosition + (data.clientAddress ? 27 : 17));
  }
  
  // Agent Details
  if (data.agentName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('AGENT', 20 + columnWidth, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(data.agentName, 20 + columnWidth, yPosition + 7);
    if (data.agentAgency) {
      doc.text(data.agentAgency, 20 + columnWidth, yPosition + 12);
    }
    if (data.agentEmail) {
      doc.text(data.agentEmail, 20 + columnWidth, yPosition + 17);
    }
    if (data.agentPhone) {
      doc.text(data.agentPhone, 20 + columnWidth, yPosition + 22);
    }
  }
  
  // Owner Details
  if (data.ownerName) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...accentColor);
    doc.text('PROPERTY OWNER', 20 + columnWidth * 2, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textColor);
    doc.text(data.ownerName, 20 + columnWidth * 2, yPosition + 7);
    if (data.ownerEmail) {
      doc.text(data.ownerEmail, 20 + columnWidth * 2, yPosition + 12);
    }
    if (data.ownerPhone) {
      doc.text(data.ownerPhone, 20 + columnWidth * 2, yPosition + 17);
    }
  }
  
  yPosition += 40;
  
  // Line items table - format with currency
  const tableData = data.items.map(item => [
    item.description,
    item.quantity.toString(),
    formatCurrency(item.rate, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    formatCurrency(item.amount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  ]);
  
  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Quantity', 'Rate', 'Amount']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 9,
      textColor: textColor
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 30 }
    },
    margin: { left: 20, right: 20 }
  });
  
  // Get final Y position after table
  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 50;
  yPosition = finalY + 10;
  
  // Totals section (right-aligned)
  const totalsX = pageWidth - 80;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(data.subtotal, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 20, yPosition, { align: 'right' });

  yPosition += 7;
  doc.text(`Tax (${data.taxRate}%):`, totalsX, yPosition, { align: 'right' });
  doc.text(formatCurrency(data.taxAmount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 20, yPosition, { align: 'right' });

  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(245, 245, 245);
  doc.rect(totalsX - 10, yPosition - 5, pageWidth - totalsX - 10, 10, 'F');
  doc.text('TOTAL:', totalsX, yPosition, { align: 'right' });
  doc.setTextColor(...accentColor);
  doc.text(formatCurrency(data.totalAmount, currencyCode, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - 20, yPosition, { align: 'right' });
  
  yPosition += 15;
  doc.setTextColor(...textColor);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, totalsX, yPosition, { align: 'right' });
  
  yPosition += 15;
  
  // Payment Terms and Notes
  if (data.paymentTerms || data.notes || data.lateFeePolicy) {
    doc.setFillColor(250, 250, 250);
    doc.rect(15, yPosition, pageWidth - 30, 0.5, 'F');
    yPosition += 10;
    
    if (data.paymentTerms) {
      doc.setFont('helvetica', 'bold');
      doc.text('Payment Terms:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(data.paymentTerms, pageWidth - 40);
      doc.text(termsLines, 20, yPosition + 5);
      yPosition += 5 + (termsLines.length * 5);
    }
    
    if (data.lateFeePolicy) {
      doc.setFont('helvetica', 'bold');
      doc.text('Late Fee Policy:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const feeLines = doc.splitTextToSize(data.lateFeePolicy, pageWidth - 40);
      doc.text(feeLines, 20, yPosition + 5);
      yPosition += 5 + (feeLines.length * 5);
    }
    
    if (data.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      doc.setFont('helvetica', 'normal');
      const noteLines = doc.splitTextToSize(data.notes, pageWidth - 40);
      doc.text(noteLines, 20, yPosition + 5);
    }
  }
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFillColor(...primaryColor);
  doc.rect(0, footerY, pageWidth, 20, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Thank you for your business!', pageWidth / 2, footerY + 10, { align: 'center' });
  doc.text('Generated by Axis CRM - Real Estate Management', pageWidth / 2, footerY + 15, { align: 'center' });
  
  return doc;
}

export function downloadInvoicePDF(data: InvoiceData, filename?: string): void {
  const pdf = generateInvoicePDF(data);
  const pdfFilename = filename || `invoice-${data.invoiceNumber}-${Date.now()}.pdf`;
  pdf.save(pdfFilename);
}

export function getInvoicePDFBlob(data: InvoiceData): Blob {
  const pdf = generateInvoicePDF(data);
  return pdf.output('blob');
}

export function getInvoicePDFDataURL(data: InvoiceData): string {
  const pdf = generateInvoicePDF(data);
  return pdf.output('dataurlstring');
}