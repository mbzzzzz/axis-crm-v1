"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail, Building2, MessageSquare, CheckCircle2 } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface AgentContactCardProps {
  agentInfo: {
    name?: string;
    email?: string;
    phone?: string;
    agency?: string;
    image?: string;
  };
  propertyId: number;
  propertyTitle: string;
}

export function AgentContactCard({ agentInfo, propertyId, propertyTitle }: AgentContactCardProps) {
  const [showContactForm, setShowContactForm] = useState(false);

  // Get initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "AG";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const agentName = agentInfo.name || "Property Agent";
  const agentAgency = agentInfo.agency || "Real Estate Agency";

  return (
    <Card className="sticky top-20 border-2 shadow-xl overflow-hidden">
      <CardHeader className="pb-6 pt-6 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Agent Avatar */}
          <div className="relative">
            <Avatar className="size-28 border-4 border-background shadow-xl ring-4 ring-primary/10">
              <AvatarImage src={agentInfo.image} alt={agentName} />
              <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
                {getInitials(agentName)}
              </AvatarFallback>
            </Avatar>
            {/* Online indicator */}
            <div className="absolute bottom-1 right-1 size-7 bg-green-500 border-4 border-background rounded-full shadow-lg">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
          </div>

          {/* Agent Name & Badge */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-2xl font-bold">{agentName}</h3>
              <CheckCircle2 className="size-5 text-primary" />
            </div>
            {agentAgency && (
              <div className="flex items-center justify-center gap-1.5">
                <Building2 className="size-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">{agentAgency}</span>
              </div>
            )}
            <Badge variant="secondary" className="mt-1">
              Verified Agent
            </Badge>
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-6 space-y-4">
        {/* Primary Contact Button */}
        <Button
          className="w-full h-14 text-base font-semibold shadow-md hover:shadow-lg transition-shadow"
          size="lg"
          onClick={() => setShowContactForm(!showContactForm)}
        >
          <MessageSquare className="mr-2 size-5" />
          {showContactForm ? "Hide Contact Form" : "Contact Agent"}
        </Button>

        {/* Secondary Contact Options */}
        {(agentInfo.phone || agentInfo.email) && (
          <div className="space-y-2">
            {agentInfo.phone && (
              <Button
                variant="outline"
                className="w-full h-11 border-2"
                asChild
              >
                <a href={`tel:${agentInfo.phone}`}>
                  <Phone className="mr-2 size-4" />
                  Call Now
                </a>
              </Button>
            )}

            {agentInfo.email && (
              <Button
                variant="outline"
                className="w-full h-11 border-2"
                asChild
              >
                <a href={`mailto:${agentInfo.email}`}>
                  <Mail className="mr-2 size-4" />
                  Email Agent
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Contact Form */}
        {showContactForm && (
          <div className="pt-4 border-t animate-in slide-in-from-top-2 duration-200">
            <ContactForm propertyId={propertyId} propertyTitle={propertyTitle} />
          </div>
        )}

        {/* Trust Indicators */}
        <div className="pt-4 space-y-3 border-t">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-green-500" />
            <span>Verified Professional</span>
          </div>
          <p className="text-xs text-center text-muted-foreground leading-relaxed">
            Responds typically within 24 hours
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

