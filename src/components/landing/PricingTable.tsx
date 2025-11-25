import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function PricingTable() {
  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for getting started",
      features: ["Up to 10 properties", "Basic reporting", "Email support"],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      highlighted: false,
    },
    {
      name: "Pro",
      price: "$29",
      period: "/mo",
      description: "For growing businesses",
      features: [
        "Unlimited properties",
        "Advanced analytics",
        "Priority support",
        "API access",
        "Custom branding",
      ],
      buttonText: "Start Trial",
      buttonVariant: "default" as const,
      highlighted: true,
    },
    {
      name: "Agency",
      price: "$99",
      period: "/mo",
      description: "For agencies and teams",
      features: [
        "Everything in Pro",
        "Team collaboration",
        "White-label options",
        "Dedicated support",
        "Custom integrations",
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      highlighted: false,
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-neutral-900/20 border ${
                plan.highlighted ? "border-purple-500" : "border-neutral-800"
              } p-8 rounded-2xl relative`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
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
                    ? "bg-purple-500 hover:bg-purple-600 text-white"
                    : "border-neutral-700 text-white hover:bg-white/10"
                }`}
              >
                {plan.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

