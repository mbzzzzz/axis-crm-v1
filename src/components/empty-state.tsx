import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4", className)}>
      <div className="rounded-full bg-muted/50 p-4 mb-4">
        <Icon className="size-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-muted-foreground/70 text-center max-w-xs">{description}</p>
      )}
    </div>
  );
}

