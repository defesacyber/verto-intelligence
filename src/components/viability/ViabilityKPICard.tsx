import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ViabilityKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function ViabilityKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = 'default',
  className
}: ViabilityKPICardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-card',
      iconBg: 'bg-muted',
      iconColor: 'text-foreground',
      border: 'border-border'
    },
    primary: {
      bg: 'bg-primary/5',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      border: 'border-primary/20'
    },
    secondary: {
      bg: 'bg-secondary/5',
      iconBg: 'bg-secondary/10',
      iconColor: 'text-secondary',
      border: 'border-secondary/20'
    },
    success: {
      bg: 'bg-success/5',
      iconBg: 'bg-success/10',
      iconColor: 'text-success',
      border: 'border-success/20'
    },
    warning: {
      bg: 'bg-warning/5',
      iconBg: 'bg-warning/10',
      iconColor: 'text-warning',
      border: 'border-warning/20'
    },
    destructive: {
      bg: 'bg-destructive/5',
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      border: 'border-destructive/20'
    }
  };

  const styles = variantStyles[variant];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className={cn('overflow-hidden border', styles.bg, styles.border, className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span className="text-xs font-medium">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', styles.iconBg)}>
            <Icon className={cn('h-5 w-5', styles.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
