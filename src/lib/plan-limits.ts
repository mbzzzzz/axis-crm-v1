export type UsageFeature = "autoGenerations" | "propertyPosts" | "leads" | "monthlyInvoices";

export type PlanKey = "free" | "professional" | "enterprise" | "agency";

type PlanDefinition = {
  key: PlanKey;
  label: string;
  description: string;
  price: string; // Display price
  priceMonthly: number; // Monthly price in dollars
  priceYearly: number; // Yearly price in dollars (if applicable)
  limits: Record<UsageFeature, number | null>;
  features: string[]; // Key features for this plan
};

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  free: {
    key: "free",
    label: "Starter",
    description: "Perfect for getting started. FREE property listings forever.",
    price: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      autoGenerations: 10, // Limited AI generations
      propertyPosts: null, // UNLIMITED - main differentiator
      leads: 50,
      monthlyInvoices: 25,
    },
    features: [
      "Unlimited property listings (FREE)",
      "Up to 10 active properties",
      "Basic CRM features",
      "Basic reporting",
      "Email support",
      "Mobile app access",
    ],
  },
  professional: {
    key: "professional",
    label: "Professional",
    description: "Best for solo agents and emerging teams. Unlimited everything.",
    price: "$29",
    priceMonthly: 29,
    priceYearly: 290, // Save $58 (2 months free)
    limits: {
      autoGenerations: 100,
      propertyPosts: null, // UNLIMITED
      leads: 500,
      monthlyInvoices: 200,
    },
    features: [
      "Everything in Starter",
      "Unlimited properties",
      "Advanced analytics & reporting",
      "Automated invoice generation",
      "Lead management & tracking",
      "Email templates library",
      "API access",
      "Priority support",
      "Custom branding",
    ],
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    description: "For growing agencies and teams. Advanced collaboration features.",
    price: "$99",
    priceMonthly: 99,
    priceYearly: 990, // Save $198 (2 months free)
    limits: {
      autoGenerations: 500,
      propertyPosts: null, // UNLIMITED
      leads: 2000,
      monthlyInvoices: 1000,
    },
    features: [
      "Everything in Professional",
      "Multi-user team management (up to 10 users)",
      "Advanced integrations",
      "Automated marketing campaigns",
      "Advanced financial reporting",
      "White-label options",
      "Custom API integrations",
      "Priority support (24-48hr)",
      "Team analytics",
      "Role-based permissions",
    ],
  },
  agency: {
    key: "agency",
    label: "Agency",
    description: "For large brokerages and franchises. Custom solutions.",
    price: "Custom",
    priceMonthly: 299, // Starting price
    priceYearly: 2990, // Starting price
    limits: {
      autoGenerations: null, // UNLIMITED
      propertyPosts: null, // UNLIMITED
      leads: null, // UNLIMITED
      monthlyInvoices: null, // UNLIMITED
    },
    features: [
      "Everything in Enterprise",
      "Unlimited team members",
      "Custom domain",
      "SSO (Single Sign-On)",
      "Advanced security & compliance",
      "Custom feature development",
      "SLA guarantee (99.9% uptime)",
      "Dedicated account manager",
      "Onboarding & training",
      "Custom integrations",
    ],
  },
};

export const FEATURE_LABELS: Record<UsageFeature, string> = {
  autoGenerations: "AI auto-generations",
  propertyPosts: "property postings",
  leads: "lead captures",
  monthlyInvoices: "monthly invoices",
};

export function isPlanKey(value: string | null | undefined): value is PlanKey {
  return Boolean(value && value in PLAN_DEFINITIONS);
}

export function getPlanDefinition(planKey: PlanKey) {
  return PLAN_DEFINITIONS[planKey];
}

export function formatFeatureLimit(planKey: PlanKey, feature: UsageFeature) {
  const plan = PLAN_DEFINITIONS[planKey];
  const limit = plan.limits[feature];
  if (limit === null) {
    return "Unlimited";
  }
  return limit.toLocaleString();
}

/**
 * Get plan price information
 */
export function getPlanPrice(planKey: PlanKey) {
  const plan = PLAN_DEFINITIONS[planKey];
  return {
    display: plan.price,
    monthly: plan.priceMonthly,
    yearly: plan.priceYearly,
    savings: plan.priceYearly > 0 ? plan.priceMonthly * 12 - plan.priceYearly : 0,
  };
}

/**
 * Check if property posting is free (unlimited) for this plan
 * This is our main competitive advantage
 */
export function isPropertyPostingFree(planKey: PlanKey): boolean {
  const plan = PLAN_DEFINITIONS[planKey];
  return plan.limits.propertyPosts === null; // null means unlimited
}

