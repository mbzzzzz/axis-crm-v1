import { ChevronDown } from "lucide-react";

export function FAQSection() {
  const faqs = [
    {
      question: "Can I import my data?",
      answer:
        "Yes, Axis CRM supports data import from CSV files. You can import properties, tenants, invoices, and other data through our import wizard. We also provide templates to help you format your data correctly.",
    },
    {
      question: "Is there a free trial?",
      answer:
        "Yes, our Starter plan is completely free forever. For Pro and Agency plans, we offer a 14-day free trial with full access to all features. No credit card required to start your trial.",
    },
    {
      question: "How secure is my data?",
      answer:
        "We take security seriously. All data is encrypted in transit and at rest using industry-standard encryption. We use Supabase for secure authentication and database hosting, ensuring your data is protected with enterprise-grade security measures.",
    },
    {
      question: "Can I customize invoices?",
      answer:
        "Absolutely! You can customize invoice templates with your logo, company information, payment terms, and branding. Pro and Agency plans include advanced customization options including custom color schemes and layouts.",
    },
    {
      question: "Do you offer API access?",
      answer:
        "Yes, API access is available on Pro and Agency plans. Our RESTful API allows you to integrate Axis CRM with your existing tools and workflows, enabling automation and custom integrations.",
    },
  ];

  return (
    <section className="py-20 relative z-10">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group border-b border-white/20 py-4"
            >
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                <ChevronDown className="size-5 text-neutral-400 group-open:rotate-180 transition-transform flex-shrink-0" />
              </summary>
              <p className="mt-4 text-neutral-400 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

