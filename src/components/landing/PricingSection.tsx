import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { ShineBorder } from "@/components/ui/shine-border";

export function PricingSection() {
  const plans = [
    {
      name: "Professional",
      price: "$90",
      period: "/mo",
      description: "Perfect for individual agents and small teams",
      features: [
        "Unlimited properties",
        "Unlimited tenants",
        "Advanced analytics",
        "Priority support",
        "API access",
        "Custom branding",
        "Email integration",
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const,
      highlighted: false,
    },
    {
      name: "Business",
      price: "$150",
      period: "/mo",
      description: "For growing real estate businesses",
      features: [
        "Everything in Professional",
        "Team collaboration (up to 10 users)",
        "White-label options",
        "Advanced reporting",
        "Dedicated support",
        "Custom integrations",
        "Bulk operations",
      ],
      buttonText: "Start Free Trial",
      buttonVariant: "default" as const,
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large agencies and organizations",
      features: [
        "Everything in Business",
        "Unlimited team members",
        "Custom deployment options",
        "Dedicated account manager",
        "SLA guarantee",
        "Custom feature development",
        "On-premise deployment available",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Choose the plan that fits your business needs. All plans include a 14-day free trial.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            // Different shine colors for each plan - brighter colors for visibility
            const shineColors = plan.highlighted
              ? ["#a855f7", "#ec4899", "#8b5cf6"] // Purple/pink gradient for Business
              : index === 0
              ? ["#3b82f6", "#60a5fa", "#3b82f6"] // Blue gradient for Professional
              : ["#10b981", "#34d399", "#10b981"]; // Green gradient for Enterprise

            return (
              <ShineBorder
                key={index}
                borderRadius={16}
                borderWidth={3}
                duration={10}
                color={shineColors}
                className="bg-neutral-900/20 border-0 p-0 dark:bg-neutral-900/20"
              >
                <div className="p-8 rounded-2xl relative w-full h-full bg-neutral-900/20">
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      {plan.period && (
                        <span className="text-neutral-400 text-lg">{plan.period}</span>
                      )}
                    </div>
                    <p className="text-neutral-400 text-sm">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-neutral-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.buttonVariant}
                    className={`w-full ${
                      plan.highlighted
                        ? "bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                        : "border-neutral-700 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ color: "white" }}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              </ShineBorder>
            );
          })}
        </div>
      </div>
    </section>
  );
}

