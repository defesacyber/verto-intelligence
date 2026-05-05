import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, PROPERTY_TYPES, PROJECT_STATUS } from '@/lib/constants';
import { MoreHorizontal, MapPin, Building, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

export interface Project {
  id: string;
  name: string;
  location: string;
  propertyType: string;
  status: string;
  vgv: number;
  roi: number;
  margin: number;
  createdAt: string;
}

export interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete: _onDelete }: ProjectCardProps) {
  const propertyTypeLabel = PROPERTY_TYPES.find(t => t.value === project.propertyType)?.label || project.propertyType;
  const statusConfig = PROJECT_STATUS.find(s => s.value === project.status);
  
  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {project.location}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Building className="h-3 w-3" />
            {propertyTypeLabel}
          </Badge>
          <Badge 
            variant={
              statusConfig?.color === 'success' ? 'success' :
              statusConfig?.color === 'destructive' ? 'destructive' :
              statusConfig?.color === 'info' ? 'info' :
              'secondary'
            }
          >
            {statusConfig?.label || project.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">VGV</p>
            <p className="text-sm font-semibold">{formatCurrency(project.vgv)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROI</p>
            <p className={cn(
              "text-sm font-semibold flex items-center gap-1",
              project.roi >= 25 ? "text-success" : project.roi >= 15 ? "text-warning" : "text-destructive"
            )}>
              <TrendingUp className="h-3 w-3" />
              {project.roi.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Margem</p>
            <p className="text-sm font-semibold">{project.margin.toFixed(1)}%</p>
          </div>
        </div>
        
        <Link to={`/projects/${project.id}`}>
          <Button variant="outline" className="w-full mt-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            Ver Análise
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
