import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  Percent,
  Target
} from 'lucide-react';
import type { MetricCard } from '@/lib/dashboard-types';

interface ProjectKPIsProps {
  metrics: MetricCard[];
  isLoading?: boolean;
}

const iconMap: Record<string, React.ElementType> = {
  project_total_projects: Building2,
  project_total_units: Target,
  project_total_vgv_brl: DollarSign,
  project_roi_avg_pct: TrendingUp,
  project_tir_avg_pct: Percent,
};

const colorMap: Record<string, string> = {
  project_total_projects: 'text-primary bg-primary/10',
  project_total_units: 'text-secondary bg-secondary/10',
  project_total_vgv_brl: 'text-success bg-success/10',
  project_roi_avg_pct: 'text-info bg-info/10',
  project_tir_avg_pct: 'text-warning bg-warning/10',
};

function KPICardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProjectKPIs({ metrics, isLoading }: ProjectKPIsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {metrics.map((metric) => {
        const Icon = iconMap[metric.metric_id] || Building2;
        const colorClass = colorMap[metric.metric_id] || 'text-primary bg-primary/10';
        
        return (
          <Card key={metric.metric_id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{metric.label}</p>
                  <p className="text-lg font-semibold truncate">{metric.value.raw}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
