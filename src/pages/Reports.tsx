import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Download, 
  Calendar,
  TrendingUp,
  Eye,
  Filter,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate } from '@/lib/constants';
import { useDashboardProjects } from '@/hooks/useDashboardProjects';
import { ReportPreviewModal } from '@/components/reports/ReportPreviewModal';

interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  date: string;
  projectsCount: number;
}

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'weekly': return 'Semanal';
    case 'monthly': return 'Mensal';
    case 'quarterly': return 'Trimestral';
    default: return type;
  }
};

const getTypeBadgeVariant = (type: string): "default" | "secondary" | "info" => {
  switch (type) {
    case 'weekly': return 'secondary';
    case 'monthly': return 'default';
    case 'quarterly': return 'info';
    default: return 'secondary';
  }
};

const generateReportsFromProjects = (projectsCount: number): Report[] => {
  const now = new Date();
  const reports: Report[] = [];
  
  const weekNumber = Math.ceil((now.getDate()) / 7);
  reports.push({
    id: `week-${now.getFullYear()}-${now.getMonth()}-${weekNumber}`,
    title: `Relatório Semanal - Semana ${weekNumber}`,
    type: 'weekly',
    date: now.toISOString(),
    projectsCount: projectsCount,
  });

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  reports.push({
    id: `month-${lastMonth.getFullYear()}-${lastMonth.getMonth()}`,
    title: `Relatório Mensal - ${monthNames[lastMonth.getMonth()]} ${lastMonth.getFullYear()}`,
    type: 'monthly',
    date: new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString(),
    projectsCount: projectsCount,
  });

  const prevWeek = new Date(now);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const prevWeekNumber = Math.ceil((prevWeek.getDate()) / 7);
  reports.push({
    id: `week-${prevWeek.getFullYear()}-${prevWeek.getMonth()}-${prevWeekNumber}`,
    title: `Relatório Semanal - Semana ${prevWeekNumber}`,
    type: 'weekly',
    date: prevWeek.toISOString(),
    projectsCount: Math.max(0, projectsCount - 1),
  });

  const currentQuarter = Math.floor(now.getMonth() / 3);
  const lastQuarter = currentQuarter === 0 ? 4 : currentQuarter;
  const quarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
  reports.push({
    id: `quarter-${quarterYear}-Q${lastQuarter}`,
    title: `Relatório Trimestral - Q${lastQuarter} ${quarterYear}`,
    type: 'quarterly',
    date: new Date(quarterYear, lastQuarter * 3, 0).toISOString(),
    projectsCount: projectsCount,
  });

  return reports;
};

export default function Reports() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const { data: projects, isLoading } = useDashboardProjects();
  
  const projectsCount = projects?.length || 0;
  
  const reports = useMemo(() => {
    const allReports = generateReportsFromProjects(projectsCount);
    if (typeFilter === 'all') return allReports;
    return allReports.filter(r => r.type === typeFilter);
  }, [projectsCount, typeFilter]);

  const stats = useMemo(() => {
    const allReports = generateReportsFromProjects(projectsCount);
    const now = new Date();
    const thisMonthReports = allReports.filter(r => {
      const reportDate = new Date(r.date);
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    });
    
    const nextMonday = new Date(now);
    nextMonday.setDate(nextMonday.getDate() + ((1 - nextMonday.getDay() + 7) % 7 || 7));
    
    return {
      total: allReports.length,
      thisMonth: thisMonthReports.length,
      nextReportDate: `${String(nextMonday.getDate()).padStart(2, '0')}/${String(nextMonday.getMonth() + 1).padStart(2, '0')}`,
    };
  }, [projectsCount]);

  const formattedProjects = projects?.map(p => ({
    id: p.id,
    name: p.name,
    city: p.city,
    uf: p.uf,
    location: p.location,
    property_type: p.property_type,
    status: p.status,
    vgv: p.vgv || 0,
    roi: p.roi || 0,
    margin: p.margin || 0,
    created_at: p.created_at,
  })) || [];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Relatórios de projetos</p>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="weekly">Semanais</SelectItem>
              <SelectItem value="monthly">Mensais</SelectItem>
              <SelectItem value="quarterly">Trimestrais</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Relatórios</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Este Mês</p>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-info/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Próximo Relatório</p>
                  <p className="text-2xl font-bold">{stats.nextReportDate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Relatórios</CardTitle>
            <CardDescription>Todos os relatórios gerados para sua conta</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum relatório encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie projetos para gerar relatórios automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div 
                    key={report.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getTypeBadgeVariant(report.type)}>
                            {getTypeLabel(report.type)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {report.projectsCount} projeto{report.projectsCount !== 1 ? 's' : ''} analisado{report.projectsCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground mr-4">
                        {formatDate(report.date)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Visualizar"
                        onClick={() => setPreviewReport(report)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Exportar PDF"
                        onClick={() => setPreviewReport(report)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ReportPreviewModal
          open={!!previewReport}
          onOpenChange={(open) => !open && setPreviewReport(null)}
          report={previewReport}
          projects={formattedProjects}
        />
      </div>
    </DashboardLayout>
  );
}
