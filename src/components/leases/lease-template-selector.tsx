"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAllTemplates, LeaseTemplate, LeaseTerms } from "@/lib/lease-templates";
import { Check } from "lucide-react";

interface LeaseTemplateSelectorProps {
  leaseType: string;
  onSelect: (template: LeaseTerms) => void;
}

export function LeaseTemplateSelector({ leaseType, onSelect }: LeaseTemplateSelectorProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const templates = getAllTemplates().filter(t => t.type === leaseType);

  const handleSelect = (template: LeaseTemplate) => {
    setSelectedTemplateId(template.id);
    onSelect(template.terms);
  };

  if (templates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Lease Template</label>
      <div className="grid gap-2">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-colors ${
              selectedTemplateId === template.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50"
            }`}
            onClick={() => handleSelect(template)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{template.name}</CardTitle>
                {selectedTemplateId === template.id && (
                  <Check className="size-4 text-primary" />
                )}
              </div>
              <CardDescription className="text-xs">
                Pre-filled with standard {template.type} lease terms
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

