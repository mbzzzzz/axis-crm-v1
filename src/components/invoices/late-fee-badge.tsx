"use client";

import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

interface LateFeeBadgeProps {
  lateFeeAmount: number;
  daysOverdue?: number;
}

export function LateFeeBadge({ lateFeeAmount, daysOverdue }: LateFeeBadgeProps) {
  if (!lateFeeAmount || lateFeeAmount === 0) {
    return null;
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertCircle className="size-3" />
      <span>Late Fee: ${lateFeeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      {daysOverdue !== undefined && daysOverdue > 0 && (
        <span className="text-xs">({daysOverdue} days)</span>
      )}
    </Badge>
  );
}
