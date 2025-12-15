export interface LeaseTerms {
  monthlyRent: number;
  deposit?: number;
  securityDeposit?: number;
  utilities?: string[];
  petsAllowed?: boolean;
  petDeposit?: number;
  additionalTerms?: string;
  lateFeePolicy?: {
    gracePeriodDays: number;
    flatFee?: number;
    percentage?: number;
  };
  currency?: string;
}

export interface LeaseTemplate {
  id: string;
  name: string;
  type: "residential" | "commercial";
  description: string;
  terms: LeaseTerms;
}

const residentialStandard: LeaseTemplate = {
  id: "residential-standard",
  name: "Standard Residential Lease",
  type: "residential",
  description: "Standard 12-month residential lease with common terms",
  terms: {
    monthlyRent: 0, // Will be filled from form
    deposit: 0, // Will be filled from form
    securityDeposit: 0, // Will be filled from form
    utilities: ["Water", "Sewer", "Trash"],
    petsAllowed: false,
    additionalTerms: "Tenant is responsible for maintaining the property in good condition. All repairs must be reported promptly.",
    lateFeePolicy: {
      gracePeriodDays: 5,
      flatFee: 50,
    },
  },
};

const residentialPetFriendly: LeaseTemplate = {
  id: "residential-pet-friendly",
  name: "Pet-Friendly Residential Lease",
  type: "residential",
  description: "Residential lease with pet policy",
  terms: {
    monthlyRent: 0,
    deposit: 0,
    securityDeposit: 0,
    utilities: ["Water", "Sewer", "Trash"],
    petsAllowed: true,
    petDeposit: 300,
    additionalTerms: "Pets are allowed with written approval. Pet deposit is non-refundable. Tenant must maintain pet insurance.",
    lateFeePolicy: {
      gracePeriodDays: 5,
      flatFee: 50,
    },
  },
};

const commercialStandard: LeaseTemplate = {
  id: "commercial-standard",
  name: "Standard Commercial Lease",
  type: "commercial",
  description: "Standard commercial lease for business use",
  terms: {
    monthlyRent: 0,
    deposit: 0,
    securityDeposit: 0,
    utilities: ["Electricity", "Water", "Internet"],
    petsAllowed: false,
    additionalTerms: "Property is to be used for business purposes only. Tenant is responsible for all utilities and maintenance.",
    lateFeePolicy: {
      gracePeriodDays: 3,
      percentage: 5, // 5% of rent
    },
  },
};

export function getAllTemplates(): LeaseTemplate[] {
  return [residentialStandard, residentialPetFriendly, commercialStandard];
}

export function getTemplateById(id: string): LeaseTemplate | undefined {
  return getAllTemplates().find(t => t.id === id);
}

export function getTemplatesByType(type: "residential" | "commercial"): LeaseTemplate[] {
  return getAllTemplates().filter(t => t.type === type);
}
