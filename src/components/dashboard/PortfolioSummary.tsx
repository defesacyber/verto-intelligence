import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraphSkeleton } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Briefcase, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const STATUS_COLORS: Record<string, string> = {
  'draft': 'hsl(var(--muted-foreground))',
  'active': 'hsl(var(--primary))',
  'completed': 'hsl(142, 76%, 36%)',
  'cancelled': 'hsl(var(--destructive))',
};

const TYPE_COLORS = [
  'hsl(var(--primary))',
  'hsl(221, 83%, 53%)',
  'hsl(142, 76%, 36%)',
  'hsl(45, 93%, 47%)',
  'hsl(280, 67%, 50%)',
  'hsl(var(--secondary))',
];

interface Project {
  id: string;
  name: string;
  status: string;
  property_type: string;
  vgv: number;
  roi: number;
  margin: number;
}

export function PortfolioSummary() {
  const { data: projects, isLoading } = useQuery({
    queryKey: ['portfolio-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status, property_type, vgv, roi, margin');
      
      if (error) throw error;
      return data as Project[];
    },
  });

  const summaryData = useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalProjects: 0,
        totalVGV: 0,
        avgROI: 0,
        avgMargin: 0,
        byStatus: [],
        byType: [],
      };
    }

    const totalVGV = projects.reduce((sum, p) => sum + (p.vgv || 0), 0);
    const avgROI = projects.reduce((sum, p) => sum + (p.roi || 0), 0) / projects.length;
    const avgMargin = projects.reduce((sum, p) => sum + (p.margin || 0), 0) / projects.length;

    // Group by status
    const statusMap = projects.reduce((acc, p) => {
      const status = p.status || 'draft';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = Object.entries(statusMap).map(([name, value]) => ({
      name: translateStatus(name),
      value,
      color: STATUS_COLORS[name] || 'hsl(var(--muted))',
    }));

    // Group by property type
    const typeMap = projects.reduce((acc, p) => {
      const type = p.property_type || 'Outros';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = Object.entries(typeMap).map(([name, value], index) => ({
      name,
      value,
      color: TYPE_COLORS[index % TYPE_COLORS.length],
    }));

    return {
      totalProjects: projects.length,
      totalVGV,
      avgROI,
      avgMargin,
      byStatus,
      byType,
    };
  }, [projects]);

  function translateStatus(status: string): string {
    const map: Record<string, string> = {
      'draft': 'Rascunho',
      'active': 'Ativo',
      'completed': 'Concluído',
      'cancelled': 'Cancelado',
    };
    return map[status] || status;
  }

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `R$ ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
    return `R$ ${value.toFixed(0)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Resumo do Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <GraphSkeleton height={200} />
            <GraphSkeleton height={200} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Resumo do Portfólio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Nenhum projeto cadastrado</p>
            <p className="text-sm text-muted-foreground/70">Crie seu primeiro projeto para ver o resumo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          Resumo do Portfólio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{summaryData.totalProjects}</p>
            <p className="text-xs text-muted-foreground">Projetos</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{formatCurrency(summaryData.totalVGV)}</p>
            <p className="text-xs text-muted-foreground">VGV Total</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <TrendingUp className="h-5 w-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{(summaryData.avgROI ?? 0).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">ROI Médio</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <TrendingUp className="h-5 w-5 text-purple-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{(summaryData.avgMargin ?? 0).toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Margem Média</p>
          </div>
        </div>

        {/* Pie Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* By Status */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 text-center">Por Status</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={summaryData.byStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {summaryData.byStatus.map((entry, index) => (
                    <Cell key={`status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} projeto(s)`, '']}
                />
                <Legend 
                  formatter={(value) => <span className="text-xs">{value}</span>}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* By Property Type */}
          <div className="bg-muted/20 rounded-lg p-4">
            <h4 className="text-sm font-medium mb-3 text-center">Por Tipo de Imóvel</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={summaryData.byType}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {summaryData.byType.map((entry, index) => (
                    <Cell key={`type-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`${value} projeto(s)`, '']}
                />
                <Legend 
                  formatter={(value) => <span className="text-xs">{value}</span>}
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
