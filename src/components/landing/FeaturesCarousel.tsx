"use client";

import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Building2, Users, FileText, Wrench, TrendingUp, DollarSign, FileSignature, BarChart3 } from "lucide-react";
import Image from "next/image";

interface Feature {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  image: string;
  gradient: string;
}

const features: Feature[] = [
  {
    id: "dashboard",
    title: "Comprehensive Dashboard",
    description: "Get a real-time overview of your entire real estate business at a glance. Track occupancy rates, total income, average rent, and key metrics all in one powerful dashboard.",
    detailedDescription: "Our comprehensive dashboard provides you with a complete 360-degree view of your real estate operations. Monitor key performance indicators including occupancy rates, total income, average rent per property, and financial trends. The intuitive interface displays critical metrics at a glance, allowing you to make informed decisions quickly. Track your portfolio's performance with visual charts and graphs that update in real-time. Customize your dashboard to highlight the metrics that matter most to your business, ensuring you always have the information you need to stay ahead.",
    icon: BarChart3,
    image: "/screenshots/dashboard.png",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "properties",
    title: "Property Management",
    description: "Manage all your property listings with detailed information, photos, and financial tracking. View properties in list or map format for easy navigation and management.",
    detailedDescription: "Take complete control of your property portfolio with our advanced property management system. Add detailed property information including addresses, property types, square footage, amenities, and high-quality photos. Track financial metrics for each property including purchase price, current value, monthly rent, and ROI calculations. Switch between list and map views to visualize your properties geographically. Manage property status, availability, and tenant assignments all from one centralized location. Generate detailed property reports and export data for analysis or sharing with stakeholders.",
    icon: Building2,
    image: "/screenshots/properties.png",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    id: "tenants",
    title: "Tenant Management",
    description: "Streamline tenant operations with comprehensive profiles, lease tracking, payment summaries, and quick actions. Manage all tenant relationships from one centralized platform.",
    detailedDescription: "Streamline your tenant management workflow with comprehensive profiles that store all essential information in one place. Track tenant contact details, lease agreements, payment history, and communication logs. Monitor payment status with visual indicators and automated reminders for overdue payments. Generate quick actions for common tasks like sending invoices, creating maintenance requests, or scheduling property inspections. Access detailed payment summaries showing rent history, late fees, and outstanding balances. Maintain complete tenant communication history and document storage for lease agreements, notices, and correspondence.",
    icon: Users,
    image: "/screenshots/tenants.png",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "invoicing",
    title: "Smart Invoicing System",
    description: "Create professional invoices with automated numbering, multi-currency support, and automated tracking. Send invoices directly via email and track payment status in real-time.",
    detailedDescription: "Create professional, branded invoices in minutes with our intelligent invoicing system. Automated invoice numbering ensures consistency and eliminates manual errors. Support multiple currencies for international property portfolios, with automatic currency conversion and formatting. Customize invoice templates with your logo, company information, and branding elements. Track invoice status from draft to paid with real-time updates. Send invoices directly via email with customizable templates and automated follow-ups. Generate PDF invoices that can be downloaded or printed. Set up recurring invoices for monthly rent and automate the entire billing process.",
    icon: FileText,
    image: "/screenshots/invoicing.png",
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "maintenance",
    title: "Maintenance Request Tracking",
    description: "Efficiently manage maintenance requests with AI-powered description generation, urgency levels, and status tracking. Keep your properties in top condition with organized workflows.",
    detailedDescription: "Keep your properties in excellent condition with our comprehensive maintenance management system. Tenants can submit maintenance requests directly through the portal, which are automatically logged and tracked. Our AI-powered description generator helps create detailed, professional maintenance reports based on simple inputs. Categorize requests by urgency level (low, medium, high, urgent) to prioritize work effectively. Track request status from submission to completion with real-time updates. Assign maintenance tasks to contractors or internal teams and monitor progress. Maintain a complete history of all maintenance work for each property, helping you identify recurring issues and plan preventive maintenance.",
    icon: Wrench,
    image: "/screenshots/maintenance.png",
    gradient: "from-yellow-500 to-amber-500",
  },
  {
    id: "leases",
    title: "Lease Management",
    description: "Create, manage, and track all lease agreements with automated reminders, status updates, and document storage. Never miss a lease renewal or important date.",
    detailedDescription: "Simplify lease management with our comprehensive lease tracking system. Create detailed lease agreements with all essential terms including rent amount, security deposit, lease duration, and special conditions. Store lease documents securely in the cloud with easy access from anywhere. Set up automated reminders for important dates like lease renewals, rent increases, and inspection dates. Track lease status (active, expired, pending) with visual indicators. Generate lease summaries and reports for quick reference. Monitor lease expiration dates and receive notifications well in advance to plan renewals or tenant transitions. Export lease data for legal or accounting purposes.",
    icon: FileSignature,
    image: "/screenshots/leases.png",
    gradient: "from-indigo-500 to-blue-500",
  },
  {
    id: "leads",
    title: "Leads Pipeline",
    description: "Transform potential tenants into signed leases with our visual pipeline. Track leads from initial inquiry through viewing, application, and final signing stages.",
    detailedDescription: "Convert more leads into signed leases with our visual pipeline management system. Track potential tenants through every stage of the rental process from initial inquiry to final signing. Organize leads in customizable pipeline stages that match your workflow. Capture lead information including contact details, property interests, budget, and timeline. Schedule and track property viewings with calendar integration. Manage application processes and track document submissions. Automate follow-up communications to keep leads engaged. Analyze conversion rates at each stage to identify bottlenecks and optimize your process. Never lose a potential tenant with comprehensive lead tracking and automated reminders.",
    icon: TrendingUp,
    image: "/screenshots/leads.png",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "financials",
    title: "Financial Dashboard",
    description: "Monitor your financial performance with comprehensive reports on revenue, expenses, and net profit. Make data-driven decisions with visual analytics and trend tracking.",
    detailedDescription: "Gain deep insights into your real estate business finances with our comprehensive financial dashboard. Monitor revenue streams from rent, fees, and other income sources. Track expenses including maintenance costs, property taxes, insurance, and management fees. Calculate net profit and ROI for individual properties or your entire portfolio. Visualize financial trends with interactive charts and graphs showing monthly, quarterly, and yearly performance. Generate detailed financial reports for tax preparation, investor updates, or internal analysis. Set financial goals and track progress toward targets. Export financial data to accounting software or spreadsheets. Identify profitable properties and areas for improvement with comparative analysis.",
    icon: DollarSign,
    image: "/screenshots/financials.png",
    gradient: "from-teal-500 to-cyan-500",
  },
];

export function FeaturesCarousel() {
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  return (
    <>
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
          <div className="max-w-[1100px] mx-auto">
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
                    <CarouselItem key={feature.id} className="pl-2 md:pl-4 basis-full">
                      <div 
                        onClick={() => setSelectedFeature(feature)}
                        className="group relative h-auto min-h-[350px] md:h-[400px] rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] cursor-pointer flex flex-col lg:flex-row"
                      >
                        {/* Gradient Overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                        
                        {/* Left Side - Large Image (full width on mobile/tablet, 45% on desktop) */}
                        <div className="relative w-full lg:w-[45%] lg:min-w-[400px] xl:min-w-[450px] h-[250px] sm:h-[300px] lg:h-full bg-gradient-to-br from-black via-black to-gray-900 flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10 after:content-[''] after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-white/10 after:hidden lg:after:block">
                          <div className="relative w-full h-full">
                            <Image
                              src={feature.image}
                              alt={`${feature.title} screenshot`}
                              fill
                              className="object-contain object-center"
                              sizes="(max-width: 768px) 100vw, 45vw"
                              priority
                              quality={100}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const placeholder = target.nextElementSibling as HTMLElement;
                                if (placeholder) placeholder.style.display = 'flex';
                              }}
                            />
                            {/* Placeholder - shown if image fails to load */}
                            <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                              <div className="text-white/30 text-center p-8">
                                <Icon className="w-24 h-24 mx-auto mb-4 opacity-30" />
                                <p className="font-medium text-lg">Screenshot Preview</p>
                                <p className="text-sm mt-2 opacity-50">Add screenshot to /public/screenshots/{feature.id}.png</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Content Section (full width on mobile/tablet, 55% on desktop) */}
                        <div className="relative w-full lg:w-[55%] flex flex-col p-6 sm:p-8 lg:p-10">
                          {/* Icon - Top Left */}
                          <div className={`mb-4 sm:mb-6 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg flex-shrink-0`}>
                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-white" />
                          </div>

                          {/* Title - Large and Bold (responsive sizes) */}
                          <h3 className="text-2xl sm:text-3xl lg:text-[32px] font-bold sm:font-black text-white mb-4 sm:mb-5 leading-tight">
                            {feature.title}
                          </h3>

                          {/* Description - Readable Size (responsive) */}
                          <p className="text-base sm:text-lg lg:text-[18px] text-white/80 sm:text-white/70 font-medium leading-relaxed flex-grow line-clamp-3 sm:line-clamp-4 lg:line-clamp-5">
                            {feature.description}
                          </p>

                          {/* Click hint */}
                          <div className="mt-6 sm:mt-8">
                            <p className="text-sm sm:text-base text-white/50 group-hover:text-white/70 transition-colors">
                              Click to view details →
                            </p>
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

      {/* Feature Detail Modal - Large Image Preview Only */}
      <Dialog open={!!selectedFeature} onOpenChange={(open) => !open && setSelectedFeature(null)}>
        <DialogContent className="max-w-[98vw] w-[98vw] max-h-[98vh] h-[98vh] overflow-hidden bg-black/98 backdrop-blur-xl border-white/20 p-0">
          {selectedFeature && (
            <div className="relative w-full h-full bg-gradient-to-br from-black via-black to-gray-900 flex items-center justify-center p-4 md:p-8">
              <div className="relative w-full h-full">
                <Image
                  src={selectedFeature.image}
                  alt={`${selectedFeature.title} screenshot`}
                  fill
                  className="object-contain object-center"
                  sizes="98vw"
                  priority
                  quality={100}
                  onError={(e) => {
                    // Fallback to placeholder on error
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const placeholder = target.nextElementSibling as HTMLElement;
                    if (placeholder) placeholder.style.display = 'flex';
                  }}
                />
                {/* Placeholder - shown if image fails to load */}
                <div className="hidden absolute inset-0 items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                  <div className="text-white/30 text-center p-8">
                    {(() => {
                      const Icon = selectedFeature.icon;
                      return <Icon className="w-24 h-24 mx-auto mb-4 opacity-30" />;
                    })()}
                    <p className="font-medium text-lg">Screenshot Preview</p>
                    <p className="text-sm mt-2 opacity-50">Add screenshot to /public/screenshots/{selectedFeature.id}.png</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
