import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Download, 
  FileText, 
  MapPin, 
  Building2, 
  TrendingUp,
  Loader2,
  Calendar
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/constants';
import { generatePdfReport } from '@/lib/pdf-export';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  city: string;
  uf: string;
  location: string;
  property_type: string;
  status: string;
  vgv: number;
  roi: number;
  margin: number;
  created_at: string;
}

interface Report {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'quarterly';
  date: string;
  projectsCount: number;
}

interface ReportPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  projects: Project[];
}

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  planning: 'Planejamento',
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const typeLabels: Record<string, string> = {
  vertical: 'Vertical',
  horizontal: 'Horizontal',
  misto: 'Misto',
  comercial: 'Comercial',
  loteamento: 'Loteamento',
};

const getStatusBadgeVariant = (status: string): "default" | "success" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case 'active': return 'default';
    case 'completed': return 'success';
    case 'planning': return 'secondary';
    case 'cancelled': return 'destructive';
    default: return 'outline';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'weekly': return 'Semanal';
    case 'monthly': return 'Mensal';
    case 'quarterly': return 'Trimestral';
    default: return type;
  }
};

export function ReportPreviewModal({ 
  open, 
  onOpenChange, 
  report, 
  projects 
}: ReportPreviewModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  if (!report) return null;

  const totalVgv = projects.reduce((acc, p) => acc + (p.vgv || 0), 0);
  const avgRoi = projects.length > 0 
    ? projects.reduce((acc, p) => acc + (p.roi || 0), 0) / projects.length 
    : 0;
  const avgMargin = projects.length > 0 
    ? projects.reduce((acc, p) => acc + (p.margin || 0), 0) / projects.length 
    : 0;

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      generatePdfReport({
        title: report.title,
        type: report.type,
        date: report.date,
        projects: projects.map(p => ({
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
        })),
        summary: {
          total_projects: projects.length,
          total_vgv: totalVgv,
          avg_roi: avgRoi,
          avg_margin: avgMargin,
        },
      });

      toast({
        title: 'PDF exportado!',
        description: 'O relatório foi baixado com sucesso.',
      });
      
      onOpenChange(false);
    } catch (_error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Ocorreu um erro ao gerar o PDF.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pré-visualização do Relatório
          </DialogTitle>
          <DialogDescription>
            Confira os dados antes de exportar o PDF
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-slate-900 text-white p-6 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Verto Intelligence</h2>
                  <p className="text-slate-300 text-sm">Inteligência Imobiliária</p>
                </div>
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20">
                  {getTypeLabel(report.type)}
                </Badge>
              </div>
              <Separator className="my-4 bg-slate-700" />
              <h3 className="text-xl font-semibold">{report.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-slate-300">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(report.date)}
                </span>
                <span>{projects.length} projetos</span>
              </div>
            </div>

            {/* Summary Cards */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                RESUMO DO PORTFÓLIO
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total de Projetos</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">VGV Total</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalVgv)}</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">ROI Médio</p>
                  <p className="text-2xl font-bold">{avgRoi.toFixed(1)}%</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Margem Média</p>
                  <p className="text-2xl font-bold">{avgMargin.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">
                PROJETOS ({projects.length})
              </h4>
              {projects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum projeto disponível</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div 
                      key={project.id}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-medium">{project.name}</h5>
                            <Badge variant={getStatusBadgeVariant(project.status)}>
                              {statusLabels[project.status] || project.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.city}/{project.uf}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {typeLabels[project.property_type] || project.property_type}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(project.vgv)}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" />
                              ROI {project.roi.toFixed(1)}%
                            </span>
                            <span>| Margem {project.margin.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleExport} disabled={isExporting || projects.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
