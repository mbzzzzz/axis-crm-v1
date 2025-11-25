export function FeatureDeepDive() {
  const features = [
    {
      title: "Pipeline Management",
      description:
        "Track leads from initial inquiry through to closing. Organize your sales pipeline with visual kanban boards, automated status updates, and intelligent lead scoring to prioritize your efforts.",
      imagePosition: "right" as const,
    },
    {
      title: "Financial Insights",
      description:
        "Get real-time financial analytics with comprehensive dashboards. Monitor revenue, expenses, profit margins, and cash flow. Make data-driven decisions with detailed reports and forecasting tools.",
      imagePosition: "left" as const,
    },
    {
      title: "Automated Invoicing",
      description:
        "Streamline your billing process with automated invoice generation. Set up recurring invoices, track payment status, and send professional invoices directly to clients via email integration.",
      imagePosition: "right" as const,
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className={`my-24 flex flex-col ${
              feature.imagePosition === "right" ? "md:flex-row" : "md:flex-row-reverse"
            } items-center gap-8 md:gap-12`}
          >
            <div className="flex-1">
              <h3 className="text-3xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-lg text-neutral-400 leading-relaxed">{feature.description}</p>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-[4/3] rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <p className="text-white/40 text-sm">Image Placeholder</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

