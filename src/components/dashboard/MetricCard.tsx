import { cn } from '@/lib/utils';
import { LucideIcon, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
  tooltip?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'primary',
  className,
  tooltip,
}: MetricCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[200px] text-xs">
                    {tooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {change && (
            <p 
              className={cn(
                "text-sm font-medium",
                changeType === 'positive' && "text-success",
                changeType === 'negative' && "text-destructive",
                changeType === 'neutral' && "text-muted-foreground"
              )}
            >
              {change}
            </p>
          )}
        </div>
        <div 
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
            iconColor === 'primary' && "bg-primary/10 text-primary",
            iconColor === 'success' && "bg-success/10 text-success",
            iconColor === 'warning' && "bg-warning/10 text-warning",
            iconColor === 'info' && "bg-info/10 text-info",
            iconColor === 'destructive' && "bg-destructive/10 text-destructive"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}
