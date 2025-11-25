import * as XLSX from "xlsx";

export function exportToCSV(data: any[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], filename: string, sheetName: string = "Sheet1") {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  XLSX.writeFile(workbook, filename);
}

export function generatePropertyTemplate() {
  const template = [
    {
      title: "Example Property",
      description: "A beautiful property",
      address: "123 Main St",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
      propertyType: "residential",
      status: "available",
      price: 500000,
      sizeSqft: 2000,
      bedrooms: 3,
      bathrooms: 2,
      yearBuilt: 2020,
      purchasePrice: 450000,
      estimatedValue: 520000,
      monthlyExpenses: 1500,
      commissionRate: 3,
    },
  ];
  
  exportToExcel(template, "property-template.xlsx", "Properties");
}

export function generateInvoiceTemplate() {
  const template = [
    {
      invoiceNumber: "INV-2024-001",
      propertyId: 1,
      clientName: "John Doe",
      clientEmail: "john@example.com",
      clientAddress: "456 Oak Ave",
      invoiceDate: "2024-01-01",
      dueDate: "2024-01-31",
      subtotal: 5000,
      taxRate: 0.07,
      taxAmount: 350,
      totalAmount: 5350,
      paymentStatus: "draft",
      notes: "Commission for property sale",
    },
  ];
  
  exportToExcel(template, "invoice-template.xlsx", "Invoices");
}

export async function importFromFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function validatePropertyData(data: any[]): { valid: any[]; errors: any[] } {
  const valid: any[] = [];
  const errors: any[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    // Required fields validation
    if (!row.title) rowErrors.push("Missing title");
    if (!row.address) rowErrors.push("Missing address");
    if (!row.city) rowErrors.push("Missing city");
    if (!row.state) rowErrors.push("Missing state");
    if (!row.zipCode) rowErrors.push("Missing zipCode");
    if (!row.propertyType) rowErrors.push("Missing propertyType");
    if (!row.status) rowErrors.push("Missing status");
    if (!row.price || isNaN(parseFloat(row.price))) rowErrors.push("Invalid price");
    
    // Property type validation
    const validTypes = ["residential", "commercial", "land", "multi_family"];
    if (row.propertyType && !validTypes.includes(row.propertyType.toLowerCase())) {
      rowErrors.push("Invalid propertyType");
    }
    
    // Status validation
    const validStatuses = ["available", "under_contract", "sold", "rented", "pending"];
    if (row.status && !validStatuses.includes(row.status.toLowerCase())) {
      rowErrors.push("Invalid status");
    }
    
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors, data: row });
    } else {
      valid.push(row);
    }
  });
  
  return { valid, errors };
}

export function validateInvoiceData(data: any[]): { valid: any[]; errors: any[] } {
  const valid: any[] = [];
  const errors: any[] = [];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    // Required fields validation
    if (!row.invoiceNumber) rowErrors.push("Missing invoiceNumber");
    if (!row.propertyId || isNaN(parseInt(row.propertyId))) rowErrors.push("Invalid propertyId");
    if (!row.clientName) rowErrors.push("Missing clientName");
    if (!row.clientEmail) rowErrors.push("Missing clientEmail");
    if (!row.invoiceDate) rowErrors.push("Missing invoiceDate");
    if (!row.dueDate) rowErrors.push("Missing dueDate");
    if (!row.subtotal || isNaN(parseFloat(row.subtotal))) rowErrors.push("Invalid subtotal");
    if (!row.taxRate || isNaN(parseFloat(row.taxRate))) rowErrors.push("Invalid taxRate");
    if (!row.taxAmount || isNaN(parseFloat(row.taxAmount))) rowErrors.push("Invalid taxAmount");
    if (!row.totalAmount || isNaN(parseFloat(row.totalAmount))) rowErrors.push("Invalid totalAmount");
    if (!row.paymentStatus) rowErrors.push("Missing paymentStatus");
    
    // Status validation
    const validStatuses = ["draft", "sent", "paid", "overdue", "cancelled"];
    if (row.paymentStatus && !validStatuses.includes(row.paymentStatus.toLowerCase())) {
      rowErrors.push("Invalid paymentStatus");
    }
    
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors, data: row });
    } else {
      valid.push(row);
    }
  });
  
  return { valid, errors };
}

export function generateLeadTemplate() {
  const template = [
    {
      name: "John Doe",
      phone: "+92 300 1234567",
      email: "john@example.com",
      budget: 50000,
      preferredLocation: "Downtown",
      source: "zameen",
      status: "inquiry",
      notes: "Interested in 2-bedroom apartment",
    },
  ];
  
  exportToExcel(template, "lead-template.xlsx", "Leads");
}

export function validateLeadData(data: any[]): { valid: any[]; errors: any[] } {
  const valid: any[] = [];
  const errors: any[] = [];
  
  const VALID_STATUSES = ['inquiry', 'viewing', 'application', 'signed', 'archived'];
  const VALID_SOURCES = ['zameen', 'olx', 'referral', 'website', 'other', 'bayut', 'propertyfinder', 'dubizzle', 'propsearch', 'zillow', 'realtor'];
  
  data.forEach((row, index) => {
    const rowErrors: string[] = [];
    
    // Required fields validation
    if (!row.name || !row.name.trim()) rowErrors.push("Missing name");
    if (!row.phone || !row.phone.trim()) rowErrors.push("Missing phone");
    if (!row.source || !VALID_SOURCES.includes(row.source.toLowerCase())) {
      rowErrors.push(`Invalid source. Must be one of: ${VALID_SOURCES.join(', ')}`);
    }
    
    // Optional but validate if provided
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      rowErrors.push("Invalid email format");
    }
    
    if (row.budget && isNaN(parseFloat(String(row.budget)))) {
      rowErrors.push("Invalid budget (must be a number)");
    }
    
    if (row.status && !VALID_STATUSES.includes(row.status.toLowerCase())) {
      rowErrors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    }
    
    if (rowErrors.length > 0) {
      errors.push({ row: index + 1, errors: rowErrors, data: row });
    } else {
      // Normalize data
      const normalizedRow = {
        ...row,
        name: row.name.trim(),
        phone: row.phone.trim(),
        email: row.email?.trim() || null,
        budget: row.budget ? parseFloat(String(row.budget)) : null,
        preferredLocation: row.preferredLocation?.trim() || null,
        source: row.source.toLowerCase(),
        status: (row.status || 'inquiry').toLowerCase(),
        notes: row.notes?.trim() || null,
      };
      valid.push(normalizedRow);
    }
  });
  
  return { valid, errors };
}