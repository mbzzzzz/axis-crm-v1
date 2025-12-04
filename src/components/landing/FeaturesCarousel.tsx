"use client";

import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Building2, Users, FileText, Wrench, TrendingUp, DollarSign, FileSignature, BarChart3 } from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  gradient: string;
}

const features: Feature[] = [
  {
    id: "dashboard",
    title: "Comprehensive Dashboard",
    description: "Get a real-time overview of your entire real estate business at a glance. Track occupancy rates, total income, average rent, and key metrics all in one powerful dashboard.",
    icon: BarChart3,
    image: "/screenshots/dashboard.png", // Placeholder - replace with actual screenshot
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "properties",
    title: "Property Management",
    description: "Manage all your property listings with detailed information, photos, and financial tracking. View properties in list or map format for easy navigation and management.",
    icon: Building2,
    image: "/screenshots/properties.png", // Placeholder - replace with actual screenshot
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "tenants",
    title: "Tenant Management",
    description: "Streamline tenant operations with comprehensive profiles, lease tracking, payment summaries, and quick actions. Manage all tenant relationships from one centralized platform.",
    icon: Users,
    image: "/screenshots/tenants.png", // Placeholder - replace with actual screenshot
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "invoicing",
    title: "Smart Invoicing System",
    description: "Create professional invoices with automated numbering, multi-currency support, and automated tracking. Send invoices directly via email and track payment status in real-time.",
    icon: FileText,
    image: "/screenshots/invoicing.png", // Placeholder - replace with actual screenshot
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "maintenance",
    title: "Maintenance Request Tracking",
    description: "Efficiently manage maintenance requests with AI-powered description generation, urgency levels, and status tracking. Keep your properties in top condition with organized workflows.",
    icon: Wrench,
    image: "/screenshots/maintenance.png", // Placeholder - replace with actual screenshot
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    id: "leases",
    title: "Lease Management",
    description: "Create, manage, and track all lease agreements with automated reminders, status updates, and document storage. Never miss a lease renewal or important date.",
    icon: FileSignature,
    image: "/screenshots/leases.png", // Placeholder - replace with actual screenshot
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    id: "leads",
    title: "Leads Pipeline",
    description: "Transform potential tenants into signed leases with our visual pipeline. Track leads from initial inquiry through viewing, application, and final signing stages.",
    icon: TrendingUp,
    image: "/screenshots/leads.png", // Placeholder - replace with actual screenshot
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "financials",
    title: "Financial Dashboard",
    description: "Monitor your financial performance with comprehensive reports on revenue, expenses, and net profit. Make data-driven decisions with visual analytics and trend tracking.",
    icon: DollarSign,
    image: "/screenshots/financials.png", // Placeholder - replace with actual screenshot
    gradient: "from-teal-500 to-cyan-500",
  },
];

export function FeaturesCarousel() {
  return (
    <section className="relative z-10 py-16 sm:py-20 md:py-24 bg-gradient-to-b from-black/50 via-black/40 to-black/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 sm:mb-6">
            Powerful Features for{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Modern Real Estate
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-white/80 font-medium">
            Discover how Axis CRM transforms your property management workflow with intuitive tools and powerful automation
          </p>
        </div>

        {/* Carousel */}
        <div className="max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <CarouselItem key={feature.id} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                    <div className="group relative h-full rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-2xl">
                      {/* Gradient Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                      
                      {/* Content */}
                      <div className="relative p-6 sm:p-8 h-full flex flex-col">
                        {/* Icon */}
                        <div className={`mb-4 sm:mb-6 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                          <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
                          {feature.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm sm:text-base text-white/70 font-medium leading-relaxed flex-grow mb-4 sm:mb-6">
                          {feature.description}
                        </p>

                        {/* Screenshot Preview */}
                        <div className="relative w-full h-48 sm:h-56 rounded-lg overflow-hidden border border-white/10 bg-black/20 group-hover:border-white/20 transition-all duration-300">
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                            {/* Placeholder for screenshot - replace with actual Image component when screenshots are available */}
                            {/* To add screenshots: 
                                1. Create /public/screenshots/ directory
                                2. Add screenshot images (dashboard.png, properties.png, etc.)
                                3. Uncomment the Image component below and remove the placeholder div
                            */}
                            <div className="text-white/30 text-xs text-center p-4">
                              <Icon className="w-16 h-16 mx-auto mb-3 opacity-30" />
                              <p className="font-medium">Screenshot Preview</p>
                              <p className="text-[10px] mt-1 opacity-50">Add screenshot to /public/screenshots/</p>
                            </div>
                            {/* Uncomment when screenshots are available:
                            <Image
                              src={feature.image}
                              alt={`${feature.title} screenshot`}
                              fill
                              className="object-cover object-top"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              priority={feature.id === "dashboard"}
                            />
                            */}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            <div className="flex justify-center gap-4 mt-8 sm:mt-10">
              <CarouselPrevious className="static translate-x-0 translate-y-0 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/30" />
              <CarouselNext className="static translate-x-0 translate-y-0 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white hover:border-white/30" />
            </div>
          </Carousel>
        </div>

        {/* Feature Indicators */}
        <div className="flex justify-center gap-2 mt-8 sm:mt-10">
          {features.map((_, index) => (
            <div
              key={index}
              className="h-2 w-2 rounded-full bg-white/30 transition-all duration-300"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

