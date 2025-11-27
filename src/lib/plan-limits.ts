export type UsageFeature = "autoGenerations" | "propertyPosts" | "leads" | "monthlyInvoices";

export type PlanKey = "professional" | "business" | "enterprise";

type PlanDefinition = {
  key: PlanKey;
  label: string;
  description: string;
  limits: Record<UsageFeature, number | null>;
};

export const PLAN_DEFINITIONS: Record<PlanKey, PlanDefinition> = {
  professional: {
    key: "professional",
    label: "Professional",
    description: "Best for solo agents and emerging teams.",
    limits: {
      autoGenerations: 40,
      propertyPosts: 60,
      leads: 200,
      monthlyInvoices: 150,
    },
  },
  business: {
    key: "business",
    label: "Business",
    description: "Scaling brokerages with deeper automation needs.",
    limits: {
      autoGenerations: 200,
      propertyPosts: 300,
      leads: 1000,
      monthlyInvoices: 600,
    },
  },
  enterprise: {
    key: "enterprise",
    label: "Enterprise",
    description: "Custom deployments and dedicated success.",
    limits: {
      autoGenerations: null,
      propertyPosts: null,
      leads: null,
      monthlyInvoices: null,
    },
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

