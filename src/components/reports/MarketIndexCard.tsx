import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface MarketIndex {
  label: string;
  description: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  source: string;
}

interface MarketIndexCardProps {
  title: string;
  period: string;
  icon: React.ReactNode;
  indices: MarketIndex[];
  className?: string;
}

export function MarketIndexCard({ title, period, icon, indices, className }: MarketIndexCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{period}</p>
          </div>
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {indices.map((index, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{index.label}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{index.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm">{index.value}</p>
                    <p className={cn(
                      "text-xs font-medium",
                      index.changeType === 'positive' && "text-success",
                      index.changeType === 'negative' && "text-destructive",
                      index.changeType === 'neutral' && "text-muted-foreground"
                    )}>
                      {index.change}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground/70">Fonte: {index.source}</p>
                {i < indices.length - 1 && <div className="border-b border-border/50 pt-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
